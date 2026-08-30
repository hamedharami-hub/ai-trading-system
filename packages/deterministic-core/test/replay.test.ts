import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  validateReplaySequence,
  type ReplayObservation,
} from "../src/replay/sequence-validator.js";

function fixture(name: string): ReplayObservation[] {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"),
  ) as ReplayObservation[];
}

describe("replay sequence validation", () => {
  it("rejects gaps and duplicate event IDs", () => {
    const result = validateReplaySequence([
      { eventId: "a", streamId: "s", sequence: "1", receivedIndex: 1 },
      { eventId: "b", streamId: "s", sequence: "3", receivedIndex: 2 },
      { eventId: "a", streamId: "s", sequence: "2", receivedIndex: 3 },
    ]);
    expect(result.healthy).toBe(false);
    expect(result.rejected.map((entry) => entry.reason)).toEqual([
      "SEQUENCE_GAP",
      "DUPLICATE_EVENT_ID",
    ]);
  });

  it("supports sequence values above JavaScript safe integer range", () => {
    expect(validateReplaySequence(fixture("replay-valid.json")).healthy).toBe(
      true,
    );
  });

  it("fails closed on a recorded replay gap fixture", () => {
    expect(
      validateReplaySequence(fixture("replay-invalid.json")).rejected[0]
        ?.reason,
    ).toBe("SEQUENCE_GAP");
  });
});
