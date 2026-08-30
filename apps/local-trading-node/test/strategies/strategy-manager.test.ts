import { describe, it, expect } from 'vitest';
import { StrategyManager } from '../../src/strategies/strategy-manager.js';
import { validatePayload } from '@trade/contracts';
import type { FeatureSnapshotPayload, StrategyCandidatePayload } from '@trade/contracts';

describe('Strategy Manager & Schema Compliance', () => {
  it('routes snapshot to proper engine and verifies StrategyCandidatePayload against canonical contracts', () => {
    const manager = new StrategyManager();

    let capturedCandidate: StrategyCandidatePayload | null = null;
    manager.onCandidate((c) => {
      capturedCandidate = c;
    });

    const scalpSnapshot: FeatureSnapshotPayload = {
      symbol: 'BTCUSDT',
      timeframe: '5M',
      smc: {
        bos: true,
        choch: false,
        displacement: true,
        fvg: {
          top: '65000',
          bottom: '64800',
          type: 'BULLISH',
          mitigated: false
        }
      },
      order_flow: { ofi: '10', cvd: '500', spread_state: 'NORMAL' },
      secondary_filters: { atr: '150', vwap: '64500', volume_profile_poc: '64700' },
      evidence_candle_time: new Date().toISOString()
    };

    const res = manager.evaluate(scalpSnapshot, '65000');
    expect(res.candidate).not.toBeNull();
    expect(capturedCandidate).toBe(res.candidate);

    // Validate with strict contracts Ajv validator
    const valRes = validatePayload('STRATEGY_CANDIDATE', res.candidate!);
    expect(valRes.valid).toBe(true);
    expect(valRes.errors).toBeUndefined();

    // Verify isolated metrics
    const metrics = manager.getMetrics() as Record<string, { totalGenerated: number }>;
    expect(metrics.SCALP?.totalGenerated).toBe(1);
    expect(metrics.INTRADAY?.totalGenerated).toBe(0);
  });
});
