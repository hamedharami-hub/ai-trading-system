export type ReadOnlyProviderProfile =
  | "CTRADER_SPOT_DEPTH_V1"
  | "BINANCE_SPOT_DEPTH_V1"
  | "BINANCE_USDM_DEPTH_V1";

export type ProviderRecoveryStep =
  | { readonly kind: "CONNECT" }
  | { readonly kind: "DISCONNECT" }
  | { readonly kind: "SNAPSHOT"; readonly lastUpdateId: string }
  | {
      readonly kind: "DELTA";
      readonly firstUpdateId: string;
      readonly finalUpdateId: string;
    };

export type ProviderRecoveryStatus =
  | "REPLAY_ONLY_VALID"
  | "UNPROVEN"
  | "GAPPED"
  | "RECONNECTING"
  | "REJECTED";

export interface ReadOnlyProviderRecoveryFixtureInput {
  readonly fixtureId: string;
  readonly profile: ReadOnlyProviderProfile;
  readonly steps: readonly ProviderRecoveryStep[];
}

export interface ReadOnlyProviderRecoveryFixtureReport {
  readonly fixtureId: string;
  readonly profile: ReadOnlyProviderProfile;
  readonly status: ProviderRecoveryStatus;
  readonly rejectionReasons: readonly string[];
  readonly executionEligible: false;
  readonly orderIntentsCreated: 0;
  readonly executionReportsCreated: 0;
  readonly simulatedFillsCreated: 0;
  readonly externalRequestsMade: 0;
}

const CANONICAL_INTEGER = /^(0|[1-9]\d*)$/;

function asSequence(value: string): bigint | undefined {
  return CANONICAL_INTEGER.test(value) ? BigInt(value) : undefined;
}

function isBinanceProfile(profile: ReadOnlyProviderProfile): boolean {
  return (
    profile === "BINANCE_SPOT_DEPTH_V1" || profile === "BINANCE_USDM_DEPTH_V1"
  );
}

/**
 * Runs an offline-only recovery fixture. It never declares a live feed healthy
 * and never creates a trading artifact.
 */
export function runReadOnlyProviderRecoveryFixture(
  input: Readonly<ReadOnlyProviderRecoveryFixtureInput>,
): ReadOnlyProviderRecoveryFixtureReport {
  if (input.fixtureId.trim().length === 0) {
    throw new Error("Provider recovery fixture requires a non-empty fixtureId");
  }

  const reasons: string[] = [];
  if (input.steps.length === 0) {
    reasons.push("EMPTY_RECOVERY_FIXTURE");
  }

  if (
    input.profile !== "CTRADER_SPOT_DEPTH_V1" &&
    !isBinanceProfile(input.profile)
  ) {
    reasons.push("UNSUPPORTED_PROVIDER_PROFILE");
    return freezeReport(input, "REJECTED", reasons);
  }

  if (!isBinanceProfile(input.profile)) {
    const disconnected = input.steps.some((step) => step.kind === "DISCONNECT");
    reasons.push("CTRADER_SNAPSHOT_REBUILD_UNPROVEN");
    return freezeReport(
      input,
      disconnected ? "RECONNECTING" : "UNPROVEN",
      reasons,
    );
  }

  let connected = false;
  let bufferedDeltas: { readonly first: bigint; readonly final: bigint }[] = [];
  let lastUpdateId: bigint | undefined;
  let status: ProviderRecoveryStatus = "UNPROVEN";

  for (const step of input.steps) {
    if (step.kind === "CONNECT") {
      connected = true;
      bufferedDeltas = [];
      lastUpdateId = undefined;
      status = "UNPROVEN";
      continue;
    }
    if (step.kind === "DISCONNECT") {
      connected = false;
      bufferedDeltas = [];
      lastUpdateId = undefined;
      status = "RECONNECTING";
      continue;
    }
    if (!connected) {
      reasons.push("EVENT_WHILE_DISCONNECTED");
      status = "REJECTED";
      continue;
    }

    if (step.kind === "SNAPSHOT") {
      const snapshotSequence = asSequence(step.lastUpdateId);
      if (snapshotSequence === undefined) {
        reasons.push("INVALID_SNAPSHOT_UPDATE_ID");
        status = "REJECTED";
        continue;
      }
      lastUpdateId = snapshotSequence;
      const bridgeIndex = bufferedDeltas.findIndex(
        (delta) =>
          delta.first <= snapshotSequence + 1n &&
          delta.final >= snapshotSequence + 1n,
      );
      if (bridgeIndex === -1) {
        reasons.push("MISSING_SNAPSHOT_BRIDGE");
        status = "GAPPED";
        continue;
      }
      const bridge = bufferedDeltas[bridgeIndex];
      if (bridge === undefined) {
        reasons.push("MISSING_SNAPSHOT_BRIDGE");
        status = "GAPPED";
        continue;
      }
      lastUpdateId = bridge.final;
      const bufferedAfterBridge = bufferedDeltas.slice(bridgeIndex + 1);
      bufferedDeltas = [];
      for (const delta of bufferedAfterBridge) {
        if (delta.first !== lastUpdateId + 1n) {
          reasons.push("SEQUENCE_GAP");
          lastUpdateId = undefined;
          status = "GAPPED";
          break;
        }
        lastUpdateId = delta.final;
      }
      if (lastUpdateId === undefined) {
        continue;
      }
      status = "REPLAY_ONLY_VALID";
      continue;
    }

    const first = asSequence(step.firstUpdateId);
    const final = asSequence(step.finalUpdateId);
    if (first === undefined || final === undefined || final < first) {
      reasons.push("INVALID_DELTA_UPDATE_RANGE");
      status = "REJECTED";
      continue;
    }
    if (lastUpdateId === undefined) {
      bufferedDeltas.push({ first, final });
      continue;
    }
    if (first !== lastUpdateId + 1n) {
      reasons.push("SEQUENCE_GAP");
      lastUpdateId = undefined;
      bufferedDeltas = [];
      status = "GAPPED";
      continue;
    }
    lastUpdateId = final;
    status = "REPLAY_ONLY_VALID";
  }

  return freezeReport(input, status, reasons);
}

function freezeReport(
  input: Readonly<ReadOnlyProviderRecoveryFixtureInput>,
  status: ProviderRecoveryStatus,
  rejectionReasons: readonly string[],
): ReadOnlyProviderRecoveryFixtureReport {
  return Object.freeze({
    fixtureId: input.fixtureId,
    profile: input.profile,
    status,
    rejectionReasons: Object.freeze([...rejectionReasons]),
    executionEligible: false,
    orderIntentsCreated: 0,
    executionReportsCreated: 0,
    simulatedFillsCreated: 0,
    externalRequestsMade: 0,
  });
}
