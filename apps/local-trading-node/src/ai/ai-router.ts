import type { StrategyCandidatePayload, FeatureSnapshotPayload, AnalystProposalPayload, CriticProposalPayload, JudgeDecisionPayload } from '@trade/contracts';
import type { ILLMProvider, AIRouterMetrics } from './types.js';
import { AnalystRole } from './roles/analyst-role.js';
import { CriticRole } from './roles/critic-role.js';
import { JudgeRole } from './roles/judge-role.js';

export interface AIRouterConfig {
  primaryProvider: ILLMProvider;
  fallbackProvider?: ILLMProvider;
}

export interface AIPipelineResult {
  candidateId: string;
  analyst: AnalystProposalPayload;
  critic: CriticProposalPayload;
  judge: JudgeDecisionPayload;
  success: boolean;
}

export class AIRouter {
  private analystRole: AnalystRole;
  private criticRole: CriticRole;
  private judgeRole: JudgeRole;
  private metrics: AIRouterMetrics = {
    totalRequests: 0,
    totalTokensUsed: 0,
    roleCounts: {
      ANALYST: 0,
      CRITIC: 0,
      JUDGE: 0,
      AUDITOR: 0
    },
    fallbackCount: 0
  };

  constructor(private readonly config: AIRouterConfig) {
    this.analystRole = new AnalystRole(config.primaryProvider);
    this.criticRole = new CriticRole(config.primaryProvider);
    this.judgeRole = new JudgeRole(config.primaryProvider);
  }

  /**
   * Executes multi-role analytical pipeline: Analyst -> Critic -> Judge.
   */
  public async runEvaluationPipeline(
    candidate: StrategyCandidatePayload,
    snapshot: FeatureSnapshotPayload
  ): Promise<AIPipelineResult> {
    this.metrics.totalRequests++;

    // 1. Analyst Phase
    const analyst = await this.analystRole.evaluate(candidate, snapshot);
    this.metrics.roleCounts.ANALYST++;

    // 2. Critic Phase
    const critic = await this.criticRole.evaluate(candidate, snapshot, analyst);
    this.metrics.roleCounts.CRITIC++;

    // 3. Judge Phase
    const judge = await this.judgeRole.evaluate(candidate, analyst, critic);
    this.metrics.roleCounts.JUDGE++;

    return {
      candidateId: candidate.candidate_id,
      analyst,
      critic,
      judge,
      success: judge.decision === 'APPROVE'
    };
  }

  public getMetrics(): AIRouterMetrics {
    return { ...this.metrics };
  }
}
