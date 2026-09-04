import {
  digestEurUsdM1GoldenLabelSet,
  type EurUsdM1GoldenLabelSetDigest,
} from "./eurusd-m1-golden-label-set-digest.js";
import type { EurUsdM1GoldenLabelSetReport } from "./eurusd-m1-golden-label-set-validator.js";

const SHA256 = /^[a-f0-9]{64}$/i;

export interface EurUsdM1GoldenLabelSetDigestVerification {
  readonly kind: "GOLDEN_LABEL_SET_DIGEST_VERIFICATION";
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

/** Recomputes and compares local Golden-label evidence without retaining it. */
export async function verifyEurUsdM1GoldenLabelSetDigest(
  report: Readonly<EurUsdM1GoldenLabelSetReport>,
  expectedDigest: string,
): Promise<EurUsdM1GoldenLabelSetDigestVerification> {
  const digest: EurUsdM1GoldenLabelSetDigest =
    await digestEurUsdM1GoldenLabelSet(report);
  const actualDigest =
    digest.kind === "GOLDEN_LABEL_SET_DIGEST" ? digest.sha256 : null;
  const status =
    actualDigest === null
      ? "DIGEST_UNAVAILABLE"
      : !SHA256.test(expectedDigest)
        ? "INVALID_EXPECTED_DIGEST"
        : actualDigest.toLowerCase() === expectedDigest.toLowerCase()
          ? "MATCH"
          : "MISMATCH";
  return Object.freeze({
    kind: "GOLDEN_LABEL_SET_DIGEST_VERIFICATION",
    datasetId: report.datasetId,
    sourceKind: "REPLAY",
    status,
    actualDigest,
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
