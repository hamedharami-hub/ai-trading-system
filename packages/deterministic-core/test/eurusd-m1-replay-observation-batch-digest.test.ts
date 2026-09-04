import { describe, expect, it } from "vitest";
import { collectEurUsdM1ReplayObservationBatch } from "../src/replay/eurusd-m1-replay-observation-batch.js";
import { digestEurUsdM1ReplayObservationBatch } from "../src/replay/eurusd-m1-replay-observation-batch-digest.js";
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

describe("EURUSD M1 Replay observation batch digest", () => {
  it("returns deterministic non-executable digest for an admitted batch", async () => {
    const batch = await collectEurUsdM1ReplayObservationBatch({
      playback: playback(),
      instrument: "EURUSD",
      timeframe: "M1",
      cursors: [14, 19],
    });
    const [first, second] = await Promise.all([
      digestEurUsdM1ReplayObservationBatch(batch),
      digestEurUsdM1ReplayObservationBatch(batch),
    ]);
    expect(first).toMatchObject({
      kind: "OBSERVATION_BATCH_DIGEST",
      entryCount: 2,
      canonicalization: "JCS_RFC8785",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      executionEligible: false,
      orderIntentsCreated: 0,
    });
    if (
      first.kind === "OBSERVATION_BATCH_DIGEST" &&
      second.kind === "OBSERVATION_BATCH_DIGEST"
    )
      expect(first.sha256).toBe(second.sha256);
  });
});
