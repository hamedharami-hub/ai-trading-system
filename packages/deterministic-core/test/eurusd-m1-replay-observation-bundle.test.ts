import { describe, expect, it } from "vitest";
import { collectEurUsdM1ReplayObservationBundle } from "../src/replay/eurusd-m1-replay-observation-bundle.js";
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

describe("EURUSD M1 Replay observation bundle", () => {
  it("keeps all observation results immutable and execution-ineligible", () => {
    const result = collectEurUsdM1ReplayObservationBundle({
      playback: playback(Array.from({ length: 25 }, () => candle())),
      instrument: "EURUSD",
      timeframe: "M1",
      cursor: 19,
    });
    expect(result).toMatchObject({
      kind: "OBSERVATION_BUNDLE",
      cursor: 19,
      candleSwing: { kind: "OBSERVATION_FACTS" },
      atrDisplacement: { kind: "OBSERVATION_FACTS" },
      bosFvg: { kind: "OBSERVATION_FACTS" },
      sweepRaid: { kind: "OBSERVATION_FACTS" },
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("preserves unavailable facts rather than inferring a positive result", () => {
    const result = collectEurUsdM1ReplayObservationBundle({
      playback: playback(Array.from({ length: 14 }, () => candle())),
      instrument: "EURUSD",
      timeframe: "M1",
      cursor: 13,
    });
    expect(result.atrDisplacement).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "INSUFFICIENT_ATR_CONTEXT",
    });
    expect(result.bosFvg).toMatchObject({ kind: "OBSERVATION_UNAVAILABLE" });
  });
});
