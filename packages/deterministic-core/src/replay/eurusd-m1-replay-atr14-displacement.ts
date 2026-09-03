import { Decimal, parseDecimal, toDecimalString } from "@trade/contracts";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "./historical-replay-runner.js";

const ATR_PERIOD = 14;
const ATR_DEFINITION_ID = "eurusd-m1-atr14-arithmetic-tr-v1";
const MIN_DISPLACEMENT_BODY_TO_RANGE = "0.6";

export type EurUsdM1ReplayAtr14Displacement =
  | {
      readonly kind: "OBSERVATION_UNAVAILABLE";
      readonly reason:
        | "REPLAY_REJECTED"
        | "UNSUPPORTED_SCOPE"
        | "INVALID_CURSOR"
        | "INSUFFICIENT_ATR_CONTEXT"
        | "INVALID_CANDLE_GEOMETRY"
        | "ZERO_CANDLE_RANGE";
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
      readonly atrDefinitionId: typeof ATR_DEFINITION_ID;
      readonly atrPeriod: 14;
      readonly atr: string;
      readonly body: string;
      readonly bodyToRange: string;
      readonly displacement: boolean;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

export interface EurUsdM1ReplayAtr14DisplacementInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly centerCursor: number;
}

type CandleGeometry = Readonly<{
  readonly open: Decimal;
  readonly high: Decimal;
  readonly low: Decimal;
  readonly close: Decimal;
}>;

function unavailable(
  datasetId: string,
  reason: Extract<
    EurUsdM1ReplayAtr14Displacement,
    { kind: "OBSERVATION_UNAVAILABLE" }
  >["reason"],
): EurUsdM1ReplayAtr14Displacement {
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

function trueRange(current: CandleGeometry, previousClose: Decimal): Decimal {
  return Decimal.max(
    current.high.minus(current.low),
    current.high.minus(previousClose).abs(),
    current.low.minus(previousClose).abs(),
  );
}

/**
 * Calculates an immutable, arithmetic ATR-14 observation and DEC-047
 * displacement fact from an admitted local EURUSD M1 Replay only.
 */
export function observeEurUsdM1ReplayAtr14Displacement(
  input: Readonly<EurUsdM1ReplayAtr14DisplacementInput>,
): EurUsdM1ReplayAtr14Displacement {
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

  const firstTrueRangeCursor = centerCursor - ATR_PERIOD + 1;
  const priorCloseCursor = firstTrueRangeCursor - 1;
  if (priorCloseCursor < 0 || centerCursor >= playback.candles.length) {
    return unavailable(playback.datasetId, "INSUFFICIENT_ATR_CONTEXT");
  }

  let trueRangeSum = new Decimal(0);
  for (let cursor = firstTrueRangeCursor; cursor <= centerCursor; cursor += 1) {
    const current = parseGeometry(playback.candles[cursor]);
    const previous = parseGeometry(playback.candles[cursor - 1]);
    if (current === undefined || previous === undefined) {
      return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
    }
    trueRangeSum = trueRangeSum.plus(trueRange(current, previous.close));
  }

  const center = parseGeometry(playback.candles[centerCursor]);
  if (center === undefined) {
    return unavailable(playback.datasetId, "INVALID_CANDLE_GEOMETRY");
  }

  const range = center.high.minus(center.low);
  if (range.isZero()) {
    return unavailable(playback.datasetId, "ZERO_CANDLE_RANGE");
  }

  const atr = trueRangeSum.div(ATR_PERIOD);
  const body = center.close.minus(center.open).abs();
  const bodyToRange = body.div(range);

  return Object.freeze({
    kind: "OBSERVATION_FACTS",
    datasetId: playback.datasetId,
    centerCursor,
    sourceKind: "REPLAY",
    atrDefinitionId: ATR_DEFINITION_ID,
    atrPeriod: ATR_PERIOD,
    atr: toDecimalString(atr),
    body: toDecimalString(body),
    bodyToRange: toDecimalString(bodyToRange),
    displacement:
      body.gte(atr) &&
      bodyToRange.gte(parseDecimal(MIN_DISPLACEMENT_BODY_TO_RANGE)),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
