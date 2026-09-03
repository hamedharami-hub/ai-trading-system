import { describe, expect, it } from "vitest";
import {
  observeEurUsdM1ReplayFeatureFacts,
  type EurUsdM1ReplayFeatureFactsInput,
} from "../src/replay/eurusd-m1-replay-feature-facts.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "../src/replay/historical-replay-runner.js";

function candle(
  input: Partial<HistoricalReplayCandle> = {},
): HistoricalReplayCandle {
  return {
    timestampUtc: "2025-08-01T00:00:00+00:00",
    open: "1.10000",
    high: "1.10020",
    low: "1.09980",
    close: "1.10010",
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
): EurUsdM1ReplayFeatureFactsInput {
  return {
    playback: playback(candles),
    instrument: "EURUSD",
    timeframe: "M1",
    centerCursor: 5,
  };
}

describe("EURUSD M1 Replay feature facts", () => {
  it("derives immutable bullish candle and confirmed swing-high facts only", () => {
    const candles = Array.from({ length: 11 }, () => candle());
    candles[5] = candle({
      open: "1.10000",
      high: "1.10050",
      low: "1.09990",
      close: "1.10040",
    });

    const result = observeEurUsdM1ReplayFeatureFacts(input(candles));

    expect(result).toMatchObject({
      kind: "OBSERVATION_FACTS",
      datasetId: "eurusd-m1-local-replay",
      centerCursor: 5,
      candle: { body: "0.0004", range: "0.0006", direction: "BULLISH" },
      swing: {
        confirmedHigh: true,
        confirmedLow: false,
        contextCandlesEachSide: 5,
      },
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("fails closed for rejected replay, wrong scope, invalid cursor, and missing context", () => {
    const candles = Array.from({ length: 11 }, () => candle());
    const readyInput = input(candles);
    const rejectedPlayback: HistoricalReplayPlayback = Object.freeze({
      ...readyInput.playback,
      status: "REJECTED" as const,
      candles: Object.freeze([]),
      rejectionReasons: Object.freeze(["SHA256_MISMATCH"]),
    });

    expect(
      observeEurUsdM1ReplayFeatureFacts({
        ...readyInput,
        playback: rejectedPlayback,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "REPLAY_REJECTED",
    });
    expect(
      observeEurUsdM1ReplayFeatureFacts({
        ...readyInput,
        instrument: "GBPUSD",
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "UNSUPPORTED_SCOPE",
    });
    expect(
      observeEurUsdM1ReplayFeatureFacts({ ...readyInput, centerCursor: -1 }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "INVALID_CURSOR",
    });
    expect(
      observeEurUsdM1ReplayFeatureFacts({ ...readyInput, centerCursor: 4 }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "INSUFFICIENT_SWING_CONTEXT",
    });
  });

  it("fails closed when any candle geometry is malformed", () => {
    const candles = Array.from({ length: 11 }, () => candle());
    candles[3] = candle({ high: "1.09970", low: "1.09980" });

    expect(observeEurUsdM1ReplayFeatureFacts(input(candles))).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "INVALID_CANDLE_GEOMETRY",
    });
  });
});
