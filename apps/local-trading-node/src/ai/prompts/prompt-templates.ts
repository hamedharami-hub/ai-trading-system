import type { StrategyCandidatePayload, FeatureSnapshotPayload, AnalystProposalPayload, CriticProposalPayload } from '@trade/contracts';

function sanitize(input: string): string {
  return input.replace(/[\r\n\t]/g, ' ').replace(/[<>{}[\]\\]/g, '').trim();
}

export class PromptTemplates {
  public static buildAnalystPrompt(
    candidate: StrategyCandidatePayload,
    snapshot: FeatureSnapshotPayload
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are a strict institutional AI Market Analyst.
Your role is to evaluate trade candidates based strictly on SMC structure and order flow data.
Output MUST be a valid JSON object matching this schema:
{
  "verdict": "FAVORABLE" | "UNFAVORABLE" | "NEUTRAL",
  "confidence": "0.00" to "1.00" (DecimalString),
  "evidence_keys": ["KEY_1", "KEY_2"],
  "notes": "string max 1000 chars"
}`;

    const userPrompt = `Analyst Evaluation Request:
Symbol: ${sanitize(candidate.symbol)}
Side: ${candidate.side}
Grade: ${candidate.grade}
Entry Price: ${candidate.entry_price}
Invalidation Price: ${candidate.invalidation_price}
Target Price: ${candidate.target_price}
Risk/Reward: ${candidate.risk_reward_ratio}
SMC Structure: BOS=${snapshot.smc.bos}, Displacement=${snapshot.smc.displacement}
Order Flow: CVD=${snapshot.order_flow.cvd}, Spread State=${snapshot.order_flow.spread_state}

Provide your structured JSON analysis now.`;

    return { systemPrompt, userPrompt };
  }

  public static buildCriticPrompt(
    candidate: StrategyCandidatePayload,
    snapshot: FeatureSnapshotPayload,
    analyst: AnalystProposalPayload
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are an adversarial AI Risk Critic.
Your role is to actively seek flaw, liquidity traps, and adverse market factors in proposed trade candidates.
Output MUST be a valid JSON object matching this schema:
{
  "verdict": "FAVORABLE" | "UNFAVORABLE" | "NEUTRAL",
  "confidence": "0.00" to "1.00" (DecimalString),
  "evidence_keys": ["RISK_KEY_1", "RISK_KEY_2"],
  "notes": "string max 1000 chars"
}`;

    const userPrompt = `Critic Adversarial Review:
Candidate: ${sanitize(candidate.symbol)} ${candidate.side} (Grade ${candidate.grade})
Analyst Verdict: ${analyst.verdict} (Confidence: ${analyst.confidence})
Analyst Notes: ${sanitize(analyst.notes || 'None')}
Market Spread: ${snapshot.order_flow.spread_state}
Current ATR: ${snapshot.secondary_filters.atr}

Identify any critical flaws or confirm risk safety in structured JSON.`;

    return { systemPrompt, userPrompt };
  }

  public static buildJudgePrompt(
    candidate: StrategyCandidatePayload,
    analyst: AnalystProposalPayload,
    critic: CriticProposalPayload
  ): { systemPrompt: string; userPrompt: string } {
    const systemPrompt = `You are the executive AI Judge.
Synthesize the Analyst thesis and Critic arguments to decide whether the candidate should proceed to deterministic Risk validation.
Output MUST be a valid JSON object matching this schema:
{
  "decision": "APPROVE" | "REJECT" | "REANALYZE",
  "reason": "string max 1000 chars",
  "reanalysis_count": 0
}`;

    const userPrompt = `Judge Synthesis Request:
Symbol: ${sanitize(candidate.symbol)} ${candidate.side}
R:R: ${candidate.risk_reward_ratio}
Analyst Verdict: ${analyst.verdict} (Conf: ${analyst.confidence})
Critic Verdict: ${critic.verdict} (Conf: ${critic.confidence})
Critic Notes: ${sanitize(critic.notes || 'None')}

Deliver your definitive verdict in structured JSON.`;

    return { systemPrompt, userPrompt };
  }
}
