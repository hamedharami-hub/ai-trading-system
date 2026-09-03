import { Decimal, parseDecimal, toDecimalString } from "@trade/contracts";
import {
  observeEurUsdM1ReplayAtr14Displacement,
  type EurUsdM1ReplayAtr14Displacement,
} from "./eurusd-m1-replay-atr14-displacement.js";
import { observeEurUsdM1ReplayFeatureFacts } from "./eurusd-m1-replay-feature-facts.js";
import { EURUSD_M1_LOCAL_REPLAY_METADATA } from "./eurusd-m1-local-replay-metadata.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "./historical-replay-runner.js";

const MINIMUM_TICKS = 2;
const MINIMUM_ATR_MULTIPLIER = "0.10";

export type EurUsdM1ReplayBosFvgFacts =
  | {
      readonly kind: "OBSERVATION_UNAVAILABLE";
      readonly reason:
        | "REPLAY_REJECTED"
        | "UNSUPPORTED_SCOPE"
        | "INVALID_CURSOR"
        | "INSUFFICIENT_ATR_CONTEXT"
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
      readonly centerCursor: number;
      readonly sourceKind: "REPLAY";
      readonly metadataVersion: "eurusd-m1-replay-metadata-v1";
      readonly tickSize: "0.00001";
      readonly atr: string;
      readonly threshold: string;
      readonly latestConfirmedSwingHighCursor: number | null;
      readonly latestConfirmedSwingLowCursor: number | null;
      readonly bullishBos: boolean;
      readonly bearishBos: boolean;
      readonly bullishFvg: boolean;
      readonly bearishFvg: boolean;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

export interface EurUsdM1ReplayBosFvgFactsInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly centerCursor: number;
}

type CandleGeometry = Readonly<{
  readonly high: Decimal;
  readonly low: Decimal;
  readonly close: Decimal;
}>;

function unavailable(
  datasetId: string,
  reason: Extract<
    EurUsdM1ReplayBosFvgFacts,
    { kind: "OBSERVATION_UNAVAILABLE" }
  >["reason"],
): EurUsdM1ReplayBosFvgFacts {
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

function mapAtrUnavailable(
  atr: Extract<
    EurUsdM1ReplayAtr14Displacement,
    { kind: "OBSERVATION_UNAVAILABLE" }
  >,
): Extract<
  EurUsdM1ReplayBosFvgFacts,
  { kind: "OBSERVATION_UNAVAILABLE" }
>["reason"] {
  switch (atr.reason) {
    case "REPLAY_REJECTED":
    case "UNSUPPORTED_SCOPE":
    case "INVALID_CURSOR":
    case "INVALID_CANDLE_GEOMETRY":
      return atr.reason;
    case "INSUFFICIENT_ATR_CONTEXT":
    case "ZERO_CANDLE_RANGE":
      return "INSUFFICIENT_ATR_CONTEXT";
  }
}

/**
 * Observes DEC-047 BOS and three-candle FVG evidence only from the admitted
 * EURUSD M1 local Replay scope. It cannot create trading candidates or any
 * executable artifact.
 */
export function observeEurUsdM1ReplayBosFvgFacts(
  input: Readonly<EurUsdM1ReplayBosFvgFactsInput>,
): EurUsdM1ReplayBosFvgFacts {
  const { playback, centerCursor } = input;

  if (playback.status !== "REPLAY_READY") {
    return unavailable(playback.datasetId, "REPLAY_REJECTED");
  }
  if (
    input.instrument !== EURUSD_M1_LOCAL_REPLAY_METADATA.instrument ||
    input.timeframe !== EURUSD_M1_LOCAL_REPLAY_METADATA.timeframe
  ) {
    return unavailable(playback.datasetId, "UNSUPPORTED_SCOPE");
  }
  if (!Number.isSafeInteger(centerCursor) || centerCursor < 0) {
    return unavailable(playback.datasetId, "INVALID_CURSOR");
  }

  const atr = observeEurUsdM1ReplayAtr14Displacement(input);
  if (atr.kind === "OBSERVATION_UNAVAILABLE") {
    return unavailable(playback.datasetId, mapAtrUnavailable(atr));
  }

  const center = parseGeometry(playback.candles[centerCursor]);
  const twoCandlesEarlier = parseGeometry(playback.candles[centerCursor - 2]);
  if (center === undefined || twoCandlesEarlier === undefined) {
    return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
  }

  let latestConfirmedSwingHighCursor: number | null = null;
  let latestConfirmedSwingLowCursor: number | null = null;
  for (let cursor = centerCursor - 5; cursor >= 5; cursor -= 1) {
    const features = observeEurUsdM1ReplayFeatureFacts({
      playback,
      instrument: input.instrument,
      timeframe: input.timeframe,
      centerCursor: cursor,
    });
    if (features.kind === "OBSERVATION_UNAVAILABLE") {
      return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
    }
    if (
      latestConfirmedSwingHighCursor === null &&
      features.swing.confirmedHigh
    ) {
      latestConfirmedSwingHighCursor = cursor;
    }
    if (latestConfirmedSwingLowCursor === null && features.swing.confirmedLow) {
      latestConfirmedSwingLowCursor = cursor;
    }
    if (
      latestConfirmedSwingHighCursor !== null &&
      latestConfirmedSwingLowCursor !== null
    ) {
      break;
    }
  }

  const latestSwingHigh =
    latestConfirmedSwingHighCursor === null
      ? undefined
      : parseGeometry(playback.candles[latestConfirmedSwingHighCursor]);
  const latestSwingLow =
    latestConfirmedSwingLowCursor === null
      ? undefined
      : parseGeometry(playback.candles[latestConfirmedSwingLowCursor]);
  if (
    (latestConfirmedSwingHighCursor !== null &&
      latestSwingHigh === undefined) ||
    (latestConfirmedSwingLowCursor !== null && latestSwingLow === undefined)
  ) {
    return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
  }

  const threshold = Decimal.max(
    parseDecimal(EURUSD_M1_LOCAL_REPLAY_METADATA.tickSize).mul(MINIMUM_TICKS),
    parseDecimal(atr.atr).mul(MINIMUM_ATR_MULTIPLIER),
  );

  return Object.freeze({
    kind: "OBSERVATION_FACTS",
    datasetId: playback.datasetId,
    centerCursor,
    sourceKind: "REPLAY",
    metadataVersion: EURUSD_M1_LOCAL_REPLAY_METADATA.metadataVersion,
    tickSize: EURUSD_M1_LOCAL_REPLAY_METADATA.tickSize,
    atr: atr.atr,
    threshold: toDecimalString(threshold),
    latestConfirmedSwingHighCursor,
    latestConfirmedSwingLowCursor,
    bullishBos:
      latestSwingHigh !== undefined &&
      center.close.gte(latestSwingHigh.high.plus(threshold)),
    bearishBos:
      latestSwingLow !== undefined &&
      center.close.lte(latestSwingLow.low.minus(threshold)),
    bullishFvg: center.low.gt(twoCandlesEarlier.high.plus(threshold)),
    bearishFvg: center.high.lt(twoCandlesEarlier.low.minus(threshold)),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
