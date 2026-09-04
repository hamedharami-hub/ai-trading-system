import { computeCanonicalHash } from "@trade/contracts";
import type { EurUsdM1ReplayObservationBatch } from "./eurusd-m1-replay-observation-batch.js";

export type EurUsdM1ReplayObservationBatchDigest =
  | {
      readonly kind: "OBSERVATION_BATCH_DIGEST_UNAVAILABLE";
      readonly reason: "BATCH_UNAVAILABLE";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "OBSERVATION_BATCH_DIGEST";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly entryCount: number;
      readonly canonicalization: "JCS_RFC8785";
      readonly sha256: string;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

/** Hashes only an admitted immutable batch; no storage or transmission occurs. */
export async function digestEurUsdM1ReplayObservationBatch(
  batch: Readonly<EurUsdM1ReplayObservationBatch>,
): Promise<EurUsdM1ReplayObservationBatchDigest> {
  if (batch.kind !== "OBSERVATION_BATCH") {
    return Object.freeze({
      kind: "OBSERVATION_BATCH_DIGEST_UNAVAILABLE",
      reason: "BATCH_UNAVAILABLE",
      datasetId: batch.datasetId,
      sourceKind: "REPLAY",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }
  return Object.freeze({
    kind: "OBSERVATION_BATCH_DIGEST",
    datasetId: batch.datasetId,
    sourceKind: "REPLAY",
    entryCount: batch.entries.length,
    canonicalization: "JCS_RFC8785",
    sha256: await computeCanonicalHash(batch),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
