import type { LocalPaperTerminalState } from "./local-paper-lifecycle.js";

export type LocalPaperFixtureScenario =
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "DUPLICATE"
  | "CANCELLED"
  | "UNKNOWN";

export interface LocalPaperSimulationFixture {
  readonly fixtureId: string;
  readonly scenario: LocalPaperFixtureScenario;
  readonly label: "PAPER_LOCAL_ONLY";
  readonly replayDatasetId: string;
  readonly assumptionEvidenceId: string;
  readonly terminalState: LocalPaperTerminalState;
  readonly reason: string;
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

function fixture(
  fixtureId: string,
  scenario: LocalPaperFixtureScenario,
  terminalState: LocalPaperTerminalState,
  reason: string,
): LocalPaperSimulationFixture {
  return Object.freeze({
    fixtureId,
    scenario,
    label: "PAPER_LOCAL_ONLY",
    replayDatasetId: "historical-replay-evidence-v1",
    assumptionEvidenceId: "local-assumptions-evidence-v1",
    terminalState,
    reason,
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}

export const LOCAL_PAPER_SIMULATION_FIXTURES: readonly LocalPaperSimulationFixture[] =
  Object.freeze([
    fixture(
      "paper-accepted-v1",
      "ACCEPTED",
      "NO_TRADE",
      "SIMULATED_ENTRY_NOT_IMPLEMENTED",
    ),
    fixture(
      "paper-rejected-v1",
      "REJECTED",
      "REJECTED",
      "POLICY_OR_RISK_REJECTED",
    ),
    fixture("paper-expired-v1", "EXPIRED", "NO_TRADE", "CANDIDATE_EXPIRED"),
    fixture(
      "paper-duplicate-v1",
      "DUPLICATE",
      "REJECTED",
      "RECORD_ID_DUPLICATE",
    ),
    fixture(
      "paper-cancelled-v1",
      "CANCELLED",
      "CANCELLED",
      "OWNER_CANCELLED_LOCAL_REVIEW",
    ),
    fixture(
      "paper-unknown-v1",
      "UNKNOWN",
      "REJECTED",
      "UNKNOWN_LIFECYCLE_INPUT",
    ),
  ]);

export function findLocalPaperSimulationFixture(
  fixtureId: string,
): LocalPaperSimulationFixture | undefined {
  return LOCAL_PAPER_SIMULATION_FIXTURES.find(
    (fixture) => fixture.fixtureId === fixtureId,
  );
}
