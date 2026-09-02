import { describe, expect, it } from "vitest";

import {
  findLocalPaperTerminalFixture,
  LOCAL_PAPER_TERMINAL_FIXTURES,
} from "../src/paper/local-paper-terminal-fixtures.js";

describe("local Paper terminal fixtures", () => {
  it("exposes only immutable terminal and zero-artifact evidence", () => {
    expect(LOCAL_PAPER_TERMINAL_FIXTURES).toHaveLength(3);
    expect(Object.isFrozen(LOCAL_PAPER_TERMINAL_FIXTURES)).toBe(true);

    for (const fixture of LOCAL_PAPER_TERMINAL_FIXTURES) {
      expect(Object.isFrozen(fixture)).toBe(true);
      expect(["NO_TRADE", "CANCELLED", "REJECTED"]).toContain(
        fixture.terminalState,
      );
      expect(fixture.label).toBe("PAPER_LOCAL_ONLY");
      expect(fixture.paperRecordsCreated).toBe(0);
      expect(fixture.simulatedFillsCreated).toBe(0);
      expect(fixture.positionsCreated).toBe(0);
      expect(fixture.profitLossCalculated).toBe(false);
      expect(fixture.externalRequestsMade).toBe(0);
      expect(fixture.executionEligible).toBe(false);
    }
  });

  it("fails closed to no fixture for an unknown identity", () => {
    expect(findLocalPaperTerminalFixture("unknown-fixture")).toBeUndefined();
  });
});
