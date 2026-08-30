import { describe, it, expect } from 'vitest';
import { FeedManager } from '../../src/feed/feed-manager.js';
import { ReconnectHandler } from '../../src/feed/reconnect-handler.js';
import { BinanceNormalizer } from '../../src/feed/normalizers/binance-normalizer.js';
import type { EventEnvelope } from '@trade/contracts';

describe('Feed Manager & Reconnect Handler', () => {
  it('manages subscription and generates valid schema-compliant EventEnvelopes', () => {
    const manager = new FeedManager({ deviceId: 'win-node-test', sourceVenue: 'BINANCE_SPOT' });
    manager.subscribe({ symbol: 'BTCUSDT', channels: ['CANDLE'], timeframe: '1M' });

    let capturedEvent: EventEnvelope | null = null;
    manager.onEvent((event) => {
      capturedEvent = event;
    });

    const nowMs = Date.now();
    const rawKline = {
      s: 'BTCUSDT',
      k: {
        t: nowMs - 60000,
        T: nowMs - 1000,
        i: '1m',
        o: '16500.00',
        h: '16520.00',
        l: '16490.00',
        c: '16515.00',
        v: '10.0',
        x: true
      }
    };

    const normalized = BinanceNormalizer.normalizeKline(rawKline);
    const envelope = manager.ingestPayload(normalized, new Date(nowMs - 50).toISOString(), 1);

    expect(envelope.schema_version).toBe('1.0.0');
    expect(envelope.event_type).toBe('MARKET_EVENT');
    expect(envelope.source).toBe('BINANCE_SPOT');
    expect(capturedEvent).toBe(envelope);

    const health = manager.getHealth('BTCUSDT');
    expect(health?.status).toBe('CONNECTED');
    expect(health?.symbol).toBe('BTCUSDT');
  });

  it('calculates exponential backoff delay with jitter', () => {
    const reconnect = new ReconnectHandler({
      initialDelayMs: 100,
      maxDelayMs: 1000,
      multiplier: 2,
      jitterRatio: 0.1,
      maxAttempts: 3
    });

    expect(reconnect.shouldRetry()).toBe(true);
    const d1 = reconnect.getNextDelayMs();
    expect(d1).toBeGreaterThanOrEqual(90);
    expect(d1).toBeLessThanOrEqual(110);

    const d2 = reconnect.getNextDelayMs();
    expect(d2).toBeGreaterThanOrEqual(180);
    expect(d2).toBeLessThanOrEqual(220);

    reconnect.getNextDelayMs();
    expect(reconnect.shouldRetry()).toBe(false);
  });
});
