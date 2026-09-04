import {
  validateEurUsdM1GoldenDatasetManifest,
  type EurUsdM1GoldenDatasetManifest,
  type EurUsdM1GoldenDatasetManifestReport,
} from "./eurusd-m1-golden-dataset-manifest-validator.js";
import {
  verifyEurUsdM1GoldenLabelSetDigest,
  type EurUsdM1GoldenLabelSetDigestVerification,
} from "./eurusd-m1-golden-label-set-digest-verification.js";
import {
  validateEurUsdM1GoldenLabelSet,
  type EurUsdM1GoldenDatasetLabelSet,
  type EurUsdM1GoldenLabelSetReport,
} from "./eurusd-m1-golden-label-set-validator.js";
import type { HistoricalReplayPlayback } from "./historical-replay-runner.js";

export interface EurUsdM1GoldenEvidenceReadinessInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly manifest: Readonly<EurUsdM1GoldenDatasetManifest>;
  readonly labelSet: Readonly<EurUsdM1GoldenDatasetLabelSet>;
  readonly expectedLabelSetDigest: string;
}

export interface EurUsdM1GoldenEvidenceReadiness {
  readonly status: "GOLDEN_EVIDENCE_READY" | "GOLDEN_EVIDENCE_REJECTED";
  readonly datasetId: string;
  readonly sourceKind: "REPLAY";
  readonly reasons: readonly string[];
  readonly manifest: EurUsdM1GoldenDatasetManifestReport;
  readonly labelSet: EurUsdM1GoldenLabelSetReport;
  readonly digestVerification: EurUsdM1GoldenLabelSetDigestVerification;
  readonly executionEligible: false;
  readonly strategyCandidatesCreated: 0;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

/**
 * Aggregates caller-owned Golden evidence checks only. "READY" means evidence
 * binding is internally consistent, never that data is suitable for a strategy,
 * Paper/Demo, or execution.
 */
export async function evaluateEurUsdM1GoldenEvidenceReadiness(
  input: Readonly<EurUsdM1GoldenEvidenceReadinessInput>,
): Promise<EurUsdM1GoldenEvidenceReadiness> {
  const manifest = validateEurUsdM1GoldenDatasetManifest({
    playback: input.playback,
    manifest: input.manifest,
  });
  const labelSet = validateEurUsdM1GoldenLabelSet({
    playback: input.playback,
    manifest: input.manifest,
    labelSet: input.labelSet,
  });
  const digestVerification = await verifyEurUsdM1GoldenLabelSetDigest(
    labelSet,
    input.expectedLabelSetDigest,
  );
  const reasons = Object.freeze([
    ...manifest.rejectionReasons,
    ...labelSet.rejectionReasons,
    digestVerification.status,
  ]);
  const accepted =
    manifest.kind === "GOLDEN_MANIFEST_ACCEPTED" &&
    labelSet.kind === "GOLDEN_LABEL_SET_ACCEPTED" &&
    digestVerification.status === "MATCH";
  return Object.freeze({
    status: accepted ? "GOLDEN_EVIDENCE_READY" : "GOLDEN_EVIDENCE_REJECTED",
    datasetId: input.playback.datasetId,
    sourceKind: "REPLAY",
    reasons,
    manifest,
    labelSet,
    digestVerification,
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
