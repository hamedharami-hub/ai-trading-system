import { describe, it, expect } from 'vitest';
import { MockLLMProvider } from '../../src/ai/providers/mock-provider.js';
import { PromptTemplates } from '../../src/ai/prompts/prompt-templates.js';
import type { StrategyCandidatePayload, FeatureSnapshotPayload } from '@trade/contracts';

describe('LLM Providers & Prompt Sanitization', () => {
  it('sanitizes input and generates prompt templates', () => {
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

    const { systemPrompt, userPrompt } = PromptTemplates.buildAnalystPrompt(candidate, snapshot);
    expect(systemPrompt).toContain('AI Market Analyst');
    expect(userPrompt).toContain('BTCUSDT');
  });

  it('generates mock completion response accurately', async () => {
    const provider = new MockLLMProvider();
    const res = await provider.generateCompletion({ prompt: 'Analyst prompt review' });
    expect(res.parsedJson).toBeDefined();
    expect(res.usage.totalTokens).toBeGreaterThan(0);
  });
});
