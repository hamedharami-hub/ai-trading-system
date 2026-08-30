import { describe, it, expect } from 'vitest';
import { AnalystRole } from '../../src/ai/roles/analyst-role.js';
import { CriticRole } from '../../src/ai/roles/critic-role.js';
import { MockLLMProvider } from '../../src/ai/providers/mock-provider.js';
import { validatePayload } from '@trade/contracts';
import type { StrategyCandidatePayload, FeatureSnapshotPayload } from '@trade/contracts';

describe('Analyst & Critic AI Roles', () => {
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

  const snapshot: FeatureSnapshotPayload = {
    symbol: 'BTCUSDT',
    timeframe: '5M',
    smc: { bos: true, choch: false, displacement: true },
    order_flow: { ofi: '10', cvd: '500', spread_state: 'NORMAL' },
    secondary_filters: { atr: '150', vwap: '64800', volume_profile_poc: '64900' },
    evidence_candle_time: new Date().toISOString()
  };

  it('runs AnalystRole and validates AnalystProposalPayload', async () => {
    const provider = new MockLLMProvider();
    const analystRole = new AnalystRole(provider);

    const proposal = await analystRole.evaluate(candidate, snapshot);
    expect(proposal.candidate_id).toBe(candidate.candidate_id);
    expect(proposal.verdict).toBe('FAVORABLE');

    const valRes = validatePayload('ANALYST_PROPOSAL', proposal);
    expect(valRes.valid).toBe(true);
  });

  it('runs CriticRole and validates CriticProposalPayload', async () => {
    const provider = new MockLLMProvider();
    const analystRole = new AnalystRole(provider);
    const criticRole = new CriticRole(provider);

    const analystProposal = await analystRole.evaluate(candidate, snapshot);
    const criticProposal = await criticRole.evaluate(candidate, snapshot, analystProposal);

    expect(criticProposal.candidate_id).toBe(candidate.candidate_id);
    expect(criticProposal.verdict).toBe('FAVORABLE');

    const valRes = validatePayload('CRITIC_PROPOSAL', criticProposal);
    expect(valRes.valid).toBe(true);
  });
});
