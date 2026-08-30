import crypto from 'node:crypto';
import type { StrategyCandidatePayload, FeatureSnapshotPayload, TradeSide } from '@trade/contracts';
import { parseDecimal, toDecimalString, calculateRiskReward } from '@trade/contracts';
import type { IStrategyEngine, StrategyEngineConfig, StrategyMetrics, StrategyEvaluationResult } from './types.js';
import { CandidateGrader } from './grading.js';

export const DEFAULT_SCALP_CONFIG: StrategyEngineConfig = {
  engineType: 'SCALP',
  minRiskReward: '1.50',
  maxHoldDurationMinutes: 30,
  maxChaseAtrMultiplier: '0.20'
};

export class ScalpStrategyEngine implements IStrategyEngine {
  public readonly engineType = 'SCALP';
  private metrics: StrategyMetrics = {
    engineType: 'SCALP',
    totalGenerated: 0,
    gradeAPlusCount: 0,
    gradeACount: 0,
    gradeBCount: 0,
    gradeCCount: 0,
    rejectedCount: 0,
    expiredCount: 0
  };

  constructor(private readonly config: StrategyEngineConfig = DEFAULT_SCALP_CONFIG) {}

  public evaluate(featureSnapshot: FeatureSnapshotPayload, currentPriceStr: string): StrategyEvaluationResult {
    // 1. Timeframe check (Scalp only operates on 1M and 5M)
    if (featureSnapshot.timeframe !== '1M' && featureSnapshot.timeframe !== '5M') {
      return { candidate: null, grade: 'REJECTED', reason: 'Unsupported timeframe for Scalp engine' };
    }

    const currentPrice = parseDecimal(currentPriceStr);
    const atr = parseDecimal(featureSnapshot.secondary_filters.atr);

    // 2. Identify Potential Direction
    let side: TradeSide | null = null;
    let entryPrice = currentPrice;
    let stopLoss = currentPrice;
    let takeProfit = currentPrice;

    const fvg = featureSnapshot.smc.fvg;
    const ob = featureSnapshot.smc.order_block;
    const sweep = featureSnapshot.smc.liquidity_sweep;

    if ((fvg && fvg.type === 'BULLISH' && !fvg.mitigated) || (sweep && sweep.direction === 'LOW')) {
      side = 'BUY';
      entryPrice = currentPrice;
      const baseStop = sweep ? parseDecimal(sweep.swept_level) : (fvg ? parseDecimal(fvg.bottom) : currentPrice.minus(atr));
      stopLoss = baseStop.minus(atr.times('0.5'));
      const risk = entryPrice.minus(stopLoss);
      if (risk.gt(0)) {
        takeProfit = entryPrice.plus(risk.times(this.config.minRiskReward));
      }
    } else if ((fvg && fvg.type === 'BEARISH' && !fvg.mitigated) || (sweep && sweep.direction === 'HIGH')) {
      side = 'SELL';
      entryPrice = currentPrice;
      const baseStop = sweep ? parseDecimal(sweep.swept_level) : (fvg ? parseDecimal(fvg.top) : currentPrice.plus(atr));
      stopLoss = baseStop.plus(atr.times('0.5'));
      const risk = stopLoss.minus(entryPrice);
      if (risk.gt(0)) {
        takeProfit = entryPrice.minus(risk.times(this.config.minRiskReward));
      }
    }

    if (!side) {
      return { candidate: null, grade: 'REJECTED', reason: 'No valid scalp SMC trigger identified' };
    }

    // 3. No-Chase Rule Verification
    const maxChaseDist = atr.times(this.config.maxChaseAtrMultiplier);
    const chaseDist = currentPrice.minus(entryPrice).abs();
    if (chaseDist.gt(maxChaseDist)) {
      this.metrics.rejectedCount++;
      return {
        candidate: null,
        grade: 'REJECTED',
        reason: `Price has moved beyond max chase distance (${toDecimalString(chaseDist)} > ${toDecimalString(maxChaseDist)})`
      };
    }

    // 4. Calculate Risk:Reward
    const rr = calculateRiskReward(entryPrice, stopLoss, takeProfit, side);
    const rrStr = toDecimalString(rr);

    // 5. Grade Candidate
    const { grade, reason } = CandidateGrader.grade({
      side,
      calculatedRR: rrStr,
      minRR: this.config.minRiskReward,
      featureSnapshot
    });

    if (grade === 'REJECTED') {
      this.metrics.rejectedCount++;
      return { candidate: null, grade, reason };
    }

    // 6. Build Valid StrategyCandidatePayload
    const candidate: StrategyCandidatePayload = {
      candidate_id: crypto.randomUUID(),
      engine_type: 'SCALP',
      symbol: featureSnapshot.symbol,
      side,
      grade,
      entry_price: toDecimalString(entryPrice),
      invalidation_price: toDecimalString(stopLoss),
      target_price: toDecimalString(takeProfit),
      risk_reward_ratio: rrStr,
      expiry_candles: 5,
      generated_at: new Date().toISOString()
    };

    this.metrics.totalGenerated++;
    if (grade === 'A_PLUS') this.metrics.gradeAPlusCount++;
    if (grade === 'A') this.metrics.gradeACount++;
    if (grade === 'B') this.metrics.gradeBCount++;
    if (grade === 'C') this.metrics.gradeCCount++;

    return { candidate, grade, reason };
  }

  public getMetrics(): StrategyMetrics {
    return { ...this.metrics };
  }
}
