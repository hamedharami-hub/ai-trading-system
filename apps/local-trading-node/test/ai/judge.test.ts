import { describe, it, expect } from 'vitest';
import { JudgeRole } from '../../src/ai/roles/judge-role.js';
import { MockLLMProvider } from '../../src/ai/providers/mock-provider.js';
import { validatePayload } from '@trade/contracts';
import type { StrategyCandidatePayload, AnalystProposalPayload, CriticProposalPayload } from '@trade/contracts';

describe('Judge AI Role', () => {
  const candidate: StrategyCandidatePayload = {
    candidate_id: '018f3a55-0000-7000-8000-000000000001',
    engine_type: 'SCALP',
    symbol: 'BTCUSDT',
    side: 'BUY',
    grade: 'A',
    entry_price: '65000',
    invalidation_price: '64800',
    target_price: '65400',
    risk_reward_ratio: '2.00',
    expiry_candles: 5,
    generated_at: new Date().toISOString()
  };

  const analyst: AnalystProposalPayload = {
    candidate_id: candidate.candidate_id,
    verdict: 'FAVORABLE',
    confidence: '0.85',
    evidence_keys: ['SMC_BOS'],
    evaluated_at: new Date().toISOString()
  };

  const critic: CriticProposalPayload = {
    candidate_id: candidate.candidate_id,
    verdict: 'FAVORABLE',
    confidence: '0.80',
    evidence_keys: ['LOW_SLIPPAGE_RISK'],
    evaluated_at: new Date().toISOString()
  };

  it('runs JudgeRole and validates JudgeDecisionPayload against canonical contracts', async () => {
    const provider = new MockLLMProvider();
    const judge = new JudgeRole(provider);

    const decision = await judge.evaluate(candidate, analyst, critic);
    expect(decision.candidate_id).toBe(candidate.candidate_id);
    expect(decision.decision).toBe('APPROVE');

    const valRes = validatePayload('JUDGE_DECISION', decision);
    expect(valRes.valid).toBe(true);
  });
});
