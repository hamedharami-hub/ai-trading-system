import { Decimal } from '@trade/contracts';
import type { CompletedTrade, PerformanceMetrics } from './types.js';

export class MetricsCalculator {
  public static calculate(trades: CompletedTrade[], initialEquity: Decimal): PerformanceMetrics {
    const totalTrades = trades.length;

    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRatePercent: new Decimal(0),
        grossProfit: new Decimal(0),
        grossLoss: new Decimal(0),
        netProfit: new Decimal(0),
        profitFactor: new Decimal(0),
        maxDrawdownPercent: new Decimal(0),
        maxConsecutiveLosses: 0,
        averageTradePnl: new Decimal(0)
      };
    }

    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = new Decimal(0);
    let grossLoss = new Decimal(0);
    let netProfit = new Decimal(0);
    let runningEquity = initialEquity;
    let highWaterMark = initialEquity;
    let maxDrawdownPercent = new Decimal(0);
    let currentConsecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    for (const trade of trades) {
      netProfit = netProfit.plus(trade.realizedPnl);
      runningEquity = runningEquity.plus(trade.realizedPnl);

      if (runningEquity.gt(highWaterMark)) {
        highWaterMark = runningEquity;
      } else if (highWaterMark.gt(0)) {
        const dd = highWaterMark.minus(runningEquity).dividedBy(highWaterMark);
        if (dd.gt(maxDrawdownPercent)) {
          maxDrawdownPercent = dd;
        }
      }

      if (trade.realizedPnl.gt(0)) {
        winningTrades++;
        grossProfit = grossProfit.plus(trade.realizedPnl);
        currentConsecutiveLosses = 0;
      } else if (trade.realizedPnl.lt(0)) {
        losingTrades++;
        grossLoss = grossLoss.plus(trade.realizedPnl.abs());
        currentConsecutiveLosses++;
        if (currentConsecutiveLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentConsecutiveLosses;
        }
      }
    }

    const winRatePercent = new Decimal(winningTrades).dividedBy(totalTrades).times(100);
    const profitFactor = grossLoss.gt(0) ? grossProfit.dividedBy(grossLoss) : grossProfit;
    const averageTradePnl = netProfit.dividedBy(totalTrades);

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRatePercent,
      grossProfit,
      grossLoss,
      netProfit,
      profitFactor,
      maxDrawdownPercent: maxDrawdownPercent.times(100),
      maxConsecutiveLosses,
      averageTradePnl
    };
  }
}
