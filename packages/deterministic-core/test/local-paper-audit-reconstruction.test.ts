import { describe, expect, it } from "vitest";

import { reconstructLocalPaperNoTradeAudit } from "../src/paper/local-paper-audit-reconstruction.js";
import type { LocalPaperNoTradeAuditRecord } from "../src/paper/local-paper-no-trade-audit.js";

function record(recordId: string): LocalPaperNoTradeAuditRecord {
  return Object.freeze({
    recordId,
    createdAtUtc: "2025-08-01T00:00:00.000Z",
    replayDatasetId: "historical-eurusd-v1",
    label: "PAPER_LOCAL_ONLY",
    decision: "NO_TRADE",
    reasons: Object.freeze(["SIMULATED_LIFECYCLE_NOT_IMPLEMENTED"]),
    paperRecordsCreated: 0,
    simulatedFillsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}

describe("local Paper audit reconstruction", () => {
  it("reconstructs immutable local no-trade audit evidence", () => {
    const auditRecord = record("audit-1");
    const result = reconstructLocalPaperNoTradeAudit([auditRecord]);

    expect(result.status).toBe("RECONSTRUCTED");
    expect(result.recordIds).toEqual(["audit-1"]);
    expect(result.replayDatasetIds).toEqual(["historical-eurusd-v1"]);
    expect(result.reasons).toEqual([]);
    expect(result.paperRecordsCreated).toBe(0);
    expect(result.simulatedFillsCreated).toBe(0);
    expect(result.positionsCreated).toBe(0);
    expect(result.profitLossCalculated).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("fails closed for empty, duplicate, or structurally invalid records", () => {
    expect(reconstructLocalPaperNoTradeAudit([])).toMatchObject({
      status: "REJECTED",
      reasons: ["AUDIT_LOG_EMPTY"],
    });

    const duplicate = reconstructLocalPaperNoTradeAudit([
      record("audit-1"),
      record("audit-1"),
    ]);
    expect(duplicate.status).toBe("REJECTED");
    expect(duplicate.reasons).toContain("AUDIT_RECORD_ID_DUPLICATE");

    const invalid = reconstructLocalPaperNoTradeAudit([
      Object.freeze({ ...record("audit-2"), replayDatasetId: "" }),
    ]);
    expect(invalid.status).toBe("REJECTED");
    expect(invalid.reasons).toContain("REPLAY_DATASET_LINK_MISSING");
  });
});
