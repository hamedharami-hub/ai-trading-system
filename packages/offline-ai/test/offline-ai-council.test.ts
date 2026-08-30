import { describe, expect, it } from "vitest";
import { OfflineAiCouncil } from "../src/orchestration/offline-ai-council.js";
import type {
  OfflineAiRuntime,
  OfflineGenerationResult,
} from "../src/runtime/runtime.js";

class ScriptedRuntime implements OfflineAiRuntime {
  constructor(private readonly outputs: unknown[]) {}
  async generate(): Promise<OfflineGenerationResult> {
    const json = this.outputs.shift();
    if (json === undefined) throw new Error("No scripted output");
    return { json, elapsedMs: 1, runtime: "scripted" };
  }
  async benchmark() {
    return { runtime: "scripted" };
  }
}

const candidate = {
  candidate_id: "018f3a9e-64c2-7b00-8000-000000000010",
  engine_type: "SCALP" as const,
  symbol: "XAUUSD" as const,
  side: "BUY" as const,
  grade: "A_PLUS" as const,
  entry_price: "2400.5",
  invalidation_price: "2395",
  target_price: "2415",
  risk_reward_ratio: "2.636",
  expiry_candles: 3,
  generated_at: "2026-08-30T07:00:00.000Z",
};

describe("offline analytical council", () => {
  it("runs Analyst and Critic independently and invokes Judge for A+", async () => {
    const council = new OfflineAiCouncil(
      new ScriptedRuntime([
        { verdict: "FAVORABLE", confidence: "0.8", evidence_keys: ["smc.bos"] },
        {
          verdict: "FAVORABLE",
          confidence: "0.6",
          evidence_keys: ["spread.normal"],
        },
        {
          decision: "APPROVE",
          reason: "Both proposals reference permitted evidence.",
        },
      ]),
    );
    const result = await council.analyze({
      candidate,
      evidence: { "smc.bos": true, "spread.normal": true },
      evidenceKeys: ["smc.bos", "spread.normal"],
      evaluatedAt: "2026-08-30T07:00:01.000Z",
      reanalysisCount: 0,
    });
    expect(result.judge?.decision).toBe("APPROVE");
    expect(result.analyticalApproval).toBe(true);
  });

  it("fails closed when AI invents an evidence key", async () => {
    const council = new OfflineAiCouncil(
      new ScriptedRuntime([
        {
          verdict: "FAVORABLE",
          confidence: "0.8",
          evidence_keys: ["invented"],
        },
        { verdict: "FAVORABLE", confidence: "0.7", evidence_keys: ["known"] },
      ]),
    );
    await expect(
      council.analyze({
        candidate: { ...candidate, grade: "A" },
        evidence: { known: true },
        evidenceKeys: ["known"],
        evaluatedAt: "2026-08-30T07:00:01.000Z",
        reanalysisCount: 0,
      }),
    ).rejects.toThrow(/allowlist/);
  });

  it("prohibits a second REANALYZE", async () => {
    const council = new OfflineAiCouncil(
      new ScriptedRuntime([
        { verdict: "FAVORABLE", confidence: "0.8", evidence_keys: ["known"] },
        { verdict: "UNFAVORABLE", confidence: "0.8", evidence_keys: ["known"] },
        { decision: "REANALYZE", reason: "Evidence conflict." },
      ]),
    );
    await expect(
      council.analyze({
        candidate,
        evidence: { known: true },
        evidenceKeys: ["known"],
        evaluatedAt: "2026-08-30T07:00:01.000Z",
        reanalysisCount: 1,
      }),
    ).rejects.toThrow(/Second reanalysis/);
  });

  it("keeps Post-Trade Auditor outside the live path and report-only", async () => {
    const council = new OfflineAiCouncil(
      new ScriptedRuntime([
        {
          observations: ["Fill was later than the mock reference."],
          comparisons: ["Observed slippage exceeded mock slippage."],
        },
      ]),
    );
    const report = await council.audit({
      candidateId: candidate.candidate_id,
      executionReportId: "018f3a9e-64c2-7b00-8000-000000000099",
      evidence: { outcome: "LOSS" },
      reportedAt: "2026-08-30T08:00:00.000Z",
    });
    expect(report).not.toHaveProperty("rule_changes");
    expect(report.observations).toHaveLength(1);
  });
});
