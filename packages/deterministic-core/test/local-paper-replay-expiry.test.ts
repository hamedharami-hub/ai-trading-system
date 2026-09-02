import { describe, expect, it } from "vitest";
import { evaluateLocalPaperReplayExpiry } from "../src/paper/local-paper-replay-expiry.js";

describe("local Paper Replay expiry", () => {
  it("expires only after three complete subsequent local M1 candles", () => {
    expect(evaluateLocalPaperReplayExpiry(10, 12, true)).toMatchObject({
      status: "NO_TRADE",
      expired: false,
      reasons: ["SIMULATED_ENTRY_NOT_IMPLEMENTED"],
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      executionEligible: false,
    });
    expect(evaluateLocalPaperReplayExpiry(10, 13, true)).toMatchObject({
      status: "NO_TRADE",
      expired: true,
      reasons: ["CANDIDATE_EXPIRED_AFTER_THREE_COMPLETE_M1_CANDLES"],
    });
  });

  it("fails closed for incomplete evidence and invalid/gapped index input", () => {
    expect(evaluateLocalPaperReplayExpiry(10, 13, false)).toMatchObject({
      status: "NO_TRADE",
      expired: false,
      reasons: ["REPLAY_EVIDENCE_INCOMPLETE"],
    });
    expect(evaluateLocalPaperReplayExpiry(10, undefined, true)).toMatchObject({
      status: "NO_TRADE",
      expired: false,
      reasons: ["REPLAY_CANDLE_INDEX_INVALID"],
    });
    expect(evaluateLocalPaperReplayExpiry(12, 10, true)).toMatchObject({
      status: "NO_TRADE",
      expired: false,
      reasons: ["REPLAY_CANDLE_INDEX_INVALID"],
    });
  });
});
