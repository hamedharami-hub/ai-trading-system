import type { MarketEventPayload, MarketId, Timeframe } from '@trade/contracts';
import { parseDecimal, toDecimalString } from '@trade/contracts';

const TIMEFRAME_MAP: Record<string, Timeframe> = {
  '1m': '1M',
  '5m': '5M',
  '15m': '15M',
  '1h': '1H',
  '4h': '4H',
  '1d': '1D'
};

const SYMBOL_MAP: Record<string, MarketId> = {
  BTCUSDT: 'BTCUSDT',
  ETHUSDT: 'ETHUSDT'
};

export class BinanceNormalizer {
  public static mapSymbol(rawSymbol: string): MarketId {
    const symbol = SYMBOL_MAP[rawSymbol.toUpperCase()];
    if (!symbol) {
      throw new Error(`Unsupported Binance symbol: "${rawSymbol}"`);
    }
    return symbol;
  }

  public static mapTimeframe(rawInterval: string): Timeframe {
    const tf = TIMEFRAME_MAP[rawInterval.toLowerCase()];
    if (!tf) {
      throw new Error(`Unsupported Binance timeframe interval: "${rawInterval}"`);
    }
    return tf;
  }

  /**
   * Normalizes Binance Kline / Candlestick stream payload.
   */
  public static normalizeKline(raw: {
    s: string; // Symbol
    k: {
      t: number; // Open time
      T: number; // Close time
      i: string; // Interval
      o: string; // Open
      h: string; // High
      l: string; // Low
      c: string; // Close
      v: string; // Volume
      x: boolean; // Is closed
    };
  }): MarketEventPayload {
    const symbol = this.mapSymbol(raw.s);
    const timeframe = this.mapTimeframe(raw.k.i);

    return {
      symbol,
      feed_type: 'CANDLE',
      candle: {
        open: toDecimalString(parseDecimal(raw.k.o)),
        high: toDecimalString(parseDecimal(raw.k.h)),
        low: toDecimalString(parseDecimal(raw.k.l)),
        close: toDecimalString(parseDecimal(raw.k.c)),
        volume: toDecimalString(parseDecimal(raw.k.v)),
        timeframe,
        is_closed: Boolean(raw.k.x),
        open_time: new Date(raw.k.t).toISOString(),
        close_time: new Date(raw.k.T).toISOString()
      }
    };
  }

  /**
   * Normalizes Binance BookTicker stream payload.
   */
  public static normalizeBookTicker(raw: {
    s: string;
    b: string; // Best bid
    a: string; // Best ask
    last_price?: string;
    last_qty?: string;
  }): MarketEventPayload {
    const symbol = this.mapSymbol(raw.s);

    const payload: MarketEventPayload = {
      symbol,
      feed_type: 'TICK',
      tick: {
        bid: toDecimalString(parseDecimal(raw.b)),
        ask: toDecimalString(parseDecimal(raw.a))
      }
    };

    if (raw.last_price && payload.tick) {
      payload.tick.last_price = toDecimalString(parseDecimal(raw.last_price));
    }
    if (raw.last_qty && payload.tick) {
      payload.tick.last_qty = toDecimalString(parseDecimal(raw.last_qty));
    }

    return payload;
  }

  /**
   * Normalizes Binance L2 Depth payload (50 bids / 50 asks target per DEC-025).
   */
  public static normalizeDepth(raw: {
    s: string;
    lastUpdateId?: number;
    bids: Array<[string, string]>;
    asks: Array<[string, string]>;
  }): MarketEventPayload {
    const symbol = this.mapSymbol(raw.s);

    const bids = raw.bids.map(([p, q]): [string, string] => [
      toDecimalString(parseDecimal(p)),
      toDecimalString(parseDecimal(q))
    ]);

    const asks = raw.asks.map(([p, q]): [string, string] => [
      toDecimalString(parseDecimal(p)),
      toDecimalString(parseDecimal(q))
    ]);

    const payload: MarketEventPayload = {
      symbol,
      feed_type: 'ORDERBOOK_L2',
      orderbook: {
        bids,
        asks,
        depth: Math.max(bids.length, asks.length)
      }
    };

    if (raw.lastUpdateId !== undefined) {
      payload.sequence_number = raw.lastUpdateId;
    }

    return payload;
  }
}
