import {
  canonicalizeJson,
  parseDecimal,
  validatePayload,
  type AnalystProposalPayload,
  type CriticProposalPayload,
  type JudgeDecisionPayload,
  type PostTradeAuditReportPayload,
  type StrategyCandidatePayload,
} from "@trade/contracts";
import type { OfflineAiRuntime } from "../runtime/runtime.js";

type ProposalFragment = Pick<
  AnalystProposalPayload,
  "verdict" | "confidence" | "evidence_keys" | "notes"
>;

const PROPOSAL_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["verdict", "confidence", "evidence_keys"],
  properties: {
    verdict: { type: "string", enum: ["FAVORABLE", "UNFAVORABLE", "NEUTRAL"] },
    confidence: { type: "string", pattern: "^(0|0\\.\\d+|1(?:\\.0+)?)$" },
    evidence_keys: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      uniqueItems: true,
      items: { type: "string", minLength: 1, maxLength: 120 },
    },
    notes: { type: "string", maxLength: 1_000 },
  },
});

const JUDGE_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["decision", "reason"],
  properties: {
    decision: { type: "string", enum: ["APPROVE", "REJECT", "REANALYZE"] },
    reason: { type: "string", minLength: 1, maxLength: 1_000 },
  },
});

const AUDITOR_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["observations", "comparisons"],
  properties: {
    observations: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: { type: "string", minLength: 1, maxLength: 500 },
    },
    comparisons: {
      type: "array",
      maxItems: 20,
      items: { type: "string", minLength: 1, maxLength: 500 },
    },
  },
});

export interface CouncilEvidence {
  readonly candidate: Readonly<StrategyCandidatePayload>;
  readonly evidence: Readonly<Record<string, unknown>>;
  readonly evidenceKeys: readonly string[];
  readonly evaluatedAt: string;
  readonly reanalysisCount: 0 | 1;
}

export interface CouncilResult {
  readonly analyst: Readonly<AnalystProposalPayload>;
  readonly critic: Readonly<CriticProposalPayload>;
  readonly judge?: Readonly<JudgeDecisionPayload>;
  readonly analyticalApproval: boolean;
}

export class OfflineAiCouncil {
  constructor(private readonly runtime: OfflineAiRuntime) {}

  async analyze(input: Readonly<CouncilEvidence>): Promise<CouncilResult> {
    const evidenceJson = canonicalizeJson({
      candidate: input.candidate,
      evidence: input.evidence,
    });
    const [analystFragment, criticFragment] = await Promise.all([
      this.runProposal(
        "ANALYST",
        "Evaluate the deterministic evidence for thesis support. Do not calculate prices, risk, size, or execution.",
        evidenceJson,
      ),
      this.runProposal(
        "CRITIC",
        "Search for invalidation, contradiction, stale evidence, and uncertainty. Do not calculate prices, risk, size, or execution.",
        evidenceJson,
      ),
    ]);
    this.assertEvidenceKeys(analystFragment, input.evidenceKeys);
    this.assertEvidenceKeys(criticFragment, input.evidenceKeys);

    const analyst = this.finalizeProposal<AnalystProposalPayload>(
      "ANALYST_PROPOSAL",
      input.candidate.candidate_id,
      input.evaluatedAt,
      analystFragment,
    );
    const critic = this.finalizeProposal<CriticProposalPayload>(
      "CRITIC_PROPOSAL",
      input.candidate.candidate_id,
      input.evaluatedAt,
      criticFragment,
    );
    const bothReject =
      analyst.verdict === "UNFAVORABLE" && critic.verdict === "UNFAVORABLE";
    const materialConflict = analyst.verdict !== critic.verdict;
    const judgeRequired =
      !bothReject && (input.candidate.grade === "A_PLUS" || materialConflict);
    const judge = judgeRequired
      ? await this.runJudge(
          input.candidate.candidate_id,
          input.evaluatedAt,
          input.reanalysisCount,
          analyst,
          critic,
        )
      : undefined;
    const analyticalApproval = bothReject
      ? false
      : judgeRequired
        ? judge?.decision === "APPROVE"
        : analyst.verdict === "FAVORABLE" && critic.verdict === "FAVORABLE";
    return Object.freeze({
      analyst,
      critic,
      ...(judge === undefined ? {} : { judge }),
      analyticalApproval,
    });
  }

