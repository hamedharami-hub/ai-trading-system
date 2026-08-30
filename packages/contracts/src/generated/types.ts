/* eslint-disable */
/**
 * AUTO-GENERATED FILE - DO NOT MODIFY MANUALLY.
 * Source: JSON Schema 2020-12 specifications in packages/contracts/src/schemas/
 */

// ==================== PRIMITIVES ====================
/**
 * Arbitrary-precision decimal represented as a string. Binary floats are forbidden.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "DecimalString".
 */
export type DecimalString = string;
/**
 * Non-negative arbitrary-precision decimal string.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "PositiveDecimalString".
 */
export type PositiveDecimalString = string;
/**
 * Strictly positive arbitrary-precision decimal string (> 0).
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "StrictPositiveDecimalString".
 */
export type StrictPositiveDecimalString = string;
/**
 * RFC 3339 UTC timestamp with exactly millisecond precision.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "TimestampISO".
 */
export type TimestampISO = string;
/**
 * Unbounded non-negative integer represented as a canonical decimal string.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "NonNegativeIntegerString".
 */
export type NonNegativeIntegerString = string;
/**
 * Canonical lowercase UUIDv7 string for time-ordered identifiers.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "UUIDv7".
 */
export type UUIDv7 = string;
/**
 * Canonical market identifier according to DEC-053.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "MarketId".
 */
export type MarketId =
  | "EURUSD"
  | "GBPUSD"
  | "USDJPY"
  | "AUDUSD"
  | "USDCAD"
  | "USDCHF"
  | "NZDUSD"
  | "XAUUSD"
  | "BTCUSDT"
  | "ETHUSDT";
/**
 * Standardized candlestick timeframes.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "Timeframe".
 */
export type Timeframe = "1M" | "5M" | "15M" | "1H" | "4H" | "1D";
/**
 * Deterministic strategy engine type according to DEC-014.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "EngineType".
 */
export type EngineType = "SCALP" | "INTRADAY";
/**
 * Order and position direction.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "TradeSide".
 */
export type TradeSide = "BUY" | "SELL";
/**
 * Order execution type.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "OrderType".
 */
export type OrderType = "LIMIT" | "MARKET" | "STOP_LIMIT";
/**
 * Deterministic candidate quality grade according to DEC-017.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "CandidateGrade".
 */
export type CandidateGrade = "A_PLUS" | "A" | "B" | "C";
/**
 * Conditional analytical judge verdict according to DEC-006.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "JudgeDecisionType".
 */
export type JudgeDecisionType = "APPROVE" | "REJECT" | "REANALYZE";
/**
 * Lifecycle status of an order according to DEC-051.
 *
 * This interface was referenced by `Primitives`'s JSON-Schema
 * via the `definition` "OrderStatus".
 */
export type OrderStatus =
  | "PENDING_NEW"
  | "NEW"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED"
  | "EXPIRED";

/**
 * Authoritative base primitive definitions for the trading system.
 */
export interface Primitives {
  [k: string]: unknown | undefined;
}

// ==================== EVENT ENVELOPE ====================
/**
 * Standardized, immutable envelope wrapping all system events.
 */
export interface EventEnvelope {
  /**
   * SemVer schema version string.
   */
  schema_version: string;
  /**
   * Unique identifier for this specific event.
   */
  event_id: string;
  /**
   * Correlation identifier tracking the causal chain.
   */
  correlation_id: string;
  /**
   * Timestamp reported by the external exchange or venue (or local if generated internally).
   */
  timestamp_exchange: string;
  /**
   * Timestamp recorded locally by the node at arrival/generation.
   */
  timestamp_local: string;
  /**
   * Origin of the event (e.g. CTRADER, BINANCE_SPOT, LOCAL_NODE, PWA).
   */
  source: string;
  /**
   * Unique identifier of the publishing device.
   */
  device_id: string;
  /**
   * Discriminator enum for the enclosed payload.
   */
  event_type:
    | "MARKET_EVENT"
    | "FEATURE_SNAPSHOT"
    | "STRATEGY_CANDIDATE"
    | "ANALYST_PROPOSAL"
    | "CRITIC_PROPOSAL"
    | "JUDGE_DECISION"
    | "POLICY_DECISION"
    | "RISK_DECISION"
    | "ORDER_INTENT"
    | "EXECUTION_REPORT"
    | "AUDIT_EVENT"
    | "POST_TRADE_AUDIT_REPORT";
  /**
   * Event payload adhering to the corresponding event schema.
   */
  payload: {
    [k: string]: unknown | undefined;
  };
}

