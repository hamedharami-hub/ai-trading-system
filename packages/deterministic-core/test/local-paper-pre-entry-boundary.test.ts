import { describe, expect, it } from "vitest";
import { evaluateLocalPaperPreEntryBoundary } from "../src/paper/local-paper-pre-entry-boundary.js";

const complete = {
  recordId: "local-run-1",
  knownRecordIds: [],
  replayEvidenceId: "replay-v1",
  fixtureEvidenceId: "fixture-v1",
  auditEvidenceId: "audit-v1",
  protectiveEvidenceId: "protective-v1",
  terminalState: "NO_TRADE" as const,
};

describe("local Paper pre-entry boundary", () => {
  it("validates complete local evidence but remains no-trade and zero-artifact", () => {
    expect(evaluateLocalPaperPreEntryBoundary(complete)).toMatchObject({
      status: "NO_TRADE",
      label: "PAPER_LOCAL_ONLY",
      reasons: ["SIMULATED_ENTRY_NOT_IMPLEMENTED"],
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      executionEligible: false,
    });
  });

  it("fails closed for duplicate and incomplete local evidence", () => {
    expect(
      evaluateLocalPaperPreEntryBoundary({
        ...complete,
        knownRecordIds: ["local-run-1"],
      }),
    ).toMatchObject({ status: "REJECTED", reasons: ["RECORD_ID_DUPLICATE"] });
    expect(
      evaluateLocalPaperPreEntryBoundary({
        ...complete,
        replayEvidenceId: undefined,
        protectiveEvidenceId: undefined,
        terminalState: undefined,
      }),
    ).toMatchObject({
      status: "NO_TRADE",
      reasons: [
        "REPLAY_EVIDENCE_MISSING",
        "PROTECTIVE_EVIDENCE_MISSING",
        "TERMINAL_EVIDENCE_MISSING",
      ],
    });
  });
});
