import { describe, expect, it } from "vitest";
import { runReadOnlyProviderRecoveryFixture } from "../src/replay/read-only-provider-recovery-fixture.js";

describe("read-only provider recovery fixture", () => {
  it("accepts only a locally replayed Binance snapshot bridge", () => {
    expect(
      runReadOnlyProviderRecoveryFixture({
        fixtureId: "binance-recovery-valid",
        profile: "BINANCE_SPOT_DEPTH_V1",
        steps: [
          { kind: "CONNECT" },
          { kind: "DELTA", firstUpdateId: "101", finalUpdateId: "103" },
          { kind: "SNAPSHOT", lastUpdateId: "100" },
          { kind: "DELTA", firstUpdateId: "104", finalUpdateId: "105" },
        ],
      }),
    ).toMatchObject({
      status: "REPLAY_ONLY_VALID",
      rejectionReasons: [],
      executionEligible: false,
      orderIntentsCreated: 0,
      executionReportsCreated: 0,
      simulatedFillsCreated: 0,
      externalRequestsMade: 0,
    });
  });

  it("fails closed when a Binance delta cannot bridge the snapshot", () => {
    const report = runReadOnlyProviderRecoveryFixture({
      fixtureId: "binance-recovery-gap",
      profile: "BINANCE_USDM_DEPTH_V1",
      steps: [
        { kind: "CONNECT" },
        { kind: "DELTA", firstUpdateId: "103", finalUpdateId: "104" },
        { kind: "SNAPSHOT", lastUpdateId: "100" },
      ],
    });

    expect(report.status).toBe("GAPPED");
    expect(report.rejectionReasons).toEqual(["MISSING_SNAPSHOT_BRIDGE"]);
    expect(report.executionEligible).toBe(false);
  });

  it("rejects a gap buffered after an otherwise valid snapshot bridge", () => {
    const report = runReadOnlyProviderRecoveryFixture({
      fixtureId: "binance-buffered-gap",
      profile: "BINANCE_SPOT_DEPTH_V1",
      steps: [
        { kind: "CONNECT" },
        { kind: "DELTA", firstUpdateId: "101", finalUpdateId: "102" },
        { kind: "DELTA", firstUpdateId: "104", finalUpdateId: "105" },
        { kind: "SNAPSHOT", lastUpdateId: "100" },
      ],
    });

    expect(report.status).toBe("GAPPED");
    expect(report.rejectionReasons).toEqual(["SEQUENCE_GAP"]);
  });

  it("returns to reconnecting after a disconnect", () => {
    const report = runReadOnlyProviderRecoveryFixture({
      fixtureId: "binance-reconnect",
      profile: "BINANCE_SPOT_DEPTH_V1",
      steps: [{ kind: "CONNECT" }, { kind: "DISCONNECT" }],
    });

    expect(report.status).toBe("RECONNECTING");
    expect(report.executionEligible).toBe(false);
  });

  it("keeps cTrader depth unproven until snapshot/rebuild semantics are evidenced", () => {
    const report = runReadOnlyProviderRecoveryFixture({
      fixtureId: "ctrader-depth",
      profile: "CTRADER_SPOT_DEPTH_V1",
      steps: [
        { kind: "CONNECT" },
        { kind: "DELTA", firstUpdateId: "1", finalUpdateId: "1" },
      ],
    });

    expect(report.status).toBe("UNPROVEN");
    expect(report.rejectionReasons).toEqual([
      "CTRADER_SNAPSHOT_REBUILD_UNPROVEN",
    ]);
    expect(report.externalRequestsMade).toBe(0);
  });
});
