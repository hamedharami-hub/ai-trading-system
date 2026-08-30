// crypto.randomUUID() available natively in browsers and Node.js 19+
import type { EventEnvelope, MarketEventPayload, MarketId } from '@trade/contracts';
import { validateFullEvent } from '@trade/contracts';
import { ClockSyncTracker } from './clock-sync.js';
import { SequenceTracker } from './sequence-tracker.js';
import type { FeedHealth, FeedStatus, FeedSubscription } from './types.js';

export interface FeedManagerConfig {
  deviceId: string;
  sourceVenue: string;
}

export class FeedManager {
  private subscriptions = new Map<MarketId, FeedSubscription>();
  private clockSyncTrackers = new Map<MarketId, ClockSyncTracker>();
  private sequenceTrackers = new Map<string, SequenceTracker<MarketEventPayload>>();
  private feedStatuses = new Map<MarketId, FeedStatus>();
  private eventListeners: Array<(envelope: EventEnvelope) => void> = [];

  constructor(private readonly config: FeedManagerConfig) {}

  public subscribe(sub: FeedSubscription): void {
    this.subscriptions.set(sub.symbol, sub);
    this.feedStatuses.set(sub.symbol, 'CONNECTED');
    if (!this.clockSyncTrackers.has(sub.symbol)) {
      this.clockSyncTrackers.set(sub.symbol, new ClockSyncTracker());
    }
  }

  public unsubscribe(symbol: MarketId): void {
    this.subscriptions.delete(symbol);
    this.feedStatuses.delete(symbol);
    this.clockSyncTrackers.delete(symbol);
  }

  public onEvent(listener: (envelope: EventEnvelope) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Ingests a normalized market event payload, verifies clock drift and sequence,
   * wraps in an authoritative EventEnvelope, validates via Ajv, and publishes.
   */
  public ingestPayload(
    payload: MarketEventPayload,
    exchangeTimestampISO: string,
    sequenceNumber?: number,
    correlationId: string = crypto.randomUUID()
  ): EventEnvelope {
    const symbol = payload.symbol;
    const nowMs = Date.now();
    const localTimestampISO = new Date(nowMs).toISOString();

    // 1. Clock drift tracking
    const clockTracker = this.clockSyncTrackers.get(symbol) ?? new ClockSyncTracker();
    clockTracker.recordSample(exchangeTimestampISO, nowMs);

    if (clockTracker.isDriftExceeded()) {
      this.feedStatuses.set(symbol, 'DEGRADED');
    } else {
      this.feedStatuses.set(symbol, 'CONNECTED');
    }

    // 2. Sequence tracking (if channel supports sequence numbers)
    if (sequenceNumber !== undefined) {
      const channelKey = `${symbol}:${payload.feed_type}`;
      let seqTracker = this.sequenceTrackers.get(channelKey);
      if (!seqTracker) {
        seqTracker = new SequenceTracker();
        this.sequenceTrackers.set(channelKey, seqTracker);
      }

      const seqRes = seqTracker.ingest(sequenceNumber, payload);
      if (seqRes.status === 'GAP_DETECTED') {
        this.feedStatuses.set(symbol, 'STALE');
        throw new Error(
          `Sequence gap detected for ${channelKey}! Expected: ${seqRes.gapDetails?.expected}, Received: ${seqRes.gapDetails?.received}`
        );
      }
    }

    // 3. Construct EventEnvelope
    const envelope: EventEnvelope = {
      schema_version: '1.0.0',
      event_id: crypto.randomUUID(),
      correlation_id: correlationId,
      timestamp_exchange: exchangeTimestampISO,
      timestamp_local: localTimestampISO,
      source: this.config.sourceVenue,
      device_id: this.config.deviceId,
      event_type: 'MARKET_EVENT',
      payload: payload as unknown as Record<string, unknown>
    };

    // 4. Strict Schema Validation (Fail-closed)
    const valRes = validateFullEvent(envelope);
    if (!valRes.valid) {
      this.feedStatuses.set(symbol, 'DEGRADED');
      throw new Error(`Market event failed schema validation: ${valRes.errors?.join('; ')}`);
    }

    // 5. Emit to listeners
    for (const listener of this.eventListeners) {
      listener(envelope);
    }

    return envelope;
  }

  public getHealth(symbol: MarketId): FeedHealth | undefined {
    const status = this.feedStatuses.get(symbol);
    if (!status) return undefined;

    const clockTracker = this.clockSyncTrackers.get(symbol);
    const seqTracker = this.sequenceTrackers.get(`${symbol}:CANDLE`) || this.sequenceTrackers.get(`${symbol}:TICK`);

    return {
      symbol,
      status,
      lastMessageTimestampExchange: clockTracker ? new Date(clockTracker.getLastExchangeTime()).toISOString() : null,
      lastMessageTimestampLocal: null,
      latencyMs: clockTracker ? Math.abs(clockTracker.getSmoothedOffsetMs()) : 0,
      clockOffsetMs: clockTracker ? clockTracker.getSmoothedOffsetMs() : 0,
      lastSequenceNumber: seqTracker ? seqTracker.getExpectedSequence() : 0,
      gapCount: seqTracker ? seqTracker.getGapCount() : 0,
      isStale: clockTracker ? clockTracker.isStale() : true
    };
  }
}
