import { describe, it, expect } from 'vitest';
import { IntradayStrategyEngine } from '../../src/strategies/intraday-engine.js';
import type { FeatureSnapshotPayload } from '@trade/contracts';

describe('Intraday Strategy Engine', () => {
  const sampleSnapshot: FeatureSnapshotPayload = {
    symbol: 'EURUSD',
    timeframe: '15M',
    smc: {
      bos: true,
      choch: false,
      displacement: true,
      order_block: {
        top: '1.08300',
        bottom: '1.08200',
        type: 'BULLISH',
        mitigated: false
      }
    },
    order_flow: {
      ofi: '8',
      cvd: '250',
      spread_state: 'NORMAL'
    },
    secondary_filters: {
      atr: '0.00120',
      vwap: '1.08100',
      volume_profile_poc: '1.08150'
    },
    evidence_candle_time: new Date().toISOString()
  };

  it('generates a valid Intraday candidate with R:R >= 2.00', () => {
    const engine = new IntradayStrategyEngine();
    const result = engine.evaluate(sampleSnapshot, '1.08500');

    expect(result.candidate).not.toBeNull();
    expect(result.candidate?.engine_type).toBe('INTRADAY');
    expect(result.candidate?.side).toBe('BUY');
    expect(Number(result.candidate?.risk_reward_ratio)).toBeGreaterThanOrEqual(2.00);
  });
});
