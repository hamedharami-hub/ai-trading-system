export type JudgeDecision = "APPROVE" | "REJECT" | "REANALYZE";

export interface PolicyGateInput {
  readonly dataHealth: "GREEN" | "STALE" | "INVALID" | "UNKNOWN";
  readonly sessionPermitted: boolean;
  readonly newsBlackout: boolean;
  readonly candidateValid: boolean;
  readonly candidateExpired: boolean;
  readonly analyticalConflict: boolean;
  readonly judgeRequired: boolean;
  readonly judgeDecision?: JudgeDecision;
}

export interface PolicyGateDecision {
  readonly approved: boolean;
  readonly reasons: readonly string[];
}

export function evaluatePolicyGate(
  input: Readonly<PolicyGateInput>,
): PolicyGateDecision {
  const reasons: string[] = [];
  if (input.dataHealth !== "GREEN") reasons.push(`DATA_${input.dataHealth}`);
  if (!input.sessionPermitted) reasons.push("SESSION_NOT_PERMITTED");
  if (input.newsBlackout) reasons.push("NEWS_BLACKOUT");
  if (!input.candidateValid) reasons.push("CANDIDATE_INVALID");
  if (input.candidateExpired) reasons.push("CANDIDATE_EXPIRED");
  if (input.analyticalConflict && !input.judgeRequired)
    reasons.push("UNRESOLVED_ANALYTICAL_CONFLICT");
  if (input.judgeRequired && input.judgeDecision !== "APPROVE") {
    reasons.push(
      input.judgeDecision === "REANALYZE"
        ? "REANALYSIS_REQUIRED"
        : "ANALYTICAL_APPROVAL_MISSING",
    );
  }
  return Object.freeze({
    approved: reasons.length === 0,
    reasons: Object.freeze(reasons),
  });
}
