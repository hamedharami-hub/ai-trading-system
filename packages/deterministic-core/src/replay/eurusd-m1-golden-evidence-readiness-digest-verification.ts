import {
  digestEurUsdM1GoldenEvidenceReadiness,
  type EurUsdM1GoldenEvidenceReadinessDigest,
} from "./eurusd-m1-golden-evidence-readiness-digest.js";
import type { EurUsdM1GoldenEvidenceReadiness } from "./eurusd-m1-golden-evidence-readiness.js";

const SHA256 = /^[a-f0-9]{64}$/i;

export interface EurUsdM1GoldenEvidenceReadinessDigestVerification {
  readonly kind: "GOLDEN_EVIDENCE_READINESS_DIGEST_VERIFICATION";
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

/** Recomputes and compares local Golden-readiness evidence without retaining it. */
export async function verifyEurUsdM1GoldenEvidenceReadinessDigest(
  readiness: Readonly<EurUsdM1GoldenEvidenceReadiness>,
  expectedDigest: string,
): Promise<EurUsdM1GoldenEvidenceReadinessDigestVerification> {
  const digest: EurUsdM1GoldenEvidenceReadinessDigest =
    await digestEurUsdM1GoldenEvidenceReadiness(readiness);
  const actualDigest =
    digest.kind === "GOLDEN_EVIDENCE_READINESS_DIGEST" ? digest.sha256 : null;
  const status =
    actualDigest === null
      ? "DIGEST_UNAVAILABLE"
      : !SHA256.test(expectedDigest)
        ? "INVALID_EXPECTED_DIGEST"
        : actualDigest.toLowerCase() === expectedDigest.toLowerCase()
          ? "MATCH"
          : "MISMATCH";
  return Object.freeze({
    kind: "GOLDEN_EVIDENCE_READINESS_DIGEST_VERIFICATION",
    datasetId: readiness.datasetId,
    sourceKind: "REPLAY",
    status,
    actualDigest,
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
