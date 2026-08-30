import type { Decimal, EventEnvelope, UUIDv7, AuditEventPayload } from '@trade/contracts';

export interface AuditRecordInput {
  action: string;
  actor: string;
  entityType: string;
  entityId: string;
  stateBefore?: Record<string, unknown>;
  stateAfter?: Record<string, unknown>;
  parentEventId?: UUIDv7;
}

export interface CounterfactualRecord {
  candidateId: UUIDv7;
  rejectedBy: 'STRATEGY_GRADER' | 'AI_JUDGE' | 'RISK_CORE' | 'HUMAN';
  rejectionReason: string;
  potentialOutcome: 'WOULD_HAVE_WON' | 'WOULD_HAVE_LOST' | 'UNDETERMINED';
  evaluatedAt: string;
}

export interface DailyReport {
  date: string;
  totalTrades: number;
  realizedPnl: Decimal;
  winRatePercent: Decimal;
  maxDailyDrawdownPercent: Decimal;
  dailyLossLimitStatus: 'OK' | 'BREACHED';
  counterfactualEvaluations: CounterfactualRecord[];
}

export interface IEventStore {
  append(event: EventEnvelope): Promise<void>;
  getEventsByCorrelationId(correlationId: string): Promise<EventEnvelope[]>;
  getAllEvents(): Promise<EventEnvelope[]>;
}
