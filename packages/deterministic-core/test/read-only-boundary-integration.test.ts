import { describe, expect, it } from "vitest";
import { DisabledReadOnlyProviderAdapter } from "../src/replay/disabled-read-only-provider-adapter.js";
import { validateReadOnlyMarketDataFixture } from "../src/replay/read-only-market-data-fixture-validator.js";
import { runReadOnlyProviderRecoveryFixture } from "../src/replay/read-only-provider-recovery-fixture.js";

describe("offline read-only provider boundary", () => {
  it("keeps invalid evidence, gapped recovery, and the adapter ineligible for execution", () => {
    const evidence = validateReadOnlyMarketDataFixture({
      fixtureId: "boundary-invalid-evidence",
      sourceKind: "REPLAY",
      observations: [
        {
          eventId: "event-1",
          streamId: "btc-depth",
          receivedIndex: 1,
          timestampExchange: "invalid",
          timestampLocal: "2026-09-01T00:00:00.000Z",
        },
      ],
    });
    const recovery = runReadOnlyProviderRecoveryFixture({
      fixtureId: "boundary-gapped-recovery",
      profile: "BINANCE_SPOT_DEPTH_V1",
      steps: [
        { kind: "CONNECT" },
        { kind: "DELTA", firstUpdateId: "3", finalUpdateId: "4" },
        { kind: "SNAPSHOT", lastUpdateId: "1" },
      ],
    });
    const adapter = new DisabledReadOnlyProviderAdapter(
      "BINANCE_SPOT_DEPTH_V1",
    ).capabilityReport();

    expect(evidence.status).toBe("REJECTED");
    expect(recovery.status).toBe("GAPPED");
    expect(adapter.executionAllowed).toBe(false);
    expect(adapter.networkAllowed).toBe(false);
    expect(evidence.orderIntentsCreated).toBe(0);
    expect(recovery.orderIntentsCreated).toBe(0);
    expect(recovery.externalRequestsMade).toBe(0);
  });
});
