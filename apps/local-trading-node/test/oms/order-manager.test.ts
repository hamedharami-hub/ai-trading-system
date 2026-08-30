import { describe, it, expect } from 'vitest';
import { OrderManager } from '../../src/oms/order-manager.js';
import { Decimal } from '@trade/contracts';
import type { RiskDecisionPayload, StrategyCandidatePayload } from '@trade/contracts';
import type { CandleData } from '../../src/features/types.js';

describe('Order Manager End-to-End Orchestration', () => {
  const candidate: StrategyCandidatePayload = {
    candidate_id: '018f3a55-0000-7000-8000-000000000001',
    engine_type: 'SCALP',
    symbol: 'BTCUSDT',
    side: 'BUY',
    grade: 'A',
    entry_price: '65000',
    invalidation_price: '64500',
    target_price: '66000',
    risk_reward_ratio: '2.00',
    expiry_candles: 5,
    generated_at: new Date().toISOString()
  };

  const risk: RiskDecisionPayload = {
    candidate_id: candidate.candidate_id,
    status: 'APPROVED',
    approved_risk_percent: '0.0100',
    calculated_quantity: '0.2000',
    quantized_quantity: '0.2000',
    estimated_risk_amount: '100.00',
    portfolio_open_risk_percent: '0.0000',
    concurrent_positions_count: 0,
    daily_loss_percent: '0.0000',
    drawdown_state: 'NORMAL',
    rejection_reasons: [],
    evaluated_at: new Date().toISOString()
  };

  it('orchestrates candidate approval -> simulated fill -> position creation', () => {
    const om = new OrderManager();
    const { bracket, intent } = om.submitApprovedCandidate(candidate, risk);

    expect(bracket.state).toBe('PENDING_ENTRY');
    expect(intent.symbol).toBe('BTCUSDT');

    const candle: CandleData = {
      open: new Decimal('65200'),
      high: new Decimal('65300'),
      low: new Decimal('64900'), // Low touches entry
      close: new Decimal('65100'),
      volume: new Decimal('100'),
      openTime: new Date().toISOString(),
      closeTime: new Date().toISOString()
    };

    const reports = om.processMarketCandle('BTCUSDT', candle);
    expect(reports.length).toBe(1);
    expect(reports[0]?.status).toBe('FILLED');

    const positions = om.getActivePositions();
    expect(positions.length).toBe(1);
    expect(positions[0]?.symbol).toBe('BTCUSDT');
    expect(positions[0]?.side).toBe('BUY');
  });
});
