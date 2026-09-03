import { describe, expect, it } from "vitest";
import { observeEurUsdM1ReplayOrderBlockState } from "../src/replay/eurusd-m1-replay-order-block-state.js";
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
  candles[20] = candle({
    open: "1.00090",
    high: "1.00100",
    low: "1.00050",
    close: "1.00090",
  });
  candles[21] = candle({
    open: "1.00040",
    high: "1.00040",
    low: "0.99990",
    close: "1.00010",
  });
  return candles;
}

describe("EURUSD M1 Replay Order Block state", () => {
  it("records mitigation and later invalidation as evidence only", () => {
    const result = observeEurUsdM1ReplayOrderBlockState({
      playback: playback(history()),
      instrument: "EURUSD",
      timeframe: "M1",
      bosCursor: 19,
      observationCursor: 21,
    });

    expect(result).toMatchObject({
      kind: "OBSERVATION_FACTS",
      direction: "BULLISH",
      originCursor: 18,
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

  it("records untouched state without inferring a trade", () => {
    const candles = history();
    candles[20] = candle({
      open: "1.00110",
      high: "1.00130",
      low: "1.00100",
      close: "1.00120",
    });
    const result = observeEurUsdM1ReplayOrderBlockState({
      playback: playback(candles),
      instrument: "EURUSD",
      timeframe: "M1",
      bosCursor: 19,
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

  it("fails closed for invalid observation position and unavailable structure", () => {
    expect(
      observeEurUsdM1ReplayOrderBlockState({
        playback: playback(history()),
        instrument: "EURUSD",
        timeframe: "M1",
        bosCursor: 19,
        observationCursor: 19,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "INVALID_OBSERVATION_CURSOR",
    });
    expect(
      observeEurUsdM1ReplayOrderBlockState({
        playback: playback(Array.from({ length: 22 }, () => candle())),
        instrument: "EURUSD",
        timeframe: "M1",
        bosCursor: 19,
        observationCursor: 20,
      }),
    ).toMatchObject({
      kind: "OBSERVATION_UNAVAILABLE",
      reason: "ORDER_BLOCK_UNAVAILABLE",
    });
  });
});
