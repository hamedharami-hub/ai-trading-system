import type { ReadOnlyProviderProfile } from "./read-only-provider-recovery-fixture.js";

export type ReadOnlyAdapterAvailability = "DISABLED";

export interface ReadOnlyAdapterCapabilityReport {
  readonly profile: ReadOnlyProviderProfile;
  readonly availability: ReadOnlyAdapterAvailability;
  readonly networkAllowed: false;
  readonly credentialsAllowed: false;
  readonly accountAccessAllowed: false;
  readonly omsAccessAllowed: false;
  readonly executionAllowed: false;
  readonly permittedOperations: readonly [];
}

/**
 * Deliberately contains no transport entry point. A future adapter must be
 * separately approved and cannot be substituted for this disabled boundary.
 */
export interface ReadOnlyProviderAdapterBoundary {
  capabilityReport(): ReadOnlyAdapterCapabilityReport;
}

export class DisabledReadOnlyProviderAdapter
  implements ReadOnlyProviderAdapterBoundary
{
  public constructor(private readonly profile: ReadOnlyProviderProfile) {}

  public capabilityReport(): ReadOnlyAdapterCapabilityReport {
    return Object.freeze({
      profile: this.profile,
      availability: "DISABLED",
      networkAllowed: false,
      credentialsAllowed: false,
      accountAccessAllowed: false,
      omsAccessAllowed: false,
      executionAllowed: false,
      permittedOperations: Object.freeze([]) as readonly [],
    });
  }
}
