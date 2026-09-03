/**
 * Versioned local metadata for the explicitly admitted EURUSD M1 historical
 * Replay evidence scope. It is not venue, broker, account, or execution data.
 */
export const EURUSD_M1_LOCAL_REPLAY_METADATA = Object.freeze({
  metadataVersion: "eurusd-m1-replay-metadata-v1",
  instrument: "EURUSD",
  timeframe: "M1",
  sourceKind: "REPLAY",
  tickSize: "0.00001",
  executionEligible: false as const,
});
