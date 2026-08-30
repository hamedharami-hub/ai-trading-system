import { describe, it, expect, vi } from 'vitest';
import { NodeClient } from '../src/services/node-client.js';
import type { EventEnvelope } from '@trade/contracts';

describe('PWA Node Client', () => {
  it('handles event subscription and status updates', () => {
    const client = new NodeClient({
      nodeUrl: 'http://127.0.0.1:8765',
      sessionToken: 'test-token'
    });

    expect(client.connectionStatus).toBe('DISCONNECTED');

    const receivedEvents: EventEnvelope[] = [];
    client.onEvent((ev) => {
      receivedEvents.push(ev);
    });

    const envelope: EventEnvelope = {
      schema_version: '1.0.0',
      event_id: '018f3a55-0000-7000-8000-000000000001',
      correlation_id: '018f3a55-0000-7000-8000-000000000002',
      timestamp_exchange: new Date().toISOString(),
      timestamp_local: new Date().toISOString(),
      source: 'LOCAL_NODE',
      device_id: 'DEV_1',
      event_type: 'AUDIT_EVENT',
      payload: { audit_id: '018f3a55-0000-7000-8000-000000000001' }
    };

    client.handleIncomingEnvelope(envelope);
    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0]?.event_id).toBe(envelope.event_id);
  });
});
