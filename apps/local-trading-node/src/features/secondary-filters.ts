import { Decimal } from '@trade/contracts';
import type { CandleData } from './types.js';

export class SecondaryFilters {
  /**
   * Calculates Average True Range (ATR) with standard 14-period Wilder RMA.
   */
  public static calculateATR(candles: CandleData[], period = 14): Decimal {
    if (candles.length < 2) {
      if (candles.length === 1) {
        return candles[0]!.high.minus(candles[0]!.low);
      }
      return new Decimal(0);
    }

    const trueRanges: Decimal[] = [];
    for (let i = 1; i < candles.length; i++) {
      const curr = candles[i]!;
      const prev = candles[i - 1]!;

      const hl = curr.high.minus(curr.low);
      const hc = curr.high.minus(prev.close).abs();
      const lc = curr.low.minus(prev.close).abs();

      const tr = Decimal.max(hl, hc, lc);
      trueRanges.push(tr);
    }

    if (trueRanges.length < period) {
      let sum = new Decimal(0);
      for (const tr of trueRanges) {
        sum = sum.plus(tr);
      }
      return sum.dividedBy(trueRanges.length);
    }

    // Initial simple average for first `period`
    let atr = new Decimal(0);
    for (let i = 0; i < period; i++) {
      atr = atr.plus(trueRanges[i]!);
    }
    atr = atr.dividedBy(period);

    // Wilder smoothing for subsequent periods
    const pDec = new Decimal(period);
    for (let i = period; i < trueRanges.length; i++) {
      atr = atr.times(pDec.minus(1)).plus(trueRanges[i]!).dividedBy(pDec);
    }

    return atr;
  }

  /**
   * Calculates Volume Weighted Average Price (VWAP).
   * Typical Price = (High + Low + Close) / 3
   * VWAP = sum(TypicalPrice * Volume) / sum(Volume)
   */
  public static calculateVWAP(candles: CandleData[]): Decimal {
    if (candles.length === 0) return new Decimal(0);

    let cumulativeTPV = new Decimal(0);
    let cumulativeVol = new Decimal(0);

    for (const c of candles) {
      const typicalPrice = c.high.plus(c.low).plus(c.close).dividedBy(3);
      cumulativeTPV = cumulativeTPV.plus(typicalPrice.times(c.volume));
      cumulativeVol = cumulativeVol.plus(c.volume);
    }

    if (cumulativeVol.isZero()) {
      return candles[candles.length - 1]!.close;
    }

    return cumulativeTPV.dividedBy(cumulativeVol);
  }

  /**
   * Computes Volume Profile Point of Control (POC) by bucketing price range.
   */
  public static calculateVolumeProfilePOC(candles: CandleData[], numBuckets = 50): Decimal {
    if (candles.length === 0) return new Decimal(0);
    if (candles.length === 1) return candles[0]!.close;

    let minPrice = candles[0]!.low;
    let maxPrice = candles[0]!.high;

    for (const c of candles) {
      if (c.low.lt(minPrice)) minPrice = c.low;
      if (c.high.gt(maxPrice)) maxPrice = c.high;
    }

    const priceRange = maxPrice.minus(minPrice);
    if (priceRange.isZero()) return minPrice;

    const bucketSize = priceRange.dividedBy(numBuckets);
    const volumeBuckets: Decimal[] = Array.from({ length: numBuckets }, () => new Decimal(0));

    for (const c of candles) {
      const typicalPrice = c.high.plus(c.low).plus(c.close).dividedBy(3);
      let bucketIdx = Math.floor(typicalPrice.minus(minPrice).dividedBy(bucketSize).toNumber());
      if (bucketIdx >= numBuckets) bucketIdx = numBuckets - 1;
      if (bucketIdx < 0) bucketIdx = 0;

      volumeBuckets[bucketIdx] = volumeBuckets[bucketIdx]!.plus(c.volume);
    }

    let maxVolIdx = 0;
    let maxVol = volumeBuckets[0]!;

    for (let i = 1; i < numBuckets; i++) {
      if (volumeBuckets[i]!.gt(maxVol)) {
        maxVol = volumeBuckets[i]!;
        maxVolIdx = i;
      }
    }

    // Return the midpoint price of the winning volume bucket
    return minPrice.plus(bucketSize.times(maxVolIdx)).plus(bucketSize.dividedBy(2));
  }
}
