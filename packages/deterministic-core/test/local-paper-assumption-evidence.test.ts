import { describe, expect, it } from "vitest";

import { evaluateLocalPaperAssumptionEvidence } from "../src/paper/local-paper-assumption-evidence.js";

describe("local Paper assumption evidence", () => {
  it("fails closed and identifies each missing assumption evidence item", () => {
    const result = evaluateLocalPaperAssumptionEvidence({
      costEvidenceId: "costs-v1",
      partialFillEvidenceId: undefined,
      protectiveHandlingEvidenceId: "",
      reconciliationEvidenceId: undefined,
    });

    expect(result.status).toBe("NO_TRADE");
    expect(result.recorded).toEqual({
      costs: true,
      partialFill: false,
      protectiveHandling: false,
      reconciliation: false,
    });
    expect(result.missingReasons).toEqual([
      "PARTIAL_FILL_EVIDENCE_MISSING",
      "PROTECTIVE_HANDLING_EVIDENCE_MISSING",
      "RECONCILIATION_EVIDENCE_MISSING",
    ]);
    expect(result.paperRecordsCreated).toBe(0);
    expect(result.simulatedFillsCreated).toBe(0);
    expect(result.positionsCreated).toBe(0);
    expect(result.profitLossCalculated).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.recorded)).toBe(true);
  });

  it("still remains no-trade when all assumption evidence is present", () => {
    const result = evaluateLocalPaperAssumptionEvidence({
      costEvidenceId: "costs-v1",
      partialFillEvidenceId: "partial-fill-v1",
      protectiveHandlingEvidenceId: "protective-v1",
      reconciliationEvidenceId: "reconciliation-v1",
    });

    expect(result.recorded).toEqual({
      costs: true,
      partialFill: true,
      protectiveHandling: true,
      reconciliation: true,
    });
    expect(result.missingReasons).toEqual([
      "SIMULATED_LIFECYCLE_NOT_IMPLEMENTED",
    ]);
    expect(result.status).toBe("NO_TRADE");
  });
});
