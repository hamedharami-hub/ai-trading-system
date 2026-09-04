import { canonicalizeJson, computeCanonicalHash } from "@trade/contracts";
import type { EurUsdM1ReplayObservationBundle } from "./eurusd-m1-replay-observation-bundle.js";

export interface EurUsdM1ReplayObservationDigest {
  readonly kind: "OBSERVATION_DIGEST";
  readonly datasetId: string;
  readonly cursor: number;
  readonly sourceKind: "REPLAY";
  readonly canonicalization: "JCS_RFC8785";
  readonly sha256: string;
  readonly executionEligible: false;
  readonly strategyCandidatesCreated: 0;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

/** Hashes an existing immutable evidence bundle; it performs no I/O or action. */
export async function digestEurUsdM1ReplayObservationBundle(
  bundle: Readonly<EurUsdM1ReplayObservationBundle>,
): Promise<EurUsdM1ReplayObservationDigest> {
  // Canonicalize before hashing so a future caller cannot accidentally hash a
  // non-canonical serialization of the same evidence.
  const canonicalBundle = JSON.parse(canonicalizeJson(bundle)) as unknown;
  return Object.freeze({
    kind: "OBSERVATION_DIGEST",
    datasetId: bundle.datasetId,
    cursor: bundle.cursor,
    sourceKind: "REPLAY",
    canonicalization: "JCS_RFC8785",
    sha256: await computeCanonicalHash(canonicalBundle),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
