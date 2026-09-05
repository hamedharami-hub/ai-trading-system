import { verifyEurUsdM1GoldenEvidenceReadinessDigest } from "./eurusd-m1-golden-evidence-readiness-digest-verification.js";
import type { EurUsdM1GoldenEvidenceReadiness } from "./eurusd-m1-golden-evidence-readiness.js";

export type EurUsdM1GoldenEvidenceAuditPackage =
  | {
      readonly kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_UNAVAILABLE";
      readonly reason:
        | "EVIDENCE_NOT_READY"
        | "INVALID_EXPECTED_DIGEST"
        | "READINESS_DIGEST_MISMATCH";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE";
      readonly packageVersion: "eurusd-m1-golden-evidence-audit-package-v1";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly readinessStatus: "GOLDEN_EVIDENCE_READY";
      readonly readinessDigest: string;
      readonly readinessDigestVerificationStatus: "MATCH";
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

/**
 * Assembles only locally recomputed and matching Golden-readiness audit facts.
 * This is an in-memory value; it does not retain, transmit, or act on evidence.
 */
export async function packageEurUsdM1GoldenEvidenceAudit(
  readiness: Readonly<EurUsdM1GoldenEvidenceReadiness>,
  expectedReadinessDigest: string,
): Promise<EurUsdM1GoldenEvidenceAuditPackage> {
  const verification = await verifyEurUsdM1GoldenEvidenceReadinessDigest(
    readiness,
    expectedReadinessDigest,
  );

  if (verification.status !== "MATCH") {
    return Object.freeze({
      kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_UNAVAILABLE",
      reason:
        verification.status === "DIGEST_UNAVAILABLE"
          ? "EVIDENCE_NOT_READY"
          : verification.status === "INVALID_EXPECTED_DIGEST"
            ? "INVALID_EXPECTED_DIGEST"
            : "READINESS_DIGEST_MISMATCH",
      datasetId: readiness.datasetId,
      sourceKind: "REPLAY",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  if (verification.actualDigest === null) {
    return Object.freeze({
      kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_UNAVAILABLE",
      reason: "EVIDENCE_NOT_READY",
      datasetId: readiness.datasetId,
      sourceKind: "REPLAY",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  return Object.freeze({
    kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE",
    packageVersion: "eurusd-m1-golden-evidence-audit-package-v1",
    datasetId: readiness.datasetId,
    sourceKind: "REPLAY",
    readinessStatus: "GOLDEN_EVIDENCE_READY",
    readinessDigest: verification.actualDigest,
    readinessDigestVerificationStatus: "MATCH",
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
