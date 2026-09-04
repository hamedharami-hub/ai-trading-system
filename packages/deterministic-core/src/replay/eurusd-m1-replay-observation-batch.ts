import {
  digestEurUsdM1ReplayObservationBundle,
  type EurUsdM1ReplayObservationDigest,
} from "./eurusd-m1-replay-observation-digest.js";
import { collectEurUsdM1ReplayObservationBundle } from "./eurusd-m1-replay-observation-bundle.js";
import type { HistoricalReplayPlayback } from "./historical-replay-runner.js";

const MAX_CURSORS = 64;

export interface EurUsdM1ReplayObservationBatchInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly cursors: readonly number[];
}

export type EurUsdM1ReplayObservationBatch =
  | {
      readonly kind: "OBSERVATION_BATCH_UNAVAILABLE";
      readonly reason:
        | "INVALID_CURSOR_SEQUENCE"
        | "REPLAY_REJECTED"
        | "UNSUPPORTED_SCOPE";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    }
  | {
      readonly kind: "OBSERVATION_BATCH";
      readonly datasetId: string;
      readonly sourceKind: "REPLAY";
      readonly entries: readonly Readonly<{
        readonly cursor: number;
        readonly digest: EurUsdM1ReplayObservationDigest["sha256"];
      }>[];
      readonly executionEligible: false;
      readonly strategyCandidatesCreated: 0;
      readonly orderIntentsCreated: 0;
      readonly externalRequestsMade: 0;
    };

function unavailable(
  datasetId: string,
  reason: Extract<
    EurUsdM1ReplayObservationBatch,
    { kind: "OBSERVATION_BATCH_UNAVAILABLE" }
  >["reason"],
): EurUsdM1ReplayObservationBatch {
  return Object.freeze({
    kind: "OBSERVATION_BATCH_UNAVAILABLE",
    reason,
    datasetId,
    sourceKind: "REPLAY",
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}

function validCursorSequence(cursors: readonly number[]): boolean {
  return (
    cursors.length > 0 &&
    cursors.length <= MAX_CURSORS &&
    cursors.every(
      (cursor, index) =>
        Number.isSafeInteger(cursor) &&
        cursor >= 0 &&
        (index === 0 || cursor > (cursors[index - 1] ?? cursor)),
    )
  );
}

/** Collects digest-only evidence for a bounded, ordered local Replay sequence. */
export async function collectEurUsdM1ReplayObservationBatch(
  input: Readonly<EurUsdM1ReplayObservationBatchInput>,
): Promise<EurUsdM1ReplayObservationBatch> {
  if (input.playback.status !== "REPLAY_READY")
    return unavailable(input.playback.datasetId, "REPLAY_REJECTED");
  if (input.instrument !== "EURUSD" || input.timeframe !== "M1")
    return unavailable(input.playback.datasetId, "UNSUPPORTED_SCOPE");
  if (!validCursorSequence(input.cursors))
    return unavailable(input.playback.datasetId, "INVALID_CURSOR_SEQUENCE");
  const entries = await Promise.all(
    input.cursors.map(async (cursor) => {
      const bundle = collectEurUsdM1ReplayObservationBundle({
        playback: input.playback,
        instrument: input.instrument,
        timeframe: input.timeframe,
        cursor,
      });
      const digest = await digestEurUsdM1ReplayObservationBundle(bundle);
      return Object.freeze({ cursor, digest: digest.sha256 });
    }),
  );
  return Object.freeze({
    kind: "OBSERVATION_BATCH",
    datasetId: input.playback.datasetId,
    sourceKind: "REPLAY",
    entries: Object.freeze(entries),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
