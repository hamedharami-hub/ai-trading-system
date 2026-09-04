import { describe, expect, it } from "vitest";
import { collectEurUsdM1ReplayObservationBatch } from "../src/replay/eurusd-m1-replay-observation-batch.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "../src/replay/historical-replay-runner.js";

function playback(): HistoricalReplayPlayback {
  const candle: HistoricalReplayCandle = {
    timestampUtc: "2025-08-01T00:00:00+00:00",
    open: "1.00000",
    high: "1.00040",
    low: "1.00000",
    close: "1.00000",
    volume: "1",
  };
  return Object.freeze({
    datasetId: "eurusd-m1-local-replay",
    status: "REPLAY_READY",
    candles: Object.freeze(Array.from({ length: 25 }, () => candle)),
    rejectionReasons: Object.freeze([]),
    sourceKind: "REPLAY",
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}

describe("EURUSD M1 Replay observation batch", () => {
  it("collects bounded ordered digest-only evidence", async () => {
    await expect(
      collectEurUsdM1ReplayObservationBatch({
        playback: playback(),
        instrument: "EURUSD",
        timeframe: "M1",
        cursors: [14, 19],
      }),
    ).resolves.toMatchObject({
      kind: "OBSERVATION_BATCH",
      entries: [
        { cursor: 14, digest: expect.stringMatching(/^[a-f0-9]{64}$/) },
        { cursor: 19, digest: expect.stringMatching(/^[a-f0-9]{64}$/) },
      ],
      executionEligible: false,
      orderIntentsCreated: 0,
    });
  });
  it("fails closed for empty, duplicate, and unordered cursors", async () => {
    for (const cursors of [[], [14, 14], [19, 14]])
      await expect(
        collectEurUsdM1ReplayObservationBatch({
          playback: playback(),
          instrument: "EURUSD",
          timeframe: "M1",
          cursors,
        }),
      ).resolves.toMatchObject({
        kind: "OBSERVATION_BATCH_UNAVAILABLE",
        reason: "INVALID_CURSOR_SEQUENCE",
      });
  });
});
