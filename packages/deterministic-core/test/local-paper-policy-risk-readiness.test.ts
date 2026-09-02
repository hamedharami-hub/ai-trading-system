import { describe, expect, it } from "vitest";
import { evaluateLocalPaperPolicyRiskReadiness } from "../src/paper/local-paper-policy-risk-readiness.js";

describe("local Paper policy/risk readiness", () => {
  it("stays no-trade with complete but unapproved local readiness", () => {
    expect(
      evaluateLocalPaperPolicyRiskReadiness({
        policyContractId: "policy-v1",
        policyEvidenceId: "policy-evidence-v1",
        riskContractId: "risk-v1",
        riskEvidenceId: "risk-evidence-v1",
      }),
    ).toMatchObject({
      status: "NO_TRADE",
      label: "PAPER_LOCAL_ONLY",
      reasons: ["POLICY_RISK_NOT_APPROVED"],
      policyApproved: false,
      riskApproved: false,
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      executionEligible: false,
    });
  });

  it("rejects missing policy/risk contracts and evidence", () => {
    expect(
      evaluateLocalPaperPolicyRiskReadiness({
        policyContractId: undefined,
        policyEvidenceId: "",
        riskContractId: undefined,
        riskEvidenceId: undefined,
      }),
    ).toMatchObject({
      status: "REJECTED",
      reasons: [
        "POLICY_CONTRACT_MISSING",
        "POLICY_EVIDENCE_MISSING",
        "RISK_CONTRACT_MISSING",
        "RISK_EVIDENCE_MISSING",
      ],
    });
  });
});
