import { computeCanonicalHash } from "@trade/contracts";
import type { EurUsdM1GoldenEvidenceReadiness } from "./eurusd-m1-golden-evidence-readiness.js";

export type EurUsdM1GoldenEvidenceReadinessDigest =
  | {
      readonly kind: "GOLDEN_EVIDENCE_READINESS_DIGEST_UNAVAILABLE";
      readonly reason: "EVIDENCE_NOT_READY";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "GOLDEN_EVIDENCE_READINESS_DIGEST";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly canonicalization: "JCS_RFC8785";
      readonly sha256: string;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

/**
 * Produces local audit evidence only after Golden evidence is internally
 * consistent. It neither retains nor interprets readiness inputs.
 */
export async function digestEurUsdM1GoldenEvidenceReadiness(
  readiness: Readonly<EurUsdM1GoldenEvidenceReadiness>,
): Promise<EurUsdM1GoldenEvidenceReadinessDigest> {
  if (readiness.status !== "GOLDEN_EVIDENCE_READY") {
    return Object.freeze({
      kind: "GOLDEN_EVIDENCE_READINESS_DIGEST_UNAVAILABLE",
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
    kind: "GOLDEN_EVIDENCE_READINESS_DIGEST",
    datasetId: readiness.datasetId,
    sourceKind: "REPLAY",
    canonicalization: "JCS_RFC8785",
    sha256: await computeCanonicalHash(readiness),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
