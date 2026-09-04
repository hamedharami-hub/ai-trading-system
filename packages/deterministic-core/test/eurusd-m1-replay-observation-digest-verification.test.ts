import { describe, expect, it } from "vitest";
import { digestEurUsdM1ReplayObservationBundle } from "../src/replay/eurusd-m1-replay-observation-digest.js";
import { collectEurUsdM1ReplayObservationBundle } from "../src/replay/eurusd-m1-replay-observation-bundle.js";
import { verifyEurUsdM1ReplayObservationDigest } from "../src/replay/eurusd-m1-replay-observation-digest-verification.js";
import type {
  HistoricalReplayCandle,
  HistoricalReplayPlayback,
} from "../src/replay/historical-replay-runner.js";

function bundle() {
  const candle: HistoricalReplayCandle = {
    timestampUtc: "2025-08-01T00:00:00+00:00",
    open: "1.00000",
    high: "1.00040",
    low: "1.00000",
    close: "1.00000",
    volume: "1",
  };
  const playback: HistoricalReplayPlayback = Object.freeze({
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
  return collectEurUsdM1ReplayObservationBundle({
    playback,
    instrument: "EURUSD",
    timeframe: "M1",
    cursor: 19,
  });
}

describe("EURUSD M1 Replay digest verification", () => {
  it("reports match, mismatch, and malformed input without an action", async () => {
    const evidence = bundle();
    const digest = await digestEurUsdM1ReplayObservationBundle(evidence);
    await expect(
      verifyEurUsdM1ReplayObservationDigest(evidence, digest.sha256),
    ).resolves.toMatchObject({
      status: "MATCH",
      executionEligible: false,
      orderIntentsCreated: 0,
    });
    await expect(
      verifyEurUsdM1ReplayObservationDigest(evidence, "0".repeat(64)),
    ).resolves.toMatchObject({ status: "MISMATCH" });
    await expect(
      verifyEurUsdM1ReplayObservationDigest(evidence, "not-a-digest"),
    ).resolves.toMatchObject({ status: "INVALID_EXPECTED_DIGEST" });
  });
});
