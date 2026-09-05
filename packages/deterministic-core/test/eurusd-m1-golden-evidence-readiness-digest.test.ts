import { describe, expect, it } from "vitest";
import { digestEurUsdM1GoldenEvidenceReadiness } from "../src/replay/eurusd-m1-golden-evidence-readiness-digest.js";
import { verifyEurUsdM1GoldenEvidenceReadinessDigest } from "../src/replay/eurusd-m1-golden-evidence-readiness-digest-verification.js";
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

async function readyEvidence() {
  const labels = validateEurUsdM1GoldenLabelSet({
    playback: playback(),
    manifest,
    labelSet,
  });
  const labelDigest = await digestEurUsdM1GoldenLabelSet(labels);
  if (labelDigest.kind !== "GOLDEN_LABEL_SET_DIGEST") {
    throw new Error("fixture rejected");
  }
  return evaluateEurUsdM1GoldenEvidenceReadiness({
    playback: playback(),
    manifest,
    labelSet,
    expectedLabelSetDigest: labelDigest.sha256,
  });
}

describe("EURUSD M1 Golden evidence readiness digest", () => {
  it("creates a deterministic local audit digest only for ready evidence", async () => {
    const [first, second] = await Promise.all([
      digestEurUsdM1GoldenEvidenceReadiness(await readyEvidence()),
      digestEurUsdM1GoldenEvidenceReadiness(await readyEvidence()),
    ]);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      kind: "GOLDEN_EVIDENCE_READINESS_DIGEST",
      canonicalization: "JCS_RFC8785",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed without a digest when evidence is rejected", async () => {
    const rejected = await evaluateEurUsdM1GoldenEvidenceReadiness({
      playback: playback(),
      manifest,
      labelSet,
      expectedLabelSetDigest: "0".repeat(64),
    });

    await expect(
      digestEurUsdM1GoldenEvidenceReadiness(rejected),
    ).resolves.toEqual({
      kind: "GOLDEN_EVIDENCE_READINESS_DIGEST_UNAVAILABLE",
      reason: "EVIDENCE_NOT_READY",
      datasetId: "eurusd-m1-local-replay",
      sourceKind: "REPLAY",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("compares a recomputed readiness digest without creating execution authority", async () => {
    const ready = await readyEvidence();
    const digest = await digestEurUsdM1GoldenEvidenceReadiness(ready);
    if (digest.kind !== "GOLDEN_EVIDENCE_READINESS_DIGEST") {
      throw new Error("fixture is not ready");
    }

    await expect(
      verifyEurUsdM1GoldenEvidenceReadinessDigest(ready, digest.sha256),
    ).resolves.toMatchObject({
      kind: "GOLDEN_EVIDENCE_READINESS_DIGEST_VERIFICATION",
      status: "MATCH",
      actualDigest: digest.sha256,
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed for invalid, mismatched, and unavailable readiness evidence", async () => {
    const ready = await readyEvidence();
    const rejected = await evaluateEurUsdM1GoldenEvidenceReadiness({
      playback: playback(),
      manifest,
      labelSet,
      expectedLabelSetDigest: "0".repeat(64),
    });

    await expect(
      verifyEurUsdM1GoldenEvidenceReadinessDigest(ready, "invalid"),
    ).resolves.toMatchObject({ status: "INVALID_EXPECTED_DIGEST" });
    await expect(
      verifyEurUsdM1GoldenEvidenceReadinessDigest(ready, "0".repeat(64)),
    ).resolves.toMatchObject({ status: "MISMATCH" });
    await expect(
      verifyEurUsdM1GoldenEvidenceReadinessDigest(rejected, "0".repeat(64)),
    ).resolves.toMatchObject({
      status: "DIGEST_UNAVAILABLE",
      actualDigest: null,
      executionEligible: false,
    });
  });
});
