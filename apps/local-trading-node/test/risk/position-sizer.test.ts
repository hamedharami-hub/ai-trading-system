import { describe, it, expect } from 'vitest';
import { PositionSizer } from '../../src/risk/position-sizer.js';
import { Decimal } from '@trade/contracts';

describe('Position Sizer', () => {
  it('calculates position size and quantizes down to stepSize', () => {
    const equity = new Decimal('10000'); // $10,000 equity
    const riskPercent = new Decimal('0.01'); // 1.0% = $100 risk
    const entryPrice = new Decimal('65000');
    const invalidationPrice = new Decimal('64500'); // Distance = $500
    // Raw qty = 100 / 500 = 0.2 BTC
    const stepSize = new Decimal('0.001');

    const result = PositionSizer.calculatePositionSize(equity, riskPercent, entryPrice, invalidationPrice, stepSize);
    expect(result.valid).toBe(true);
    expect(result.riskAmount.toString()).toBe('100');
    expect(result.rawQuantity.toString()).toBe('0.2');
    expect(result.quantizedQuantity.toString()).toBe('0.2');
  });

  it('rejects sizing if quantized quantity is below minQty', () => {
    const equity = new Decimal('100'); // $100 equity
    const riskPercent = new Decimal('0.01'); // 1.0% = $1 risk
    const entryPrice = new Decimal('65000');
    const invalidationPrice = new Decimal('64000'); // Distance = $1000
    // Raw qty = 1 / 1000 = 0.001 BTC
    const minQty = new Decimal('0.01'); // Min qty required is 0.01

    const result = PositionSizer.calculatePositionSize(equity, riskPercent, entryPrice, invalidationPrice, new Decimal('0.001'), minQty);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('below venue minimum quantity');
  });
});
