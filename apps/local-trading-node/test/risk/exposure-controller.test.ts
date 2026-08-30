import { describe, it, expect } from 'vitest';
import { ExposureController } from '../../src/risk/exposure-controller.js';
import { DEFAULT_RISK_CONFIG } from '../../src/risk/risk-core.js';
import type { AccountState, OpenPosition } from '../../src/risk/types.js';
import type { StrategyCandidatePayload } from '@trade/contracts';
import { Decimal } from '@trade/contracts';

describe('Exposure Controller', () => {
  const candidate: StrategyCandidatePayload = {
    candidate_id: '018f3a55-0000-7000-8000-000000000001',
    engine_type: 'SCALP',
    symbol: 'BTCUSDT',
    side: 'BUY',
    grade: 'A',
    entry_price: '65000',
    invalidation_price: '64800',
    target_price: '65400',
    risk_reward_ratio: '2.00',
    expiry_candles: 5,
    generated_at: new Date().toISOString()
  };

  it('rejects candidate if max concurrent positions (3) reached', () => {
    const controller = new ExposureController(DEFAULT_RISK_CONFIG);
    const openPositions: OpenPosition[] = [
      { symbol: 'EURUSD', side: 'BUY', quantity: new Decimal('1'), entryPrice: new Decimal('1'), stopLossPrice: new Decimal('1'), riskAmount: new Decimal('100'), riskPercent: new Decimal('0.01') },
      { symbol: 'GBPUSD', side: 'BUY', quantity: new Decimal('1'), entryPrice: new Decimal('1'), stopLossPrice: new Decimal('1'), riskAmount: new Decimal('100'), riskPercent: new Decimal('0.01') },
      { symbol: 'XAUUSD', side: 'BUY', quantity: new Decimal('1'), entryPrice: new Decimal('1'), stopLossPrice: new Decimal('1'), riskAmount: new Decimal('100'), riskPercent: new Decimal('0.01') }
    ];

    const account: AccountState = {
      equity: new Decimal('10000'),
      balance: new Decimal('10000'),
      highWaterMark: new Decimal('10000'),
      dailyRealizedLoss: new Decimal('0'),
      openPositions,
      consecutiveLosses: 0
    };

    const status = controller.checkExposure(account, candidate, new Decimal('0.01'));
    expect(status.passed).toBe(false);
    expect(status.reason).toContain('Maximum concurrent positions reached');
  });

  it('rejects candidate if same symbol/side position is already open', () => {
    const controller = new ExposureController(DEFAULT_RISK_CONFIG);
    const openPositions: OpenPosition[] = [
      { symbol: 'BTCUSDT', side: 'BUY', quantity: new Decimal('0.1'), entryPrice: new Decimal('64000'), stopLossPrice: new Decimal('63500'), riskAmount: new Decimal('50'), riskPercent: new Decimal('0.005') }
    ];

    const account: AccountState = {
      equity: new Decimal('10000'),
      balance: new Decimal('10000'),
      highWaterMark: new Decimal('10000'),
      dailyRealizedLoss: new Decimal('0'),
      openPositions,
      consecutiveLosses: 0
    };

    const status = controller.checkExposure(account, candidate, new Decimal('0.01'));
    expect(status.passed).toBe(false);
    expect(status.reason).toContain('Position already open on BTCUSDT');
  });
});