  async audit(input: {
    readonly candidateId: string;
    readonly executionReportId: string;
    readonly evidence: Readonly<Record<string, unknown>>;
    readonly reportedAt: string;
  }): Promise<Readonly<PostTradeAuditReportPayload>> {
    const result = await this.runtime.generate({
      systemPrompt:
        "You are the non-live Post-Trade Auditor. Report and compare observed outcomes only. Never propose or change rules, prompts, models, risk, settings, or execution.",
      userPrompt: canonicalizeJson(input.evidence),
      jsonSchema: AUDITOR_SCHEMA,
      maxTokens: 512,
      timeoutMs: 90_000,
    });
    const fragment = result.json as {
      observations?: unknown;
      comparisons?: unknown;
    };
    const payload = {
      candidate_id: input.candidateId,
      execution_report_id: input.executionReportId,
      observations: fragment.observations,
      comparisons: fragment.comparisons,
      reported_at: input.reportedAt,
    };
    assertContract("POST_TRADE_AUDIT_REPORT", payload);
    return Object.freeze(payload as PostTradeAuditReportPayload);
  }

  private async runProposal(
    role: "ANALYST" | "CRITIC",
    instruction: string,
    evidenceJson: string,
  ): Promise<ProposalFragment> {
    const result = await this.runtime.generate({
      systemPrompt: `${role}: ${instruction} Return only the constrained JSON. Never reveal chain-of-thought; provide short conclusions and evidence keys only.`,
      userPrompt: evidenceJson,
      jsonSchema: PROPOSAL_SCHEMA,
      maxTokens: 384,
      timeoutMs: 90_000,
    });
    const fragment = result.json as ProposalFragment;
    const confidence = parseDecimal(fragment.confidence);
    if (confidence.lt(0) || confidence.gt(1))
      throw new Error(`${role} confidence outside [0,1]`);
    return fragment;
  }

  private async runJudge(
    candidateId: string,
    decidedAt: string,
    reanalysisCount: 0 | 1,
    analyst: Readonly<AnalystProposalPayload>,
    critic: Readonly<CriticProposalPayload>,
  ): Promise<Readonly<JudgeDecisionPayload>> {
    const result = await this.runtime.generate({
      systemPrompt:
        "JUDGE: resolve only the analytical conflict. Output APPROVE, REJECT, or REANALYZE. This is never policy, risk, sizing, or execution approval.",
      userPrompt: canonicalizeJson({ analyst, critic }),
      jsonSchema: JUDGE_SCHEMA,
      maxTokens: 256,
      timeoutMs: 90_000,
    });
    const fragment = result.json as Pick<
      JudgeDecisionPayload,
      "decision" | "reason"
    >;
    if (fragment.decision === "REANALYZE" && reanalysisCount >= 1)
      throw new Error("Second reanalysis is prohibited");
    const payload: JudgeDecisionPayload = {
      candidate_id: candidateId,
      decision: fragment.decision,
      reason: fragment.reason,
      reanalysis_count: reanalysisCount,
      decided_at: decidedAt,
    };
    assertContract("JUDGE_DECISION", payload);
    return Object.freeze(payload);
  }

  private finalizeProposal<
    T extends AnalystProposalPayload | CriticProposalPayload,
  >(
    eventType: "ANALYST_PROPOSAL" | "CRITIC_PROPOSAL",
    candidateId: string,
    evaluatedAt: string,
    fragment: ProposalFragment,
  ): Readonly<T> {
    const payload = {
      candidate_id: candidateId,
      verdict: fragment.verdict,
      confidence: fragment.confidence,
      evidence_keys: [
        fragment.evidence_keys[0],
        ...fragment.evidence_keys.slice(1),
      ],
      ...(fragment.notes === undefined ? {} : { notes: fragment.notes }),
      evaluated_at: evaluatedAt,
    };
    assertContract(eventType, payload);
    return Object.freeze(payload as T);
  }

  private assertEvidenceKeys(
    fragment: ProposalFragment,
    allowed: readonly string[],
  ): void {
    const allowlist = new Set(allowed);
    if (fragment.evidence_keys.some((key) => !allowlist.has(key)))
      throw new Error(
        "AI referenced evidence outside the deterministic allowlist",
      );
  }
}

function assertContract(eventType: string, payload: unknown): void {
  const result = validatePayload(eventType, payload);
  if (!result.valid)
    throw new Error(
      `${eventType} schema rejected: ${result.errors?.join("; ")}`,
    );
}
