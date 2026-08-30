import { describe, it, expect } from 'vitest';
import { ScalpStrategyEngine } from '../../src/strategies/scalp-engine.js';
import type { FeatureSnapshotPayload } from '@trade/contracts';

describe('Scalp Strategy Engine', () => {
  const sampleSnapshot: FeatureSnapshotPayload = {
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
    order_flow: {
      ofi: '10',
      cvd: '500',
      spread_state: 'NORMAL'
    },
    secondary_filters: {
      atr: '150',
      vwap: '64500',
      volume_profile_poc: '64700'
    },
    evidence_candle_time: new Date().toISOString()
  };

  it('generates a valid Scalp candidate with R:R >= 1.50', () => {
    const engine = new ScalpStrategyEngine();
    const result = engine.evaluate(sampleSnapshot, '65000');

    expect(result.candidate).not.toBeNull();
    expect(result.candidate?.engine_type).toBe('SCALP');
    expect(result.candidate?.side).toBe('BUY');
    expect(Number(result.candidate?.risk_reward_ratio)).toBeGreaterThanOrEqual(1.50);
  });

  it('rejects evaluation on unsupported timeframes (e.g. 1H)', () => {
    const engine = new ScalpStrategyEngine();
    const h1Snapshot = { ...sampleSnapshot, timeframe: '1H' as const };
    const result = engine.evaluate(h1Snapshot, '65000');

    expect(result.candidate).toBeNull();
    expect(result.grade).toBe('REJECTED');
  });
});
