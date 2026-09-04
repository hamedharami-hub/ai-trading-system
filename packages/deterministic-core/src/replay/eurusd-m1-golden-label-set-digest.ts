import { computeCanonicalHash } from "@trade/contracts";
import type { EurUsdM1GoldenLabelSetReport } from "./eurusd-m1-golden-label-set-validator.js";

export type EurUsdM1GoldenLabelSetDigest =
  | {
      readonly kind: "GOLDEN_LABEL_SET_DIGEST_UNAVAILABLE";
      readonly reason: "LABEL_SET_REJECTED";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "GOLDEN_LABEL_SET_DIGEST";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly labelCount: number;
      readonly canonicalization: "JCS_RFC8785";
      readonly sha256: string;
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

/**
 * Produces a local audit digest only after label identity and cursor binding have
 * already passed. It neither stores nor interprets a label set.
 */
export async function digestEurUsdM1GoldenLabelSet(
  report: Readonly<EurUsdM1GoldenLabelSetReport>,
): Promise<EurUsdM1GoldenLabelSetDigest> {
  if (report.kind !== "GOLDEN_LABEL_SET_ACCEPTED") {
    return Object.freeze({
      kind: "GOLDEN_LABEL_SET_DIGEST_UNAVAILABLE",
      reason: "LABEL_SET_REJECTED",
      datasetId: report.datasetId,
      sourceKind: "REPLAY",
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  return Object.freeze({
    kind: "GOLDEN_LABEL_SET_DIGEST",
    datasetId: report.datasetId,
    sourceKind: "REPLAY",
    labelCount: report.validatedLabelCount,
    canonicalization: "JCS_RFC8785",
    sha256: await computeCanonicalHash(report),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