// ==================== AnalystProposalPayload ====================
/**
 * Structured analytical evaluation from the AI Analyst.
 */
export interface AnalystProposalPayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  candidate_id: string;
  verdict: "FAVORABLE" | "UNFAVORABLE" | "NEUTRAL";
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  confidence: string;
  /**
   * @minItems 1
   */
  evidence_keys: [string, ...string[]];
  notes?: string;
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  evaluated_at: string;
}

// ==================== AuditEventPayload ====================
/**
 * Tamper-evident audit record linking causal actions and hash verified states.
 */
export interface AuditEventPayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  audit_id: string;
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  parent_event_id?: string;
  action: string;
  actor: string;
  entity_type: string;
  entity_id: string;
  state_before?: {
    [k: string]: unknown | undefined;
  };
  state_after?: {
    [k: string]: unknown | undefined;
  };
  canonical_hash: string;
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  recorded_at: string;
}

// ==================== CriticProposalPayload ====================
/**
 * Structured analytical risk critique from the AI Critic.
 */
export interface CriticProposalPayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  candidate_id: string;
  verdict: "FAVORABLE" | "UNFAVORABLE" | "NEUTRAL";
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  confidence: string;
  /**
   * @minItems 1
   */
  evidence_keys: [string, ...string[]];
  notes?: string;
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  evaluated_at: string;
}

// ==================== ExecutionReportPayload ====================
/**
 * Execution lifecycle update from broker or venue connector.
 */
export interface ExecutionReportPayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  report_id: string;
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  intent_id: string;
  broker_order_id: string;
  /**
   * Canonical market identifier according to DEC-053.
   */
  symbol:
    | "EURUSD"
    | "GBPUSD"
    | "USDJPY"
    | "AUDUSD"
    | "USDCAD"
    | "USDCHF"
    | "NZDUSD"
    | "XAUUSD"
    | "BTCUSDT"
    | "ETHUSDT";
  /**
   * Order and position direction.
   */
  side: "BUY" | "SELL";
  /**
   * Lifecycle status of an order according to DEC-051.
   */
  status:
    | "PENDING_NEW"
    | "NEW"
    | "PARTIALLY_FILLED"
    | "FILLED"
    | "CANCELLED"
    | "REJECTED"
    | "EXPIRED";
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  filled_quantity: string;
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  remaining_quantity: string;
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  average_fill_price?: string;
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  last_fill_price?: string;
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  last_fill_qty?: string;
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  commission?: string;
  commission_asset?: string;
  rejection_reason?: string;
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  transact_time: string;
}

// ==================== FeatureSnapshotPayload ====================
/**
 * Deterministic market structure and order flow features.
 */
