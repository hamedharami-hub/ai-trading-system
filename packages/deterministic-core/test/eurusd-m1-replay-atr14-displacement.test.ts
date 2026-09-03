import { describe, expect, it } from "vitest";
import {
  observeEurUsdM1ReplayAtr14Displacement,
  type EurUsdM1ReplayAtr14DisplacementInput,
} from "../src/replay/eurusd-m1-replay-atr14-displacement.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "../src/replay/historical-replay-runner.js";

function candle(
  input: Partial<HistoricalReplayCandle> = {},
): HistoricalReplayCandle {
  return {
    timestampUtc: "2025-08-01T00:00:00+00:00",
    open: "1.00000",
    high: "1.00040",
    low: "1.00000",
    close: "1.00000",
    volume: "1",
    ...input,
  };
}

function playback(
  candles: readonly HistoricalReplayCandle[],
): HistoricalReplayPlayback {
  return Object.freeze({
    datasetId: "eurusd-m1-local-replay",
    status: "REPLAY_READY",
    candles: Object.freeze([...candles]),
    rejectionReasons: Object.freeze([]),
    sourceKind: "REPLAY",
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}

function input(
  candles: readonly HistoricalReplayCandle[],
): EurUsdM1ReplayAtr14DisplacementInput {
  return {
    playback: playback(candles),
    instrument: "EURUSD",
    timeframe: "M1",
    centerCursor: 14,
  };
}

describe("EURUSD M1 Replay ATR-14 displacement facts", () => {
  it("derives immutable ATR-14 and displacement facts only", () => {
    const candles = Array.from({ length: 15 }, () => candle());
    candles[14] = candle({ close: "1.00040" });

    const result = observeEurUsdM1ReplayAtr14Displacement(input(candles));

    expect(result).toMatchObject({
      kind: "OBSERVATION_FACTS",
      atrDefinitionId: "eurusd-m1-atr14-arithmetic-tr-v1",
      atrPeriod: 14,
      atr: "0.0004",
      body: "0.0004",
      bodyToRange: "1",
      displacement: true,
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("does not label a candle displacement when its body is below ATR", () => {
    const candles = Array.from({ length: 15 }, () => candle());
    candles[14] = candle({ close: "1.00020" });

    expect(
      observeEurUsdM1ReplayAtr14Displacement(input(candles)),
    ).toMatchObject({
      kind: "OBSERVATION_FACTS",
      atr: "0.0004",
      body: "0.0002",
      displacement: false,
    });
  });

  it("fails closed for incomplete context, wrong scope, and invalid geometry", () => {
    expect(
      observeEurUsdM1ReplayAtr14Displacement(
        input(Array.from({ length: 14 }, () => candle())),
      ),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "INSUFFICIENT_ATR_CONTEXT",
    });
    expect(
      observeEurUsdM1ReplayAtr14Displacement({
        ...input(Array.from({ length: 15 }, () => candle())),
        timeframe: "M5",
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "UNSUPPORTED_SCOPE",
    });
    expect(
      observeEurUsdM1ReplayAtr14Displacement(
        input([
          ...Array.from({ length: 14 }, () => candle()),
          candle({ high: "0.99990" }),
        ]),
      ),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "INVALID_CANDLE_GEOMETRY",
    });
  });
});
