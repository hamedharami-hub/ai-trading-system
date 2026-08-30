import { describe, it, expect } from 'vitest';
import { BacktestRunner } from '../../src/backtest/backtest-runner.js';
import type { CandleData } from '../../src/features/types.js';
import { Decimal } from '@trade/contracts';

describe('Backtest Runner End-to-End Execution', () => {
  it('runs full backtest pipeline without errors', async () => {
    const baseTime = Date.now();
    const candles: CandleData[] = [];

    // Generate 30 sequential candles
    for (let i = 0; i < 30; i++) {
      const price = 65000 + i * 20;
      candles.push({
        open: new Decimal(price),
        high: new Decimal(price + 50),
        low: new Decimal(price - 30),
        close: new Decimal(price + 20),
        volume: new Decimal(100),
        openTime: new Date(baseTime + i * 60000).toISOString(),
        closeTime: new Date(baseTime + (i + 1) * 60000).toISOString()
      });
    }

    const runner = new BacktestRunner({
      symbol: 'BTCUSDT',
      timeframe: '5M',
      initialBalance: '10000',
      enableAIValidation: true
    });

    const result = await runner.run(candles);

    expect(result.config.symbol).toBe('BTCUSDT');
    expect(result.metrics).toBeDefined();
    expect(result.equityCurve.length).toBeGreaterThan(0);
    expect(result.finalEquity.toString()).toBe('10000');
  });
});
