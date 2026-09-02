export interface LocalPaperPolicyRiskReadinessInput {
  readonly policyContractId: string | undefined;
  readonly policyEvidenceId: string | undefined;
  readonly riskContractId: string | undefined;
  readonly riskEvidenceId: string | undefined;
}

export interface LocalPaperPolicyRiskReadinessResult {
  readonly status: "NO_TRADE" | "REJECTED";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly reasons: readonly string[];
  readonly policyApproved: false;
  readonly riskApproved: false;
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

function hasId(value: string | undefined): boolean {
  return value !== undefined && value.trim().length > 0;
}

/** Validates only local evidence presence; it cannot approve policy or risk. */
export function evaluateLocalPaperPolicyRiskReadiness(
  input: Readonly<LocalPaperPolicyRiskReadinessInput>,
): LocalPaperPolicyRiskReadinessResult {
  const reasons: string[] = [];
  if (!hasId(input.policyContractId)) reasons.push("POLICY_CONTRACT_MISSING");
  if (!hasId(input.policyEvidenceId)) reasons.push("POLICY_EVIDENCE_MISSING");
  if (!hasId(input.riskContractId)) reasons.push("RISK_CONTRACT_MISSING");
  if (!hasId(input.riskEvidenceId)) reasons.push("RISK_EVIDENCE_MISSING");
  if (reasons.length === 0) reasons.push("POLICY_RISK_NOT_APPROVED");
  return Object.freeze({
    status: reasons.some((reason) => reason.endsWith("_MISSING"))
      ? "REJECTED"
      : "NO_TRADE",
    label: "PAPER_LOCAL_ONLY",
    reasons: Object.freeze(reasons),
    policyApproved: false,
    riskApproved: false,
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
