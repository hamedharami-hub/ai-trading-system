import { describe, expect, it } from "vitest";
import { createRiskApprovedOrderIntent } from "../src/orders/order-intent-factory.js";

const request = {
  intentId: "018f3a9e-64c2-7b00-8000-000000000020",
  candidateId: "018f3a9e-64c2-7b00-8000-000000000010",
  idempotencyKey: "018f3a9e-64c2-7b00-8000-000000000021",
  symbol: "XAUUSD" as const,
  side: "BUY" as const,
  orderType: "LIMIT" as const,
  quantity: "0.1",
  limitPrice: "2400.5",
  stopLossPrice: "2395",
  takeProfitPrice: "2415",
  maxSlippage: "0.5",
  timeInForce: "GTC" as const,
  createdAt: "2026-08-30T07:00:01.000Z",
};

describe("OrderIntent authority boundary", () => {
  it("creates a schema-valid immutable intent only after both deterministic approvals", () => {
    const intent = createRiskApprovedOrderIntent(
      request,
      { approved: true, reasons: [] },
      { approved: true, approvedRiskPercent: "0.25", reasons: [] },
    );
    expect(intent.intent_id).toBe(request.intentId);
    expect(Object.isFrozen(intent)).toBe(true);
  });

  it("rejects attempts without policy or risk approval", () => {
    expect(() =>
      createRiskApprovedOrderIntent(
        request,
        { approved: false, reasons: ["NEWS_BLACKOUT"] },
        { approved: true, approvedRiskPercent: "0.25", reasons: [] },
      ),
    ).toThrow(/PolicyGate/);
    expect(() =>
      createRiskApprovedOrderIntent(
        request,
        { approved: true, reasons: [] },
        {
          approved: false,
          approvedRiskPercent: "0",
          reasons: ["DRAWDOWN_STOP"],
        },
      ),
    ).toThrow(/Risk engine/);
  });
});
