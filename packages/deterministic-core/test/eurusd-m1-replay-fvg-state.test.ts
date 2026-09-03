import { describe, expect, it } from "vitest";
import { observeEurUsdM1ReplayFvgState } from "../src/replay/eurusd-m1-replay-fvg-state.js";
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

function history(): HistoricalReplayCandle[] {
  const candles = Array.from({ length: 22 }, () => candle());
  candles[19] = candle({
    open: "1.00080",
    high: "1.00130",
    low: "1.00080",
    close: "1.00120",
  });
  candles[20] = candle({
    open: "1.00100",
    high: "1.00110",
    low: "1.00060",
    close: "1.00090",
  });
  candles[21] = candle({
    open: "1.00060",
    high: "1.00070",
    low: "1.00030",
    close: "1.00040",
  });
  return candles;
}

describe("EURUSD M1 Replay FVG state", () => {
  it("records mitigation and full-fill invalidation as evidence only", () => {
    const result = observeEurUsdM1ReplayFvgState({
      playback: playback(history()),
      instrument: "EURUSD",
      timeframe: "M1",
      fvgCursor: 19,
      observationCursor: 21,
    });

    expect(result).toMatchObject({
      kind: "OBSERVATION_FACTS",
      direction: "BULLISH",
      status: "INVALIDATED",
      mitigatedAtCursor: 20,
      invalidatedAtCursor: 21,
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("reports untouched evidence without a candidate", () => {
    const candles = history();
    candles[20] = candle({
      open: "1.00110",
      high: "1.00130",
      low: "1.00100",
      close: "1.00120",
    });
    const result = observeEurUsdM1ReplayFvgState({
      playback: playback(candles),
      instrument: "EURUSD",
      timeframe: "M1",
      fvgCursor: 19,
      observationCursor: 20,
    });

    expect(result).toMatchObject({
      kind: "OBSERVATION_FACTS",
      status: "UNTOUCHED",
      mitigatedAtCursor: null,
      invalidatedAtCursor: null,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed for invalid observation position and unavailable FVG", () => {
    expect(
      observeEurUsdM1ReplayFvgState({
        playback: playback(history()),
        instrument: "EURUSD",
        timeframe: "M1",
        fvgCursor: 19,
        observationCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "INVALID_OBSERVATION_CURSOR",
    });
    expect(
      observeEurUsdM1ReplayFvgState({
        playback: playback(Array.from({ length: 22 }, () => candle())),
        instrument: "EURUSD",
        timeframe: "M1",
        fvgCursor: 19,
        observationCursor: 20,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "FVG_UNAVAILABLE",
    });
  });
});
