import type { EurUsdM1ReplayObservationBatch } from "./eurusd-m1-replay-observation-batch.js";
import type { EurUsdM1GoldenEvidenceReadiness } from "./eurusd-m1-golden-evidence-readiness.js";
import type { EurUsdM1GoldenDatasetLabelSet } from "./eurusd-m1-golden-label-set-validator.js";

export interface EurUsdM1ObservationGoldenAlignmentInput {
  readonly observationBatch: Readonly<EurUsdM1ReplayObservationBatch>;
  readonly goldenReadiness: Readonly<EurUsdM1GoldenEvidenceReadiness>;
  readonly labelSet: Readonly<EurUsdM1GoldenDatasetLabelSet>;
}

export interface EurUsdM1AlignedEntry {
  readonly cursor: number;
  readonly observationDigest: string;
  readonly labelId: string;
}

export type EurUsdM1ObservationGoldenAlignmentReport =
  | {
      readonly kind: "ALIGNMENT_REJECTED";
      readonly status: "ALIGNMENT_INPUT_REJECTED";
      readonly reasons: readonly string[];
      readonly alignedEntries: readonly EurUsdM1AlignedEntry[];
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "ALIGNMENT_MISMATCH";
      readonly status: "ALIGNMENT_CURSOR_MISMATCH";
      readonly reasons: readonly string[];
      readonly alignedEntries: readonly EurUsdM1AlignedEntry[];
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "ALIGNMENT_MATCH";
      readonly status: "ALIGNMENT_ALIGNED";
      readonly reasons: readonly string[];
      readonly alignedEntries: readonly EurUsdM1AlignedEntry[];
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

/**
 * Deterministically aligns extracted observation evidence bundles with
 * accepted Golden Dataset labels on a per-cursor basis.
 *
 * Fails closed if either evidence source is not ready, or if cursors mismatch.
 * This is an evidence alignment check only and does not infer trading signals,
 * strategy candidates, or execution eligibility.
 */
export function evaluateEurUsdM1ObservationGoldenAlignment(
  input: Readonly<EurUsdM1ObservationGoldenAlignmentInput>,
): EurUsdM1ObservationGoldenAlignmentReport {
  const reasons: string[] = [];

  if (input.observationBatch.kind !== "OBSERVATION_BATCH") {
    reasons.push(
      `OBSERVATION_BATCH_UNAVAILABLE: ${input.observationBatch.reason}`,
    );
  }

  if (input.goldenReadiness.status !== "GOLDEN_EVIDENCE_READY") {
    reasons.push("GOLDEN_EVIDENCE_NOT_READY");
    reasons.push(...input.goldenReadiness.reasons);
  }

  if (reasons.length > 0) {
    return Object.freeze({
      kind: "ALIGNMENT_REJECTED",
      status: "ALIGNMENT_INPUT_REJECTED",
      reasons: Object.freeze(reasons),
      alignedEntries: Object.freeze([]),
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  const batch = input.observationBatch as Extract<
    EurUsdM1ReplayObservationBatch,
    { kind: "OBSERVATION_BATCH" }
  >;
  const labels = input.labelSet.labels;

  if (batch.entries.length !== labels.length) {
    return Object.freeze({
      kind: "ALIGNMENT_MISMATCH",
      status: "ALIGNMENT_CURSOR_MISMATCH",
      reasons: Object.freeze([
        `CURSOR_COUNT_MISMATCH: batch has ${batch.entries.length}, labels have ${labels.length}`,
      ]),
      alignedEntries: Object.freeze([]),
      executionEligible: false,
      strategyCandidatesCreated: 0,
      orderIntentsCreated: 0,
      externalRequestsMade: 0,
    });
  }

  for (let i = 0; i < batch.entries.length; i++) {
    const bEntry = batch.entries[i];
    const lEntry = labels[i];
    if (!bEntry || !lEntry || bEntry.cursor !== lEntry.cursor) {
      return Object.freeze({
        kind: "ALIGNMENT_MISMATCH",
        status: "ALIGNMENT_CURSOR_MISMATCH",
        reasons: Object.freeze([
          `CURSOR_SEQUENCE_MISMATCH: at index ${i}, batch cursor=${bEntry?.cursor} vs label cursor=${lEntry?.cursor}`,
        ]),
        alignedEntries: Object.freeze([]),
        executionEligible: false,
        strategyCandidatesCreated: 0,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    }
  }

  const alignedEntries: EurUsdM1AlignedEntry[] = batch.entries.map(
    (entry, i) => {
      const lEntry = labels[i]!;
      return Object.freeze({
        cursor: entry.cursor,
        observationDigest: entry.digest,
        labelId: lEntry.labelId,
      });
    },
  );

  return Object.freeze({
    kind: "ALIGNMENT_MATCH",
    status: "ALIGNMENT_ALIGNED",
    reasons: Object.freeze([]),
    alignedEntries: Object.freeze(alignedEntries),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
