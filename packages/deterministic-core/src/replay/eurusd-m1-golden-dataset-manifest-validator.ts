import type { HistoricalReplayPlayback } from "./historical-replay-runner.js";

const MANIFEST_VERSION = "eurusd-m1-golden-manifest-v1";
const SHA256 = /^[a-f0-9]{64}$/i;
const MAX_LABEL_CURSORS = 512;

export interface EurUsdM1GoldenDatasetManifest {
  readonly manifestVersion: typeof MANIFEST_VERSION;
  readonly datasetId: string;
  readonly replaySha256: string;
  readonly instrument: "EURUSD";
  readonly timeframe: "M1";
  readonly sourceKind: "REPLAY";
  readonly ownerLabelSetId: string;
  readonly labeledCursors: readonly number[];
}

export interface EurUsdM1GoldenDatasetManifestInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly manifest: Readonly<EurUsdM1GoldenDatasetManifest>;
}

export interface EurUsdM1GoldenDatasetManifestReport {
  readonly kind: "GOLDEN_MANIFEST_ACCEPTED" | "GOLDEN_MANIFEST_REJECTED";
  readonly datasetId: string;
  readonly sourceKind: "REPLAY";
  readonly rejectionReasons: readonly string[];
  readonly executionEligible: false;
  readonly strategyCandidatesCreated: 0;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

function validCursors(
  cursors: readonly number[],
  candleCount: number,
): boolean {
  return (
    cursors.length > 0 &&
    cursors.length <= MAX_LABEL_CURSORS &&
    cursors.every(
      (cursor, index) =>
        Number.isSafeInteger(cursor) &&
        cursor >= 0 &&
        cursor < candleCount &&
        (index === 0 || cursor > (cursors[index - 1] ?? cursor)),
    )
  );
}

/** Validates only manifest shape/bounds; it never accepts label correctness. */
export function validateEurUsdM1GoldenDatasetManifest(
  input: Readonly<EurUsdM1GoldenDatasetManifestInput>,
): EurUsdM1GoldenDatasetManifestReport {
  const { playback, manifest } = input;
  const reasons: string[] = [];
  if (playback.status !== "REPLAY_READY") reasons.push("REPLAY_REJECTED");
  if (manifest.manifestVersion !== MANIFEST_VERSION)
    reasons.push("INVALID_MANIFEST_VERSION");
  if (
    manifest.datasetId !== playback.datasetId ||
    manifest.datasetId.trim().length === 0
  )
    reasons.push("DATASET_ID_MISMATCH");
  if (!SHA256.test(manifest.replaySha256))
    reasons.push("INVALID_REPLAY_SHA256");
  if (manifest.ownerLabelSetId.trim().length === 0)
    reasons.push("OWNER_LABEL_SET_ID_REQUIRED");
  if (!validCursors(manifest.labeledCursors, playback.candles.length))
    reasons.push("INVALID_LABELED_CURSORS");
  return Object.freeze({
    kind:
      reasons.length === 0
        ? "GOLDEN_MANIFEST_ACCEPTED"
        : "GOLDEN_MANIFEST_REJECTED",
    datasetId: playback.datasetId,
    sourceKind: "REPLAY",
    rejectionReasons: Object.freeze(reasons),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
