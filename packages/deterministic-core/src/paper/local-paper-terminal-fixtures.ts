import type { LocalPaperTerminalState } from "./local-paper-lifecycle.js";

export interface LocalPaperTerminalFixture {
  readonly fixtureId: string;
  readonly label: "PAPER_LOCAL_ONLY";
  readonly terminalState: LocalPaperTerminalState;
  readonly replayDatasetId: string;
  readonly assumptionEvidenceId: string;
  readonly reason: string;
  readonly paperRecordsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

const terminalFixtures: readonly LocalPaperTerminalFixture[] = Object.freeze([
  Object.freeze({
    fixtureId: "local-paper-replay-rejected-v1",
    label: "PAPER_LOCAL_ONLY",
    terminalState: "NO_TRADE",
    replayDatasetId: "replay-rejected-evidence-v1",
    assumptionEvidenceId: "assumptions-incomplete-v1",
    reason: "REPLAY_UNAVAILABLE",
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  }),
  Object.freeze({
    fixtureId: "local-paper-cancelled-v1",
    label: "PAPER_LOCAL_ONLY",
    terminalState: "CANCELLED",
    replayDatasetId: "replay-admitted-evidence-v1",
    assumptionEvidenceId: "assumptions-recorded-v1",
    reason: "OWNER_CANCELLED_LOCAL_REVIEW",
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  }),
  Object.freeze({
    fixtureId: "local-paper-rejected-v1",
    label: "PAPER_LOCAL_ONLY",
    terminalState: "REJECTED",
    replayDatasetId: "replay-admitted-evidence-v1",
    assumptionEvidenceId: "assumptions-recorded-v1",
    reason: "UNKNOWN_LIFECYCLE_INPUT",
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  }),
]);

export const LOCAL_PAPER_TERMINAL_FIXTURES = terminalFixtures;

/** Returns immutable local fixture evidence, or no data for an unknown ID. */
export function findLocalPaperTerminalFixture(
  fixtureId: string,
): LocalPaperTerminalFixture | undefined {
  return LOCAL_PAPER_TERMINAL_FIXTURES.find(
    (fixture) => fixture.fixtureId === fixtureId,
  );
}
