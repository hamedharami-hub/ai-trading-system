import type { CandleData } from '../features/types.js';

export class EventReplayer {
  private currentIndex = 0;

  constructor(private readonly candles: readonly CandleData[]) {
    // Verify ascending chronological order
    for (let i = 1; i < candles.length; i++) {
      const prev = new Date(candles[i - 1]!.closeTime).getTime();
      const curr = new Date(candles[i]!.closeTime).getTime();
      if (curr < prev) {
        throw new Error(`Candles must be sorted in ascending chronological order (index ${i})`);
      }
    }
  }

  public hasNext(): boolean {
    return this.currentIndex < this.candles.length;
  }

  public next(): CandleData | null {
    if (!this.hasNext()) return null;
    const bar = this.candles[this.currentIndex]!;
    this.currentIndex++;
    return bar;
  }

  public reset(): void {
    this.currentIndex = 0;
  }

  public get totalCandles(): number {
    return this.candles.length;
  }
}
