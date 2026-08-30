export interface ReplayObservation {
  readonly eventId: string;
  readonly streamId: string;
  readonly sequence?: string;
  readonly receivedIndex: number;
}

export interface ReplayValidation {
  readonly healthy: boolean;
  readonly accepted: readonly ReplayObservation[];
  readonly rejected: readonly {
    observation: ReplayObservation;
    reason: string;
  }[];
}

export function validateReplaySequence(
  observations: readonly ReplayObservation[],
): ReplayValidation {
  const eventIds = new Set<string>();
  const lastSequence = new Map<string, bigint>();
  const accepted: ReplayObservation[] = [];
  const rejected: { observation: ReplayObservation; reason: string }[] = [];

  for (const observation of [...observations].sort(
    (a, b) => a.receivedIndex - b.receivedIndex,
  )) {
    if (eventIds.has(observation.eventId)) {
      rejected.push({ observation, reason: "DUPLICATE_EVENT_ID" });
      continue;
    }
    eventIds.add(observation.eventId);
    if (observation.sequence !== undefined) {
      if (!/^(0|[1-9]\d*)$/.test(observation.sequence)) {
        rejected.push({ observation, reason: "INVALID_SEQUENCE" });
        continue;
      }
      const sequence = BigInt(observation.sequence);
      const prior = lastSequence.get(observation.streamId);
      if (prior !== undefined && sequence !== prior + 1n) {
        rejected.push({
          observation,
          reason: sequence <= prior ? "OUT_OF_ORDER" : "SEQUENCE_GAP",
        });
        continue;
      }
      lastSequence.set(observation.streamId, sequence);
    }
    accepted.push(observation);
  }
  return Object.freeze({
    healthy: rejected.length === 0,
    accepted: Object.freeze(accepted),
    rejected: Object.freeze(rejected),
  });
}
