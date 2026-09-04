import {
  digestEurUsdM1ReplayObservationBundle,
  type EurUsdM1ReplayObservationDigest,
} from "./eurusd-m1-replay-observation-digest.js";
import type { EurUsdM1ReplayObservationBundle } from "./eurusd-m1-replay-observation-bundle.js";

const SHA256 = /^[a-f0-9]{64}$/i;

export interface EurUsdM1ReplayObservationDigestVerification {
  readonly kind: "DIGEST_VERIFICATION";
  readonly datasetId: string;
  readonly cursor: number;
  readonly sourceKind: "REPLAY";
  readonly status: "MATCH" | "MISMATCH" | "INVALID_EXPECTED_DIGEST";
  readonly actualDigest: EurUsdM1ReplayObservationDigest["sha256"];
  readonly executionEligible: false;
  readonly strategyCandidatesCreated: 0;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

/** Recomputes and compares an evidence digest without mutating or storing it. */
export async function verifyEurUsdM1ReplayObservationDigest(
  bundle: Readonly<EurUsdM1ReplayObservationBundle>,
  expectedDigest: string,
): Promise<EurUsdM1ReplayObservationDigestVerification> {
  const digest = await digestEurUsdM1ReplayObservationBundle(bundle);
  const status = !SHA256.test(expectedDigest)
    ? "INVALID_EXPECTED_DIGEST"
    : digest.sha256.toLowerCase() === expectedDigest.toLowerCase()
      ? "MATCH"
      : "MISMATCH";
  return Object.freeze({
    kind: "DIGEST_VERIFICATION",
    datasetId: bundle.datasetId,
    cursor: bundle.cursor,
    sourceKind: "REPLAY",
    status,
    actualDigest: digest.sha256,
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
