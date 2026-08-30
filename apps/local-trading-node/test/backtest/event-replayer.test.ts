import { describe, it, expect } from 'vitest';
import { EventReplayer } from '../../src/backtest/event-replayer.js';
import type { CandleData } from '../../src/features/types.js';
import { Decimal } from '@trade/contracts';

describe('Event Replayer', () => {
  it('iterates through candles in ascending chronological order', () => {
    const baseTime = Date.now();
    const candles: CandleData[] = [
      {
        open: new Decimal('65000'),
        high: new Decimal('65100'),
        low: new Decimal('64900'),
        close: new Decimal('65050'),
        volume: new Decimal('10'),
        openTime: new Date(baseTime).toISOString(),
        closeTime: new Date(baseTime + 60000).toISOString()
      },
      {
        open: new Decimal('65050'),
        high: new Decimal('65200'),
        low: new Decimal('65000'),
        close: new Decimal('65150'),
        volume: new Decimal('15'),
        openTime: new Date(baseTime + 60000).toISOString(),
        closeTime: new Date(baseTime + 120000).toISOString()
      }
    ];

    const replayer = new EventReplayer(candles);
    expect(replayer.totalCandles).toBe(2);
    expect(replayer.hasNext()).toBe(true);

    const first = replayer.next();
    expect(first?.close.toString()).toBe('65050');

    const second = replayer.next();
    expect(second?.close.toString()).toBe('65150');

    expect(replayer.hasNext()).toBe(false);
  });

  it('throws an error if candles are not in ascending chronological order', () => {
    const baseTime = Date.now();
    const outOfOrderCandles: CandleData[] = [
      {
        open: new Decimal('65000'),
        high: new Decimal('65100'),
        low: new Decimal('64900'),
        close: new Decimal('65050'),
        volume: new Decimal('10'),
        openTime: new Date(baseTime + 60000).toISOString(),
        closeTime: new Date(baseTime + 120000).toISOString()
      },
      {
        open: new Decimal('65050'),
        high: new Decimal('65200'),
        low: new Decimal('65000'),
        close: new Decimal('65150'),
        volume: new Decimal('15'),
        openTime: new Date(baseTime).toISOString(),
        closeTime: new Date(baseTime + 60000).toISOString() // Earlier time
      }
    ];

    expect(() => new EventReplayer(outOfOrderCandles)).toThrow();
  });
});
