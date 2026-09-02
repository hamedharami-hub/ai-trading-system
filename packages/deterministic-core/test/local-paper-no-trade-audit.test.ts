import { describe, expect, it } from "vitest";
import {
  appendLocalPaperNoTradeAuditRecord,
  createLocalPaperNoTradeAuditRecord,
} from "../src/paper/local-paper-no-trade-audit.js";

const ADMISSION = {
  status: "NO_TRADE",
  replayStatus: "REPLAY_READY",
  sourceKind: "REPLAY",
  localOnly: true,
  reasons: ["SIMULATED_LIFECYCLE_NOT_IMPLEMENTED"],
  paperRecordsCreated: 0,
  simulatedFillsCreated: 0,
  profitLossCalculated: false,
  externalRequestsMade: 0,
  executionEligible: false,
} as const;

describe("local Paper no-trade audit", () => {
  it("creates immutable PAPER_LOCAL_ONLY evidence without a trade artifact", () => {
    const record = createLocalPaperNoTradeAuditRecord(
      "paper-local-001",
      "2025-08-01T00:00:00.000Z",
      "eurusd-m1-sample",
      ADMISSION,
    );

    expect(record).toEqual({
      recordId: "paper-local-001",
      createdAtUtc: "2025-08-01T00:00:00.000Z",
      replayDatasetId: "eurusd-m1-sample",
      label: "PAPER_LOCAL_ONLY",
      decision: "NO_TRADE",
      reasons: ["SIMULATED_LIFECYCLE_NOT_IMPLEMENTED"],
      paperRecordsCreated: 0,
      simulatedFillsCreated: 0,
      profitLossCalculated: false,
      externalRequestsMade: 0,
      executionEligible: false,
    });
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.reasons)).toBe(true);
  });

  it("appends immutably and rejects a duplicate local audit ID", () => {
    const record = createLocalPaperNoTradeAuditRecord(
      "paper-local-001",
      "2025-08-01T00:00:00.000Z",
      "eurusd-m1-sample",
      ADMISSION,
    );
    const records = Object.freeze([]);
    const appended = appendLocalPaperNoTradeAuditRecord(records, record);

    expect(records).toEqual([]);
    expect(appended).toEqual([record]);
    expect(Object.isFrozen(appended)).toBe(true);
    expect(() => appendLocalPaperNoTradeAuditRecord(appended, record)).toThrow(
      "Duplicate Local Paper audit record ID",
    );
  });

  it("rejects an invalid timestamp or non-no-trade evidence", () => {
    expect(() =>
      createLocalPaperNoTradeAuditRecord(
        "paper-local-001",
        "2025-08-01T00:00:00Z",
        "eurusd-m1-sample",
        ADMISSION,
      ),
    ).toThrow("Local Paper audit record requires a canonical UTC timestamp");
    expect(() =>
      createLocalPaperNoTradeAuditRecord(
        "paper-local-002",
        "2025-08-01T00:00:00.000Z",
        "eurusd-m1-sample",
        { ...ADMISSION, reasons: [] },
      ),
    ).toThrow("Local Paper admission is not valid no-trade evidence");
  });
});
