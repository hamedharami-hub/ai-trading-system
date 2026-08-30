import { describe, it, expect } from 'vitest';
import { BracketManager } from '../../src/oms/bracket-manager.js';
import { validatePayload, Decimal } from '@trade/contracts';
import type { StrategyCandidatePayload, RiskDecisionPayload } from '@trade/contracts';

describe('Bracket Manager & OCO Orchestration', () => {
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

  it('creates bracket group and validates OrderIntentPayload against schema', () => {
    const { bracket, intent } = BracketManager.createBracket(candidate, risk);
    expect(bracket.state).toBe('PENDING_ENTRY');
    expect(intent.symbol).toBe('BTCUSDT');
    expect(intent.quantity).toBe('0.2');

    const valRes = validatePayload('ORDER_INTENT', intent);
    expect(valRes.valid).toBe(true);
  });

  it('handles entry fill and spawns SL and TP orders', () => {
    const { bracket } = BracketManager.createBracket(candidate, risk);
    BracketManager.handleEntryFill(bracket, new Decimal('65000'));

    expect(bracket.state).toBe('ACTIVE');
    expect(bracket.entryOrder.status).toBe('FILLED');
    expect(bracket.stopLossOrder).toBeDefined();
    expect(bracket.takeProfitOrder).toBeDefined();
    expect(bracket.stopLossOrder?.side).toBe('SELL');
    expect(bracket.takeProfitOrder?.side).toBe('SELL');
  });

  it('handles OCO take profit trigger by cancelling stop loss', () => {
    const { bracket } = BracketManager.createBracket(candidate, risk);
    BracketManager.handleEntryFill(bracket, new Decimal('65000'));
    BracketManager.handleExitTriggered(bracket, 'TAKE_PROFIT');

    expect(bracket.state).toBe('CLOSED');
    expect(bracket.takeProfitOrder?.status).toBe('FILLED');
    expect(bracket.stopLossOrder?.status).toBe('CANCELLED');
  });
});
