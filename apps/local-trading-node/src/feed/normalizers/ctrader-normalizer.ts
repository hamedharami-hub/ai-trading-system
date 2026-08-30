import type { MarketEventPayload, MarketId, Timeframe } from '@trade/contracts';
import { parseDecimal, toDecimalString } from '@trade/contracts';

const CTRADER_TIMEFRAME_MAP: Record<string, Timeframe> = {
  M1: '1M',
  M5: '5M',
  M15: '15M',
  H1: '1H',
  H4: '4H',
  D1: '1D'
};

const CTRADER_SYMBOL_MAP: Record<string, MarketId> = {
  EURUSD: 'EURUSD',
  GBPUSD: 'GBPUSD',
  USDJPY: 'USDJPY',
  AUDUSD: 'AUDUSD',
  USDCAD: 'USDCAD',
  USDCHF: 'USDCHF',
  NZDUSD: 'NZDUSD',
  XAUUSD: 'XAUUSD'
};

export class CTraderNormalizer {
  public static mapSymbol(symbolName: string): MarketId {
    const canonical = CTRADER_SYMBOL_MAP[symbolName.toUpperCase()];
    if (!canonical) {
      throw new Error(`Unsupported cTrader symbol: "${symbolName}"`);
    }
    return canonical;
  }

  public static mapTimeframe(period: string): Timeframe {
    const tf = CTRADER_TIMEFRAME_MAP[period.toUpperCase()];
    if (!tf) {
      throw new Error(`Unsupported cTrader period: "${period}"`);
    }
    return tf;
  }

  /**
   * Normalizes cTrader Spot event tick payload.
   */
  public static normalizeSpotEvent(raw: {
    symbol: string;
    bid: string;
    ask: string;
    lastPrice?: string;
    lastQty?: string;
  }): MarketEventPayload {
    const symbol = this.mapSymbol(raw.symbol);

    const payload: MarketEventPayload = {
      symbol,
      feed_type: 'TICK',
      tick: {
        bid: toDecimalString(parseDecimal(raw.bid)),
        ask: toDecimalString(parseDecimal(raw.ask))
      }
    };

    if (raw.lastPrice && payload.tick) {
      payload.tick.last_price = toDecimalString(parseDecimal(raw.lastPrice));
    }
    if (raw.lastQty && payload.tick) {
      payload.tick.last_qty = toDecimalString(parseDecimal(raw.lastQty));
    }

    return payload;
  }

  /**
   * Normalizes cTrader Trendbar (Candle) payload.
   */
  public static normalizeTrendbar(raw: {
    symbol: string;
    period: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    utcTimestampMs: number;
    periodMinutes: number;
  }): MarketEventPayload {
    const symbol = this.mapSymbol(raw.symbol);
    const timeframe = this.mapTimeframe(raw.period);
    const openTime = new Date(raw.utcTimestampMs);
    const closeTime = new Date(raw.utcTimestampMs + raw.periodMinutes * 60 * 1000);

    return {
      symbol,
      feed_type: 'CANDLE',
      candle: {
        open: toDecimalString(parseDecimal(raw.open)),
        high: toDecimalString(parseDecimal(raw.high)),
        low: toDecimalString(parseDecimal(raw.low)),
        close: toDecimalString(parseDecimal(raw.close)),
        volume: toDecimalString(parseDecimal(raw.volume)),
        timeframe,
        is_closed: true,
        open_time: openTime.toISOString(),
        close_time: closeTime.toISOString()
      }
    };
  }

  /**
   * Normalizes cTrader DepthQuotes event.
   * Note per DEC-024: Single-broker Forex DOM is secondary evidence, not global liquidity.
   */
  public static normalizeDepth(raw: {
    symbol: string;
    bids: Array<[string, string]>;
    asks: Array<[string, string]>;
    sequenceNumber?: number;
  }): MarketEventPayload {
    const symbol = this.mapSymbol(raw.symbol);

    const bids = raw.bids.map(([p, q]): [string, string] => [
      toDecimalString(parseDecimal(p)),
      toDecimalString(parseDecimal(q))
    ]);

    const asks = raw.asks.map(([p, q]): [string, string] => [
      toDecimalString(parseDecimal(p)),
      toDecimalString(parseDecimal(q))
    ]);

    const payload: MarketEventPayload = {
      symbol,
      feed_type: 'ORDERBOOK_L2',
      orderbook: {
        bids,
        asks,
        depth: Math.max(bids.length, asks.length)
      }
    };

    if (raw.sequenceNumber !== undefined) {
      payload.sequence_number = raw.sequenceNumber;
    }

    return payload;
  }
}
