import { describe, it, expect } from 'vitest';
import {
  parseDecimal,
  toDecimalString,
  quantizeQuantity,
  calculateRiskReward,
  calculatePositionSize
} from '../src/math/decimal.js';

describe('Arbitrary-Precision Decimal Math', () => {
  it('performs exact decimal arithmetic avoiding floating-point inaccuracies', () => {
    const a = parseDecimal('0.1');
    const b = parseDecimal('0.2');
    const sum = a.plus(b);
    expect(toDecimalString(sum)).toBe('0.3');
  });

  it('rejects invalid decimal strings or non-numeric strings', () => {
    expect(() => parseDecimal('abc')).toThrow();
    expect(() => parseDecimal('1.2.3')).toThrow();
    expect(() => parseDecimal('NaN')).toThrow();
    expect(() => parseDecimal('Infinity')).toThrow();
    expect(() => parseDecimal('1e5')).toThrow();
  });

  it('quantizes quantity by rounding down to stepSize (DEC-041)', () => {
    // 1.258 with stepSize 0.01 -> 1.25
    expect(toDecimalString(quantizeQuantity('1.258', '0.01'))).toBe('1.25');

    // 0.0059 with stepSize 0.001 -> 0.005
    expect(toDecimalString(quantizeQuantity('0.0059', '0.001'))).toBe('0.005');

    // 10.999 with stepSize 1 -> 10
    expect(toDecimalString(quantizeQuantity('10.999', '1'))).toBe('10');
  });

  it('calculates Risk-to-Reward accurately for BUY', () => {
    // Entry: 100, SL: 95 (risk = 5), TP: 115 (reward = 15) -> R:R = 3.0
    const rr = calculateRiskReward('100.00', '95.00', '115.00', 'BUY');
    expect(toDecimalString(rr)).toBe('3');
  });

  it('calculates Risk-to-Reward accurately for SELL', () => {
    // Entry: 100, SL: 105 (risk = 5), TP: 85 (reward = 15) -> R:R = 3.0
    expect(() => calculateRiskReward('100.00', '105.00', '105.00', 'SELL')).toThrow();
    const validRR = calculateRiskReward('100.00', '105.00', '85.00', 'SELL');
    expect(toDecimalString(validRR)).toBe('3');
  });

  it('calculates exact position sizing and risk amount', () => {
    // Equity: $10,000, Risk: 0.50% ($50)
    // Entry: $2000, SL: $1990 (dist = $10)
    // Size = 50 / 10 = 5 units
    const { riskAmount, rawQuantity } = calculatePositionSize(
      '10000.00',
      '0.50',
      '2000.00',
      '1990.00'
    );
    expect(toDecimalString(riskAmount)).toBe('50');
    expect(toDecimalString(rawQuantity)).toBe('5');
  });
});
