import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  validateReadOnlyMarketDataFixture,
  type ReadOnlyMarketDataObservation,
} from "../src/replay/read-only-market-data-fixture-validator.js";

describe("mock forex replay fixture", () => {
  it("keeps EURUSD, GBPUSD, USDJPY, and XAUUSD strictly offline", () => {
    const observations = JSON.parse(
      readFileSync(
        new URL("./fixtures/mock-forex-replay.json", import.meta.url),
        "utf8",
      ),
    ) as ReadOnlyMarketDataObservation[];
    const report = validateReadOnlyMarketDataFixture({
      fixtureId: "mock-forex-v1",
      sourceKind: "MOCK",
      observations,
    });
    expect(report.status).toBe("REPLAY_ONLY_VALID");
    expect(report.executionEligible).toBe(false);
    expect(report.externalRequestsMade).toBe(0);
  });
});
