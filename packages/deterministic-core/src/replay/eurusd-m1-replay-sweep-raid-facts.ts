import { parseDecimal, toDecimalString } from "@trade/contracts";
import { observeEurUsdM1ReplayFeatureFacts } from "./eurusd-m1-replay-feature-facts.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "./historical-replay-runner.js";

export type EurUsdM1ReplaySweepRaidFacts =
  | {
      readonly kind: "OBSERVATION_UNAVAILABLE";
      readonly reason:
        | "REPLAY_REJECTED"
        | "UNSUPPORTED_SCOPE"
        | "INVALID_CURSOR"
        | "INSUFFICIENT_SWING_CONTEXT"
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
      readonly sweepCursor: number;
      readonly latestConfirmedSwingHigh: Readonly<{
        readonly cursor: number;
        readonly level: string;
      }> | null;
      readonly latestConfirmedSwingLow: Readonly<{
        readonly cursor: number;
        readonly level: string;
      }> | null;
      readonly buySideSweep: "NOT_CONFIRMED" | "SAME_CANDLE" | "NEXT_CANDLE";
      readonly sellSideSweep: "NOT_CONFIRMED" | "SAME_CANDLE" | "NEXT_CANDLE";
      readonly nextCandleChecked: boolean;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

export interface EurUsdM1ReplaySweepRaidFactsInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly sweepCursor: number;
}

type CandleGeometry = Readonly<{
  readonly high: ReturnType<typeof parseDecimal>;
  readonly low: ReturnType<typeof parseDecimal>;
  readonly close: ReturnType<typeof parseDecimal>;
}>;

function unavailable(
  datasetId: string,
  reason: Extract<
    EurUsdM1ReplaySweepRaidFacts,
    { kind: "OBSERVATION_UNAVAILABLE" }
  >["reason"],
): EurUsdM1ReplaySweepRaidFacts {
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
 * Observes DEC-047 liquidity Sweep/Raid facts only from local EURUSD M1
 * Replay evidence. It never produces a candidate or executable artifact.
 */
export function observeEurUsdM1ReplaySweepRaidFacts(
  input: Readonly<EurUsdM1ReplaySweepRaidFactsInput>,
): EurUsdM1ReplaySweepRaidFacts {
  const { playback, sweepCursor } = input;
  if (playback.status !== "REPLAY_READY") {
    return unavailable(playback.datasetId, "REPLAY_REJECTED");
  }
  if (input.instrument !== "EURUSD" || input.timeframe !== "M1") {
    return unavailable(playback.datasetId, "UNSUPPORTED_SCOPE");
  }
  if (!Number.isSafeInteger(sweepCursor) || sweepCursor < 0) {
    return unavailable(playback.datasetId, "INVALID_CURSOR");
  }

  const sweep = parseGeometry(playback.candles[sweepCursor]);
  if (sweep === undefined) {
    return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
  }
  const nextCandle = parseGeometry(playback.candles[sweepCursor + 1]);
  if (
    playback.candles[sweepCursor + 1] !== undefined &&
    nextCandle === undefined
  ) {
    return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
  }

  let highCursor: number | null = null;
  let lowCursor: number | null = null;
  for (let cursor = sweepCursor - 5; cursor >= 5; cursor -= 1) {
    const feature = observeEurUsdM1ReplayFeatureFacts({
      playback,
      instrument: input.instrument,
      timeframe: input.timeframe,
      centerCursor: cursor,
    });
    if (feature.kind === "OBSERVATION_UNAVAILABLE") {
      return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
    }
    if (highCursor === null && feature.swing.confirmedHigh) highCursor = cursor;
    if (lowCursor === null && feature.swing.confirmedLow) lowCursor = cursor;
    if (highCursor !== null && lowCursor !== null) break;
  }

  const highSwing =
    highCursor === null
      ? undefined
      : parseGeometry(playback.candles[highCursor]);
  const lowSwing =
    lowCursor === null ? undefined : parseGeometry(playback.candles[lowCursor]);
  if (
    (highCursor !== null && highSwing === undefined) ||
    (lowCursor !== null && lowSwing === undefined)
  ) {
    return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
  }

  const buySideWick = highSwing !== undefined && sweep.high.gt(highSwing.high);
  const sellSideWick = lowSwing !== undefined && sweep.low.lt(lowSwing.low);
  const buySideSweep = !buySideWick
    ? "NOT_CONFIRMED"
    : sweep.close.lte(highSwing.high)
      ? "SAME_CANDLE"
      : nextCandle !== undefined && nextCandle.close.lte(highSwing.high)
        ? "NEXT_CANDLE"
        : "NOT_CONFIRMED";
  const sellSideSweep = !sellSideWick
    ? "NOT_CONFIRMED"
    : sweep.close.gte(lowSwing.low)
      ? "SAME_CANDLE"
      : nextCandle !== undefined && nextCandle.close.gte(lowSwing.low)
        ? "NEXT_CANDLE"
        : "NOT_CONFIRMED";

  return Object.freeze({
    kind: "OBSERVATION_FACTS",
    datasetId: playback.datasetId,
    sourceKind: "REPLAY",
    sweepCursor,
    latestConfirmedSwingHigh:
      highCursor === null || highSwing === undefined
        ? null
        : Object.freeze({
            cursor: highCursor,
            level: toDecimalString(highSwing.high),
          }),
    latestConfirmedSwingLow:
      lowCursor === null || lowSwing === undefined
        ? null
        : Object.freeze({
            cursor: lowCursor,
            level: toDecimalString(lowSwing.low),
          }),
    buySideSweep,
    sellSideSweep,
    nextCandleChecked: nextCandle !== undefined,
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
