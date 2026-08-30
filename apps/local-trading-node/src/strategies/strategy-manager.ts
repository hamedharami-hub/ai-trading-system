import type { FeatureSnapshotPayload, StrategyCandidatePayload, EngineType } from '@trade/contracts';
import { validatePayload } from '@trade/contracts';
import { ScalpStrategyEngine } from './scalp-engine.js';
import { IntradayStrategyEngine } from './intraday-engine.js';
import type { StrategyEvaluationResult, StrategyMetrics } from './types.js';

export class StrategyManager {
  private scalpEngine: ScalpStrategyEngine;
  private intradayEngine: IntradayStrategyEngine;
  private candidateListeners: Array<(candidate: StrategyCandidatePayload) => void> = [];

  constructor() {
    this.scalpEngine = new ScalpStrategyEngine();
    this.intradayEngine = new IntradayStrategyEngine();
  }

  public onCandidate(listener: (candidate: StrategyCandidatePayload) => void): void {
    this.candidateListeners.push(listener);
  }

  /**
   * Evaluates incoming feature snapshot and routes to Scalp or Intraday engine.
   */
  public evaluate(featureSnapshot: FeatureSnapshotPayload, currentPrice: string): StrategyEvaluationResult {
    let result: StrategyEvaluationResult;

    if (featureSnapshot.timeframe === '1M' || featureSnapshot.timeframe === '5M') {
      result = this.scalpEngine.evaluate(featureSnapshot, currentPrice);
    } else if (featureSnapshot.timeframe === '15M' || featureSnapshot.timeframe === '1H') {
      result = this.intradayEngine.evaluate(featureSnapshot, currentPrice);
    } else {
      return {
        candidate: null,
        grade: 'REJECTED',
        reason: `No active engine configured for timeframe ${featureSnapshot.timeframe}`
      };
    }

    if (result.candidate) {
      // Strict runtime schema validation (Fail-closed)
      const valRes = validatePayload('STRATEGY_CANDIDATE', result.candidate);
      if (!valRes.valid) {
        throw new Error(`Generated StrategyCandidate failed schema validation: ${valRes.errors?.join('; ')}`);
      }

      for (const listener of this.candidateListeners) {
        listener(result.candidate);
      }
    }

    return result;
  }

  public getMetrics(engineType?: EngineType): Record<EngineType, StrategyMetrics> | StrategyMetrics {
    if (engineType === 'SCALP') return this.scalpEngine.getMetrics();
    if (engineType === 'INTRADAY') return this.intradayEngine.getMetrics();

    return {
      SCALP: this.scalpEngine.getMetrics(),
      INTRADAY: this.intradayEngine.getMetrics()
    };
  }
}
