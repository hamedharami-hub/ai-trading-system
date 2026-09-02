import { describe, expect, it } from "vitest";
import { evaluateLocalPaperFailClosedReadiness } from "../src/paper/local-paper-fail-closed-readiness.js";

describe("local Paper fail-closed readiness", () => {
  it("remains no-trade when all local readiness evidence is complete", () => {
    const result = evaluateLocalPaperFailClosedReadiness({
      replayEvidenceId: "replay-v1",
      assumptionEvidenceId: "assumptions-v1",
      protectiveHandlingEvidenceId: "protective-v1",
      reconciliationEvidenceId: "reconcile-v1",
      lifecycleStates: ["DRAFT", "POLICY_ALLOWED", "RISK_APPROVED", "NO_TRADE"],
    });
    expect(result).toMatchObject({
      status: "NO_TRADE",
      label: "PAPER_LOCAL_ONLY",
      reasons: ["SIMULATED_ENTRY_NOT_IMPLEMENTED"],
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      executionEligible: false,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("rejects incomplete, unknown, skipped, and terminal-backwards lifecycle input", () => {
    expect(
      evaluateLocalPaperFailClosedReadiness({
        replayEvidenceId: undefined,
        assumptionEvidenceId: undefined,
        protectiveHandlingEvidenceId: undefined,
        reconciliationEvidenceId: undefined,
        lifecycleStates: [],
      }),
    ).toMatchObject({
      status: "REJECTED",
      reasons: [
        "REPLAY_EVIDENCE_MISSING",
        "ASSUMPTION_EVIDENCE_MISSING",
        "PROTECTIVE_HANDLING_EVIDENCE_MISSING",
        "RECONCILIATION_EVIDENCE_MISSING",
        "LIFECYCLE_EVIDENCE_MISSING",
      ],
    });
    expect(
      evaluateLocalPaperFailClosedReadiness({
        replayEvidenceId: "r",
        assumptionEvidenceId: "a",
        protectiveHandlingEvidenceId: "p",
        reconciliationEvidenceId: "c",
        lifecycleStates: ["DRAFT", "RISK_APPROVED"],
      }).reasons,
    ).toContain("LIFECYCLE_TRANSITION_INVALID");
    expect(
      evaluateLocalPaperFailClosedReadiness({
        replayEvidenceId: "r",
        assumptionEvidenceId: "a",
        protectiveHandlingEvidenceId: "p",
        reconciliationEvidenceId: "c",
        lifecycleStates: ["NO_TRADE", "DRAFT"],
      }).reasons,
    ).toContain("LIFECYCLE_TRANSITION_INVALID");
  });
});
