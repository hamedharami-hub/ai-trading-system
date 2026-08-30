import type { FeatureSnapshotPayload, MarketId, Timeframe } from '@trade/contracts';
import { parseDecimal, toDecimalString, Decimal } from '@trade/contracts';
import type { CandleData } from './types.js';
import { SMCEngine } from './smc-engine.js';
import { OrderFlowEngine, type SpreadState } from './order-flow-engine.js';
import { SecondaryFilters } from './secondary-filters.js';

export interface FeatureEngineConfig {
  maxHistoryCandles: number;
}

export const DEFAULT_FEATURE_CONFIG: FeatureEngineConfig = {
  maxHistoryCandles: 300
};

export class FeatureEngine {
  private candleHistory = new Map<string, CandleData[]>();
  private orderFlowEngines = new Map<MarketId, OrderFlowEngine>();

  constructor(private readonly config: FeatureEngineConfig = DEFAULT_FEATURE_CONFIG) {}

  private getSeriesKey(symbol: MarketId, timeframe: Timeframe): string {
    return `${symbol}:${timeframe}`;
  }

  public addCandle(
    symbol: MarketId,
    timeframe: Timeframe,
    rawCandle: {
      open: string | Decimal;
      high: string | Decimal;
      low: string | Decimal;
      close: string | Decimal;
      volume: string | Decimal;
      openTime: string;
      closeTime: string;
    }
  ): void {
    const key = this.getSeriesKey(symbol, timeframe);
    let series = this.candleHistory.get(key);
    if (!series) {
      series = [];
      this.candleHistory.set(key, series);
    }

    const candle: CandleData = {
      open: parseDecimal(rawCandle.open),
      high: parseDecimal(rawCandle.high),
      low: parseDecimal(rawCandle.low),
      close: parseDecimal(rawCandle.close),
      volume: parseDecimal(rawCandle.volume),
      openTime: rawCandle.openTime,
      closeTime: rawCandle.closeTime
    };

    series.push(candle);
    if (series.length > this.config.maxHistoryCandles) {
      series.shift();
    }
  }

  public getOrderFlowEngine(symbol: MarketId): OrderFlowEngine {
    let engine = this.orderFlowEngines.get(symbol);
    if (!engine) {
      engine = new OrderFlowEngine();
      this.orderFlowEngines.set(symbol, engine);
    }
    return engine;
  }

  /**
   * Generates a fully populated and formatted FeatureSnapshotPayload for downstream strategy/AI analysis.
   */
  public generateSnapshot(
    symbol: MarketId,
    timeframe: Timeframe,
    spreadState: SpreadState = 'NORMAL'
  ): FeatureSnapshotPayload {
    const key = this.getSeriesKey(symbol, timeframe);
    const series = this.candleHistory.get(key) || [];

    if (series.length === 0) {
      throw new Error(`Cannot generate feature snapshot for ${key}: Candle history is empty`);
    }

    const lastCandle = series[series.length - 1]!;

    // 1. SMC Calculations
    const swings = SMCEngine.findSwingPoints(series);
    const { bos, choch, displacement } = SMCEngine.detectStructureBreaks(series, swings);
    const fvgs = SMCEngine.detectFVGs(series);
    const obs = SMCEngine.detectOrderBlocks(series, swings);
    const sweep = SMCEngine.detectLiquiditySweep(lastCandle, swings);

    const latestOB = obs.length > 0 ? obs[obs.length - 1] : undefined;
    const latestFVG = fvgs.length > 0 ? fvgs[fvgs.length - 1] : undefined;

    // 2. Order Flow Calculations
    const ofEngine = this.getOrderFlowEngine(symbol);
    const cvd = ofEngine.getCVD();
    const ofi = new Decimal(0); // Top-of-book OFI default or computed

    // 3. Secondary Filter Indicators
    const atr = SecondaryFilters.calculateATR(series, 14);
    const vwap = SecondaryFilters.calculateVWAP(series);
    const poc = SecondaryFilters.calculateVolumeProfilePOC(series);

    const snapshot: FeatureSnapshotPayload = {
      symbol,
      timeframe,
      smc: {
        bos,
        choch,
        displacement
      },
      order_flow: {
        ofi: toDecimalString(ofi),
        cvd: toDecimalString(cvd),
        spread_state: spreadState
      },
      secondary_filters: {
        atr: toDecimalString(atr.gt(0) ? atr : new Decimal('0.0001')),
        vwap: toDecimalString(vwap),
        volume_profile_poc: toDecimalString(poc)
      },
      evidence_candle_time: lastCandle.closeTime
    };

    if (latestOB) {
      snapshot.smc.order_block = {
        top: toDecimalString(latestOB.top),
        bottom: toDecimalString(latestOB.bottom),
        type: latestOB.type,
        mitigated: latestOB.mitigated
      };
    }

    if (latestFVG) {
      snapshot.smc.fvg = {
        top: toDecimalString(latestFVG.top),
        bottom: toDecimalString(latestFVG.bottom),
        type: latestFVG.type,
        mitigated: latestFVG.mitigated
      };
    }

    if (sweep) {
      snapshot.smc.liquidity_sweep = {
        swept_level: toDecimalString(sweep.sweptLevel),
        direction: sweep.direction
      };
    }

    return snapshot;
  }
}
