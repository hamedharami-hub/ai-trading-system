import { describe, it, expect } from 'vitest';
import { BinanceNormalizer } from '../../src/feed/normalizers/binance-normalizer.js';
import { CTraderNormalizer } from '../../src/feed/normalizers/ctrader-normalizer.js';
import { validatePayload } from '@trade/contracts';

describe('Market Data Feed Normalizers', () => {
  describe('Binance Normalizer', () => {
    it('normalizes Binance Kline (Candle) payload into canonical MarketEventPayload', () => {
      const rawKline = {
        s: 'BTCUSDT',
        k: {
          t: 1672531140000,
          T: 1672531199999,
          i: '1m',
          o: '16500.50',
          h: '16520.00',
          l: '16490.10',
          c: '16515.25',
          v: '124.500',
          x: true
        }
      };

      const normalized = BinanceNormalizer.normalizeKline(rawKline);
      expect(normalized.symbol).toBe('BTCUSDT');
      expect(normalized.feed_type).toBe('CANDLE');
      expect(normalized.candle?.open).toBe('16500.5');
      expect(normalized.candle?.high).toBe('16520');
      expect(normalized.candle?.timeframe).toBe('1M');
      expect(normalized.candle?.is_closed).toBe(true);

      const valRes = validatePayload('MARKET_EVENT', normalized);
      expect(valRes.valid).toBe(true);
    });

    it('normalizes Binance BookTicker (Tick) payload', () => {
      const rawTicker = {
        s: 'ETHUSDT',
        b: '1200.50',
        a: '1200.60',
        last_price: '1200.55',
        last_qty: '2.50'
      };

      const normalized = BinanceNormalizer.normalizeBookTicker(rawTicker);
      expect(normalized.symbol).toBe('ETHUSDT');
      expect(normalized.feed_type).toBe('TICK');
      expect(normalized.tick?.bid).toBe('1200.5');
      expect(normalized.tick?.ask).toBe('1200.6');

      const valRes = validatePayload('MARKET_EVENT', normalized);
      expect(valRes.valid).toBe(true);
    });

    it('normalizes Binance L2 Depth payload', () => {
      const rawDepth = {
        s: 'BTCUSDT',
        lastUpdateId: 50021,
        bids: [
          ['16500.00', '1.5'],
          ['16499.00', '2.0']
        ] as Array<[string, string]>,
        asks: [
          ['16501.00', '1.2'],
          ['16502.00', '3.1']
        ] as Array<[string, string]>
      };

      const normalized = BinanceNormalizer.normalizeDepth(rawDepth);
      expect(normalized.feed_type).toBe('ORDERBOOK_L2');
      expect(normalized.orderbook?.depth).toBe(2);
      expect(normalized.orderbook?.bids[0]).toEqual(['16500', '1.5']);

      const valRes = validatePayload('MARKET_EVENT', normalized);
      expect(valRes.valid).toBe(true);
    });
  });

  describe('cTrader Normalizer', () => {
    it('normalizes cTrader Spot Event (Tick) payload', () => {
      const rawSpot = {
        symbol: 'EURUSD',
        bid: '1.08500',
        ask: '1.08512'
      };

      const normalized = CTraderNormalizer.normalizeSpotEvent(rawSpot);
      expect(normalized.symbol).toBe('EURUSD');
      expect(normalized.feed_type).toBe('TICK');
      expect(normalized.tick?.bid).toBe('1.085');
      expect(normalized.tick?.ask).toBe('1.08512');

      const valRes = validatePayload('MARKET_EVENT', normalized);
      expect(valRes.valid).toBe(true);
    });

    it('normalizes cTrader Trendbar (Candle) payload', () => {
      const rawTrendbar = {
        symbol: 'XAUUSD',
        period: 'M15',
        open: '2400.10',
        high: '2405.50',
        low: '2398.00',
        close: '2403.20',
        volume: '1500',
        utcTimestampMs: 1672531200000,
        periodMinutes: 15
      };

      const normalized = CTraderNormalizer.normalizeTrendbar(rawTrendbar);
      expect(normalized.symbol).toBe('XAUUSD');
      expect(normalized.feed_type).toBe('CANDLE');
      expect(normalized.candle?.timeframe).toBe('15M');
      expect(normalized.candle?.close).toBe('2403.2');

      const valRes = validatePayload('MARKET_EVENT', normalized);
      expect(valRes.valid).toBe(true);
    });
  });
});
