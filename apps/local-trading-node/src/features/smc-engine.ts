import type { CandleData, SwingPoint, FairValueGapData, OrderBlockData, LiquiditySweepData } from './types.js';

export class SMCEngine {
  /**
   * Identifies fractal swing highs and lows using deterministic N-bar confirmation windows.
   */
  public static findSwingPoints(
    candles: CandleData[],
    leftBars = 2,
    rightBars = 2
  ): SwingPoint[] {
    const swings: SwingPoint[] = [];

    for (let i = leftBars; i < candles.length - rightBars; i++) {
      const current = candles[i]!;
      let isHigh = true;
      let isLow = true;

      for (let j = i - leftBars; j <= i + rightBars; j++) {
        if (i === j) continue;
        const other = candles[j]!;
        if (other.high.gte(current.high)) isHigh = false;
        if (other.low.lte(current.low)) isLow = false;
      }

      if (isHigh) {
        swings.push({ index: i, type: 'HIGH', price: current.high, time: current.closeTime });
      }
      if (isLow) {
        swings.push({ index: i, type: 'LOW', price: current.low, time: current.closeTime });
      }
    }

    return swings;
  }

  /**
   * Detects Fair Value Gaps (FVG) and updates their mitigation status.
   */
  public static detectFVGs(candles: CandleData[]): FairValueGapData[] {
    const fvgs: FairValueGapData[] = [];

    for (let i = 2; i < candles.length; i++) {
      const cPrev2 = candles[i - 2]!;
      const cCurr = candles[i]!;

      // Bullish FVG: current candle low > 2 candles ago high
      if (cCurr.low.gt(cPrev2.high)) {
        let mitigated = false;
        const top = cCurr.low;
        const bottom = cPrev2.high;

        for (let j = i + 1; j < candles.length; j++) {
          if (candles[j]!.low.lte(top)) {
            mitigated = true;
            break;
          }
        }

        fvgs.push({ top, bottom, type: 'BULLISH', mitigated, index: i });
      }

      // Bearish FVG: current candle high < 2 candles ago low
      if (cCurr.high.lt(cPrev2.low)) {
        let mitigated = false;
        const top = cPrev2.low;
        const bottom = cCurr.high;

        for (let j = i + 1; j < candles.length; j++) {
          if (candles[j]!.high.gte(bottom)) {
            mitigated = true;
            break;
          }
        }

        fvgs.push({ top, bottom, type: 'BEARISH', mitigated, index: i });
      }
    }

    return fvgs;
  }

  /**
   * Detects Break of Structure (BOS), Change of Character (CHoCH), and displacement.
   */
  public static detectStructureBreaks(
    candles: CandleData[],
    swings: SwingPoint[]
  ): { bos: boolean; choch: boolean; displacement: boolean } {
    if (candles.length === 0) {
      return { bos: false, choch: false, displacement: false };
    }

    const lastCandle = candles[candles.length - 1]!;
    const candleRange = lastCandle.high.minus(lastCandle.low);
    const bodyRange = lastCandle.close.minus(lastCandle.open).abs();
    const displacement = candleRange.gt(0) && bodyRange.dividedBy(candleRange).gte('0.60');

    if (candles.length < 3 || swings.length < 2) {
      return { bos: false, choch: false, displacement };
    }

    const recentHighs = swings.filter((s) => s.type === 'HIGH');
    const recentLows = swings.filter((s) => s.type === 'LOW');

    const lastHigh = recentHighs[recentHighs.length - 1];
    const lastLow = recentLows[recentLows.length - 1];

    let bos = false;
    let choch = false;

    // Check body close break
    if (lastHigh && lastCandle.close.gt(lastHigh.price)) {
      if (recentHighs.length >= 2 && lastHigh.price.gte(recentHighs[recentHighs.length - 2]!.price)) {
        bos = true; // Continuation of higher high
      } else {
        choch = true; // Reversal of lower high
      }
    }

    if (lastLow && lastCandle.close.lt(lastLow.price)) {
      if (recentLows.length >= 2 && lastLow.price.lte(recentLows[recentLows.length - 2]!.price)) {
        bos = true; // Continuation of lower low
      } else {
        choch = true; // Reversal of higher low
      }
    }

    return { bos, choch, displacement };
  }

  /**
   * Identifies unmitigated Order Blocks prior to displacement moves.
   */
  public static detectOrderBlocks(candles: CandleData[], swings: SwingPoint[]): OrderBlockData[] {
    const obs: OrderBlockData[] = [];
    if (candles.length < 4) return obs;

    for (let i = 1; i < candles.length - 1; i++) {
      const cOrigin = candles[i]!;
      const cNext = candles[i + 1]!;

      // Bullish OB: Bearish candle followed by strong bullish displacement
      if (cOrigin.close.lt(cOrigin.open) && cNext.close.gt(cNext.open)) {
        const top = cOrigin.high;
        const bottom = cOrigin.low;

        let mitigated = false;
        for (let j = i + 2; j < candles.length; j++) {
          if (candles[j]!.low.lte(top)) {
            mitigated = true;
            break;
          }
        }

        obs.push({ top, bottom, type: 'BULLISH', mitigated, originIndex: i });
      }

      // Bearish OB: Bullish candle followed by strong bearish displacement
      if (cOrigin.close.gt(cOrigin.open) && cNext.close.lt(cNext.open)) {
        const top = cOrigin.high;
        const bottom = cOrigin.low;

        let mitigated = false;
        for (let j = i + 2; j < candles.length; j++) {
          if (candles[j]!.high.gte(bottom)) {
            mitigated = true;
            break;
          }
        }

        obs.push({ top, bottom, type: 'BEARISH', mitigated, originIndex: i });
      }
    }

    return obs;
  }

  /**
   * Detects Liquidity Sweeps where a wick breaches a swing level but the body closes inside.
   */
  public static detectLiquiditySweep(
    currentCandle: CandleData,
    swings: SwingPoint[]
  ): LiquiditySweepData | null {
    for (let i = swings.length - 1; i >= 0; i--) {
      const swing = swings[i]!;
      if (swing.type === 'HIGH') {
        // High sweep: wick > swing high, but close <= swing high
        if (currentCandle.high.gt(swing.price) && currentCandle.close.lte(swing.price)) {
          return { sweptLevel: swing.price, direction: 'HIGH', index: swing.index };
        }
      } else if (swing.type === 'LOW') {
        // Low sweep: wick < swing low, but close >= swing low
        if (currentCandle.low.lt(swing.price) && currentCandle.close.gte(swing.price)) {
          return { sweptLevel: swing.price, direction: 'LOW', index: swing.index };
        }
      }
    }
    return null;
  }
}
