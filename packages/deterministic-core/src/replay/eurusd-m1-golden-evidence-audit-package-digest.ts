import { computeCanonicalHash } from "@trade/contracts";
import type { EurUsdM1GoldenEvidenceAuditPackage } from "./eurusd-m1-golden-evidence-audit-package.js";

export type EurUsdM1GoldenEvidenceAuditPackageDigest =
  | {
      readonly kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST_UNAVAILABLE";
      readonly reason: "AUDIT_PACKAGE_UNAVAILABLE";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly canonicalization: "JCS_RFC8785";
      readonly sha256: string;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

/** Hashes only an accepted in-memory audit package; no storage or transmission occurs. */
export async function digestEurUsdM1GoldenEvidenceAuditPackage(
  auditPackage: Readonly<EurUsdM1GoldenEvidenceAuditPackage>,
): Promise<EurUsdM1GoldenEvidenceAuditPackageDigest> {
  if (auditPackage.kind !== "GOLDEN_EVIDENCE_AUDIT_PACKAGE") {
    return Object.freeze({
      kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST_UNAVAILABLE",
      reason: "AUDIT_PACKAGE_UNAVAILABLE",
      datasetId: auditPackage.datasetId,
      sourceKind: "REPLAY",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  return Object.freeze({
    kind: "GOLDEN_EVIDENCE_AUDIT_PACKAGE_DIGEST",
    datasetId: auditPackage.datasetId,
    sourceKind: "REPLAY",
    canonicalization: "JCS_RFC8785",
    sha256: await computeCanonicalHash(auditPackage),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
