import { describe, expect, it } from "vitest";
import { digestEurUsdM1ReplayObservationBundle } from "../src/replay/eurusd-m1-replay-observation-digest.js";
import { collectEurUsdM1ReplayObservationBundle } from "../src/replay/eurusd-m1-replay-observation-bundle.js";
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

describe("EURUSD M1 Replay observation digest", () => {
  it("returns the same immutable SHA-256 audit digest for identical evidence", async () => {
    const bundle = collectEurUsdM1ReplayObservationBundle({
      playback: playback(),
      instrument: "EURUSD",
      timeframe: "M1",
      cursor: 19,
    });
    const [first, second] = await Promise.all([
      digestEurUsdM1ReplayObservationBundle(bundle),
      digestEurUsdM1ReplayObservationBundle(bundle),
    ]);
    expect(first).toMatchObject({
      kind: "OBSERVATION_DIGEST",
      canonicalization: "JCS_RFC8785",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
    expect(first.sha256).toBe(second.sha256);
    expect(Object.isFrozen(first)).toBe(true);
  });
});
