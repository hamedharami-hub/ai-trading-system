import { describe, expect, it } from "vitest";
import { observeEurUsdM1ReplaySweepRaidFacts } from "../src/replay/eurusd-m1-replay-sweep-raid-facts.js";
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

describe("EURUSD M1 Replay Sweep/Raid facts", () => {
  it("observes a same-candle buy-side sweep without a candidate", () => {
    const candles = Array.from({ length: 21 }, () => candle());
    candles[5] = candle({ high: "1.00100" });
    candles[19] = candle({
      open: "1.00080",
      high: "1.00120",
      low: "1.00070",
      close: "1.00090",
    });
    const result = observeEurUsdM1ReplaySweepRaidFacts({
      playback: playback(candles),
      instrument: "EURUSD",
      timeframe: "M1",
      sweepCursor: 19,
    });
    expect(result).toMatchObject({
      kind: "OBSERVATION_FACTS",
      latestConfirmedSwingHigh: { cursor: 5, level: "1.001" },
      buySideSweep: "SAME_CANDLE",
      sellSideSweep: "NOT_CONFIRMED",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("uses only the immediately next candle when same-candle closure did not return inside", () => {
    const candles = Array.from({ length: 21 }, () => candle());
    candles[5] = candle({ high: "1.00100" });
    candles[19] = candle({
      open: "1.00080",
      high: "1.00120",
      low: "1.00070",
      close: "1.00110",
    });
    candles[20] = candle({
      open: "1.00110",
      high: "1.00120",
      low: "1.00080",
      close: "1.00090",
    });
    expect(
      observeEurUsdM1ReplaySweepRaidFacts({
        playback: playback(candles),
        instrument: "EURUSD",
        timeframe: "M1",
        sweepCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_FACTS",
      buySideSweep: "NEXT_CANDLE",
      nextCandleChecked: true,
    });
  });

  it("fails closed for rejected Replay and unsupported scope", () => {
    const ready = playback(Array.from({ length: 21 }, () => candle()));
    expect(
      observeEurUsdM1ReplaySweepRaidFacts({
        playback: Object.freeze({
          ...ready,
          status: "REPLAY_REJECTED" as const,
        }),
        instrument: "EURUSD",
        timeframe: "M1",
        sweepCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "REPLAY_REJECTED",
    });
    expect(
      observeEurUsdM1ReplaySweepRaidFacts({
        playback: ready,
        instrument: "EURUSD",
        timeframe: "M5",
        sweepCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "UNSUPPORTED_SCOPE",
    });
  });
});
