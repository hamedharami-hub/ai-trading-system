import {
  digestEurUsdM1GoldenEvidenceAuditPackage,
  type EurUsdM1GoldenEvidenceAuditPackageDigest,
} from "./eurusd-m1-golden-evidence-audit-package-digest.js";
import type { EurUsdM1GoldenEvidenceAuditPackage } from "./eurusd-m1-golden-evidence-audit-package.js";

const SHA256 = /^[a-f0-9]{64}$/i;

export interface EurUsdM1GoldenEvidenceAuditPackageDigestVerification {
  readonly kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST_VERIFICATION";
  readonly datasetId: string;
  readonly sourceKind: "REPLAY";
  readonly status:
    | "MATCH"
    | "MISMATCH"
    | "INVALID_EXPECTED_DIGEST"
    | "DIGEST_UNAVAILABLE";
  readonly actualDigest: string | null;
  readonly executionEligible: false;
  readonly strategyCandidatesCreated: 0;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

/** Recomputes and compares an in-memory audit-package digest without retaining it. */
export async function verifyEurUsdM1GoldenEvidenceAuditPackageDigest(
  auditPackage: Readonly<EurUsdM1GoldenEvidenceAuditPackage>,
  expectedDigest: string,
): Promise<EurUsdM1GoldenEvidenceAuditPackageDigestVerification> {
  const digest: EurUsdM1GoldenEvidenceAuditPackageDigest =
    await digestEurUsdM1GoldenEvidenceAuditPackage(auditPackage);
  const actualDigest =
    digest.kind === "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST"
      ? digest.sha256
      : null;
  const status =
    actualDigest === null
      ? "DIGEST_UNAVAILABLE"
      : !SHA256.test(expectedDigest)
        ? "INVALID_EXPECTED_DIGEST"
        : actualDigest.toLowerCase() === expectedDigest.toLowerCase()
          ? "MATCH"
          : "MISMATCH";

  return Object.freeze({
    kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST_VERIFICATION",
    datasetId: auditPackage.datasetId,
    sourceKind: "REPLAY",
    status,
    actualDigest,
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
