import { describe, it, expect } from "vitest";
import {
  validateEnvelope,
  validatePayload,
  validateFullEvent,
} from "../src/validator.js";

describe("Event Schemas & Contract Validation", () => {
  const validEnvelope = {
    schema_version: "1.0.0",
    event_id: "018f3a9e-64c2-7b00-8000-000000000001",
    correlation_id: "018f3a9e-64c2-7b00-8000-000000000002",
    timestamp_exchange: "2026-08-30T07:00:00.000Z",
    timestamp_local: "2026-08-30T07:00:00.100Z",
    source: "CTRADER",
    device_id: "win-node-primary",
    event_type: "MARKET_EVENT",
    payload: {
      symbol: "EURUSD",
      feed_type: "TICK",
      tick: {
        bid: "1.08500",
        ask: "1.08510",
        last_price: "1.08505",
        last_qty: "100000",
      },
    },
  };

  it("validates a correct market event envelope and payload", () => {
    const res = validateFullEvent(validEnvelope);
    expect(res.valid).toBe(true);
    expect(res.errors).toBeUndefined();
  });

  it("fails closed when binary number is passed instead of DecimalString", () => {
    const invalidPayload = {
      symbol: "EURUSD",
      feed_type: "TICK",
      tick: {
        bid: 1.085, // Forbidden: JavaScript number
        ask: "1.08510",
      },
    };

    const res = validatePayload("MARKET_EVENT", invalidPayload);
    expect(res.valid).toBe(false);
    expect(res.errors?.some((e) => e.includes("string"))).toBe(true);
  });

  it("fails closed when additional unknown properties are present", () => {
    const extraPropertyPayload = {
      symbol: "EURUSD",
      feed_type: "TICK",
      tick: {
        bid: "1.08500",
        ask: "1.08510",
      },
      unauthorized_extra_field: "malicious_override",
    };

    const res = validatePayload("MARKET_EVENT", extraPropertyPayload);
    expect(res.valid).toBe(false);
    expect(
      res.errors?.some((e) =>
        e.toLowerCase().includes("additional properties"),
      ),
    ).toBe(true);
  });

  it("fails closed when UUID is malformed", () => {
    const badUuidEnvelope = {
      ...validEnvelope,
      event_id: "not-a-valid-uuid",
    };

    const res = validateEnvelope(badUuidEnvelope);
    expect(res.valid).toBe(false);
  });

  it("fails closed when UUID is valid but not version 7", () => {
    const version4Envelope = {
      ...validEnvelope,
      event_id: "550e8400-e29b-41d4-a716-446655440000",
    };
    expect(validateEnvelope(version4Envelope).valid).toBe(false);
  });

  it("requires exactly one payload matching feed_type", () => {
    expect(
      validatePayload("MARKET_EVENT", { symbol: "EURUSD", feed_type: "TICK" })
        .valid,
    ).toBe(false);
    expect(
      validatePayload("MARKET_EVENT", {
        symbol: "EURUSD",
        feed_type: "TICK",
        tick: { bid: "1", ask: "2" },
        candle: {
          open: "1",
          high: "2",
          low: "1",
          close: "2",
          volume: "1",
          timeframe: "1M",
          is_closed: true,
          open_time: "2026-08-30T00:00:00.000Z",
          close_time: "2026-08-30T00:01:00.000Z",
        },
      }).valid,
    ).toBe(false);
  });

  it("fails closed on invalid ISO timestamp format", () => {
    const badTimestampEnvelope = {
      ...validEnvelope,
      timestamp_local: "30-08-2026 07:00:00",
    };

    const res = validateEnvelope(badTimestampEnvelope);
    expect(res.valid).toBe(false);
  });

  it("validates StrategyCandidate payload correctly", () => {
    const candidatePayload = {
      candidate_id: "018f3a9e-64c2-7b00-8000-000000000010",
      engine_type: "SCALP",
      symbol: "XAUUSD",
      side: "BUY",
      grade: "A_PLUS",
      entry_price: "2400.50",
      invalidation_price: "2395.00",
      target_price: "2415.00",
      risk_reward_ratio: "2.636",
      expiry_candles: 3,
      generated_at: "2026-08-30T07:00:00.000Z",
      rejection_reasons: [],
    };

    const res = validatePayload("STRATEGY_CANDIDATE", candidatePayload);
    expect(res.valid).toBe(true);
  });

  it("validates OrderIntent payload correctly", () => {
    const orderIntentPayload = {
      intent_id: "018f3a9e-64c2-7b00-8000-000000000020",
      candidate_id: "018f3a9e-64c2-7b00-8000-000000000010",
      idempotency_key: "018f3a9e-64c2-7b00-8000-000000000021",
      symbol: "XAUUSD",
      side: "BUY",
      order_type: "LIMIT",
      quantity: "0.10",
      limit_price: "2400.50",
      stop_loss_price: "2395.00",
      take_profit_price: "2415.00",
      max_slippage: "0.50",
      time_in_force: "GTC",
      created_at: "2026-08-30T07:00:01.000Z",
    };

    const res = validatePayload("ORDER_INTENT", orderIntentPayload);
    expect(res.valid).toBe(true);
  });

  it("validates RiskDecision payload and drawdown states", () => {
    const riskPayload = {
      candidate_id: "018f3a9e-64c2-7b00-8000-000000000010",
      status: "APPROVED",
      approved_risk_percent: "0.50",
      calculated_quantity: "0.109",
      quantized_quantity: "0.10",
      estimated_risk_amount: "55.00",
      portfolio_open_risk_percent: "0.50",
      concurrent_positions_count: 1,
      daily_loss_percent: "0.00",
      drawdown_state: "NORMAL",
      rejection_reasons: [],
      evaluated_at: "2026-08-30T07:00:00.500Z",
    };

    const res = validatePayload("RISK_DECISION", riskPayload);
    expect(res.valid).toBe(true);
  });

  it("accepts only read-only Post-Trade Auditor reports", () => {
    const report = {
      candidate_id: "018f3a9e-64c2-7b00-8000-000000000010",
      execution_report_id: "018f3a9e-64c2-7b00-8000-000000000030",
      observations: [
        "The recorded outcome differed from the candidate thesis.",
      ],
      comparisons: ["Observed slippage exceeded the replay fixture."],
      reported_at: "2026-08-30T07:05:00.000Z",
    };
    expect(validatePayload("POST_TRADE_AUDIT_REPORT", report).valid).toBe(true);
    expect(
      validatePayload("POST_TRADE_AUDIT_REPORT", {
        ...report,
        change_risk_limit_to: "2.00",
      }).valid,
    ).toBe(false);
  });
});
