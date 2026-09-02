import type { LocalPaperSimulatedRecord } from "./local-paper-simulated-record.js";

export interface LocalPaperSimulatedAuditRecord {
  readonly auditId: string;
  readonly simulatedRecordId: string;
  readonly replayDatasetId: string;
  readonly fixtureId: string;
  readonly label: "PAPER_LOCAL_ONLY";
  readonly terminalState: LocalPaperSimulatedRecord["terminalState"];
  readonly reasons: readonly string[];
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

export function createLocalPaperSimulatedAuditRecord(
  auditId: string,
  record: Readonly<LocalPaperSimulatedRecord>,
): LocalPaperSimulatedAuditRecord {
  if (auditId.trim().length === 0) {
    throw new Error("Local Paper simulated audit requires an audit ID");
  }
  return Object.freeze({
    auditId,
    simulatedRecordId: record.recordId,
    replayDatasetId: record.replayDatasetId,
    fixtureId: record.fixtureId,
    label: "PAPER_LOCAL_ONLY",
    terminalState: record.terminalState,
    reasons: Object.freeze([...record.reasons]),
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}

export function appendLocalPaperSimulatedAuditRecord(
  records: readonly LocalPaperSimulatedAuditRecord[],
  record: Readonly<LocalPaperSimulatedAuditRecord>,
): readonly LocalPaperSimulatedAuditRecord[] {
  if (records.some((existing) => existing.auditId === record.auditId)) {
    throw new Error("Duplicate Local Paper simulated audit ID");
  }
  return Object.freeze([...records, record]);
}

export function reconstructLocalPaperSimulatedAudit(
  records: readonly LocalPaperSimulatedAuditRecord[],
): "RECONSTRUCTED" | "REJECTED" {
  if (
    records.length === 0 ||
    new Set(records.map((record) => record.auditId)).size !== records.length
  ) {
    return "REJECTED";
  }
  return records.every(
    (record) =>
      record.auditId.trim().length > 0 &&
      record.simulatedRecordId.trim().length > 0 &&
      record.replayDatasetId.trim().length > 0 &&
      record.fixtureId.trim().length > 0 &&
      record.label === "PAPER_LOCAL_ONLY" &&
      record.reasons.length > 0 &&
      record.orderIntentsCreated === 0 &&
      record.simulatedFillsCreated === 0 &&
      record.positionsCreated === 0 &&
      !record.profitLossCalculated &&
      record.externalRequestsMade === 0 &&
      !record.executionEligible,
  )
    ? "RECONSTRUCTED"
    : "REJECTED";
}
