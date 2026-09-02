import type { LocalPaperTerminalState } from "./local-paper-lifecycle.js";

export interface LocalPaperSimulatedRecordInput {
  readonly recordId: string;
  readonly replayDatasetId: string;
  readonly fixtureId: string;
  readonly terminalState: LocalPaperTerminalState;
  readonly reasons: readonly string[];
}

export interface LocalPaperSimulatedRecord {
  readonly recordId: string;
  readonly replayDatasetId: string;
  readonly fixtureId: string;
  readonly label: "PAPER_LOCAL_ONLY";
  readonly terminalState: LocalPaperTerminalState;
  readonly reasons: readonly string[];
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

export function createLocalPaperSimulatedRecord(
  input: Readonly<LocalPaperSimulatedRecordInput>,
): LocalPaperSimulatedRecord {
  if (
    input.recordId.trim().length === 0 ||
    input.replayDatasetId.trim().length === 0 ||
    input.fixtureId.trim().length === 0 ||
    input.reasons.length === 0 ||
    input.reasons.some((reason) => reason.trim().length === 0)
  ) {
    throw new Error("Local Paper simulated record requires complete evidence");
  }
  return Object.freeze({
    recordId: input.recordId,
    replayDatasetId: input.replayDatasetId,
    fixtureId: input.fixtureId,
    label: "PAPER_LOCAL_ONLY",
    terminalState: input.terminalState,
    reasons: Object.freeze([...input.reasons]),
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
