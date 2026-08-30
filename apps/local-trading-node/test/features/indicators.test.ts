import { describe, it, expect } from 'vitest';
import { SecondaryFilters } from '../../src/features/secondary-filters.js';
import { OrderFlowEngine } from '../../src/features/order-flow-engine.js';
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

describe('Secondary Filters & Order Flow Indicators', () => {
  it('calculates ATR with exact decimal accuracy', () => {
    const candles: CandleData[] = [
      makeCandle('100', '110', '90', '105', '100', 0), // TR = 20
      makeCandle('105', '115', '100', '112', '120', 1), // TR = max(15, 10, 5) = 15
      makeCandle('112', '120', '108', '110', '150', 2)  // TR = max(12, 8, 4) = 12
    ];

    const atr = SecondaryFilters.calculateATR(candles, 2);
    expect(atr.gt(0)).toBe(true);
    expect(atr.toFixed(2)).toBe('13.50'); // (15 + 12) / 2 = 13.5
  });

  it('calculates VWAP accurately', () => {
    const candles: CandleData[] = [
      makeCandle('100', '110', '90', '100', '10', 0), // TP = 100, Vol = 10, TPV = 1000
      makeCandle('100', '120', '100', '110', '20', 1)  // TP = 110, Vol = 20, TPV = 2200
      // Total TPV = 3200, Total Vol = 30 -> VWAP = 3200 / 30 = 106.666...
    ];

    const vwap = SecondaryFilters.calculateVWAP(candles);
    expect(vwap.toFixed(4)).toBe('106.6667');
  });

  it('calculates Volume Profile POC price level', () => {
    const candles: CandleData[] = [
      makeCandle('100', '102', '98', '100', '500', 0), // Heavy volume around 100
      makeCandle('102', '120', '102', '118', '50', 1)   // Low volume rally to 120
    ];

    const poc = SecondaryFilters.calculateVolumeProfilePOC(candles, 10);
    expect(poc.lte('105')).toBe(true); // POC should be concentrated near the 100 price level
  });

  it('calculates CVD, OFI, and spread classification', () => {
    const ofEngine = new OrderFlowEngine();

    // Buyer initiated trade at ask
    ofEngine.recordTrade(new Decimal('101.00'), new Decimal('100.00'), new Decimal('101.00'), new Decimal('5.0'));
    expect(ofEngine.getCVD().toString()).toBe('5');

    // Seller initiated trade at bid
    ofEngine.recordTrade(new Decimal('100.00'), new Decimal('100.00'), new Decimal('101.00'), new Decimal('2.0'));
    expect(ofEngine.getCVD().toString()).toBe('3');

    // OFI calculation
    const ofi = OrderFlowEngine.calculateOFI(
      new Decimal('100'), new Decimal('10'), // prevBid
      new Decimal('100'), new Decimal('15'), // currBid (+5)
      new Decimal('101'), new Decimal('10'), // prevAsk
      new Decimal('101'), new Decimal('8')   // currAsk (-2)
    );
    expect(ofi.toString()).toBe('7'); // 5 - (-2) = 7

    // Spread classification
    for (let i = 0; i < 10; i++) {
      ofEngine.classifySpread(new Decimal('0.00010'));
    }
    expect(ofEngine.classifySpread(new Decimal('0.00010'))).toBe('NORMAL');
    expect(ofEngine.classifySpread(new Decimal('0.00030'))).toBe('WIDE');
  });
});
