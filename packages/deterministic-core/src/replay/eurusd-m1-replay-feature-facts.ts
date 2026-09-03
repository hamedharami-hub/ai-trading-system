import { parseDecimal, toDecimalString } from "@trade/contracts";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "./historical-replay-runner.js";

const SWING_CONTEXT_CANDLES = 5;

export type ReplayCandleDirection = "BULLISH" | "BEARISH" | "FLAT";

export type EurUsdM1ReplayFeatureFacts =
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
      readonly centerCursor: number;
      readonly sourceKind: "REPLAY";
      readonly candle: Readonly<{
        readonly body: string;
        readonly range: string;
        readonly direction: ReplayCandleDirection;
      }>;
      readonly swing: Readonly<{
        readonly confirmedHigh: boolean;
        readonly confirmedLow: boolean;
        readonly contextCandlesEachSide: 5;
      }>;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

export interface EurUsdM1ReplayFeatureFactsInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly centerCursor: number;
}

function unavailable(
  datasetId: string,
  reason: Extract<
    EurUsdM1ReplayFeatureFacts,
    { kind: "OBSERVATION_UNAVAILABLE" }
  >["reason"],
): EurUsdM1ReplayFeatureFacts {
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

function parseCandleGeometry(candle: Readonly<HistoricalReplayCandle>):
  | Readonly<{
      readonly body: string;
      readonly range: string;
      readonly direction: ReplayCandleDirection;
      readonly high: ReturnType<typeof parseDecimal>;
      readonly low: ReturnType<typeof parseDecimal>;
    }>
  | undefined {
  try {
    const open = parseDecimal(candle.open);
    const high = parseDecimal(candle.high);
    const low = parseDecimal(candle.low);
    const close = parseDecimal(candle.close);

    if (open.lte(0) || high.lt(low) || low.lte(0) || close.lte(0)) {
      return undefined;
    }

    const direction: ReplayCandleDirection = close.gt(open)
      ? "BULLISH"
      : close.lt(open)
        ? "BEARISH"
        : "FLAT";

    return Object.freeze({
      body: toDecimalString(close.minus(open).abs()),
      range: toDecimalString(high.minus(low)),
      direction,
      high,
      low,
    });
  } catch {
    return undefined;
  }
}

/**
 * Reads deterministic observation facts only from an already-admitted EURUSD
 * M1 historical Replay. It cannot create a candidate, calculate a threshold,
 * or perform an external or executable action.
 */
export function observeEurUsdM1ReplayFeatureFacts(
  input: Readonly<EurUsdM1ReplayFeatureFactsInput>,
): EurUsdM1ReplayFeatureFacts {
  const { playback, centerCursor } = input;

  if (playback.status !== "REPLAY_READY") {
    return unavailable(playback.datasetId, "REPLAY_REJECTED");
  }

  if (input.instrument !== "EURUSD" || input.timeframe !== "M1") {
    return unavailable(playback.datasetId, "UNSUPPORTED_SCOPE");
  }

  if (!Number.isSafeInteger(centerCursor) || centerCursor < 0) {
    return unavailable(playback.datasetId, "INVALID_CURSOR");
  }

  const firstContextCursor = centerCursor - SWING_CONTEXT_CANDLES;
  const lastContextCursor = centerCursor + SWING_CONTEXT_CANDLES;
  if (firstContextCursor < 0 || lastContextCursor >= playback.candles.length) {
    return unavailable(playback.datasetId, "INSUFFICIENT_SWING_CONTEXT");
  }

  const centerCandle = playback.candles[centerCursor];
  if (centerCandle === undefined) {
    return unavailable(playback.datasetId, "INVALID_CURSOR");
  }

  const center = parseCandleGeometry(centerCandle);
  if (center === undefined) {
    return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
  }

  const surroundingCandles = playback.candles.filter(
    (_, cursor) =>
      cursor >= firstContextCursor &&
      cursor <= lastContextCursor &&
      cursor !== centerCursor,
  );
  const surrounding = surroundingCandles.map(parseCandleGeometry);
  if (surrounding.some((candle) => candle === undefined)) {
    return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
  }

  const context = surrounding as ReadonlyArray<
    NonNullable<ReturnType<typeof parseCandleGeometry>>
  >;

  return Object.freeze({
    kind: "OBSERVATION_FACTS",
    datasetId: playback.datasetId,
    centerCursor,
    sourceKind: "REPLAY",
    candle: Object.freeze({
      body: center.body,
      range: center.range,
      direction: center.direction,
    }),
    swing: Object.freeze({
      confirmedHigh: context.every((candle) => center.high.gt(candle.high)),
      confirmedLow: context.every((candle) => center.low.lt(candle.low)),
      contextCandlesEachSide: SWING_CONTEXT_CANDLES,
    }),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
