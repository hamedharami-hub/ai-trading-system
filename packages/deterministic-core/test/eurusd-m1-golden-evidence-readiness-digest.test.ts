import { describe, expect, it } from "vitest";
import { packageEurUsdM1GoldenEvidenceAudit } from "../src/replay/eurusd-m1-golden-evidence-audit-package.js";
import { digestEurUsdM1GoldenEvidenceAuditPackage } from "../src/replay/eurusd-m1-golden-evidence-audit-package-digest.js";
import { verifyEurUsdM1GoldenEvidenceAuditPackageDigest } from "../src/replay/eurusd-m1-golden-evidence-audit-package-digest-verification.js";
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

  it("packages only matching local readiness audit facts without execution authority", async () => {
    const ready = await readyEvidence();
    const digest = await digestEurUsdM1GoldenEvidenceReadiness(ready);
    if (digest.kind !== "GOLDEN_EVIDENCE_READINESS_DIGEST") {
      throw new Error("fixture is not ready");
    }

    const auditPackage = await packageEurUsdM1GoldenEvidenceAudit(
      ready,
      digest.sha256,
    );

    expect(Object.isFrozen(auditPackage)).toBe(true);
    expect(auditPackage).toEqual({
      kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE",
      packageVersion: "eurusd-m1-golden-evidence-audit-package-v1",
      datasetId: "eurusd-m1-local-replay",
      sourceKind: "REPLAY",
      readinessStatus: "GOLDEN_EVIDENCE_READY",
      readinessDigest: digest.sha256,
      readinessDigestVerificationStatus: "MATCH",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed without digest values for rejected, invalid, or mismatched packages", async () => {
    const ready = await readyEvidence();
    const rejected = await evaluateEurUsdM1GoldenEvidenceReadiness({
      playback: playback(),
      manifest,
      labelSet,
      expectedLabelSetDigest: "0".repeat(64),
    });

    await expect(
      packageEurUsdM1GoldenEvidenceAudit(ready, "invalid"),
    ).resolves.toMatchObject({
      kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_UNAVAILABLE",
      reason: "INVALID_EXPECTED_DIGEST",
      executionEligible: false,
    });
    await expect(
      packageEurUsdM1GoldenEvidenceAudit(ready, "0".repeat(64)),
    ).resolves.toMatchObject({
      kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_UNAVAILABLE",
      reason: "READINESS_DIGEST_MISMATCH",
      executionEligible: false,
    });
    await expect(
      packageEurUsdM1GoldenEvidenceAudit(rejected, "0".repeat(64)),
    ).resolves.toEqual({
      kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_UNAVAILABLE",
      reason: "EVIDENCE_NOT_READY",
      datasetId: "eurusd-m1-local-replay",
      sourceKind: "REPLAY",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("hashes only an accepted local audit package deterministically", async () => {
    const ready = await readyEvidence();
    const readinessDigest = await digestEurUsdM1GoldenEvidenceReadiness(ready);
    if (readinessDigest.kind !== "GOLDEN_EVIDENCE_READINESS_DIGEST") {
      throw new Error("fixture is not ready");
    }
    const auditPackage = await packageEurUsdM1GoldenEvidenceAudit(
      ready,
      readinessDigest.sha256,
    );

    const [first, second] = await Promise.all([
      digestEurUsdM1GoldenEvidenceAuditPackage(auditPackage),
      digestEurUsdM1GoldenEvidenceAuditPackage(auditPackage),
    ]);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST",
      canonicalization: "JCS_RFC8785",
      sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed without a digest for an unavailable audit package", async () => {
    const unavailable = await packageEurUsdM1GoldenEvidenceAudit(
      await readyEvidence(),
      "invalid",
    );

    await expect(
      digestEurUsdM1GoldenEvidenceAuditPackage(unavailable),
    ).resolves.toEqual({
      kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST_UNAVAILABLE",
      reason: "AUDIT_PACKAGE_UNAVAILABLE",
      datasetId: "eurusd-m1-local-replay",
      sourceKind: "REPLAY",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("verifies an audit-package digest without creating execution authority", async () => {
    const ready = await readyEvidence();
    const readinessDigest = await digestEurUsdM1GoldenEvidenceReadiness(ready);
    if (readinessDigest.kind !== "GOLDEN_EVIDENCE_READINESS_DIGEST") {
      throw new Error("fixture is not ready");
    }
    const auditPackage = await packageEurUsdM1GoldenEvidenceAudit(
      ready,
      readinessDigest.sha256,
    );
    const digest = await digestEurUsdM1GoldenEvidenceAuditPackage(auditPackage);
    if (digest.kind !== "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST") {
      throw new Error("fixture package is unavailable");
    }

    await expect(
      verifyEurUsdM1GoldenEvidenceAuditPackageDigest(
        auditPackage,
        digest.sha256,
      ),
    ).resolves.toMatchObject({
      status: "MATCH",
      actualDigest: digest.sha256,
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
    await expect(
      verifyEurUsdM1GoldenEvidenceAuditPackageDigest(auditPackage, "invalid"),
    ).resolves.toMatchObject({ status: "INVALID_EXPECTED_DIGEST" });
    await expect(
      verifyEurUsdM1GoldenEvidenceAuditPackageDigest(
        auditPackage,
        "0".repeat(64),
      ),
    ).resolves.toMatchObject({ status: "MISMATCH" });
    const unavailable = await packageEurUsdM1GoldenEvidenceAudit(
      ready,
      "invalid",
    );
    await expect(
      verifyEurUsdM1GoldenEvidenceAuditPackageDigest(
        unavailable,
        "0".repeat(64),
      ),
    ).resolves.toMatchObject({
      status: "DIGEST_UNAVAILABLE",
      actualDigest: null,
      executionEligible: false,
    });
  });
});
