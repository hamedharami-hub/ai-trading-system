import { describe, expect, it } from "vitest";
import { createLocalNodeOfflineDiagnostic } from "../src/index.js";

describe("offline Local Trading Node diagnostic", () => {
  it("never starts a transport or produces a trade artifact", () => {
    expect(createLocalNodeOfflineDiagnostic()).toMatchObject({
      kind: "OFFLINE_LOCAL_NODE_DIAGNOSTIC",
      transportStarted: false,
      schedulerStarted: false,
      environmentRead: false,
      datasetsRead: 0,
      persistenceMutations: 0,
      externalRequestsMade: 0,
      readiness: {
        status: "NO_TRADE",
        label: "PAPER_LOCAL_ONLY",
        orderIntentsCreated: 0,
        simulatedFillsCreated: 0,
        positionsCreated: 0,
        profitLossCalculated: false,
        externalRequestsMade: 0,
        executionEligible: false,
      },
    });
  });

  it("returns the same immutable report on every invocation", () => {
    const first = createLocalNodeOfflineDiagnostic();
    const second = createLocalNodeOfflineDiagnostic();

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.readiness)).toBe(true);
  });
});
