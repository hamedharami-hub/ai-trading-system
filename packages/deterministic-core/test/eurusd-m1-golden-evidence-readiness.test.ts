import { describe, expect, it } from "vitest";
import { digestEurUsdM1GoldenLabelSet } from "../src/replay/eurusd-m1-golden-label-set-digest.js";
import { evaluateEurUsdM1GoldenEvidenceReadiness } from "../src/replay/eurusd-m1-golden-evidence-readiness.js";
import { validateEurUsdM1GoldenLabelSet } from "../src/replay/eurusd-m1-golden-label-set-validator.js";
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

const manifest = {
  manifestVersion: "eurusd-m1-golden-manifest-v1" as const,
  datasetId: "eurusd-m1-local-replay",
  replaySha256: "a".repeat(64),
  instrument: "EURUSD" as const,
  timeframe: "M1" as const,
  sourceKind: "REPLAY" as const,
  ownerLabelSetId: "owner-labels-v1",
  labeledCursors: [14, 19],
};
const labelSet = {
  ownerLabelSetId: "owner-labels-v1",
  labels: [
    { cursor: 14, labelId: "label-a" },
    { cursor: 19, labelId: "label-b" },
  ],
};

describe("EURUSD M1 Golden evidence readiness", () => {
  it("reports evidence-ready only when manifest, labels, and expected digest agree", async () => {
    const labels = validateEurUsdM1GoldenLabelSet({
      playback: playback(),
      manifest,
      labelSet,
    });
    const digest = await digestEurUsdM1GoldenLabelSet(labels);
    if (digest.kind !== "GOLDEN_LABEL_SET_DIGEST")
      throw new Error("fixture rejected");
    await expect(
      evaluateEurUsdM1GoldenEvidenceReadiness({
        playback: playback(),
        manifest,
        labelSet,
        expectedLabelSetDigest: digest.sha256,
      }),
    ).resolves.toMatchObject({
      status: "GOLDEN_EVIDENCE_READY",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed on a mismatched expected digest", async () => {
    await expect(
      evaluateEurUsdM1GoldenEvidenceReadiness({
        playback: playback(),
        manifest,
        labelSet,
        expectedLabelSetDigest: "0".repeat(64),
      }),
    ).resolves.toMatchObject({
      status: "GOLDEN_EVIDENCE_REJECTED",
      reasons: expect.arrayContaining(["MISMATCH"]),
      executionEligible: false,
    });
  });
});
