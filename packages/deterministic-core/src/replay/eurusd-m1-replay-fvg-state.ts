import { parseDecimal } from "@trade/contracts";
import { observeEurUsdM1ReplayBosFvgFacts } from "./eurusd-m1-replay-bos-fvg-facts.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "./historical-replay-runner.js";

export type EurUsdM1ReplayFvgState =
  | {
      readonly kind: "OBSERVATION_UNAVAILABLE";
      readonly reason:
        | "REPLAY_REJECTED"
        | "UNSUPPORTED_SCOPE"
        | "INVALID_FVG_CURSOR"
        | "INVALID_OBSERVATION_CURSOR"
        | "FVG_UNAVAILABLE"
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
      readonly fvgCursor: number;
      readonly observationCursor: number;
      readonly direction: "BULLISH" | "BEARISH";
      readonly status: "UNTOUCHED" | "MITIGATED" | "INVALIDATED";
      readonly mitigatedAtCursor: number | null;
      readonly invalidatedAtCursor: number | null;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

export interface EurUsdM1ReplayFvgStateInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly fvgCursor: number;
  readonly observationCursor: number;
}

type CandleGeometry = Readonly<{
  readonly high: ReturnType<typeof parseDecimal>;
  readonly low: ReturnType<typeof parseDecimal>;
}>;

function unavailable(
  datasetId: string,
  reason: Extract<
    EurUsdM1ReplayFvgState,
    { kind: "OBSERVATION_UNAVAILABLE" }
  >["reason"],
): EurUsdM1ReplayFvgState {
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
    return Object.freeze({ high, low });
  } catch {
    return undefined;
  }
}

/**
 * Observes only a valid FVG's later fill state in local Replay evidence. It
 * does not infer tradability, candidate quality, or an executable action.
 */
export function observeEurUsdM1ReplayFvgState(
  input: Readonly<EurUsdM1ReplayFvgStateInput>,
): EurUsdM1ReplayFvgState {
  const { playback, fvgCursor, observationCursor } = input;
  if (!Number.isSafeInteger(fvgCursor) || fvgCursor < 0) {
    return unavailable(playback.datasetId, "INVALID_FVG_CURSOR");
  }
  if (
    !Number.isSafeInteger(observationCursor) ||
    observationCursor <= fvgCursor ||
    observationCursor >= playback.candles.length
  ) {
    return unavailable(playback.datasetId, "INVALID_OBSERVATION_CURSOR");
  }

  const fvg = observeEurUsdM1ReplayBosFvgFacts({
    playback,
    instrument: input.instrument,
    timeframe: input.timeframe,
    centerCursor: fvgCursor,
  });
  if (fvg.kind === "OBSERVATION_UNAVAILABLE") {
    switch (fvg.reason) {
      case "REPLAY_REJECTED":
      case "UNSUPPORTED_SCOPE":
        return unavailable(playback.datasetId, fvg.reason);
      case "INVALID_CURSOR":
        return unavailable(playback.datasetId, "INVALID_FVG_CURSOR");
      case "INVALID_CANDLE_GEOMETRY":
        return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
      case "INSUFFICIENT_ATR_CONTEXT":
      case "INSUFFICIENT_SWING_CONTEXT":
        return unavailable(playback.datasetId, "FVG_UNAVAILABLE");
    }
  }

  const direction = fvg.bullishFvg
    ? "BULLISH"
    : fvg.bearishFvg
      ? "BEARISH"
      : undefined;
  if (direction === undefined || (fvg.bullishFvg && fvg.bearishFvg)) {
    return unavailable(playback.datasetId, "FVG_UNAVAILABLE");
  }

  const current = parseGeometry(playback.candles[fvgCursor]);
  const twoCandlesEarlier = parseGeometry(playback.candles[fvgCursor - 2]);
  if (current === undefined || twoCandlesEarlier === undefined) {
    return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
  }
  const lower = direction === "BULLISH" ? twoCandlesEarlier.high : current.high;
  const upper = direction === "BULLISH" ? current.low : twoCandlesEarlier.low;
  const midpoint = lower.plus(upper).div(2);
  let mitigatedAtCursor: number | null = null;
  let invalidatedAtCursor: number | null = null;

  for (let cursor = fvgCursor + 1; cursor <= observationCursor; cursor += 1) {
    const candle = parseGeometry(playback.candles[cursor]);
    if (candle === undefined) {
      return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
    }
    const reachesMidpoint =
      direction === "BULLISH"
        ? candle.low.lte(midpoint)
        : candle.high.gte(midpoint);
    if (mitigatedAtCursor === null && reachesMidpoint) {
      mitigatedAtCursor = cursor;
    }
    const fullyFilled =
      direction === "BULLISH" ? candle.low.lte(lower) : candle.high.gte(upper);
    if (fullyFilled) {
      invalidatedAtCursor = cursor;
      break;
    }
  }

  return Object.freeze({
    kind: "OBSERVATION_FACTS",
    datasetId: playback.datasetId,
    sourceKind: "REPLAY",
    fvgCursor,
    observationCursor,
    direction,
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
