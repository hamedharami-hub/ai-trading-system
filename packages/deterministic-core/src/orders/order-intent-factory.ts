import { validatePayload, type OrderIntentPayload } from "@trade/contracts";
import type { PolicyGateDecision } from "../policy/policy-gate.js";
import type { RiskEvaluation } from "../risk/risk-engine.js";

export interface OrderIntentRequest {
  readonly intentId: string;
  readonly candidateId: string;
  readonly idempotencyKey: string;
  readonly symbol: OrderIntentPayload["symbol"];
  readonly side: OrderIntentPayload["side"];
  readonly orderType: OrderIntentPayload["order_type"];
  readonly quantity: string;
  readonly limitPrice?: string;
  readonly stopLossPrice: string;
  readonly takeProfitPrice: string;
  readonly maxSlippage?: string;
  readonly timeInForce: OrderIntentPayload["time_in_force"];
  readonly createdAt: string;
}

export function createRiskApprovedOrderIntent(
  request: Readonly<OrderIntentRequest>,
  policy: Readonly<PolicyGateDecision>,
  risk: Readonly<RiskEvaluation>,
): Readonly<OrderIntentPayload> {
  if (!policy.approved)
    throw new Error("PolicyGate did not approve this candidate");
  if (!risk.approved || risk.approvedRiskPercent === "0")
    throw new Error("Risk engine did not approve this candidate");

  const payload: OrderIntentPayload = {
    intent_id: request.intentId,
    candidate_id: request.candidateId,
    idempotency_key: request.idempotencyKey,
    symbol: request.symbol,
    side: request.side,
    order_type: request.orderType,
    quantity: request.quantity,
    stop_loss_price: request.stopLossPrice,
    take_profit_price: request.takeProfitPrice,
    time_in_force: request.timeInForce,
    created_at: request.createdAt,
    ...(request.limitPrice === undefined
      ? {}
      : { limit_price: request.limitPrice }),
    ...(request.maxSlippage === undefined
      ? {}
      : { max_slippage: request.maxSlippage }),
  };
  const validation = validatePayload("ORDER_INTENT", payload);
  if (!validation.valid)
    throw new Error(
      `OrderIntent contract rejected: ${validation.errors?.join("; ")}`,
    );
  return Object.freeze(payload);
}
