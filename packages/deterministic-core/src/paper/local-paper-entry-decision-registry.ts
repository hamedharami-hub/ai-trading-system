export const REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS = Object.freeze([
  "paper-expiry-v1",
  "paper-idempotency-v1",
  "paper-protective-v1",
  "paper-reconciliation-v1",
  "paper-evidence-v1",
] as const);

export type LocalPaperEntryDecisionId =
  (typeof REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS)[number];

export interface LocalPaperEntryDecisionReadiness {
  readonly status: "NO_TRADE" | "REJECTED";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly reasons: readonly string[];
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

/**
 * These decision identifiers are accepted only as local, non-executable
 * prerequisites. They cannot approve policy/risk or authorize a Paper entry.
 */
export function evaluateLocalPaperEntryDecisionReadiness(
  suppliedDecisionIds: readonly string[],
): LocalPaperEntryDecisionReadiness {
  const reasons: string[] = [];
  const supplied = new Set(suppliedDecisionIds);
  if (supplied.size !== suppliedDecisionIds.length)
    reasons.push("DECISION_ID_DUPLICATE");
  for (const id of suppliedDecisionIds) {
    if (
      !REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS.includes(
        id as LocalPaperEntryDecisionId,
      )
    ) {
      reasons.push("DECISION_ID_UNKNOWN");
    }
  }
  for (const requiredId of REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS) {
    if (!supplied.has(requiredId)) reasons.push("DECISION_ID_MISSING");
  }
  if (reasons.length === 0) reasons.push("ENTRY_DECISIONS_ACCEPTED");
  return Object.freeze({
    status: reasons.some(
      (reason) =>
        reason === "DECISION_ID_DUPLICATE" || reason === "DECISION_ID_UNKNOWN",
    )
      ? "REJECTED"
      : "NO_TRADE",
    label: "PAPER_LOCAL_ONLY",
    reasons: Object.freeze(reasons),
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
