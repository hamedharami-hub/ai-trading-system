import { describe, it, expect } from 'vitest';
import { SimulationConnector } from '../../src/oms/simulation-connector.js';
import { validatePayload, Decimal } from '@trade/contracts';
import type { OrderIntentPayload } from '@trade/contracts';
import type { CandleData } from '../../src/features/types.js';

describe('Simulation Connector (Paper Matching Engine)', () => {
  const intent: OrderIntentPayload = {
    intent_id: '018f3a55-0000-7000-8000-000000000001',
    candidate_id: '018f3a55-0000-7000-8000-000000000002',
    idempotency_key: 'IDEM_1',
    symbol: 'BTCUSDT',
    side: 'BUY',
    order_type: 'LIMIT',
    quantity: '0.2000',
    limit_price: '65000',
    stop_loss_price: '64500',
    take_profit_price: '66000',
    time_in_force: 'GTC',
    created_at: new Date().toISOString()
  };

  it('fills BUY limit order when candle low touches limit price', () => {
    const matchingCandle: CandleData = {
      open: new Decimal('65200'),
      high: new Decimal('65300'),
      low: new Decimal('64950'), // Low touches 65000 limit
      close: new Decimal('65100'),
      volume: new Decimal('100'),
      openTime: new Date().toISOString(),
      closeTime: new Date().toISOString()
    };

    const report = SimulationConnector.simulateExecution(intent, matchingCandle);
    expect(report).not.toBeNull();
    expect(report?.status).toBe('FILLED');
    expect(report?.average_fill_price).toBe('65000');

    const valRes = validatePayload('EXECUTION_REPORT', report!);
    expect(valRes.valid).toBe(true);
  });

  it('does not fill BUY limit order if candle low remains above limit price', () => {
    const nonMatchingCandle: CandleData = {
      open: new Decimal('65500'),
      high: new Decimal('65800'),
      low: new Decimal('65200'), // Low is above 65000 limit
      close: new Decimal('65600'),
      volume: new Decimal('100'),
      openTime: new Date().toISOString(),
      closeTime: new Date().toISOString()
    };

    const report = SimulationConnector.simulateExecution(intent, nonMatchingCandle);
    expect(report).toBeNull();
  });
});
