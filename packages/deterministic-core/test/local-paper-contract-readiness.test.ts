import { describe, expect, it } from "vitest";
import { evaluateLocalPaperContractReadiness } from "../src/paper/local-paper-contract-readiness.js";

const complete = {
  schemaVersion: "paper-contract-v1",
  lifecycleContractId: "lifecycle-v1",
  expiryContractId: "expiry-v1",
  idempotencyContractId: "idempotency-v1",
  protectiveHandlingContractId: "protective-v1",
  reconciliationContractId: "reconciliation-v1",
  evidenceContractId: "evidence-v1",
};

describe("local Paper contract readiness", () => {
  it("keeps a complete contract sequence at no-trade", () => {
    expect(
      evaluateLocalPaperContractReadiness({
        ...complete,
        lifecycleSequence: [
          "DRAFT",
          "POLICY_ALLOWED",
          "RISK_APPROVED",
          "INTENT_CREATED",
        ],
      }),
    ).toMatchObject({
      status: "NO_TRADE",
      label: "PAPER_LOCAL_ONLY",
      reasons: ["SIMULATED_ENTRY_NOT_IMPLEMENTED"],
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      executionEligible: false,
    });
  });

  it("fails closed for incomplete, unknown, skipped, and terminal-reversal contracts", () => {
    expect(
      evaluateLocalPaperContractReadiness({
        ...complete,
        lifecycleContractId: undefined,
        lifecycleSequence: [],
      }),
    ).toMatchObject({
      status: "REJECTED",
      reasons: ["LIFECYCLE_CONTRACT_MISSING", "LIFECYCLE_SEQUENCE_MISSING"],
    });
    expect(
      evaluateLocalPaperContractReadiness({
        ...complete,
        lifecycleSequence: ["DRAFT", "RISK_APPROVED"],
      }).reasons,
    ).toContain("LIFECYCLE_SEQUENCE_INVALID");
    expect(
      evaluateLocalPaperContractReadiness({
        ...complete,
        lifecycleSequence: ["NO_TRADE", "DRAFT"],
      }).reasons,
    ).toContain("LIFECYCLE_SEQUENCE_INVALID");
    expect(
      evaluateLocalPaperContractReadiness({
        ...complete,
        lifecycleSequence: ["UNKNOWN"],
      }).reasons,
    ).toContain("LIFECYCLE_STATE_UNKNOWN");
  });
});