export interface FeatureSnapshotPayload {
  /**
   * Canonical market identifier according to DEC-053.
   */
  symbol:
    | "EURUSD"
    | "GBPUSD"
    | "USDJPY"
    | "AUDUSD"
    | "USDCAD"
    | "USDCHF"
    | "NZDUSD"
    | "XAUUSD"
    | "BTCUSDT"
    | "ETHUSDT";
  /**
   * Standardized candlestick timeframes.
   */
  timeframe: "1M" | "5M" | "15M" | "1H" | "4H" | "1D";
  smc: {
    bos: boolean;
    choch: boolean;
    displacement: boolean;
    order_block?: {
      /**
       * Strictly positive arbitrary-precision decimal string (> 0).
       */
      top: string;
      /**
       * Strictly positive arbitrary-precision decimal string (> 0).
       */
      bottom: string;
      type: "BULLISH" | "BEARISH";
      mitigated: boolean;
    };
    fvg?: {
      /**
       * Strictly positive arbitrary-precision decimal string (> 0).
       */
      top: string;
      /**
       * Strictly positive arbitrary-precision decimal string (> 0).
       */
      bottom: string;
      type: "BULLISH" | "BEARISH";
      mitigated: boolean;
    };
    liquidity_sweep?: {
      /**
       * Strictly positive arbitrary-precision decimal string (> 0).
       */
      swept_level: string;
      direction: "HIGH" | "LOW";
    };
  };
  order_flow: {
    /**
     * Arbitrary-precision decimal represented as a string. Binary floats are forbidden.
     */
    ofi: string;
    /**
     * Arbitrary-precision decimal represented as a string. Binary floats are forbidden.
     */
    cvd: string;
    spread_state: "NORMAL" | "ELEVATED" | "WIDE";
  };
  secondary_filters: {
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    atr: string;
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    vwap: string;
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    volume_profile_poc?: string;
  };
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  evidence_candle_time: string;
}

// ==================== JudgeDecisionPayload ====================
/**
 * Conditional analytical resolution by the AI Judge.
 */
export interface JudgeDecisionPayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  candidate_id: string;
  /**
   * Conditional analytical judge verdict according to DEC-006.
   */
  decision: "APPROVE" | "REJECT" | "REANALYZE";
  reason: string;
  reanalysis_count: number;
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  decided_at: string;
}

// ==================== MarketEventPayload ====================
/**
 * Raw or normalized market data event from a feed.
 */
export type MarketEventPayload = {
  /**
   * Canonical market identifier according to DEC-053.
   */
  symbol:
    | "EURUSD"
    | "GBPUSD"
    | "USDJPY"
    | "AUDUSD"
    | "USDCAD"
    | "USDCHF"
    | "NZDUSD"
    | "XAUUSD"
    | "BTCUSDT"
    | "ETHUSDT";
  feed_type: "CANDLE" | "TICK" | "ORDERBOOK_L2";
  candle?: {
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    open: string;
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    high: string;
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    low: string;
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    close: string;
    /**
     * Non-negative arbitrary-precision decimal string.
     */
    volume: string;
    /**
     * Standardized candlestick timeframes.
     */
    timeframe: "1M" | "5M" | "15M" | "1H" | "4H" | "1D";
    is_closed: boolean;
    /**
     * RFC 3339 UTC timestamp with exactly millisecond precision.
     */
    open_time: string;
    /**
     * RFC 3339 UTC timestamp with exactly millisecond precision.
     */
    close_time: string;
  };
  tick?: {
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    bid: string;
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    ask: string;
    /**
     * Strictly positive arbitrary-precision decimal string (> 0).
     */
    last_price?: string;
    /**
     * Non-negative arbitrary-precision decimal string.
     */
    last_qty?: string;
  };
  orderbook?: {
    bids: [string, string][];
    asks: [string, string][];
    depth: number;
  };
  /**
   * Unbounded non-negative integer represented as a canonical decimal string.
   */
  sequence_number?: string;
} & (
  | {
      feed_type?: "CANDLE";
      candle: unknown;
      tick?: never;
      orderbook?: never;
      [k: string]: unknown | undefined;
    }
  | {
      feed_type?: "TICK";
      candle?: never;
      tick: unknown;
      orderbook?: never;
      [k: string]: unknown | undefined;
    }
  | {
      feed_type?: "ORDERBOOK_L2";
      candle?: never;
      tick?: never;
      orderbook: unknown;
      sequence_number: unknown;
      [k: string]: unknown | undefined;
    }
);

// ==================== OrderIntentPayload ====================
/**
 * Risk-approved, idempotent order intent ready for deterministic OMS routing.
 */
