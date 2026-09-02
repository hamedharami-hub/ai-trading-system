import type { LocalPaperAdmission } from "./local-paper-admission.js";

export interface LocalPaperNoTradeAuditRecord {
  readonly recordId: string;
  readonly createdAtUtc: string;
  readonly replayDatasetId: string;
  readonly label: "PAPER_LOCAL_ONLY";
  readonly decision: "NO_TRADE";
  readonly reasons: readonly string[];
  readonly paperRecordsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

const CANONICAL_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isCanonicalUtcTimestamp(value: string): boolean {
  if (!CANONICAL_UTC_TIMESTAMP.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

/**
 * Materializes immutable audit evidence for a local no-trade decision only.
 * It cannot create a simulated trade, fill, position, P&L, or external action.
 */
export function createLocalPaperNoTradeAuditRecord(
  recordId: string,
  createdAtUtc: string,
  replayDatasetId: string,
  admission: Readonly<LocalPaperAdmission>,
): LocalPaperNoTradeAuditRecord {
  if (recordId.trim().length === 0) {
    throw new Error("Local Paper audit record requires a non-empty recordId");
  }
  if (!isCanonicalUtcTimestamp(createdAtUtc)) {
    throw new Error(
      "Local Paper audit record requires a canonical UTC timestamp",
    );
  }
  if (replayDatasetId.trim().length === 0) {
    throw new Error(
      "Local Paper audit record requires a non-empty Replay dataset ID",
    );
  }
  if (
    admission.status !== "NO_TRADE" ||
    !admission.localOnly ||
    admission.paperRecordsCreated !== 0 ||
    admission.simulatedFillsCreated !== 0 ||
    admission.profitLossCalculated ||
    admission.externalRequestsMade !== 0 ||
    admission.executionEligible ||
    admission.reasons.length === 0
  ) {
    throw new Error("Local Paper admission is not valid no-trade evidence");
  }

  return Object.freeze({
    recordId,
    createdAtUtc,
    replayDatasetId,
    label: "PAPER_LOCAL_ONLY",
    decision: "NO_TRADE",
    reasons: Object.freeze([...admission.reasons]),
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}

/**
 * Returns a new immutable log and rejects duplicate IDs without modifying the
 * supplied log. Persistence is intentionally outside this local-only slice.
 */
export function appendLocalPaperNoTradeAuditRecord(
  records: readonly LocalPaperNoTradeAuditRecord[],
  record: Readonly<LocalPaperNoTradeAuditRecord>,
): readonly LocalPaperNoTradeAuditRecord[] {
  if (
    records.some(
      (existingRecord) => existingRecord.recordId === record.recordId,
    )
  ) {
    throw new Error("Duplicate Local Paper audit record ID");
  }
  return Object.freeze([...records, record]);
}
