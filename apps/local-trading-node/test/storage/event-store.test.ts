import { describe, it, expect } from 'vitest';
import { LocalEventStore } from '../../src/storage/event-store.js';
import type { EventEnvelope } from '@trade/contracts';

describe('Local Event Store', () => {
  it('appends and queries events by correlation ID and event type', async () => {
    const store = new LocalEventStore();

    const event1: EventEnvelope = {
      schema_version: '1.0.0',
      event_id: '018f3a55-0000-7000-8000-000000000001',
      correlation_id: '018f3a55-0000-7000-8000-000000000002',
      timestamp_exchange: new Date().toISOString(),
      timestamp_local: new Date().toISOString(),
      source: 'LOCAL_NODE',
      device_id: 'DEV_1',
      event_type: 'ORDER_INTENT',
      payload: { test: true }
    };

    const event2: EventEnvelope = {
      schema_version: '1.0.0',
      event_id: '018f3a55-0000-7000-8000-000000000003',
      correlation_id: '018f3a55-0000-7000-8000-000000000002',
      timestamp_exchange: new Date().toISOString(),
      timestamp_local: new Date().toISOString(),
      source: 'LOCAL_NODE',
      device_id: 'DEV_1',
      event_type: 'EXECUTION_REPORT',
      payload: { fill: true }
    };

    await store.append(event1);
    await store.append(event2);

    expect(store.count).toBe(2);

    const corrEvents = await store.getEventsByCorrelationId(event1.correlation_id);
    expect(corrEvents.length).toBe(2);

    const intentEvents = await store.getEventsByType('ORDER_INTENT');
    expect(intentEvents.length).toBe(1);
    expect(intentEvents[0]?.event_id).toBe(event1.event_id);
  });
});
