import type { LocalPaperNoTradeAuditRecord } from "./local-paper-no-trade-audit.js";

export interface LocalPaperAuditReconstruction {
  readonly status: "RECONSTRUCTED" | "REJECTED";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly recordIds: readonly string[];
  readonly replayDatasetIds: readonly string[];
  readonly reasons: readonly string[];
  readonly paperRecordsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
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
 * Verifies an in-memory local no-trade audit log without storing, appending, or
 * advancing any lifecycle state. Invalid evidence is rejected fail-closed.
 */
export function reconstructLocalPaperNoTradeAudit(
  records: readonly LocalPaperNoTradeAuditRecord[],
): LocalPaperAuditReconstruction {
  const reasons: string[] = [];
  const recordIds = records.map((record) => record.recordId);
  const replayDatasetIds = records.map((record) => record.replayDatasetId);

  if (records.length === 0) {
    reasons.push("AUDIT_LOG_EMPTY");
  }
  for (const record of records) {
    if (record.recordId.trim().length === 0) {
      reasons.push("AUDIT_RECORD_ID_MISSING");
    }
    if (!isCanonicalUtcTimestamp(record.createdAtUtc)) {
      reasons.push("AUDIT_TIMESTAMP_INVALID");
    }
    if (record.replayDatasetId.trim().length === 0) {
      reasons.push("REPLAY_DATASET_LINK_MISSING");
    }
    if (
      record.label !== "PAPER_LOCAL_ONLY" ||
      record.decision !== "NO_TRADE" ||
      record.reasons.length === 0 ||
      record.paperRecordsCreated !== 0 ||
      record.simulatedFillsCreated !== 0 ||
      record.profitLossCalculated ||
      record.externalRequestsMade !== 0 ||
      record.executionEligible
    ) {
      reasons.push("AUDIT_RECORD_NOT_LOCAL_NO_TRADE");
    }
  }
  if (new Set(recordIds).size !== recordIds.length) {
    reasons.push("AUDIT_RECORD_ID_DUPLICATE");
  }

  return Object.freeze({
    status: reasons.length === 0 ? "RECONSTRUCTED" : "REJECTED",
    label: "PAPER_LOCAL_ONLY",
    recordIds: Object.freeze([...recordIds]),
    replayDatasetIds: Object.freeze([...replayDatasetIds]),
    reasons: Object.freeze(reasons),
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
