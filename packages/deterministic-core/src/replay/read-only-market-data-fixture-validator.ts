import {
  validateReplaySequence,
  type ReplayObservation,
} from "./sequence-validator.js";

export type ReadOnlyFixtureSourceKind = "MOCK" | "REPLAY";

export interface ReadOnlyMarketDataObservation extends ReplayObservation {
  readonly timestampExchange?: string;
  readonly timestampLocal?: string;
}

export type ReadOnlyMarketDataFixtureStatus = "REPLAY_ONLY_VALID" | "REJECTED";

export interface ReadOnlyMarketDataFixtureInput {
  readonly fixtureId: string;
  readonly sourceKind: ReadOnlyFixtureSourceKind;
  readonly observations: readonly ReadOnlyMarketDataObservation[];
}

export interface ReadOnlyMarketDataFixtureReport {
  readonly fixtureId: string;
  readonly status: ReadOnlyMarketDataFixtureStatus;
  readonly observationCount: number;
  readonly rejectedCount: number;
  readonly rejectionReasons: readonly string[];
  readonly freshnessEvaluated: false;
  readonly requiresFreshnessPolicy: true;
  readonly executionEligible: false;
  readonly orderIntentsCreated: 0;
  readonly executionReportsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly externalRequestsMade: 0;
}

const UTC_MILLISECOND_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isCanonicalUtcMillisecondTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !UTC_MILLISECOND_TIMESTAMP.test(value)) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

/**
 * Validates only committed MOCK/REPLAY fixture evidence. It deliberately does
 * not assess freshness: a provider-specific freshness policy is required
 * before any future live-read-only feed can be considered healthy.
 */
export function validateReadOnlyMarketDataFixture(
  input: Readonly<ReadOnlyMarketDataFixtureInput>,
): ReadOnlyMarketDataFixtureReport {
  if (input.fixtureId.trim().length === 0) {
    throw new Error(
      "Read-only market-data fixture requires a non-empty fixtureId",
    );
  }

  const reasons: string[] = [];
  if (input.sourceKind !== "MOCK" && input.sourceKind !== "REPLAY") {
    reasons.push("UNSUPPORTED_SOURCE_KIND");
  }
  if (input.observations.length === 0) {
    reasons.push("EMPTY_FIXTURE");
  }

  for (const observation of input.observations) {
    if (observation.eventId.trim().length === 0) {
      reasons.push("MISSING_EVENT_ID");
    }
    if (observation.streamId.trim().length === 0) {
      reasons.push("MISSING_STREAM_ID");
    }
    if (!isCanonicalUtcMillisecondTimestamp(observation.timestampExchange)) {
      reasons.push("INVALID_TIMESTAMP_EXCHANGE");
    }
    if (!isCanonicalUtcMillisecondTimestamp(observation.timestampLocal)) {
      reasons.push("INVALID_TIMESTAMP_LOCAL");
    }
  }

  const sequenceValidation = validateReplaySequence(input.observations);
  reasons.push(
    ...sequenceValidation.rejected.map((rejection) => rejection.reason),
  );

  return Object.freeze({
    fixtureId: input.fixtureId,
    status: reasons.length === 0 ? "REPLAY_ONLY_VALID" : "REJECTED",
    observationCount: input.observations.length,
    rejectedCount: reasons.length,
    rejectionReasons: Object.freeze(reasons),
    freshnessEvaluated: false,
    requiresFreshnessPolicy: true,
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}
