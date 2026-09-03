import { describe, expect, it } from "vitest";
import {
  REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS,
  summarizeLocalPaperReadiness,
} from "../src/index.js";

const completeInput = {
  entryDecisionIds: REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS,
  policyRisk: {
    policyContractId: "policy-contract-v1",
    policyEvidenceId: "policy-evidence-v1",
    riskContractId: "risk-contract-v1",
    riskEvidenceId: "risk-evidence-v1",
  },
  preEntry: {
    recordId: "paper-readiness-summary-v1",
    knownRecordIds: [],
    replayEvidenceId: "replay-evidence-v1",
    fixtureEvidenceId: "fixture-evidence-v1",
    auditEvidenceId: "audit-evidence-v1",
    protectiveEvidenceId: "protective-evidence-v1",
    terminalState: "NO_TRADE" as const,
  },
};

describe("local Paper readiness summary", () => {
  it("keeps complete local evidence at no-trade while policy and risk deny", () => {
    const result = summarizeLocalPaperReadiness(completeInput);

    expect(result).toMatchObject({
      status: "NO_TRADE",
      label: "PAPER_LOCAL_ONLY",
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      externalRequestsMade: 0,
      executionEligible: false,
    });
    expect(result.reasons).toEqual([
      "ENTRY_DECISIONS_ACCEPTED",
      "POLICY_RISK_NOT_APPROVED",
      "POLICY_RULES_NOT_APPROVED",
      "RISK_MODEL_NOT_APPROVED",
      "SIMULATED_ENTRY_NOT_IMPLEMENTED",
    ]);
  });

  it("rejects invalid local prerequisites without creating an artifact", () => {
    const result = summarizeLocalPaperReadiness({
      ...completeInput,
      entryDecisionIds: ["paper-expiry-v1", "paper-expiry-v1"],
      preEntry: {
        ...completeInput.preEntry,
        knownRecordIds: ["paper-readiness-summary-v1"],
      },
    });

    expect(result).toMatchObject({
      status: "REJECTED",
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      externalRequestsMade: 0,
      executionEligible: false,
    });
    expect(result.reasons).toContain("DECISION_ID_DUPLICATE");
    expect(result.reasons).toContain("RECORD_ID_DUPLICATE");
  });
});
