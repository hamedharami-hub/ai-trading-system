const fs = require('fs');
const path = require('path');

const schemasDir = path.join(__dirname, '..', 'src', 'schemas', 'events');
if (!fs.existsSync(schemasDir)) {
  fs.mkdirSync(schemasDir, { recursive: true });
}

const schemas = {
  'market-event.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/market-event.json",
    title: "MarketEventPayload",
    description: "Raw or normalized market data event from a feed.",
    type: "object",
    required: ["symbol", "feed_type"],
    additionalProperties: false,
    properties: {
      symbol: { "$ref": "../primitives.json#/$defs/MarketId" },
      feed_type: { type: "string", enum: ["CANDLE", "TICK", "ORDERBOOK_L2"] },
      candle: {
        type: "object",
        required: ["open", "high", "low", "close", "volume", "timeframe", "is_closed", "open_time", "close_time"],
        additionalProperties: false,
        properties: {
          open: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
          high: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
          low: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
          close: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
          volume: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
          timeframe: { "$ref": "../primitives.json#/$defs/Timeframe" },
          is_closed: { type: "boolean" },
          open_time: { "$ref": "../primitives.json#/$defs/TimestampISO" },
          close_time: { "$ref": "../primitives.json#/$defs/TimestampISO" }
        }
      },
      tick: {
        type: "object",
        required: ["bid", "ask"],
        additionalProperties: false,
        properties: {
          bid: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
          ask: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
          last_price: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
          last_qty: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" }
        }
      },
      orderbook: {
        type: "object",
        required: ["bids", "asks", "depth"],
        additionalProperties: false,
        properties: {
          bids: {
            type: "array",
            items: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" }
            }
          },
          asks: {
            type: "array",
            items: {
              type: "array",
              minItems: 2,
              maxItems: 2,
              items: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" }
            }
          },
          depth: { type: "integer", minimum: 1 }
        }
      },
      sequence_number: { type: "integer", minimum: 0 }
    }
  },

  'feature-snapshot.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/feature-snapshot.json",
    title: "FeatureSnapshotPayload",
    description: "Deterministic market structure and order flow features.",
    type: "object",
    required: ["symbol", "timeframe", "smc", "order_flow", "secondary_filters", "evidence_candle_time"],
    additionalProperties: false,
    properties: {
      symbol: { "$ref": "../primitives.json#/$defs/MarketId" },
      timeframe: { "$ref": "../primitives.json#/$defs/Timeframe" },
      smc: {
        type: "object",
        required: ["bos", "choch", "displacement"],
        additionalProperties: false,
        properties: {
          bos: { type: "boolean" },
          choch: { type: "boolean" },
          displacement: { type: "boolean" },
          order_block: {
            type: "object",
            required: ["top", "bottom", "type", "mitigated"],
            additionalProperties: false,
            properties: {
              top: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
              bottom: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
              type: { type: "string", enum: ["BULLISH", "BEARISH"] },
              mitigated: { type: "boolean" }
            }
          },
          fvg: {
            type: "object",
            required: ["top", "bottom", "type", "mitigated"],
            additionalProperties: false,
            properties: {
              top: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
              bottom: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
              type: { type: "string", enum: ["BULLISH", "BEARISH"] },
              mitigated: { type: "boolean" }
            }
          },
          liquidity_sweep: {
            type: "object",
            required: ["swept_level", "direction"],
            additionalProperties: false,
            properties: {
              swept_level: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
              direction: { type: "string", enum: ["HIGH", "LOW"] }
            }
          }
        }
      },
      order_flow: {
        type: "object",
        required: ["ofi", "cvd", "spread_state"],
        additionalProperties: false,
        properties: {
          ofi: { "$ref": "../primitives.json#/$defs/DecimalString" },
          cvd: { "$ref": "../primitives.json#/$defs/DecimalString" },
          spread_state: { type: "string", enum: ["NORMAL", "ELEVATED", "WIDE"] }
        }
      },
      secondary_filters: {
        type: "object",
        required: ["atr", "vwap"],
        additionalProperties: false,
        properties: {
          atr: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
          vwap: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
          volume_profile_poc: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" }
        }
      },
      evidence_candle_time: { "$ref": "../primitives.json#/$defs/TimestampISO" }
    }
  },

  'strategy-candidate.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/strategy-candidate.json",
    title: "StrategyCandidatePayload",
    description: "Deterministic trade setup generated by Scalp or Intraday strategy engines.",
    type: "object",
    required: [
      "candidate_id",
      "engine_type",
      "symbol",
      "side",
      "grade",
      "entry_price",
      "invalidation_price",
      "target_price",
      "risk_reward_ratio",
      "expiry_candles",
      "generated_at"
    ],
    additionalProperties: false,
    properties: {
      candidate_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      engine_type: { "$ref": "../primitives.json#/$defs/EngineType" },
      symbol: { "$ref": "../primitives.json#/$defs/MarketId" },
      side: { "$ref": "../primitives.json#/$defs/TradeSide" },
      grade: { "$ref": "../primitives.json#/$defs/CandidateGrade" },
      entry_price: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      invalidation_price: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      target_price: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      risk_reward_ratio: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      expiry_candles: { type: "integer", minimum: 1, maximum: 10 },
      generated_at: { "$ref": "../primitives.json#/$defs/TimestampISO" },
      rejection_reasons: {
        type: "array",
        items: { type: "string" }
      }
    }
  },

  'analyst-proposal.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/analyst-proposal.json",
    title: "AnalystProposalPayload",
    description: "Structured analytical evaluation from the AI Analyst.",
    type: "object",
    required: ["candidate_id", "verdict", "confidence", "evidence_keys", "evaluated_at"],
    additionalProperties: false,
    properties: {
      candidate_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      verdict: { type: "string", enum: ["FAVORABLE", "UNFAVORABLE", "NEUTRAL"] },
      confidence: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      evidence_keys: {
        type: "array",
        minItems: 1,
        items: { type: "string" }
      },
      notes: { type: "string", maxLength: 1000 },
      evaluated_at: { "$ref": "../primitives.json#/$defs/TimestampISO" }
    }
  },

  'critic-proposal.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/critic-proposal.json",
    title: "CriticProposalPayload",
    description: "Structured analytical risk critique from the AI Critic.",
    type: "object",
    required: ["candidate_id", "verdict", "confidence", "evidence_keys", "evaluated_at"],
    additionalProperties: false,
    properties: {
      candidate_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      verdict: { type: "string", enum: ["FAVORABLE", "UNFAVORABLE", "NEUTRAL"] },
      confidence: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      evidence_keys: {
        type: "array",
        minItems: 1,
        items: { type: "string" }
      },
      notes: { type: "string", maxLength: 1000 },
      evaluated_at: { "$ref": "../primitives.json#/$defs/TimestampISO" }
    }
  },

  'judge-decision.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/judge-decision.json",
    title: "JudgeDecisionPayload",
    description: "Conditional analytical resolution by the AI Judge.",
    type: "object",
    required: ["candidate_id", "decision", "reason", "reanalysis_count", "decided_at"],
    additionalProperties: false,
    properties: {
      candidate_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      decision: { "$ref": "../primitives.json#/$defs/JudgeDecisionType" },
      reason: { type: "string", minLength: 1, maxLength: 1000 },
      reanalysis_count: { type: "integer", minimum: 0, maximum: 2 },
      decided_at: { "$ref": "../primitives.json#/$defs/TimestampISO" }
    }
  },

  'policy-decision.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/policy-decision.json",
    title: "PolicyDecisionPayload",
    description: "Deterministic hard policy evaluation outcome.",
    type: "object",
    required: [
      "candidate_id",
      "status",
      "news_filter_passed",
      "session_filter_passed",
      "spread_filter_passed",
      "counter_trend_allowed",
      "block_reasons",
      "evaluated_at"
    ],
    additionalProperties: false,
    properties: {
      candidate_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      status: { type: "string", enum: ["PASSED", "BLOCKED"] },
      news_filter_passed: { type: "boolean" },
      session_filter_passed: { type: "boolean" },
      spread_filter_passed: { type: "boolean" },
      counter_trend_allowed: { type: "boolean" },
      block_reasons: {
        type: "array",
        items: { type: "string" }
      },
      evaluated_at: { "$ref": "../primitives.json#/$defs/TimestampISO" }
    }
  },

  'risk-decision.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/risk-decision.json",
    title: "RiskDecisionPayload",
    description: "Authoritative deterministic risk approval and position sizing calculation.",
    type: "object",
    required: [
      "candidate_id",
      "status",
      "approved_risk_percent",
      "calculated_quantity",
      "quantized_quantity",
      "estimated_risk_amount",
      "portfolio_open_risk_percent",
      "concurrent_positions_count",
      "daily_loss_percent",
      "drawdown_state",
      "rejection_reasons",
      "evaluated_at"
    ],
    additionalProperties: false,
    properties: {
      candidate_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      status: { type: "string", enum: ["APPROVED", "REJECTED"] },
      approved_risk_percent: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      calculated_quantity: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      quantized_quantity: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      estimated_risk_amount: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      portfolio_open_risk_percent: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      concurrent_positions_count: { type: "integer", minimum: 0, maximum: 3 },
      daily_loss_percent: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      drawdown_state: { type: "string", enum: ["NORMAL", "HALVED_RISK", "STOPPED_NEW_ENTRIES"] },
      rejection_reasons: {
        type: "array",
        items: { type: "string" }
      },
      evaluated_at: { "$ref": "../primitives.json#/$defs/TimestampISO" }
    }
  },

  'order-intent.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/order-intent.json",
    title: "OrderIntentPayload",
    description: "Risk-approved, idempotent order intent ready for deterministic OMS routing.",
    type: "object",
    required: [
      "intent_id",
      "candidate_id",
      "idempotency_key",
      "symbol",
      "side",
      "order_type",
      "quantity",
      "stop_loss_price",
      "take_profit_price",
      "time_in_force",
      "created_at"
    ],
    additionalProperties: false,
    properties: {
      intent_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      candidate_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      idempotency_key: { type: "string", minLength: 1, maxLength: 128 },
      symbol: { "$ref": "../primitives.json#/$defs/MarketId" },
      side: { "$ref": "../primitives.json#/$defs/TradeSide" },
      order_type: { "$ref": "../primitives.json#/$defs/OrderType" },
      quantity: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      limit_price: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      stop_loss_price: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      take_profit_price: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      max_slippage: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      time_in_force: { type: "string", enum: ["GTC", "IOC", "FOK"] },
      created_at: { "$ref": "../primitives.json#/$defs/TimestampISO" }
    }
  },

  'execution-report.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/execution-report.json",
    title: "ExecutionReportPayload",
    description: "Execution lifecycle update from broker or venue connector.",
    type: "object",
    required: [
      "report_id",
      "intent_id",
      "broker_order_id",
      "symbol",
      "side",
      "status",
      "filled_quantity",
      "remaining_quantity",
      "transact_time"
    ],
    additionalProperties: false,
    properties: {
      report_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      intent_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      broker_order_id: { type: "string", minLength: 1 },
      symbol: { "$ref": "../primitives.json#/$defs/MarketId" },
      side: { "$ref": "../primitives.json#/$defs/TradeSide" },
      status: { "$ref": "../primitives.json#/$defs/OrderStatus" },
      filled_quantity: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      remaining_quantity: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      average_fill_price: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      last_fill_price: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      last_fill_qty: { "$ref": "../primitives.json#/$defs/StrictPositiveDecimalString" },
      commission: { "$ref": "../primitives.json#/$defs/PositiveDecimalString" },
      commission_asset: { type: "string" },
      rejection_reason: { type: "string" },
      transact_time: { "$ref": "../primitives.json#/$defs/TimestampISO" }
    }
  },

  'audit-event.json': {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://trading.system/schemas/events/audit-event.json",
    title: "AuditEventPayload",
    description: "Tamper-evident audit record linking causal actions and hash verified states.",
    type: "object",
    required: ["audit_id", "action", "actor", "entity_type", "entity_id", "canonical_hash", "recorded_at"],
    additionalProperties: false,
    properties: {
      audit_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      parent_event_id: { "$ref": "../primitives.json#/$defs/UUIDv7" },
      action: { type: "string", minLength: 1 },
      actor: { type: "string", minLength: 1 },
      entity_type: { type: "string", minLength: 1 },
      entity_id: { type: "string", minLength: 1 },
      state_before: { type: "object" },
      state_after: { type: "object" },
      canonical_hash: { type: "string", pattern: "^[a-fA-F0-9]{64}$" },
      recorded_at: { "$ref": "../primitives.json#/$defs/TimestampISO" }
    }
  }
};

for (const [filename, schema] of Object.entries(schemas)) {
  const filePath = path.join(schemasDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(schema, null, 2) + '\n', 'utf-8');
  console.log('Wrote', filePath);
}
