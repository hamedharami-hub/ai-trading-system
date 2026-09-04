import {
  observeEurUsdM1ReplayAtr14Displacement,
  type EurUsdM1ReplayAtr14Displacement,
} from "./eurusd-m1-replay-atr14-displacement.js";
import {
  observeEurUsdM1ReplayBosFvgFacts,
  type EurUsdM1ReplayBosFvgFacts,
} from "./eurusd-m1-replay-bos-fvg-facts.js";
import {
  observeEurUsdM1ReplayFeatureFacts,
  type EurUsdM1ReplayFeatureFacts,
} from "./eurusd-m1-replay-feature-facts.js";
import type { HistoricalReplayPlayback } from "./historical-replay-runner.js";
import {
  observeEurUsdM1ReplaySweepRaidFacts,
  type EurUsdM1ReplaySweepRaidFacts,
} from "./eurusd-m1-replay-sweep-raid-facts.js";

export interface EurUsdM1ReplayObservationBundleInput {
  readonly playback: Readonly<HistoricalReplayPlayback>;
  readonly instrument: string;
  readonly timeframe: string;
  readonly cursor: number;
}

export interface EurUsdM1ReplayObservationBundle {
  readonly kind: "OBSERVATION_BUNDLE";
  readonly datasetId: string;
  readonly cursor: number;
  readonly sourceKind: "REPLAY";
  readonly candleSwing: EurUsdM1ReplayFeatureFacts;
  readonly atrDisplacement: EurUsdM1ReplayAtr14Displacement;
  readonly bosFvg: EurUsdM1ReplayBosFvgFacts;
  readonly sweepRaid: EurUsdM1ReplaySweepRaidFacts;
  readonly executionEligible: false;
  readonly strategyCandidatesCreated: 0;
  readonly orderIntentsCreated: 0;
  readonly externalRequestsMade: 0;
}

/**
 * Collects already-derived Replay observation evidence without reinterpreting
 * unavailable findings or producing a candidate, state mutation, or I/O.
 */
export function collectEurUsdM1ReplayObservationBundle(
  input: Readonly<EurUsdM1ReplayObservationBundleInput>,
): EurUsdM1ReplayObservationBundle {
  const common = {
    playback: input.playback,
    instrument: input.instrument,
    timeframe: input.timeframe,
  };
  return Object.freeze({
    kind: "OBSERVATION_BUNDLE",
    datasetId: input.playback.datasetId,
    cursor: input.cursor,
    sourceKind: "REPLAY",
    candleSwing: observeEurUsdM1ReplayFeatureFacts({
      ...common,
      centerCursor: input.cursor,
    }),
    atrDisplacement: observeEurUsdM1ReplayAtr14Displacement({
      ...common,
      centerCursor: input.cursor,
    }),
    bosFvg: observeEurUsdM1ReplayBosFvgFacts({
      ...common,
      centerCursor: input.cursor,
    }),
    sweepRaid: observeEurUsdM1ReplaySweepRaidFacts({
      ...common,
      sweepCursor: input.cursor,
    }),
    executionEligible: false,
    strategyCandidatesCreated: 0,
    orderIntentsCreated: 0,
    externalRequestsMade: 0,
  });
}