export interface OrderIntentPayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  intent_id: string;
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  candidate_id: string;
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  idempotency_key: string;
  /**
   * Canonical market identifier according to DEC-053.
   */
  symbol:
    | "EURUSD"
    | "GBPUSD"
    | "USDJPY"
    | "AUDUSD"
    | "USDCAD"
    | "USDCHF"
    | "NZDUSD"
    | "XAUUSD"
    | "BTCUSDT"
    | "ETHUSDT";
  /**
   * Order and position direction.
   */
  side: "BUY" | "SELL";
  /**
   * Order execution type.
   */
  order_type: "LIMIT" | "MARKET" | "STOP_LIMIT";
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  quantity: string;
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  limit_price?: string;
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  stop_loss_price: string;
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  take_profit_price: string;
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  max_slippage?: string;
  time_in_force: "GTC" | "IOC" | "FOK";
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  created_at: string;
}

// ==================== PolicyDecisionPayload ====================
/**
 * Deterministic hard policy evaluation outcome.
 */
export interface PolicyDecisionPayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  candidate_id: string;
  status: "PASSED" | "BLOCKED";
  news_filter_passed: boolean;
  session_filter_passed: boolean;
  spread_filter_passed: boolean;
  counter_trend_allowed: boolean;
  block_reasons: string[];
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  evaluated_at: string;
}

// ==================== PostTradeAuditReportPayload ====================
/**
 * Read-only comparison report produced outside the live path.
 */
export interface PostTradeAuditReportPayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  candidate_id: string;
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  execution_report_id: string;
  /**
   * @minItems 1
   * @maxItems 20
   */
  observations:
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ];
  /**
   * @maxItems 20
   */
  comparisons:
    | []
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ]
    | [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ];
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  reported_at: string;
}

// ==================== RiskDecisionPayload ====================
/**
 * Authoritative deterministic risk approval and position sizing calculation.
 */
export interface RiskDecisionPayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  candidate_id: string;
  status: "APPROVED" | "REJECTED";
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  approved_risk_percent: string;
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  calculated_quantity: string;
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  quantized_quantity: string;
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  estimated_risk_amount: string;
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  portfolio_open_risk_percent: string;
  concurrent_positions_count: number;
  /**
   * Non-negative arbitrary-precision decimal string.
   */
  daily_loss_percent: string;
  drawdown_state: "NORMAL" | "HALVED_RISK" | "STOPPED_NEW_ENTRIES";
  rejection_reasons: string[];
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  evaluated_at: string;
}

// ==================== StrategyCandidatePayload ====================
/**
 * Deterministic trade setup generated by Scalp or Intraday strategy engines.
 */
export interface StrategyCandidatePayload {
  /**
   * Canonical lowercase UUIDv7 string for time-ordered identifiers.
   */
  candidate_id: string;
  /**
   * Deterministic strategy engine type according to DEC-014.
   */
  engine_type: "SCALP" | "INTRADAY";
  /**
   * Canonical market identifier according to DEC-053.
   */
  symbol:
    | "EURUSD"
    | "GBPUSD"
    | "USDJPY"
    | "AUDUSD"
    | "USDCAD"
    | "USDCHF"
    | "NZDUSD"
    | "XAUUSD"
    | "BTCUSDT"
    | "ETHUSDT";
  /**
   * Order and position direction.
   */
  side: "BUY" | "SELL";
  /**
   * Deterministic candidate quality grade according to DEC-017.
   */
  grade: "A_PLUS" | "A" | "B" | "C";
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  entry_price: string;
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  invalidation_price: string;
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  target_price: string;
  /**
   * Strictly positive arbitrary-precision decimal string (> 0).
   */
  risk_reward_ratio: string;
  expiry_candles: number;
  /**
   * RFC 3339 UTC timestamp with exactly millisecond precision.
   */
  generated_at: string;
  rejection_reasons?: string[];
}
