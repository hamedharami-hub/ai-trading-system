import { describe, it, expect } from 'vitest';
import { AIRouter } from '../../src/ai/ai-router.js';
import { HumanReviewLayer } from '../../src/ai/human-layer.js';
import { MockLLMProvider } from '../../src/ai/providers/mock-provider.js';
import { validatePayload } from '@trade/contracts';
import type { StrategyCandidatePayload, FeatureSnapshotPayload } from '@trade/contracts';

describe('AI Router Pipeline & Human Review Layer', () => {
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

  it('executes full multi-role AI pipeline', async () => {
    const provider = new MockLLMProvider();
    const router = new AIRouter({ primaryProvider: provider });

    const result = await router.runEvaluationPipeline(candidate, snapshot);
    expect(result.success).toBe(true);
    expect(result.analyst.verdict).toBe('FAVORABLE');
    expect(result.critic.verdict).toBe('FAVORABLE');
    expect(result.judge.decision).toBe('APPROVE');

    const metrics = router.getMetrics();
    expect(metrics.totalRequests).toBe(1);
    expect(metrics.roleCounts.ANALYST).toBe(1);
    expect(metrics.roleCounts.CRITIC).toBe(1);
    expect(metrics.roleCounts.JUDGE).toBe(1);
  });

  it('records human operator decisions and validates PolicyDecisionPayload', () => {
    const humanLayer = new HumanReviewLayer();
    const policyDecision = humanLayer.evaluateHumanDecision({
      candidateId: candidate.candidate_id,
      approved: true,
      notes: 'Human operator approved execution'
    });

    expect(policyDecision.status).toBe('PASSED');
    expect(policyDecision.candidate_id).toBe(candidate.candidate_id);

    const valRes = validatePayload('POLICY_DECISION', policyDecision);
    expect(valRes.valid).toBe(true);
  });
});
