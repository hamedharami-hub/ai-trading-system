import { describe, expect, it } from "vitest";
import {
  evaluateLocalPaperEntryDecisionReadiness,
  REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS,
} from "../src/paper/local-paper-entry-decision-registry.js";

describe("local Paper entry decision registry", () => {
  it("keeps a complete accepted decision set at no-trade", () => {
    expect(
      evaluateLocalPaperEntryDecisionReadiness(
        REQUIRED_LOCAL_PAPER_ENTRY_DECISIONS,
      ),
    ).toMatchObject({
      status: "NO_TRADE",
      label: "PAPER_LOCAL_ONLY",
      reasons: ["ENTRY_DECISIONS_ACCEPTED"],
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      executionEligible: false,
    });
  });

  it("rejects duplicate and unknown decisions and reports missing ones", () => {
    expect(
      evaluateLocalPaperEntryDecisionReadiness([
        "paper-expiry-v1",
        "paper-expiry-v1",
        "unknown-v1",
      ]),
    ).toMatchObject({ status: "REJECTED" });
    expect(evaluateLocalPaperEntryDecisionReadiness([]).reasons).toEqual([
      "DECISION_ID_MISSING",
      "DECISION_ID_MISSING",
      "DECISION_ID_MISSING",
      "DECISION_ID_MISSING",
      "DECISION_ID_MISSING",
    ]);
  });
});
