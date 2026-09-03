import {
  evaluateLocalPaperDenyOnlyPolicy,
  type LocalPaperDenyOnlyPolicyResult,
} from "./local-paper-deny-only-policy.js";
import {
  evaluateLocalPaperDenyOnlyRisk,
  type LocalPaperDenyOnlyRiskResult,
} from "./local-paper-deny-only-risk.js";
import {
  evaluateLocalPaperEntryDecisionReadiness,
  type LocalPaperEntryDecisionReadiness,
} from "./local-paper-entry-decision-registry.js";
import {
  evaluateLocalPaperPolicyRiskReadiness,
  type LocalPaperPolicyRiskReadinessResult,
} from "./local-paper-policy-risk-readiness.js";
import {
  evaluateLocalPaperPreEntryBoundary,
  type LocalPaperPreEntryBoundaryInput,
  type LocalPaperPreEntryBoundaryResult,
} from "./local-paper-pre-entry-boundary.js";

export interface LocalPaperReadinessSummaryInput {
  readonly entryDecisionIds: readonly string[];
  readonly policyRisk: Readonly<{
    readonly policyContractId: string | undefined;
    readonly policyEvidenceId: string | undefined;
    readonly riskContractId: string | undefined;
    readonly riskEvidenceId: string | undefined;
  }>;
  readonly preEntry: Readonly<LocalPaperPreEntryBoundaryInput>;
}

export interface LocalPaperReadinessSummary {
  readonly status: "NO_TRADE" | "REJECTED";
  readonly label: "PAPER_LOCAL_ONLY";
  readonly reasons: readonly string[];
  readonly entryDecisions: LocalPaperEntryDecisionReadiness;
  readonly policyRiskReadiness: LocalPaperPolicyRiskReadinessResult;
  readonly policy: LocalPaperDenyOnlyPolicyResult;
  readonly risk: LocalPaperDenyOnlyRiskResult;
  readonly preEntry: LocalPaperPreEntryBoundaryResult;
  readonly orderIntentsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly positionsCreated: 0;
  readonly profitLossCalculated: false;
  readonly externalRequestsMade: 0;
  readonly executionEligible: false;
}

function mergeReasons(
  results: readonly { readonly reasons: readonly string[] }[],
): readonly string[] {
  return Object.freeze([
    ...new Set(results.flatMap((result) => result.reasons)),
  ]);
}

/**
 * Composes every accepted local prerequisite with the deny-only Policy/Risk
 * boundaries. This is evidence aggregation only: it cannot produce an entry,
 * intent, fill, position, P&L, persistence mutation, or external request.
 */
export function summarizeLocalPaperReadiness(
  input: Readonly<LocalPaperReadinessSummaryInput>,
): LocalPaperReadinessSummary {
  const entryDecisions = evaluateLocalPaperEntryDecisionReadiness(
    input.entryDecisionIds,
  );
  const policyRiskReadiness = evaluateLocalPaperPolicyRiskReadiness(
    input.policyRisk,
  );
  const policy = evaluateLocalPaperDenyOnlyPolicy();
  const risk = evaluateLocalPaperDenyOnlyRisk();
  const preEntry = evaluateLocalPaperPreEntryBoundary(input.preEntry);
  const results = [entryDecisions, policyRiskReadiness, policy, risk, preEntry];

  return Object.freeze({
    status: results.some((result) => result.status === "REJECTED")
      ? "REJECTED"
      : "NO_TRADE",
    label: "PAPER_LOCAL_ONLY",
    reasons: mergeReasons(results),
    entryDecisions,
    policyRiskReadiness,
    policy,
    risk,
    preEntry,
    orderIntentsCreated: 0,
    simulatedFillsCreated: 0,
    positionsCreated: 0,
    profitLossCalculated: false,
    externalRequestsMade: 0,
    executionEligible: false,
  });
}
