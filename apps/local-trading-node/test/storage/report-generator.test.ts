import { describe, it, expect } from 'vitest';
import { ReportGenerator } from '../../src/storage/report-generator.js';
import type { CompletedTrade } from '../../src/backtest/types.js';
import type { CandleData } from '../../src/features/types.js';
import type { StrategyCandidatePayload } from '@trade/contracts';
import { Decimal } from '@trade/contracts';

describe('Report Generator & Counterfactual Analysis', () => {
  it('generates daily session report', () => {
    const trades: CompletedTrade[] = [
      {
        tradeId: '018f3a55-0000-7000-8000-000000000001',
        candidateId: '018f3a55-0000-7000-8000-000000000002',
        symbol: 'BTCUSDT',
        side: 'BUY',
        entryPrice: new Decimal('65000'),
        exitPrice: new Decimal('66000'),
        quantity: new Decimal('0.2'),
        realizedPnl: new Decimal('200'),
        realizedPnlPercent: new Decimal('2.0'),
        exitReason: 'TAKE_PROFIT',
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString()
      }
    ];

    const report = ReportGenerator.generateDailyReport('2026-08-30', trades, false);

    expect(report.date).toBe('2026-08-30');
    expect(report.totalTrades).toBe(1);
    expect(report.realizedPnl.toString()).toBe('200');
    expect(report.dailyLossLimitStatus).toBe('OK');
  });

  it('evaluates counterfactual outcome of a rejected candidate', () => {
    const candidate: StrategyCandidatePayload = {
      candidate_id: '018f3a55-0000-7000-8000-000000000001',
      engine_type: 'SCALP',
      symbol: 'BTCUSDT',
      side: 'BUY',
      grade: 'C',
      entry_price: '65000',
      invalidation_price: '64500',
      target_price: '66000',
      risk_reward_ratio: '2.00',
      expiry_candles: 5,
      generated_at: new Date().toISOString()
    };

    const subsequentCandles: CandleData[] = [
      {
        open: new Decimal('65200'),
        high: new Decimal('65300'),
        low: new Decimal('64950'), // Touches entry (65000)
        close: new Decimal('65100'),
        volume: new Decimal('100'),
        openTime: new Date().toISOString(),
        closeTime: new Date().toISOString()
      },
      {
        open: new Decimal('65100'),
        high: new Decimal('66200'), // Touches TP (66000)
        low: new Decimal('64900'),
        close: new Decimal('66100'),
        volume: new Decimal('100'),
        openTime: new Date().toISOString(),
        closeTime: new Date().toISOString()
      }
    ];

    const cf = ReportGenerator.evaluateCounterfactual(
      candidate,
      subsequentCandles,
      'STRATEGY_GRADER',
      'Grade C lower than minimum threshold'
    );

    expect(cf.candidateId).toBe(candidate.candidate_id);
    expect(cf.rejectedBy).toBe('STRATEGY_GRADER');
    expect(cf.potentialOutcome).toBe('WOULD_HAVE_WON');
  });
});
