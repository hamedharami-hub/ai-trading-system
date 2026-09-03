import { describe, expect, it } from "vitest";
import { observeEurUsdM1ReplayBosFvgFacts } from "../src/replay/eurusd-m1-replay-bos-fvg-facts.js";
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

describe("EURUSD M1 Replay BOS and FVG facts", () => {
  it("derives thresholded bullish BOS and FVG evidence without a candidate", () => {
    const candles = Array.from({ length: 20 }, () => candle());
    candles[5] = candle({ high: "1.00100" });
    candles[19] = candle({
      open: "1.00080",
      high: "1.00130",
      low: "1.00080",
      close: "1.00120",
    });

    const result = observeEurUsdM1ReplayBosFvgFacts({
      playback: playback(candles),
      instrument: "EURUSD",
      timeframe: "M1",
      centerCursor: 19,
    });

    expect(result).toMatchObject({
      kind: "OBSERVATION_FACTS",
      metadataVersion: "eurusd-m1-replay-metadata-v1",
      tickSize: "0.00001",
      latestConfirmedSwingHighCursor: 5,
      bullishBos: true,
      bearishBos: false,
      bullishFvg: true,
      bearishFvg: false,
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("keeps absent structure as false facts, not a trade candidate", () => {
    const result = observeEurUsdM1ReplayBosFvgFacts({
      playback: playback(Array.from({ length: 20 }, () => candle())),
      instrument: "EURUSD",
      timeframe: "M1",
      centerCursor: 19,
    });

    expect(result).toMatchObject({
      kind: "OBSERVATION_FACTS",
      latestConfirmedSwingHighCursor: null,
      latestConfirmedSwingLowCursor: null,
      bullishBos: false,
      bearishBos: false,
      bullishFvg: false,
      bearishFvg: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed for rejected Replay, wrong scope, and incomplete ATR evidence", () => {
    const rejected = playback(Array.from({ length: 20 }, () => candle()));
    const replayRejected = Object.freeze({
      ...rejected,
      status: "REPLAY_REJECTED" as const,
    });

    expect(
      observeEurUsdM1ReplayBosFvgFacts({
        playback: replayRejected,
        instrument: "EURUSD",
        timeframe: "M1",
        centerCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "REPLAY_REJECTED",
    });
    expect(
      observeEurUsdM1ReplayBosFvgFacts({
        playback: playback(Array.from({ length: 20 }, () => candle())),
        instrument: "EURUSD",
        timeframe: "M5",
        centerCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "UNSUPPORTED_SCOPE",
    });
    expect(
      observeEurUsdM1ReplayBosFvgFacts({
        playback: playback(Array.from({ length: 14 }, () => candle())),
        instrument: "EURUSD",
        timeframe: "M1",
        centerCursor: 13,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "INSUFFICIENT_ATR_CONTEXT",
    });
  });
});
