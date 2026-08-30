import { Decimal, parseDecimal } from '@trade/contracts';
import type { CompletedTrade } from '../backtest/types.js';
import type { CandleData } from '../features/types.js';
import type { CounterfactualRecord, DailyReport } from './types.js';
import type { StrategyCandidatePayload } from '@trade/contracts';

export class ReportGenerator {
  /**
   * Generates End-of-Day report summarizing session performance and counterfactual outcomes.
   */
  public static generateDailyReport(
    date: string,
    trades: CompletedTrade[],
    dailyLossLimitBreached: boolean,
    counterfactuals: CounterfactualRecord[] = []
  ): DailyReport {
    const totalTrades = trades.length;
    let realizedPnl = new Decimal(0);
    let winningTrades = 0;

    for (const trade of trades) {
      realizedPnl = realizedPnl.plus(trade.realizedPnl);
      if (trade.realizedPnl.gt(0)) {
        winningTrades++;
      }
    }

    const winRatePercent = totalTrades > 0
      ? new Decimal(winningTrades).dividedBy(totalTrades).times(100)
      : new Decimal(0);

    return {
      date,
      totalTrades,
      realizedPnl,
      winRatePercent,
      maxDailyDrawdownPercent: new Decimal(0),
      dailyLossLimitStatus: dailyLossLimitBreached ? 'BREACHED' : 'OK',
      counterfactualEvaluations: counterfactuals
    };
  }

  /**
   * Analyzes a rejected candidate against subsequent candles to check if it would have won or lost.
   */
  public static evaluateCounterfactual(
    candidate: StrategyCandidatePayload,
    subsequentCandles: CandleData[],
    rejectedBy: 'STRATEGY_GRADER' | 'AI_JUDGE' | 'RISK_CORE' | 'HUMAN',
    rejectionReason: string
  ): CounterfactualRecord {
    const entryPrice = parseDecimal(candidate.entry_price);
    const stopLossPrice = parseDecimal(candidate.invalidation_price);
    const takeProfitPrice = parseDecimal(candidate.target_price);

    let entered = false;
    let potentialOutcome: 'WOULD_HAVE_WON' | 'WOULD_HAVE_LOST' | 'UNDETERMINED' = 'UNDETERMINED';

    for (const candle of subsequentCandles) {
      if (!entered) {
        if (candidate.side === 'BUY' && candle.low.lte(entryPrice)) {
          entered = true;
        } else if (candidate.side === 'SELL' && candle.high.gte(entryPrice)) {
          entered = true;
        }
      }

      if (entered) {
        if (candidate.side === 'BUY') {
          if (candle.low.lte(stopLossPrice)) {
            potentialOutcome = 'WOULD_HAVE_LOST';
            break;
          } else if (candle.high.gte(takeProfitPrice)) {
            potentialOutcome = 'WOULD_HAVE_WON';
            break;
          }
        } else if (candidate.side === 'SELL') {
          if (candle.high.gte(stopLossPrice)) {
            potentialOutcome = 'WOULD_HAVE_LOST';
            break;
          } else if (candle.low.lte(takeProfitPrice)) {
            potentialOutcome = 'WOULD_HAVE_WON';
            break;
          }
        }
      }
    }

    return {
      candidateId: candidate.candidate_id,
      rejectedBy,
      rejectionReason,
      potentialOutcome,
      evaluatedAt: new Date().toISOString()
    };
  }
}
