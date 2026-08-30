import { Decimal } from 'decimal.js';

// Configure high-precision financial decimal environment
Decimal.set({
  precision: 34, // Standard IEEE 754 decimal128 precision
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -12,
  toExpPos: 20
});

const DECIMAL_REGEX = /^-?(0|[1-9]\d*)(\.\d+)?$/;

/**
 * Validates and converts an arbitrary precision string to a Decimal instance.
 * Throws an error if input is not a canonical decimal string or is NaN/Infinity.
 */
export function parseDecimal(value: string | Decimal): Decimal {
  if (value instanceof Decimal) {
    if (!value.isFinite()) {
      throw new Error(`Invalid non-finite Decimal value: ${value.toString()}`);
    }
    return value;
  }

  if (typeof value !== 'string' || !DECIMAL_REGEX.test(value.trim())) {
    throw new Error(`Invalid decimal string format: "${value}". Must match ^-?(0|[1-9]\\d*)(\\.\\d+)?$`);
  }

  const d = new Decimal(value.trim());
  if (!d.isFinite()) {
    throw new Error(`Decimal value evaluates to non-finite: "${value}"`);
  }
  return d;
}

/**
 * Formats a Decimal value to a canonical string representation (never scientific notation).
 */
export function toDecimalString(d: Decimal | string): string {
  const dec = parseDecimal(d);
  return dec.toFixed();
}

/**
 * Quantizes order quantity by rounding DOWN to the venue's stepSize (DEC-041).
 * Example: qty = 1.258, stepSize = 0.01 -> 1.25
 */
export function quantizeQuantity(quantity: string | Decimal, stepSize: string | Decimal): Decimal {
  const q = parseDecimal(quantity);
  const step = parseDecimal(stepSize);

  if (q.lte(0)) {
    throw new Error(`Quantity must be strictly positive, got: ${q.toString()}`);
  }
  if (step.lte(0)) {
    throw new Error(`stepSize must be strictly positive, got: ${step.toString()}`);
  }

  // floor(q / step) * step
  const units = q.dividedBy(step).floor();
  return units.times(step);
}

/**
 * Calculates net Risk-to-Reward ratio for BUY and SELL trades.
 */
export function calculateRiskReward(
  entryPrice: string | Decimal,
  stopLossPrice: string | Decimal,
  targetPrice: string | Decimal,
  side: 'BUY' | 'SELL'
): Decimal {
  const entry = parseDecimal(entryPrice);
  const sl = parseDecimal(stopLossPrice);
  const tp = parseDecimal(targetPrice);

  let riskDist: Decimal;
  let rewardDist: Decimal;

  if (side === 'BUY') {
    if (sl.gte(entry)) {
      throw new Error(`For BUY, Stop Loss (${sl}) must be below Entry (${entry})`);
    }
    if (tp.lte(entry)) {
      throw new Error(`For BUY, Take Profit (${tp}) must be above Entry (${entry})`);
    }
    riskDist = entry.minus(sl);
    rewardDist = tp.minus(entry);
  } else {
    if (sl.lte(entry)) {
      throw new Error(`For SELL, Stop Loss (${sl}) must be above Entry (${entry})`);
    }
    if (tp.gte(entry)) {
      throw new Error(`For SELL, Take Profit (${tp}) must be below Entry (${entry})`);
    }
    riskDist = sl.minus(entry);
    rewardDist = entry.minus(tp);
  }

  if (riskDist.isZero()) {
    throw new Error('Risk distance cannot be zero');
  }

  return rewardDist.dividedBy(riskDist);
}

/**
 * Calculates position sizing based on portfolio equity and approved risk percentage.
 * Formula: RiskAmount = Equity * (RiskPercent / 100)
 * Quantity = RiskAmount / (StopLossDistanceInPrice * ContractSize)
 */
export function calculatePositionSize(
  equity: string | Decimal,
  riskPercent: string | Decimal,
  entryPrice: string | Decimal,
  stopLossPrice: string | Decimal,
  contractMultiplier: string | Decimal = '1'
): { riskAmount: Decimal; rawQuantity: Decimal } {
  const eq = parseDecimal(equity);
  const rPct = parseDecimal(riskPercent);
  const entry = parseDecimal(entryPrice);
  const sl = parseDecimal(stopLossPrice);
  const mult = parseDecimal(contractMultiplier);

  if (eq.lte(0)) throw new Error('Equity must be positive');
  if (rPct.lte(0)) throw new Error('Risk percent must be positive');
  if (mult.lte(0)) throw new Error('Contract multiplier must be positive');

  const riskAmount = eq.times(rPct.dividedBy('100'));
  const slDistance = entry.minus(sl).abs();

  if (slDistance.isZero()) {
    throw new Error('Stop loss distance cannot be zero');
  }

  const rawQuantity = riskAmount.dividedBy(slDistance.times(mult));
  return { riskAmount, rawQuantity };
}

export { Decimal };
