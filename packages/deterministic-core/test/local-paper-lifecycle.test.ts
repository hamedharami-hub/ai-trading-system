import { describe, expect, it } from "vitest";

import {
  createLocalPaperTerminalSnapshot,
  type LocalPaperLifecycleState,
} from "../src/paper/local-paper-lifecycle.js";

describe("local Paper lifecycle contract", () => {
  it("materializes frozen no-trade terminal evidence with no trading artifacts", () => {
    const snapshot = createLocalPaperTerminalSnapshot("NO_TRADE", [
      "REPLAY_UNAVAILABLE",
    ]);

    expect(snapshot).toEqual({
      label: "PAPER_LOCAL_ONLY",
      state: "NO_TRADE",
      reasons: ["REPLAY_UNAVAILABLE"],
      paperRecordsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      externalRequestsMade: 0,
      executionEligible: false,
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.reasons)).toBe(true);
  });

  it("permits only the declared terminal states", () => {
    expect(() =>
      createLocalPaperTerminalSnapshot("DRAFT" as LocalPaperLifecycleState, [
        "NOT_TERMINAL",
      ]),
    ).toThrow("must be terminal");
  });

  it("fails closed for empty terminal evidence", () => {
    expect(() => createLocalPaperTerminalSnapshot("REJECTED", [])).toThrow(
      "requires non-empty reasons",
    );
    expect(() => createLocalPaperTerminalSnapshot("CANCELLED", ["  "])).toThrow(
      "requires non-empty reasons",
    );
  });
});
