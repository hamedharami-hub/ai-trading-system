import {
  Decimal,
  parseDecimal,
  toDecimalString,
  validatePayload,
  type StrategyCandidatePayload,
} from "@trade/contracts";
import {
  collectEurUsdM1ReplayObservationBundle,
  type EurUsdM1ReplayObservationBundle,
} from "./eurusd-m1-replay-observation-bundle.js";
import {
  observeEurUsdM1ReplayOrderBlockOrigin,
  type EurUsdM1ReplayOrderBlockOrigin,
} from "./eurusd-m1-replay-order-block-origin.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "./historical-replay-runner.js";

export interface EurUsdM1StrategyCandidateInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly cursor: number;
}

export type EurUsdM1StrategyCandidateReport =
  | {
      readonly kind: "CANDIDATE_REJECTED";
      readonly status:
        | "UNSUPPORTED_SCOPE"
        | "REPLAY_REJECTED"
        | "INVALID_CURSOR"
        | "INSUFFICIENT_OBSERVATION_CONTEXT"
        | "NO_STRUCTURE_BREAK"
        | "STRUCTURAL_CONFLICT"
        | "NO_DISPLACEMENT"
        | "DIRECTION_MISMATCH"
        | "NO_VALID_ZONE"
        | "INVALID_RISK_REWARD"
        | "SCHEMA_VALIDATION_FAILED";
      readonly reasons: readonly string[];
      readonly candidate: null;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "CANDIDATE_EVALUATED";
      readonly status: "CANDIDATE_QUALIFIED";
      readonly reasons: readonly string[];
      readonly candidate: Readonly<StrategyCandidatePayload>;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 1;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

/**
 * Creates a deterministic, standard-compliant UUIDv7 string.
 */
export function createDeterministicUuidV7(
  timestampMs: number,
  sequence: number,
): string {
  const timeHex = Math.floor(Math.max(0, timestampMs))
    .toString(16)
    .padStart(12, "0");
  const part1 = timeHex.slice(0, 8);
  const part2 = timeHex.slice(8, 12);

  const seq12 = (sequence & 0x0fff).toString(16).padStart(3, "0");
  const part3 = `7${seq12}`;

  const variantNibble = (8 + ((sequence >> 12) & 0x3)).toString(16);
  const rest1 = ((sequence >> 14) & 0x0fff).toString(16).padStart(3, "0");
  const part4 = `${variantNibble}${rest1}`;

  const part5 = (sequence & 0xffffffffffff).toString(16).padStart(12, "0");

  return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
}

function rejected(
  status: Extract<
    EurUsdM1StrategyCandidateReport,
    { kind: "CANDIDATE_REJECTED" }
  >["status"],
  reasons: readonly string[],
): EurUsdM1StrategyCandidateReport {
  return Object.freeze({
    kind: "CANDIDATE_REJECTED",
    status,
    reasons: Object.freeze(reasons),
    candidate: null,
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}

/**
 * Evaluates an offline EURUSD M1 Historical Replay cursor for a deterministic
 * StrategyCandidate according to DEC-015, DEC-017, and DEC-047.
 *
 * Produces an immutable, schema-validated StrategyCandidatePayload (Grade A / A+)
 * or fail-closed rejection reasons.
 *
 * It creates ZERO order intents, fills, positions, P&L, storage mutations,
 * or execution authority.
 */
export function evaluateEurUsdM1StrategyCandidate(
  input: Readonly<EurUsdM1StrategyCandidateInput>,
): EurUsdM1StrategyCandidateReport {
  if (
    input.instrument !== "EURUSD" ||
    (input.timeframe !== "M1" && input.timeframe !== "1M") ||
    input.playback.sourceKind !== "REPLAY"
  ) {
    return rejected("UNSUPPORTED_SCOPE", [
      `UNSUPPORTED_SCOPE: requires EURUSD M1 REPLAY, got ${input.instrument} ${input.timeframe} ${input.playback.sourceKind}`,
    ]);
  }

  const normalizedTimeframe = input.timeframe === "1M" ? "M1" : input.timeframe;

  if (input.playback.status === "REJECTED") {
    return rejected("REPLAY_REJECTED", [
      `REPLAY_REJECTED: ${input.playback.rejectionReasons?.join("; ") ?? ""}`,
    ]);
  }

  if (
    !Number.isInteger(input.cursor) ||
    input.cursor < 0 ||
    input.cursor >= input.playback.candles.length
  ) {
    return rejected("INVALID_CURSOR", [
      `INVALID_CURSOR: cursor ${input.cursor} out of bounds for candle length ${input.playback.candles.length}`,
    ]);
  }

  const bundle: EurUsdM1ReplayObservationBundle =
    collectEurUsdM1ReplayObservationBundle({
      playback: input.playback,
      instrument: input.instrument,
      timeframe: normalizedTimeframe,
      cursor: input.cursor,
    });

  if (
    bundle.candleSwing.kind !== "OBSERVATION_FACTS" ||
    bundle.atrDisplacement.kind !== "OBSERVATION_FACTS" ||
    bundle.bosFvg.kind !== "OBSERVATION_FACTS" ||
    bundle.sweepRaid.kind !== "OBSERVATION_FACTS"
  ) {
    const reasons: string[] = [];
    if (bundle.candleSwing.kind !== "OBSERVATION_FACTS") {
      reasons.push(
        `CANDLE_SWING_UNAVAILABLE: ${bundle.candleSwing.reason ?? "missing"}`,
      );
    }
    if (bundle.atrDisplacement.kind !== "OBSERVATION_FACTS") {
      reasons.push(
        `ATR_DISPLACEMENT_UNAVAILABLE: ${bundle.atrDisplacement.reason ?? "missing"}`,
      );
    }
    if (bundle.bosFvg.kind !== "OBSERVATION_FACTS") {
      reasons.push(`BOS_FVG_UNAVAILABLE: ${bundle.bosFvg.reason ?? "missing"}`);
    }
    if (bundle.sweepRaid.kind !== "OBSERVATION_FACTS") {
      reasons.push(
        `SWEEP_RAID_UNAVAILABLE: ${bundle.sweepRaid.reason ?? "missing"}`,
      );
    }
    return rejected("INSUFFICIENT_OBSERVATION_CONTEXT", reasons);
  }

  const { candleSwing, atrDisplacement, bosFvg, sweepRaid } = bundle;

  if (bosFvg.bullishBos && bosFvg.bearishBos) {
    return rejected("STRUCTURAL_CONFLICT", [
      "STRUCTURAL_CONFLICT: Simultaneous bullish and bearish BOS reported",
    ]);
  }

  if (!bosFvg.bullishBos && !bosFvg.bearishBos) {
    return rejected("NO_STRUCTURE_BREAK", [
      "NO_STRUCTURE_BREAK: Neither bullish nor bearish BOS observed",
    ]);
  }

  if (!atrDisplacement.displacement) {
    return rejected("NO_DISPLACEMENT", [
      "NO_DISPLACEMENT: Candidate requires confirmed displacement",
    ]);
  }

  const isBuy = bosFvg.bullishBos;
  const side = isBuy ? "BUY" : "SELL";

  if (isBuy && candleSwing.candle.direction !== "BULLISH") {
    return rejected("DIRECTION_MISMATCH", [
      `DIRECTION_MISMATCH: Bullish BOS requires bullish displacement candle, got ${candleSwing.candle.direction}`,
    ]);
  }

  if (!isBuy && candleSwing.candle.direction !== "BEARISH") {
    return rejected("DIRECTION_MISMATCH", [
      `DIRECTION_MISMATCH: Bearish BOS requires bearish displacement candle, got ${candleSwing.candle.direction}`,
    ]);
  }

  // Observe Order Block origin
  const ob: EurUsdM1ReplayOrderBlockOrigin =
    observeEurUsdM1ReplayOrderBlockOrigin({
      playback: input.playback,
      instrument: input.instrument,
      timeframe: normalizedTimeframe,
      centerCursor: input.cursor,
    });

  const hasFvg = isBuy ? bosFvg.bullishFvg : bosFvg.bearishFvg;
  const hasOb =
    ob.kind === "OBSERVATION_FACTS" &&
    ob.direction === (isBuy ? "BULLISH" : "BEARISH");

  if (!hasFvg && !hasOb) {
    return rejected("NO_VALID_ZONE", [
      "NO_VALID_ZONE: Neither valid FVG nor Order Block zone observed",
    ]);
  }

  // Determine Entry Price
  let entryDecimal: Decimal;
  if (hasFvg && input.cursor >= 2) {
    const currentCandle = input.playback.candles[input.cursor]!;
    const twoEarlierCandle = input.playback.candles[input.cursor - 2]!;
    if (isBuy) {
      // Bullish FVG midpoint between candle[k-2].high and candle[k].low
      const highTwoEarlier = parseDecimal(twoEarlierCandle.high);
      const lowCurrent = parseDecimal(currentCandle.low);
      entryDecimal = highTwoEarlier.plus(lowCurrent).dividedBy(2);
    } else {
      // Bearish FVG midpoint between candle[k-2].low and candle[k].high
      const lowTwoEarlier = parseDecimal(twoEarlierCandle.low);
      const highCurrent = parseDecimal(currentCandle.high);
      entryDecimal = lowTwoEarlier.plus(highCurrent).dividedBy(2);
    }
  } else if (hasOb && ob.kind === "OBSERVATION_FACTS") {
    entryDecimal = isBuy
      ? parseDecimal(ob.bodyZone.upper)
      : parseDecimal(ob.bodyZone.lower);
  } else {
    return rejected("NO_VALID_ZONE", [
      "NO_VALID_ZONE: Unable to derive entry zone price",
    ]);
  }

  // Determine Invalidation Price (Stop Loss)
  let invalidationDecimal: Decimal;
  if (isBuy) {
    const swingLowLevel =
      sweepRaid.latestConfirmedSwingLow !== null
        ? parseDecimal(sweepRaid.latestConfirmedSwingLow.level)
        : bosFvg.latestConfirmedSwingLowCursor !== null
          ? parseDecimal(
              input.playback.candles[bosFvg.latestConfirmedSwingLowCursor]!.low,
            )
          : null;

    if (swingLowLevel === null) {
      return rejected("INSUFFICIENT_OBSERVATION_CONTEXT", [
        "INSUFFICIENT_OBSERVATION_CONTEXT: Missing confirmed swing low for invalidation",
      ]);
    }

    if (hasOb && ob.kind === "OBSERVATION_FACTS") {
      const obLower = parseDecimal(ob.bodyZone.lower);
      invalidationDecimal = Decimal.min(swingLowLevel, obLower);
    } else {
      invalidationDecimal = swingLowLevel;
    }

    if (invalidationDecimal.gte(entryDecimal)) {
      return rejected("INVALID_RISK_REWARD", [
        `INVALID_RISK_REWARD: Invalidation ${invalidationDecimal.toString()} >= Entry ${entryDecimal.toString()} for BUY`,
      ]);
    }
  } else {
    const swingHighLevel =
      sweepRaid.latestConfirmedSwingHigh !== null
        ? parseDecimal(sweepRaid.latestConfirmedSwingHigh.level)
        : bosFvg.latestConfirmedSwingHighCursor !== null
          ? parseDecimal(
              input.playback.candles[bosFvg.latestConfirmedSwingHighCursor]!
                .high,
            )
          : null;

    if (swingHighLevel === null) {
      return rejected("INSUFFICIENT_OBSERVATION_CONTEXT", [
        "INSUFFICIENT_OBSERVATION_CONTEXT: Missing confirmed swing high for invalidation",
      ]);
    }

    if (hasOb && ob.kind === "OBSERVATION_FACTS") {
      const obUpper = parseDecimal(ob.bodyZone.upper);
      invalidationDecimal = Decimal.max(swingHighLevel, obUpper);
    } else {
      invalidationDecimal = swingHighLevel;
    }

    if (invalidationDecimal.lte(entryDecimal)) {
      return rejected("INVALID_RISK_REWARD", [
        `INVALID_RISK_REWARD: Invalidation ${invalidationDecimal.toString()} <= Entry ${entryDecimal.toString()} for SELL`,
      ]);
    }
  }

  // Target Price: Fixed 2.0 R:R (DEC-015, DEC-058)
  const risk = isBuy
    ? entryDecimal.minus(invalidationDecimal)
    : invalidationDecimal.minus(entryDecimal);

  if (risk.lte(0)) {
    return rejected("INVALID_RISK_REWARD", [
      "INVALID_RISK_REWARD: Risk amount is non-positive",
    ]);
  }

  const reward = risk.times(2);
  const targetDecimal = isBuy
    ? entryDecimal.plus(reward)
    : entryDecimal.minus(reward);

  if (targetDecimal.lte(0)) {
    return rejected("INVALID_RISK_REWARD", [
      "INVALID_RISK_REWARD: Target price is non-positive",
    ]);
  }

  // Format decimals to 5 decimal places (EURUSD tickSize 0.00001)
  const entryStr = toDecimalString(
    entryDecimal.toDecimalPlaces(5, Decimal.ROUND_HALF_UP),
  );
  const invalidationStr = toDecimalString(
    invalidationDecimal.toDecimalPlaces(5, Decimal.ROUND_HALF_UP),
  );
  const targetStr = toDecimalString(
    targetDecimal.toDecimalPlaces(5, Decimal.ROUND_HALF_UP),
  );

  // Grade determination according to DEC-047:
  // A+ requires liquidity sweep + displacement + BOS + valid zone
  // A requires displacement + BOS + valid zone (without confirmed sweep)
  const hasSweep = isBuy
    ? sweepRaid.sellSideSweep !== "NOT_CONFIRMED"
    : sweepRaid.buySideSweep !== "NOT_CONFIRMED";

  const grade = hasSweep ? "A_PLUS" : "A";

  const currentCandle: HistoricalReplayCandle =
    input.playback.candles[input.cursor]!;
  const parsedTimestamp = Date.parse(currentCandle.timestampUtc);
  const timestampMs = Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0;
  const generatedAt = new Date(timestampMs).toISOString();

  const candidatePayload: StrategyCandidatePayload = {
    candidate_id: createDeterministicUuidV7(timestampMs, input.cursor),
    engine_type: "SCALP",
    symbol: "EURUSD",
    side,
    grade,
    entry_price: entryStr,
    invalidation_price: invalidationStr,
    target_price: targetStr,
    risk_reward_ratio: "2.000",
    expiry_candles: 3,
    generated_at: generatedAt,
    rejection_reasons: [],
  };

  const validation = validatePayload("STRATEGY_CANDIDATE", candidatePayload);
  if (!validation.valid) {
    return rejected(
      "SCHEMA_VALIDATION_FAILED",
      validation.errors ?? ["SCHEMA_VALIDATION_FAILED"],
    );
  }

  return Object.freeze({
    kind: "CANDIDATE_EVALUATED",
    status: "CANDIDATE_QUALIFIED",
    reasons: Object.freeze([]),
    candidate: Object.freeze(candidatePayload),
    executionEligible: false,
    strategyCandidatesCreated: 1,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
