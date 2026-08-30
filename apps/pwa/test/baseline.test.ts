import { describe, it, expect } from 'vitest';
import { verifyPwaEnvelope } from '../src/index.js';
import type { EventEnvelope } from '@trade/contracts';

describe('PWA Baseline', () => {
  it('imports and typechecks contracts envelope', () => {
    const mockEnvelope: EventEnvelope = {
      schema_version: '1.0.0',
      event_id: '018f3a9e-64c2-7b00-8000-000000000001',
      correlation_id: '018f3a9e-64c2-7b00-8000-000000000002',
      timestamp_exchange: '2026-08-30T07:00:00.000Z',
      timestamp_local: '2026-08-30T07:00:00.100Z',
      source: 'PWA',
      device_id: 'pwa-client-01',
      event_type: 'AUDIT_EVENT',
      payload: {}
    };

    expect(verifyPwaEnvelope(mockEnvelope)).toBe(true);
  });
});
