import { describe, it, expect } from 'vitest';
import { SMCEngine } from '../../src/features/smc-engine.js';
import type { CandleData } from '../../src/features/types.js';
import { Decimal } from '@trade/contracts';

function makeCandle(o: string, h: string, l: string, c: string, v: string, i: number): CandleData {
  return {
    open: new Decimal(o),
    high: new Decimal(h),
    low: new Decimal(l),
    close: new Decimal(c),
    volume: new Decimal(v),
    openTime: new Date(1700000000000 + i * 60000).toISOString(),
    closeTime: new Date(1700000000000 + (i + 1) * 60000).toISOString()
  };
}

describe('SMC Engine (Deterministic Market Structure)', () => {
  it('detects fractal swing points correctly', () => {
    // 5 candles forming a distinct Swing High at index 2
    const candles: CandleData[] = [
      makeCandle('100', '105', '98', '102', '10', 0),
      makeCandle('102', '110', '101', '108', '12', 1),
      makeCandle('108', '125', '107', '120', '25', 2), // Swing High
      makeCandle('120', '118', '112', '114', '15', 3),
      makeCandle('114', '113', '105', '106', '10', 4)
    ];

    const swings = SMCEngine.findSwingPoints(candles, 2, 2);
    expect(swings).toHaveLength(1);
    expect(swings[0]?.type).toBe('HIGH');
    expect(swings[0]?.price.toString()).toBe('125');
  });

  it('detects Fair Value Gaps (Bullish and Bearish) and tracks mitigation', () => {
    // Bullish FVG: Candle 0 high = 105, Candle 1 big green, Candle 2 low = 110 -> Gap (105 - 110)
    const candles: CandleData[] = [
      makeCandle('100', '105', '98', '103', '10', 0),
      makeCandle('103', '120', '102', '119', '30', 1),
      makeCandle('119', '125', '110', '124', '20', 2)
    ];

    const fvgs = SMCEngine.detectFVGs(candles);
    expect(fvgs).toHaveLength(1);
    expect(fvgs[0]?.type).toBe('BULLISH');
    expect(fvgs[0]?.top.toString()).toBe('110');
    expect(fvgs[0]?.bottom.toString()).toBe('105');
    expect(fvgs[0]?.mitigated).toBe(false);

    // Candle 3 mitigates the gap (low = 104 <= 110)
    candles.push(makeCandle('124', '124', '104', '115', '18', 3));
    const updatedFVGs = SMCEngine.detectFVGs(candles);
    expect(updatedFVGs[0]?.mitigated).toBe(true);
  });

  it('detects BOS (Break of Structure) on strong displacement close beyond swing high', () => {
    const candles: CandleData[] = [
      makeCandle('100', '105', '98', '102', '10', 0),
      makeCandle('102', '110', '101', '108', '12', 1),
      makeCandle('108', '120', '107', '118', '25', 2), // Swing High 1
      makeCandle('118', '118', '110', '112', '15', 3),
      makeCandle('112', '115', '108', '110', '10', 4), // Swing Low
      makeCandle('110', '122', '109', '121', '22', 5), // Swing High 2 (122 > 120)
      makeCandle('121', '121', '115', '116', '12', 6),
      makeCandle('116', '117', '112', '113', '10', 7),
      makeCandle('113', '135', '112', '134', '50', 8)  // Breakout Candle closing at 134 > 122
    ];

    const swings = SMCEngine.findSwingPoints(candles, 2, 2);
    const { bos, displacement } = SMCEngine.detectStructureBreaks(candles, swings);

    expect(bos).toBe(true);
    expect(displacement).toBe(true);
  });

  it('detects Liquidity Sweeps on wick breaches', () => {
    const candles: CandleData[] = [
      makeCandle('100', '105', '98', '102', '10', 0),
      makeCandle('102', '110', '101', '108', '12', 1),
      makeCandle('108', '120', '107', '118', '25', 2), // Key Swing High at 120
      makeCandle('118', '118', '110', '112', '15', 3),
      makeCandle('112', '115', '108', '110', '10', 4)
    ];

    const swings = SMCEngine.findSwingPoints(candles, 2, 2);

    // Current candle wicks above 120 (high 122) but closes below 120 (close 117)
    const sweepCandle = makeCandle('115', '122', '114', '117', '40', 5);
    const sweep = SMCEngine.detectLiquiditySweep(sweepCandle, swings);

    expect(sweep).not.toBeNull();
    expect(sweep?.direction).toBe('HIGH');
    expect(sweep?.sweptLevel.toString()).toBe('120');
  });
});
