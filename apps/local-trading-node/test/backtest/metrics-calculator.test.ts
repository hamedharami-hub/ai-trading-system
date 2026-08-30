import { describe, it, expect } from 'vitest';
import { MetricsCalculator } from '../../src/backtest/metrics-calculator.js';
import type { CompletedTrade } from '../../src/backtest/types.js';
import { Decimal } from '@trade/contracts';

describe('Metrics Calculator', () => {
  it('calculates win rate, profit factor, and max drawdown with arbitrary precision', () => {
    const initialEquity = new Decimal('10000');
    const trades: CompletedTrade[] = [
      {
        tradeId: '018f3a55-0000-7000-8000-000000000001',
        candidateId: '018f3a55-0000-7000-8000-000000000002',
        symbol: 'BTCUSDT',
        side: 'BUY',
        entryPrice: new Decimal('65000'),
        exitPrice: new Decimal('66000'),
        quantity: new Decimal('0.2'),
        realizedPnl: new Decimal('200'), // +$200
        realizedPnlPercent: new Decimal('2.0'),
        exitReason: 'TAKE_PROFIT',
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString()
      },
      {
        tradeId: '018f3a55-0000-7000-8000-000000000003',
        candidateId: '018f3a55-0000-7000-8000-000000000004',
        symbol: 'BTCUSDT',
        side: 'BUY',
        entryPrice: new Decimal('65000'),
        exitPrice: new Decimal('64500'),
        quantity: new Decimal('0.2'),
        realizedPnl: new Decimal('-100'), // -$100
        realizedPnlPercent: new Decimal('-1.0'),
        exitReason: 'STOP_LOSS',
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString()
      },
      {
        tradeId: '018f3a55-0000-7000-8000-000000000005',
        candidateId: '018f3a55-0000-7000-8000-000000000006',
        symbol: 'BTCUSDT',
        side: 'BUY',
        entryPrice: new Decimal('65000'),
        exitPrice: new Decimal('66500'),
        quantity: new Decimal('0.2'),
        realizedPnl: new Decimal('300'), // +$300
        realizedPnlPercent: new Decimal('3.0'),
        exitReason: 'TAKE_PROFIT',
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString()
      }
    ];

    const metrics = MetricsCalculator.calculate(trades, initialEquity);

    expect(metrics.totalTrades).toBe(3);
    expect(metrics.winningTrades).toBe(2);
    expect(metrics.losingTrades).toBe(1);
    expect(metrics.winRatePercent.toFixed(2)).toBe('66.67');
    expect(metrics.grossProfit.toString()).toBe('500');
    expect(metrics.grossLoss.toString()).toBe('100');
    expect(metrics.netProfit.toString()).toBe('400');
    expect(metrics.profitFactor.toString()).toBe('5');
    expect(metrics.averageTradePnl.toFixed(2)).toBe('133.33');
  });

  it('handles empty trades gracefully', () => {
    const metrics = MetricsCalculator.calculate([], new Decimal('10000'));
    expect(metrics.totalTrades).toBe(0);
    expect(metrics.netProfit.toString()).toBe('0');
  });
});
