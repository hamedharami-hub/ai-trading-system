import { Decimal, parseDecimal, toDecimalString } from "@trade/contracts";

export type TradeSide = "BUY" | "SELL";

export function quantizeQuantity(quantity: string, stepSize: string): string {
  const value = parseDecimal(quantity);
  const step = parseDecimal(stepSize);
  if (value.lte(0) || step.lte(0))
    throw new Error("Quantity and stepSize must be positive");
  return toDecimalString(value.div(step).floor().mul(step));
}

export function isTickAligned(price: string, tickSize: string): boolean {
  const value = parseDecimal(price);
  const tick = parseDecimal(tickSize);
  if (value.lte(0) || tick.lte(0)) return false;
  return value.mod(tick).isZero();
}

export function calculateNetRiskReward(input: {
  entryPrice: string;
  stopLossPrice: string;
  targetPrice: string;
  side: TradeSide;
  roundTripCosts: string;
}): string {
  const entry = parseDecimal(input.entryPrice);
  const stop = parseDecimal(input.stopLossPrice);
  const target = parseDecimal(input.targetPrice);
  const costs = parseDecimal(input.roundTripCosts);
  if (costs.lt(0)) throw new Error("Costs cannot be negative");

  const risk = input.side === "BUY" ? entry.minus(stop) : stop.minus(entry);
  const grossReward =
    input.side === "BUY" ? target.minus(entry) : entry.minus(target);
  if (risk.lte(0) || grossReward.lte(0))
    throw new Error("Invalid entry, stop, or target geometry");
  const netReward = grossReward.minus(costs);
  if (netReward.lte(0)) return "0";
  return toDecimalString(netReward.div(risk.plus(costs)));
}

export function calculatePositionSize(input: {
  equity: string;
  riskPercent: string;
  entryPrice: string;
  stopLossPrice: string;
  contractMultiplier: string;
  stepSize: string;
}): { riskAmount: string; rawQuantity: string; quantizedQuantity: string } {
  const equity = parseDecimal(input.equity);
  const riskPercent = parseDecimal(input.riskPercent);
  const entry = parseDecimal(input.entryPrice);
  const stop = parseDecimal(input.stopLossPrice);
  const multiplier = parseDecimal(input.contractMultiplier);
  if (equity.lte(0) || riskPercent.lte(0) || multiplier.lte(0))
    throw new Error("Sizing inputs must be positive");
  const distance = entry.minus(stop).abs();
  if (distance.isZero()) throw new Error("Stop distance cannot be zero");
  const riskAmount = equity.mul(riskPercent.div(100));
  const rawQuantity = riskAmount.div(distance.mul(multiplier));
  return {
    riskAmount: toDecimalString(riskAmount),
    rawQuantity: toDecimalString(rawQuantity),
    quantizedQuantity: quantizeQuantity(
      toDecimalString(rawQuantity),
      input.stepSize,
    ),
  };
}

export function minDecimal(...values: readonly string[]): string {
  if (values.length === 0) throw new Error("At least one value is required");
  return toDecimalString(Decimal.min(...values.map(parseDecimal)));
}
