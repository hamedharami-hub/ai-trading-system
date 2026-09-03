import { parseDecimal } from "@trade/contracts";
import { observeEurUsdM1ReplayOrderBlockOrigin } from "./eurusd-m1-replay-order-block-origin.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "./historical-replay-runner.js";

export type EurUsdM1ReplayOrderBlockState =
  | {
      readonly kind: "OBSERVATION_UNAVAILABLE";
      readonly reason:
        | "REPLAY_REJECTED"
        | "UNSUPPORTED_SCOPE"
        | "INVALID_BOS_CURSOR"
        | "INVALID_OBSERVATION_CURSOR"
        | "ORDER_BLOCK_UNAVAILABLE"
        | "INVALID_CANDLE_GEOMETRY";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "OBSERVATION_FACTS";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly bosCursor: number;
      readonly observationCursor: number;
      readonly direction: "BULLISH" | "BEARISH";
      readonly originCursor: number;
      readonly status: "UNTOUCHED" | "MITIGATED" | "INVALIDATED";
      readonly mitigatedAtCursor: number | null;
      readonly invalidatedAtCursor: number | null;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

export interface EurUsdM1ReplayOrderBlockStateInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly bosCursor: number;
  readonly observationCursor: number;
}

type CandleGeometry = Readonly<{
  readonly high: ReturnType<typeof parseDecimal>;
  readonly low: ReturnType<typeof parseDecimal>;
  readonly close: ReturnType<typeof parseDecimal>;
}>;

function unavailable(
  datasetId: string,
  reason: Extract<
    EurUsdM1ReplayOrderBlockState,
    { kind: "OBSERVATION_UNAVAILABLE" }
  >["reason"],
): EurUsdM1ReplayOrderBlockState {
  return Object.freeze({
    kind: "OBSERVATION_UNAVAILABLE",
    reason,
    datasetId,
    sourceKind: "REPLAY",
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}

function parseGeometry(
  candle: Readonly<HistoricalReplayCandle> | undefined,
): CandleGeometry | undefined {
  if (candle === undefined) return undefined;
  try {
    const open = parseDecimal(candle.open);
    const high = parseDecimal(candle.high);
    const low = parseDecimal(candle.low);
    const close = parseDecimal(candle.close);
    if (
      open.lte(0) ||
      high.lte(0) ||
      low.lte(0) ||
      close.lte(0) ||
      high.lt(low) ||
      high.lt(open) ||
      high.lt(close) ||
      low.gt(open) ||
      low.gt(close)
    ) {
      return undefined;
    }
    return Object.freeze({ high, low, close });
  } catch {
    return undefined;
  }
}

/**
 * Observes only post-BOS body-zone contact/invalidation. It does not label an
 * Order Block tradable or produce any candidate or execution artifact.
 */
export function observeEurUsdM1ReplayOrderBlockState(
  input: Readonly<EurUsdM1ReplayOrderBlockStateInput>,
): EurUsdM1ReplayOrderBlockState {
  const { playback, bosCursor, observationCursor } = input;
  if (!Number.isSafeInteger(bosCursor) || bosCursor < 0) {
    return unavailable(playback.datasetId, "INVALID_BOS_CURSOR");
  }
  if (
    !Number.isSafeInteger(observationCursor) ||
    observationCursor <= bosCursor ||
    observationCursor >= playback.candles.length
  ) {
    return unavailable(playback.datasetId, "INVALID_OBSERVATION_CURSOR");
  }

  const origin = observeEurUsdM1ReplayOrderBlockOrigin({
    playback,
    instrument: input.instrument,
    timeframe: input.timeframe,
    centerCursor: bosCursor,
  });
  if (origin.kind === "OBSERVATION_UNAVAILABLE") {
    switch (origin.reason) {
      case "REPLAY_REJECTED":
      case "UNSUPPORTED_SCOPE":
        return unavailable(playback.datasetId, origin.reason);
      case "INVALID_CURSOR":
        return unavailable(playback.datasetId, "INVALID_BOS_CURSOR");
      case "INVALID_CANDLE_GEOMETRY":
        return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
      case "BOS_UNAVAILABLE":
      case "OPPOSING_CANDLE_UNAVAILABLE":
        return unavailable(playback.datasetId, "ORDER_BLOCK_UNAVAILABLE");
    }
  }

  const lower = parseDecimal(origin.bodyZone.lower);
  const upper = parseDecimal(origin.bodyZone.upper);
  let mitigatedAtCursor: number | null = null;
  let invalidatedAtCursor: number | null = null;

  for (let cursor = bosCursor + 1; cursor <= observationCursor; cursor += 1) {
    const candle = parseGeometry(playback.candles[cursor]);
    if (candle === undefined) {
      return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
    }
    if (
      mitigatedAtCursor === null &&
      candle.high.gte(lower) &&
      candle.low.lte(upper)
    ) {
      mitigatedAtCursor = cursor;
    }
    const invalidated =
      origin.direction === "BULLISH"
        ? candle.close.lt(lower)
        : candle.close.gt(upper);
    if (invalidated) {
      invalidatedAtCursor = cursor;
      break;
    }
  }

  return Object.freeze({
    kind: "OBSERVATION_FACTS",
    datasetId: playback.datasetId,
    sourceKind: "REPLAY",
    bosCursor,
    observationCursor,
    direction: origin.direction,
    originCursor: origin.originCursor,
    status:
      invalidatedAtCursor !== null
        ? "INVALIDATED"
        : mitigatedAtCursor !== null
          ? "MITIGATED"
          : "UNTOUCHED",
    mitigatedAtCursor,
    invalidatedAtCursor,
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
