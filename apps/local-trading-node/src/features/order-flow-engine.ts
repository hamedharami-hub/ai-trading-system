import { Decimal, parseDecimal, toDecimalString } from '@trade/contracts';

export type SpreadState = 'NORMAL' | 'ELEVATED' | 'WIDE';

export class OrderFlowEngine {
  private cumulativeDelta = new Decimal(0);
  private recentSpreads: Decimal[] = [];

  /**
   * Updates CVD with a new trade tick.
   * If price >= ask (buyer initiated) -> delta = +qty
   * If price <= bid (seller initiated) -> delta = -qty
   */
  public recordTrade(price: Decimal, bid: Decimal, ask: Decimal, quantity: Decimal): Decimal {
    if (price.gte(ask)) {
      this.cumulativeDelta = this.cumulativeDelta.plus(quantity);
    } else if (price.lte(bid)) {
      this.cumulativeDelta = this.cumulativeDelta.minus(quantity);
    }
    return this.cumulativeDelta;
  }

  public getCVD(): Decimal {
    return this.cumulativeDelta;
  }

  /**
   * Calculates Order Flow Imbalance (OFI) from top-of-book depth changes.
   * OFI = delta(BidVolume) - delta(AskVolume)
   */
  public static calculateOFI(
    prevBid: Decimal,
    prevBidQty: Decimal,
    currBid: Decimal,
    currBidQty: Decimal,
    prevAsk: Decimal,
    prevAskQty: Decimal,
    currAsk: Decimal,
    currAskQty: Decimal
  ): Decimal {
    let deltaBid = new Decimal(0);
    if (currBid.gt(prevBid)) {
      deltaBid = currBidQty;
    } else if (currBid.eq(prevBid)) {
      deltaBid = currBidQty.minus(prevBidQty);
    } else {
      deltaBid = prevBidQty.negated();
    }

    let deltaAsk = new Decimal(0);
    if (currAsk.lt(prevAsk)) {
      deltaAsk = currAskQty;
    } else if (currAsk.eq(prevAsk)) {
      deltaAsk = currAskQty.minus(prevAskQty);
    } else {
      deltaAsk = prevAskQty.negated();
    }

    return deltaBid.minus(deltaAsk);
  }

  /**
   * Tracks rolling spread and classifies into NORMAL, ELEVATED, WIDE.
   */
  public classifySpread(currentSpread: Decimal, maxWindow = 50): SpreadState {
    this.recentSpreads.push(currentSpread);
    if (this.recentSpreads.length > maxWindow) {
      this.recentSpreads.shift();
    }

    if (this.recentSpreads.length < 5) {
      return 'NORMAL';
    }

    let sum = new Decimal(0);
    for (const s of this.recentSpreads) {
      sum = sum.plus(s);
    }
    const avgSpread = sum.dividedBy(this.recentSpreads.length);

    if (currentSpread.gt(avgSpread.times('2.0'))) {
      return 'WIDE';
    }
    if (currentSpread.gt(avgSpread.times('1.3'))) {
      return 'ELEVATED';
    }
    return 'NORMAL';
  }

  public reset(): void {
    this.cumulativeDelta = new Decimal(0);
    this.recentSpreads = [];
  }
}
