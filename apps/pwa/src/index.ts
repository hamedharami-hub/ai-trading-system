export * from './services/types.js';
export * from './services/node-client.js';
export * from './components/dashboard-model.js';
export * from './components/ui-renderer.js';

import type { EventEnvelope } from '@trade/contracts';

export function verifyPwaEnvelope(envelope: EventEnvelope): boolean {
  return envelope.schema_version === '1.0.0';
}
