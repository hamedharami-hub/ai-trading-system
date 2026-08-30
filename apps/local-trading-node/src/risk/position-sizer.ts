import { Decimal, parseDecimal, quantizeQuantity } from '@trade/contracts';

export interface SizingResult {
  riskAmount: Decimal;
  rawQuantity: Decimal;
  quantizedQuantity: Decimal;
  valid: boolean;
  reason?: string;
}

export class PositionSizer {
  /**
   * Computes position size based on exact monetary risk and invalidation distance.
   */
  public static calculatePositionSize(
    equity: Decimal,
    riskPercent: Decimal,
    entryPrice: Decimal,
    invalidationPrice: Decimal,
    stepSize: Decimal = new Decimal('0.001'),
    minQty: Decimal = new Decimal('0.001')
  ): SizingResult {
    const riskAmount = equity.times(riskPercent);
    const distance = entryPrice.minus(invalidationPrice).abs();

    if (riskAmount.lte(0)) {
      return {
        riskAmount: new Decimal(0),
        rawQuantity: new Decimal(0),
        quantizedQuantity: new Decimal(0),
        valid: false,
        reason: 'Calculated risk amount is zero or negative'
      };
    }

    if (distance.isZero()) {
      return {
        riskAmount,
        rawQuantity: new Decimal(0),
        quantizedQuantity: new Decimal(0),
        valid: false,
        reason: 'Invalidation price cannot equal entry price (zero stop distance)'
      };
    }

    const rawQuantity = riskAmount.dividedBy(distance);
    const quantizedQuantity = quantizeQuantity(rawQuantity, stepSize);

    if (quantizedQuantity.lt(minQty)) {
      return {
        riskAmount,
        rawQuantity,
        quantizedQuantity,
        valid: false,
        reason: `Quantized quantity (${quantizedQuantity.toString()}) is below venue minimum quantity (${minQty.toString()})`
      };
    }

    return {
      riskAmount,
      rawQuantity,
      quantizedQuantity,
      valid: true
    };
  }
}
