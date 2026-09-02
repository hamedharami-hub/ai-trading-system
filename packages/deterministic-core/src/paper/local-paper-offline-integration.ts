import { evaluateLocalPaperIdempotencyAndExpiry } from "./local-paper-idempotency-expiry.js";
import { findLocalPaperSimulationFixture } from "./local-paper-simulation-fixtures.js";

export interface LocalPaperOfflineIntegrationInput {
  readonly fixtureId: string;
  readonly recordId: string;
  readonly knownRecordIds: readonly string[];
  readonly replayAccepted: boolean;
  readonly assumptionsComplete: boolean;
}

export interface LocalPaperOfflineIntegrationResult {
  readonly status: "NO_TRADE" | "REJECTED";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly reasons: readonly string[];
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

/** Combines local fixture/gate evidence; this never creates a trade artifact. */
export function evaluateLocalPaperOfflineIntegration(
  input: Readonly<LocalPaperOfflineIntegrationInput>,
): LocalPaperOfflineIntegrationResult {
  const fixture = findLocalPaperSimulationFixture(input.fixtureId);
  if (fixture === undefined) {
    return Object.freeze({
      status: "REJECTED",
      label: "PAPER_LOCAL_ONLY",
      reasons: Object.freeze(["FIXTURE_UNKNOWN"]),
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      externalRequestsMade: 0,
      executionEligible: false,
    });
  }
  const gate = evaluateLocalPaperIdempotencyAndExpiry({
    recordId: input.recordId,
    knownRecordIds: input.knownRecordIds,
    replayAccepted: input.replayAccepted,
    candidateExpired: fixture.scenario === "EXPIRED",
    assumptionsComplete: input.assumptionsComplete,
  });
  return Object.freeze({
    ...gate,
    reasons: Object.freeze([...gate.reasons, fixture.reason]),
  });
}
