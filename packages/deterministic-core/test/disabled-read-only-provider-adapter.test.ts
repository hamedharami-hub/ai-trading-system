import { describe, expect, it } from "vitest";
import { DisabledReadOnlyProviderAdapter } from "../src/replay/disabled-read-only-provider-adapter.js";

describe("disabled read-only provider adapter", () => {
  it("exposes no transport, credential, account, OMS, or execution capability", () => {
    const adapter = new DisabledReadOnlyProviderAdapter(
      "BINANCE_SPOT_DEPTH_V1",
    );

    expect(adapter.capabilityReport()).toEqual({
      profile: "BINANCE_SPOT_DEPTH_V1",
      availability: "DISABLED",
      networkAllowed: false,
      credentialsAllowed: false,
      accountAccessAllowed: false,
      omsAccessAllowed: false,
      executionAllowed: false,
      permittedOperations: [],
    });
    expect("connect" in adapter).toBe(false);
    expect("subscribe" in adapter).toBe(false);
    expect("submitOrder" in adapter).toBe(false);
  });

  it("keeps each provider profile disabled", () => {
    for (const profile of [
      "CTRADER_SPOT_DEPTH_V1",
      "BINANCE_SPOT_DEPTH_V1",
      "BINANCE_USDM_DEPTH_V1",
    ] as const) {
      expect(
        new DisabledReadOnlyProviderAdapter(profile).capabilityReport(),
      ).toMatchObject({ profile, availability: "DISABLED" });
    }
  });
});
