export interface DeterministicFeatureEngine<TMarketEvent, TFeatureSnapshot> {
  calculate(event: Readonly<TMarketEvent>): Readonly<TFeatureSnapshot>;
}

export interface DeterministicStrategyEngine<
  TFeatureSnapshot,
  TStrategyCandidate,
> {
  evaluate(
    snapshot: Readonly<TFeatureSnapshot>,
  ): readonly Readonly<TStrategyCandidate>[];
}

export class DisabledFeatureEngine
  implements DeterministicFeatureEngine<unknown, never>
{
  calculate(): never {
    throw new Error(
      "Feature engine is disabled until an approved golden fixture is selected",
    );
  }
}

export class DisabledStrategyEngine
  implements DeterministicStrategyEngine<unknown, never>
{
  evaluate(): readonly never[] {
    return [];
  }
}
