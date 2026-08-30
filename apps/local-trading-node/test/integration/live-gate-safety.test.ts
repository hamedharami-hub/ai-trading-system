import { describe, it, expect } from 'vitest';
import { validatePayload } from '@trade/contracts';
import { SimulationConnector } from '../../src/oms/simulation-connector.js';

describe('Live Gate Safety & Governance Assertions', () => {
  it('enforces that order intents only produce simulated execution reports', () => {
    const report = SimulationConnector.simulateExecution(
      {
        intent_id: '018f3a55-0000-7000-8000-000000000001',
        candidate_id: '018f3a55-0000-7000-8000-000000000002',
        idempotency_key: 'IDEM_001',
        symbol: 'BTCUSDT',
        side: 'BUY',
        order_type: 'MARKET',
        quantity: '0.1',
        stop_loss_price: '64000',
        take_profit_price: '66000',
        time_in_force: 'IOC',
        created_at: new Date().toISOString()
      },
      {
        open: '65000',
        high: '65100',
        low: '64900',
        close: '65050',
        volume: '100',
        openTime: new Date().toISOString(),
        closeTime: new Date().toISOString()
      } as any
    );

    expect(report).toBeDefined();
    expect(report?.broker_order_id).toContain('SIM_');
    expect(report?.status).toBe('FILLED');

    const val = validatePayload('EXECUTION_REPORT', report!);
    expect(val.valid).toBe(true);
  });

  it('fails closed when invalid/malformed payloads are evaluated', () => {
    const invalidCandidate = {
      candidate_id: 'invalid-not-uuidv7',
      engine_type: 'SCALP',
      symbol: 'BTCUSDT',
      side: 'BUY'
    };

    const val = validatePayload('STRATEGY_CANDIDATE', invalidCandidate);
    expect(val.valid).toBe(false);
    expect(val.errors?.length).toBeGreaterThan(0);
  });
});
