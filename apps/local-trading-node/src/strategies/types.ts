import type { StrategyCandidatePayload, FeatureSnapshotPayload, CandidateGrade, EngineType } from '@trade/contracts';

export interface StrategyEngineConfig {
  engineType: EngineType;
  minRiskReward: string; // e.g. "1.50" or "2.00"
  maxHoldDurationMinutes: number; // e.g. 30 for scalp, 480 for intraday
  maxChaseAtrMultiplier: string; // e.g. "0.20" for scalp, "0.50" for intraday
}

export interface StrategyMetrics {
  engineType: EngineType;
  totalGenerated: number;
  gradeAPlusCount: number;
  gradeACount: number;
  gradeBCount: number;
  gradeCCount: number;
  rejectedCount: number;
  expiredCount: number;
}

export interface StrategyEvaluationResult {
  candidate: StrategyCandidatePayload | null;
  grade: CandidateGrade | 'REJECTED';
  reason: string;
}

export interface IStrategyEngine {
  readonly engineType: EngineType;
  evaluate(featureSnapshot: FeatureSnapshotPayload, currentPrice: string): StrategyEvaluationResult;
  getMetrics(): StrategyMetrics;
}
