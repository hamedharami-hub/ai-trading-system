export interface LocalPaperDenyOnlyRiskResult {
  readonly status: "NO_TRADE";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly riskApproved: false;
  readonly reasons: readonly ["RISK_MODEL_NOT_APPROVED"];
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

/** The local Paper risk boundary cannot calculate or approve risk yet. */
export function evaluateLocalPaperDenyOnlyRisk(): LocalPaperDenyOnlyRiskResult {
  return Object.freeze({
    status: "NO_TRADE",
    label: "PAPER_LOCAL_ONLY",
    riskApproved: false,
    reasons: Object.freeze(["RISK_MODEL_NOT_APPROVED"]) as [
      "RISK_MODEL_NOT_APPROVED",
    ],
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
