import {
  validateReplaySequence,
  type ReplayObservation,
} from "./sequence-validator.js";

export type OfflineReplayStatus = "VALID" | "INVALID";

export interface OfflineReplayInput {
  readonly replayId: string;
  readonly observations: readonly ReplayObservation[];
}

export interface OfflineReplayReport {
  readonly replayId: string;
  readonly status: OfflineReplayStatus;
  readonly observationCount: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly rejectionReasons: readonly string[];
  readonly orderIntentsCreated: 0;
  readonly executionReportsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly externalRequestsMade: 0;
}

export function runOfflineReplay(
  input: Readonly<OfflineReplayInput>,
): OfflineReplayReport {
  if (input.replayId.trim().length === 0) {
    throw new Error("Offline replay requires a non-empty replayId");
  }

  const validation = validateReplaySequence(input.observations);

  return Object.freeze({
    replayId: input.replayId,
    status: validation.healthy ? "VALID" : "INVALID",
    observationCount: input.observations.length,
    acceptedCount: validation.accepted.length,
    rejectedCount: validation.rejected.length,
    rejectionReasons: Object.freeze(
      validation.rejected.map((rejection) => rejection.reason),
    ),
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}
