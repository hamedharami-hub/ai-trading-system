import type { ExecutionReportPayload, OrderIntentPayload, RiskDecisionPayload, StrategyCandidatePayload, UUIDv7, MarketId } from '@trade/contracts';
import type { CandleData } from '../features/types.js';
import { parseDecimal, Decimal } from '@trade/contracts';
import type { BracketOrderGroup, PositionRecord } from './types.js';
import { BracketManager } from './bracket-manager.js';
import { SimulationConnector } from './simulation-connector.js';

let posCounter = 1;
function generateMockUUIDv7(): UUIDv7 {
  const hex = (posCounter++).toString(16).padStart(12, '0');
  return `018f3a55-0000-7000-8000-${hex}` as UUIDv7;
}

export class OrderManager {
  private brackets = new Map<UUIDv7, BracketOrderGroup>();
  private activePositions = new Map<UUIDv7, PositionRecord>();
  private executionReports: ExecutionReportPayload[] = [];

  public submitApprovedCandidate(
    candidate: StrategyCandidatePayload,
    risk: RiskDecisionPayload
  ): { bracket: BracketOrderGroup; intent: OrderIntentPayload } {
    const { bracket, intent } = BracketManager.createBracket(candidate, risk);
    this.brackets.set(bracket.bracketId, bracket);
    return { bracket, intent };
  }

  /**
   * Evaluates market updates (candles) against pending and active bracket orders.
   */
  public processMarketCandle(symbol: MarketId, candle: CandleData): ExecutionReportPayload[] {
    const emittedReports: ExecutionReportPayload[] = [];
    const candleLow = candle.low;
    const candleHigh = candle.high;

    for (const bracket of this.brackets.values()) {
      if (bracket.symbol !== symbol) continue;

      // 1. Pending Entry Check
      if (bracket.state === 'PENDING_ENTRY') {
        const intentPayload: OrderIntentPayload = {
          intent_id: bracket.entryOrder.intentId,
          candidate_id: bracket.candidateId,
          idempotency_key: `IDEM_${bracket.candidateId}`,
          symbol: bracket.symbol,
          side: bracket.side,
          order_type: bracket.entryOrder.orderType,
          quantity: bracket.entryOrder.quantity.toString(),
          stop_loss_price: bracket.stopLossPrice.toString(),
          take_profit_price: bracket.takeProfitPrice.toString(),
          time_in_force: 'GTC',
          created_at: bracket.entryOrder.createdAt
        };
        if (bracket.entryOrder.limitPrice) {
          intentPayload.limit_price = bracket.entryOrder.limitPrice.toString();
        }

        const report = SimulationConnector.simulateExecution(intentPayload, candle);

        if (report) {
          const fillPrice = parseDecimal(report.average_fill_price || report.last_fill_price || candle.open);
          BracketManager.handleEntryFill(bracket, fillPrice);
          emittedReports.push(report);
          this.executionReports.push(report);

          // Open Position Record
          const posId = generateMockUUIDv7();
          this.activePositions.set(posId, {
            positionId: posId,
            candidateId: bracket.candidateId,
            symbol: bracket.symbol,
            side: bracket.side,
            quantity: bracket.entryOrder.quantity,
            entryPrice: fillPrice,
            stopLossPrice: bracket.stopLossPrice,
            takeProfitPrice: bracket.takeProfitPrice,
            openedAt: report.transact_time,
            unrealizedPnl: new Decimal(0)
          });
        }
      } else if (bracket.state === 'ACTIVE') {
        // 2. Active Bracket SL/TP Trigger Check
        if (bracket.side === 'BUY') {
          if (candleLow.lte(bracket.stopLossPrice)) {
            BracketManager.handleExitTriggered(bracket, 'STOP_LOSS');
          } else if (candleHigh.gte(bracket.takeProfitPrice)) {
            BracketManager.handleExitTriggered(bracket, 'TAKE_PROFIT');
          }
        } else if (bracket.side === 'SELL') {
          if (candleHigh.gte(bracket.stopLossPrice)) {
            BracketManager.handleExitTriggered(bracket, 'STOP_LOSS');
          } else if (candleLow.lte(bracket.takeProfitPrice)) {
            BracketManager.handleExitTriggered(bracket, 'TAKE_PROFIT');
          }
        }
      }
    }

    return emittedReports;
  }

  public getActivePositions(): PositionRecord[] {
    return Array.from(this.activePositions.values());
  }

  public getExecutionReports(): ExecutionReportPayload[] {
    return [...this.executionReports];
  }
}
