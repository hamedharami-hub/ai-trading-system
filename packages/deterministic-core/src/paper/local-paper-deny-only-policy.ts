export interface LocalPaperDenyOnlyPolicyResult {
  readonly status: "NO_TRADE";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly policyApproved: false;
  readonly reasons: readonly ["POLICY_RULES_NOT_APPROVED"];
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

/**
 * The local Paper PolicyGate is intentionally deny-only until separate
 * deterministic strategy and risk decisions are accepted.
 */
export function evaluateLocalPaperDenyOnlyPolicy(): LocalPaperDenyOnlyPolicyResult {
  return Object.freeze({
    status: "NO_TRADE",
    label: "PAPER_LOCAL_ONLY",
    policyApproved: false,
    reasons: Object.freeze(["POLICY_RULES_NOT_APPROVED"]) as [
      "POLICY_RULES_NOT_APPROVED",
    ],
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
