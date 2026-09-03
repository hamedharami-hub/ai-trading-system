import { Decimal, parseDecimal, toDecimalString } from "@trade/contracts";
import { observeEurUsdM1ReplayBosFvgFacts } from "./eurusd-m1-replay-bos-fvg-facts.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "./historical-replay-runner.js";

export type EurUsdM1ReplayOrderBlockOrigin =
  | {
      readonly kind: "OBSERVATION_UNAVAILABLE";
      readonly reason:
        | "REPLAY_REJECTED"
        | "UNSUPPORTED_SCOPE"
        | "INVALID_CURSOR"
        | "BOS_UNAVAILABLE"
        | "OPPOSING_CANDLE_UNAVAILABLE"
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
      readonly direction: "BULLISH" | "BEARISH";
      readonly originCursor: number;
      readonly bodyZone: Readonly<{
        readonly lower: string;
        readonly upper: string;
      }>;
      readonly postBosStatus: "NOT_OBSERVED";
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

export interface EurUsdM1ReplayOrderBlockOriginInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly centerCursor: number;
}

type CandleGeometry = Readonly<{
  readonly open: ReturnType<typeof parseDecimal>;
  readonly high: ReturnType<typeof parseDecimal>;
  readonly low: ReturnType<typeof parseDecimal>;
  readonly close: ReturnType<typeof parseDecimal>;
}>;

function unavailable(
  datasetId: string,
  reason: Extract<
    EurUsdM1ReplayOrderBlockOrigin,
    { kind: "OBSERVATION_UNAVAILABLE" }
  >["reason"],
): EurUsdM1ReplayOrderBlockOrigin {
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
    return Object.freeze({ open, high, low, close });
  } catch {
    return undefined;
  }
}

/**
 * Observes only the pre-BOS opposing candle and its body zone. Validity,
 * mitigation, and invalidation are intentionally not inferred here.
 */
export function observeEurUsdM1ReplayOrderBlockOrigin(
  input: Readonly<EurUsdM1ReplayOrderBlockOriginInput>,
): EurUsdM1ReplayOrderBlockOrigin {
  const { playback, centerCursor } = input;
  const bos = observeEurUsdM1ReplayBosFvgFacts(input);
  if (bos.kind === "OBSERVATION_UNAVAILABLE") {
    switch (bos.reason) {
      case "REPLAY_REJECTED":
      case "UNSUPPORTED_SCOPE":
      case "INVALID_CURSOR":
      case "INVALID_CANDLE_GEOMETRY":
        return unavailable(playback.datasetId, bos.reason);
      case "INSUFFICIENT_ATR_CONTEXT":
      case "INSUFFICIENT_SWING_CONTEXT":
        return unavailable(playback.datasetId, "BOS_UNAVAILABLE");
    }
  }

  const direction = bos.bullishBos
    ? "BULLISH"
    : bos.bearishBos
      ? "BEARISH"
      : undefined;
  if (direction === undefined || (bos.bullishBos && bos.bearishBos)) {
    return unavailable(playback.datasetId, "BOS_UNAVAILABLE");
  }

  for (let cursor = centerCursor - 1; cursor >= 0; cursor -= 1) {
    const candle = parseGeometry(playback.candles[cursor]);
    if (candle === undefined) {
      return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
    }
    const isOpposing =
      direction === "BULLISH"
        ? candle.close.lt(candle.open)
        : candle.close.gt(candle.open);
    if (!isOpposing) continue;

    return Object.freeze({
      kind: "OBSERVATION_FACTS",
      datasetId: playback.datasetId,
      centerCursor,
      sourceKind: "REPLAY",
      direction,
      originCursor: cursor,
      bodyZone: Object.freeze({
        lower: toDecimalString(Decimal.min(candle.open, candle.close)),
        upper: toDecimalString(Decimal.max(candle.open, candle.close)),
      }),
      postBosStatus: "NOT_OBSERVED",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  return unavailable(playback.datasetId, "OPPOSING_CANDLE_UNAVAILABLE");
}
