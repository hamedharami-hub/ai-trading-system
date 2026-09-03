import { describe, expect, it } from "vitest";
import { observeEurUsdM1ReplayOrderBlockOrigin } from "../src/replay/eurusd-m1-replay-order-block-origin.js";
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

function bullishBosCandles(): HistoricalReplayCandle[] {
  const candles = Array.from({ length: 20 }, () => candle());
  candles[5] = candle({ high: "1.00100" });
  candles[18] = candle({
    open: "1.00060",
    high: "1.00060",
    low: "1.00020",
    close: "1.00020",
  });
  candles[19] = candle({
    open: "1.00080",
    high: "1.00130",
    low: "1.00080",
    close: "1.00120",
  });
  return candles;
}

describe("EURUSD M1 Replay Order Block origin", () => {
  it("records only the last opposing candle body before bullish BOS", () => {
    const result = observeEurUsdM1ReplayOrderBlockOrigin({
      playback: playback(bullishBosCandles()),
      instrument: "EURUSD",
      timeframe: "M1",
      centerCursor: 19,
    });

    expect(result).toMatchObject({
      kind: "OBSERVATION_FACTS",
      direction: "BULLISH",
      originCursor: 18,
      bodyZone: { lower: "1.0002", upper: "1.0006" },
      postBosStatus: "NOT_OBSERVED",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("fails closed instead of creating an Order Block where BOS is absent", () => {
    expect(
      observeEurUsdM1ReplayOrderBlockOrigin({
        playback: playback(Array.from({ length: 20 }, () => candle())),
        instrument: "EURUSD",
        timeframe: "M1",
        centerCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "BOS_UNAVAILABLE",
    });
  });

  it("fails closed for rejected Replay and unsupported scope", () => {
    const ready = playback(bullishBosCandles());
    expect(
      observeEurUsdM1ReplayOrderBlockOrigin({
        playback: Object.freeze({
          ...ready,
          status: "REPLAY_REJECTED" as const,
        }),
        instrument: "EURUSD",
        timeframe: "M1",
        centerCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "REPLAY_REJECTED",
    });
    expect(
      observeEurUsdM1ReplayOrderBlockOrigin({
        playback: ready,
        instrument: "XAUUSD",
        timeframe: "M1",
        centerCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "UNSUPPORTED_SCOPE",
    });
  });
});
