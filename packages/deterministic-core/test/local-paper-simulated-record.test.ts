import { describe, expect, it } from "vitest";
import { createLocalPaperSimulatedRecord } from "../src/paper/local-paper-simulated-record.js";
import { evaluateLocalPaperIdempotencyAndExpiry } from "../src/paper/local-paper-idempotency-expiry.js";

describe("local Paper simulated record boundary", () => {
  it("creates only immutable terminal evidence with zero trading artifacts", () => {
    const record = createLocalPaperSimulatedRecord({
      recordId: "paper-1",
      replayDatasetId: "replay-1",
      fixtureId: "fixture-1",
      terminalState: "NO_TRADE",
      reasons: ["SIMULATED_ENTRY_NOT_IMPLEMENTED"],
    });
    expect(record).toMatchObject({
      label: "PAPER_LOCAL_ONLY",
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      executionEligible: false,
    });
    expect(Object.isFrozen(record)).toBe(true);
  });

  it("fails closed for incomplete evidence, duplicate, expiry, and unknown Replay", () => {
    expect(() =>
      createLocalPaperSimulatedRecord({
        recordId: "",
        replayDatasetId: "replay-1",
        fixtureId: "fixture-1",
        terminalState: "NO_TRADE",
        reasons: ["X"],
      }),
    ).toThrow("complete evidence");
    expect(
      evaluateLocalPaperIdempotencyAndExpiry({
        recordId: "paper-1",
        knownRecordIds: ["paper-1"],
        replayAccepted: true,
        candidateExpired: false,
        assumptionsComplete: true,
      }),
    ).toMatchObject({ status: "REJECTED", reasons: ["RECORD_ID_DUPLICATE"] });
    expect(
      evaluateLocalPaperIdempotencyAndExpiry({
        recordId: "paper-2",
        knownRecordIds: [],
        replayAccepted: false,
        candidateExpired: true,
        assumptionsComplete: false,
      }).reasons,
    ).toEqual([
      "REPLAY_UNAVAILABLE",
      "CANDIDATE_EXPIRED",
      "ASSUMPTION_EVIDENCE_MISSING",
    ]);
  });
});
