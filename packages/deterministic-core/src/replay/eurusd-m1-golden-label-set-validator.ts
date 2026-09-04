import {
  validateEurUsdM1GoldenDatasetManifest,
  type EurUsdM1GoldenDatasetManifest,
} from "./eurusd-m1-golden-dataset-manifest-validator.js";
import type { HistoricalReplayPlayback } from "./historical-replay-runner.js";

export interface EurUsdM1GoldenDatasetLabel {
  readonly cursor: number;
  readonly labelId: string;
}

export interface EurUsdM1GoldenDatasetLabelSet {
  readonly ownerLabelSetId: string;
  readonly labels: readonly EurUsdM1GoldenDatasetLabel[];
}

export interface EurUsdM1GoldenLabelSetInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly manifest: Readonly<EurUsdM1GoldenDatasetManifest>;
  readonly labelSet: Readonly<EurUsdM1GoldenDatasetLabelSet>;
}

export interface EurUsdM1GoldenLabelSetReport {
  readonly kind: "GOLDEN_LABEL_SET_ACCEPTED" | "GOLDEN_LABEL_SET_REJECTED";
  readonly datasetId: string;
  readonly sourceKind: "REPLAY";
  readonly validatedLabelCount: number;
  readonly rejectionReasons: readonly string[];
  readonly executionEligible: false;
  readonly strategyCandidatesCreated: 0;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

function hasOnlyValidUniqueLabelIds(
  labels: readonly EurUsdM1GoldenDatasetLabel[],
): boolean {
  const ids = new Set<string>();
  return labels.every((label) => {
    if (label.labelId.trim().length === 0 || ids.has(label.labelId))
      return false;
    ids.add(label.labelId);
    return true;
  });
}

/**
 * Validates an owner-supplied opaque label set against an admitted local Golden
 * Dataset manifest. It validates only identity and cursor binding; label meaning
 * and market-data correctness remain outside this boundary.
 */
export function validateEurUsdM1GoldenLabelSet(
  input: Readonly<EurUsdM1GoldenLabelSetInput>,
): EurUsdM1GoldenLabelSetReport {
  const { playback, manifest, labelSet } = input;
  const reasons: string[] = [];
  const manifestReport = validateEurUsdM1GoldenDatasetManifest({
    playback,
    manifest,
  });

  if (manifestReport.kind !== "GOLDEN_MANIFEST_ACCEPTED")
    reasons.push("MANIFEST_REJECTED");
  if (labelSet.ownerLabelSetId !== manifest.ownerLabelSetId)
    reasons.push("OWNER_LABEL_SET_ID_MISMATCH");
  if (labelSet.labels.length !== manifest.labeledCursors.length)
    reasons.push("LABEL_COUNT_MISMATCH");
  if (!hasOnlyValidUniqueLabelIds(labelSet.labels))
    reasons.push("INVALID_OR_DUPLICATE_LABEL_ID");
  if (
    labelSet.labels.some(
      (label, index) => label.cursor !== manifest.labeledCursors[index],
    )
  )
    reasons.push("CURSOR_BINDING_MISMATCH");

  return Object.freeze({
    kind:
      reasons.length === 0
        ? "GOLDEN_LABEL_SET_ACCEPTED"
        : "GOLDEN_LABEL_SET_REJECTED",
    datasetId: playback.datasetId,
    sourceKind: "REPLAY",
    validatedLabelCount: reasons.length === 0 ? labelSet.labels.length : 0,
    rejectionReasons: Object.freeze(reasons),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
