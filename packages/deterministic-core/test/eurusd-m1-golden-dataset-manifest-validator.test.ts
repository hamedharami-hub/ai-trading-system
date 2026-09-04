import { describe, expect, it } from "vitest";
import { validateEurUsdM1GoldenDatasetManifest } from "../src/replay/eurusd-m1-golden-dataset-manifest-validator.js";
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

function manifest() {
  return {
    manifestVersion: "eurusd-m1-golden-manifest-v1" as const,
    datasetId: "eurusd-m1-local-replay",
    replaySha256: "a".repeat(64),
    instrument: "EURUSD" as const,
    timeframe: "M1" as const,
    sourceKind: "REPLAY" as const,
    ownerLabelSetId: "owner-labels-v1",
    labeledCursors: [14, 19],
  };
}

describe("EURUSD M1 Golden Dataset manifest", () => {
  it("accepts bounded local manifest shape without validating labels", () => {
    expect(
      validateEurUsdM1GoldenDatasetManifest({
        playback: playback(),
        manifest: manifest(),
      }),
    ).toMatchObject({
      kind: "GOLDEN_MANIFEST_ACCEPTED",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });
  it("fails closed for missing label identity, hash, and duplicate cursors", () => {
    expect(
      validateEurUsdM1GoldenDatasetManifest({
        playback: playback(),
        manifest: {
          ...manifest(),
          ownerLabelSetId: "",
          replaySha256: "bad",
          labeledCursors: [14, 14],
        },
      }),
    ).toMatchObject({
      kind: "GOLDEN_MANIFEST_REJECTED",
      rejectionReasons: expect.arrayContaining([
        "INVALID_REPLAY_SHA256",
        "OWNER_LABEL_SET_ID_REQUIRED",
        "INVALID_LABELED_CURSORS",
      ]),
    });
  });
});
