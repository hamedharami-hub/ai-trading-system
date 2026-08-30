import { describe, it, expect } from 'vitest';
import { FeatureEngine } from '../../src/features/feature-engine.js';
import { validatePayload } from '@trade/contracts';

describe('Feature Engine Coordinator & Golden Dataset Validation', () => {
  it('generates fully populated, schema-compliant FeatureSnapshotPayload', () => {
    const engine = new FeatureEngine({ maxHistoryCandles: 50 });

    const baseTime = 1700000000000;
    // Generate synthetic golden candle sequence
    const candleData = [
      { o: '1.08000', h: '1.08100', l: '1.07950', c: '1.08050', v: '100' },
      { o: '1.08050', h: '1.08250', l: '1.08020', c: '1.08200', v: '150' },
      { o: '1.08200', h: '1.08350', l: '1.08180', c: '1.08300', v: '200' },
      { o: '1.08300', h: '1.08320', l: '1.08150', c: '1.08170', v: '120' },
      { o: '1.08170', h: '1.08200', l: '1.08080', c: '1.08100', v: '90' },
      { o: '1.08100', h: '1.08500', l: '1.08090', c: '1.08480', v: '350' } // Breakout candle
    ];

    for (let i = 0; i < candleData.length; i++) {
      const c = candleData[i]!;
      engine.addCandle('EURUSD', '15M', {
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
        volume: c.v,
        openTime: new Date(baseTime + i * 900000).toISOString(),
        closeTime: new Date(baseTime + (i + 1) * 900000).toISOString()
      });
    }

    const snapshot = engine.generateSnapshot('EURUSD', '15M', 'NORMAL');

    expect(snapshot.symbol).toBe('EURUSD');
    expect(snapshot.timeframe).toBe('15M');
    expect(snapshot.smc).toBeDefined();
    expect(snapshot.smc.displacement).toBe(true);
    expect(snapshot.order_flow.spread_state).toBe('NORMAL');
    expect(snapshot.secondary_filters.atr).toBeDefined();
    expect(snapshot.secondary_filters.vwap).toBeDefined();
    expect(snapshot.secondary_filters.volume_profile_poc).toBeDefined();

    // Verify compliance with authoritative contracts JSON Schema
    const valRes = validatePayload('FEATURE_SNAPSHOT', snapshot);
    expect(valRes.valid).toBe(true);
    expect(valRes.errors).toBeUndefined();
  });
});
