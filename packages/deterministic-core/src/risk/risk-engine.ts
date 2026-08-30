import { parseDecimal, toDecimalString } from "@trade/contracts";

export type RiskTier = "A" | "A_PLUS" | "A_PLUS_ELITE";

export interface RiskEvaluationInput {
  readonly tier: RiskTier;
  readonly policyApproved: boolean;
  readonly netRiskReward: string;
  readonly dailyLossPercent: string;
  readonly drawdownPercent: string;
  readonly currentOpenRiskPercent: string;
  readonly correlationOpenRiskPercent: string;
  readonly concurrentPositions: number;
  readonly counterTrend: boolean;
  readonly executionMode:
    | "ANALYSIS_ONLY"
    | "MANUAL_CONFIRM"
    | "CONSTRAINED_AUTO";
  readonly eliteConditionsPassed: boolean;
}

export interface RiskEvaluation {
  readonly approved: boolean;
  readonly approvedRiskPercent: string;
  readonly reasons: readonly string[];
}

const TIER_RISK: Readonly<Record<RiskTier, string>> = Object.freeze({
  A: "0.25",
  A_PLUS: "0.5",
  A_PLUS_ELITE: "0.75",
});

export function evaluateRisk(
  input: Readonly<RiskEvaluationInput>,
): RiskEvaluation {
  const reasons: string[] = [];
  const dailyLoss = parseDecimal(input.dailyLossPercent);
  const drawdown = parseDecimal(input.drawdownPercent);
  const openRisk = parseDecimal(input.currentOpenRiskPercent);
  const correlationRisk = parseDecimal(input.correlationOpenRiskPercent);
  const rr = parseDecimal(input.netRiskReward);

  if (
    [dailyLoss, drawdown, openRisk, correlationRisk, rr].some((value) =>
      value.lt(0),
    )
  )
    reasons.push("INVALID_NEGATIVE_STATE");
  if (
    !Number.isSafeInteger(input.concurrentPositions) ||
    input.concurrentPositions < 0
  )
    reasons.push("INVALID_POSITION_COUNT");
  if (!input.policyApproved) reasons.push("POLICY_REJECTED");
  if (input.executionMode === "ANALYSIS_ONLY") reasons.push("ANALYSIS_ONLY");
  if (dailyLoss.gte("1.5")) reasons.push("DAILY_LOSS_LIMIT");
  if (drawdown.gte("5")) reasons.push("DRAWDOWN_STOP");
  if (input.concurrentPositions >= 3) reasons.push("POSITION_CAP");
  if (rr.lt("1.5")) reasons.push("NET_RR_BELOW_1_5");
  if (input.counterTrend && input.executionMode !== "MANUAL_CONFIRM")
    reasons.push("COUNTER_TREND_REQUIRES_MANUAL");
  if (input.tier === "A_PLUS_ELITE" && !input.eliteConditionsPassed)
    reasons.push("ELITE_CONDITIONS_FAILED");

  let requested = parseDecimal(TIER_RISK[input.tier]);
  if (input.counterTrend) requested = parseDecimal("0.25");
  if (drawdown.gte("3")) requested = requested.div(2);
  if (openRisk.plus(requested).gt("1")) reasons.push("PORTFOLIO_OPEN_RISK_CAP");
  if (correlationRisk.plus(requested).gt("0.5"))
    reasons.push("CORRELATION_GROUP_CAP");

  return Object.freeze({
    approved: reasons.length === 0,
    approvedRiskPercent:
      reasons.length === 0 ? toDecimalString(requested) : "0",
    reasons: Object.freeze(reasons),
  });
}
