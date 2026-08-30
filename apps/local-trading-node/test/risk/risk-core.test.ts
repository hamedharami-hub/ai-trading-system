import { describe, it, expect } from 'vitest';
import { RiskCore } from '../../src/risk/risk-core.js';
import { validatePayload, Decimal } from '@trade/contracts';
import type { StrategyCandidatePayload } from '@trade/contracts';
import type { AccountState } from '../../src/risk/types.js';

describe('Risk Core Coordinator & Schema Compliance', () => {
  const candidate: StrategyCandidatePayload = {
    candidate_id: '018f3a55-0000-7000-8000-000000000001',
    engine_type: 'SCALP',
    symbol: 'BTCUSDT',
    side: 'BUY',
    grade: 'A',
    entry_price: '65000',
    invalidation_price: '64500',
    target_price: '66000',
    risk_reward_ratio: '2.00',
    expiry_candles: 5,
    generated_at: new Date().toISOString()
  };

  const account: AccountState = {
    equity: new Decimal('10000'),
    balance: new Decimal('10000'),
    highWaterMark: new Decimal('10000'),
    dailyRealizedLoss: new Decimal('0'),
    openPositions: [],
    consecutiveLosses: 0
  };

  it('approves compliant trade candidate and validates RiskDecisionPayload against schema', () => {
    const riskCore = new RiskCore();
    const decision = riskCore.evaluateCandidate(candidate, account);

    expect(decision.status).toBe('APPROVED');
    expect(decision.candidate_id).toBe(candidate.candidate_id);
    expect(decision.quantized_quantity).toBe('0.2');
    expect(decision.estimated_risk_amount).toBe('100');

    // Strict schema validation
    const valRes = validatePayload('RISK_DECISION', decision);
    expect(valRes.valid).toBe(true);
    expect(valRes.errors).toBeUndefined();
  });

  it('rejects candidate and populates rejection_reasons when daily loss limit is breached', () => {
    const riskCore = new RiskCore();
    const breachedAccount = { ...account, dailyRealizedLoss: new Decimal('400') };
    const decision = riskCore.evaluateCandidate(candidate, breachedAccount);

    expect(decision.status).toBe('REJECTED');
    expect(decision.approved_risk_percent).toBe('0');
    expect(decision.rejection_reasons.length).toBeGreaterThan(0);

    const valRes = validatePayload('RISK_DECISION', decision);
    expect(valRes.valid).toBe(true);
  });
});
