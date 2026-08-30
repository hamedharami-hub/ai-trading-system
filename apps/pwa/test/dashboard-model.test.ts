import { describe, it, expect } from 'vitest';
import { DashboardModel } from '../src/components/dashboard-model.js';
import type { EventEnvelope, AuditEventPayload, StrategyCandidatePayload } from '@trade/contracts';

describe('PWA Dashboard Model', () => {
  it('updates state upon receiving audit events and candidates', () => {
    const model = new DashboardModel();
    expect(model.getState().lifecycleState).toBe('IDLE');

    const auditPayload: AuditEventPayload = {
      audit_id: '018f3a55-0000-7000-8000-000000000001',
      action: 'NODE_STARTED',
      actor: 'SYSTEM',
      entity_type: 'LOCAL_NODE',
      entity_id: 'NODE_1',
      canonical_hash: 'a'.repeat(64),
      recorded_at: new Date().toISOString()
    };

    const auditEnvelope: EventEnvelope = {
      schema_version: '1.0.0',
      event_id: '018f3a55-0000-7000-8000-000000000002',
      correlation_id: '018f3a55-0000-7000-8000-000000000003',
      timestamp_exchange: new Date().toISOString(),
      timestamp_local: new Date().toISOString(),
      source: 'LOCAL_NODE',
      device_id: 'DEV_1',
      event_type: 'AUDIT_EVENT',
      payload: auditPayload as any
    };

    model.processEnvelope(auditEnvelope);
    expect(model.getState().recentAuditEvents.length).toBe(1);
    expect(model.getState().recentAuditEvents[0]?.action).toBe('NODE_STARTED');

    const candidatePayload: StrategyCandidatePayload = {
      candidate_id: '018f3a55-0000-7000-8000-000000000010',
      engine_type: 'SCALP',
      symbol: 'BTCUSDT',
      side: 'BUY',
      grade: 'A_PLUS',
      entry_price: '65000',
      invalidation_price: '64800',
      target_price: '65500',
      risk_reward_ratio: '2.50',
      expiry_candles: 3,
      generated_at: new Date().toISOString()
    };

    const candidateEnvelope: EventEnvelope = {
      schema_version: '1.0.0',
      event_id: '018f3a55-0000-7000-8000-000000000020',
      correlation_id: '018f3a55-0000-7000-8000-000000000030',
      timestamp_exchange: new Date().toISOString(),
      timestamp_local: new Date().toISOString(),
      source: 'LOCAL_NODE',
      device_id: 'DEV_1',
      event_type: 'STRATEGY_CANDIDATE',
      payload: candidatePayload as any
    };

    model.processEnvelope(candidateEnvelope);
    expect(model.getState().pendingCandidates.length).toBe(1);
    expect(model.getState().pendingCandidates[0]?.candidate_id).toBe(candidatePayload.candidate_id);
  });
});
