import type { OrderIntentPayload, RiskDecisionPayload, StrategyCandidatePayload, UUIDv7 } from '@trade/contracts';
import { parseDecimal, toDecimalString, validatePayload, Decimal } from '@trade/contracts';
import type { BracketOrderGroup, OMSOrder } from './types.js';

let bracketCounter = 1;
function generateMockUUIDv7(): UUIDv7 {
  const hex = (bracketCounter++).toString(16).padStart(12, '0');
  return `018f3a55-0000-7000-8000-${hex}` as UUIDv7;
}

export class BracketManager {
  /**
   * Creates a Bracket Order Group and canonical OrderIntentPayload from StrategyCandidate and RiskDecision.
   */
  public static createBracket(
    candidate: StrategyCandidatePayload,
    risk: RiskDecisionPayload
  ): { bracket: BracketOrderGroup; intent: OrderIntentPayload } {
    if (risk.status !== 'APPROVED') {
      throw new Error(`Cannot create bracket order for rejected risk decision (${candidate.candidate_id})`);
    }

    const intentId = generateMockUUIDv7();
    const bracketId = generateMockUUIDv7();
    const entryPrice = parseDecimal(candidate.entry_price);
    const stopLossPrice = parseDecimal(candidate.invalidation_price);
    const takeProfitPrice = parseDecimal(candidate.target_price);
    const quantity = parseDecimal(risk.quantized_quantity);

    const intent: OrderIntentPayload = {
      intent_id: intentId,
      candidate_id: candidate.candidate_id,
      idempotency_key: `IDEM_${candidate.candidate_id}`,
      symbol: candidate.symbol,
      side: candidate.side,
      order_type: 'LIMIT',
      quantity: toDecimalString(quantity),
      limit_price: toDecimalString(entryPrice),
      stop_loss_price: toDecimalString(stopLossPrice),
      take_profit_price: toDecimalString(takeProfitPrice),
      time_in_force: 'GTC',
      created_at: new Date().toISOString()
    };

    // Schema validation (Fail-closed)
    const valRes = validatePayload('ORDER_INTENT', intent);
    if (!valRes.valid) {
      throw new Error(`OrderIntent failed schema validation: ${valRes.errors?.join('; ')}`);
    }

    const entryOrder: OMSOrder = {
      orderId: generateMockUUIDv7(),
      intentId,
      candidateId: candidate.candidate_id,
      symbol: candidate.symbol,
      side: candidate.side,
      orderType: 'LIMIT',
      quantity,
      limitPrice: entryPrice,
      status: 'PENDING_NEW',
      filledQuantity: new Decimal(0),
      remainingQuantity: quantity,
      expiryCandlesRemaining: candidate.expiry_candles,
      createdAt: intent.created_at,
      updatedAt: intent.created_at
    };

    const bracket: BracketOrderGroup = {
      bracketId,
      candidateId: candidate.candidate_id,
      symbol: candidate.symbol,
      side: candidate.side,
      state: 'PENDING_ENTRY',
      entryOrder,
      stopLossPrice,
      takeProfitPrice
    };

    return { bracket, intent };
  }

  /**
   * Activates bracket once entry is filled, setting up SL/TP orders.
   */
  public static handleEntryFill(bracket: BracketOrderGroup, fillPrice: Decimal): void {
    bracket.state = 'ACTIVE';
    bracket.entryOrder.status = 'FILLED';
    bracket.entryOrder.averageFillPrice = fillPrice;
    bracket.entryOrder.filledQuantity = bracket.entryOrder.quantity;
    bracket.entryOrder.remainingQuantity = new Decimal(0);
    bracket.entryOrder.updatedAt = new Date().toISOString();

    const exitSide = bracket.side === 'BUY' ? 'SELL' : 'BUY';

    // Stop Loss Order
    bracket.stopLossOrder = {
      orderId: generateMockUUIDv7(),
      intentId: generateMockUUIDv7(),
      candidateId: bracket.candidateId,
      symbol: bracket.symbol,
      side: exitSide,
      orderType: 'STOP_LIMIT',
      quantity: bracket.entryOrder.quantity,
      stopPrice: bracket.stopLossPrice,
      limitPrice: bracket.stopLossPrice,
      status: 'NEW',
      filledQuantity: new Decimal(0),
      remainingQuantity: bracket.entryOrder.quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Take Profit Order
    bracket.takeProfitOrder = {
      orderId: generateMockUUIDv7(),
      intentId: generateMockUUIDv7(),
      candidateId: bracket.candidateId,
      symbol: bracket.symbol,
      side: exitSide,
      orderType: 'LIMIT',
      quantity: bracket.entryOrder.quantity,
      limitPrice: bracket.takeProfitPrice,
      status: 'NEW',
      filledQuantity: new Decimal(0),
      remainingQuantity: bracket.entryOrder.quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * OCO resolution when either SL or TP is triggered.
   */
  public static handleExitTriggered(
    bracket: BracketOrderGroup,
    triggered: 'STOP_LOSS' | 'TAKE_PROFIT'
  ): void {
    bracket.state = 'CLOSED';
    const now = new Date().toISOString();

    if (triggered === 'STOP_LOSS') {
      if (bracket.stopLossOrder) {
        bracket.stopLossOrder.status = 'FILLED';
        bracket.stopLossOrder.updatedAt = now;
      }
      if (bracket.takeProfitOrder) {
        bracket.takeProfitOrder.status = 'CANCELLED';
        bracket.takeProfitOrder.updatedAt = now;
      }
    } else {
      if (bracket.takeProfitOrder) {
        bracket.takeProfitOrder.status = 'FILLED';
        bracket.takeProfitOrder.updatedAt = now;
      }
      if (bracket.stopLossOrder) {
        bracket.stopLossOrder.status = 'CANCELLED';
        bracket.stopLossOrder.updatedAt = now;
      }
    }
  }
}
