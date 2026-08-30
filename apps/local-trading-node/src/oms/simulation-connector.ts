import type { ExecutionReportPayload, OrderIntentPayload, UUIDv7 } from '@trade/contracts';
import type { CandleData } from '../features/types.js';
import { parseDecimal, toDecimalString, validatePayload, Decimal } from '@trade/contracts';

let reportCounter = 1;
function generateMockUUIDv7(): UUIDv7 {
  const hex = (reportCounter++).toString(16).padStart(12, '0');
  return `018f3a55-0000-7000-8000-${hex}` as UUIDv7;
}

export class SimulationConnector {
  /**
   * Evaluates order intent against incoming candle to produce simulated fill execution report.
   */
  public static simulateExecution(
    intent: OrderIntentPayload,
    candle: CandleData
  ): ExecutionReportPayload | null {
    const candleLow = candle.low;
    const candleHigh = candle.high;
    const limitPrice = intent.limit_price ? parseDecimal(intent.limit_price) : candle.open;
    const quantity = parseDecimal(intent.quantity);

    let isFilled = false;
    let fillPrice = limitPrice;

    if (intent.order_type === 'MARKET') {
      isFilled = true;
      fillPrice = candle.open;
    } else if (intent.side === 'BUY') {
      if (candleLow.lte(limitPrice)) {
        isFilled = true;
        fillPrice = limitPrice;
      }
    } else if (intent.side === 'SELL') {
      if (candleHigh.gte(limitPrice)) {
        isFilled = true;
        fillPrice = limitPrice;
      }
    }

    if (!isFilled) {
      return null;
    }

    const report: ExecutionReportPayload = {
      report_id: generateMockUUIDv7(),
      intent_id: intent.intent_id,
      broker_order_id: `SIM_ORD_${intent.intent_id.slice(-8)}`,
      symbol: intent.symbol,
      side: intent.side,
      status: 'FILLED',
      filled_quantity: toDecimalString(quantity),
      remaining_quantity: '0',
      average_fill_price: toDecimalString(fillPrice),
      last_fill_price: toDecimalString(fillPrice),
      last_fill_qty: toDecimalString(quantity),
      commission: '0.00',
      commission_asset: 'USDT',
      transact_time: new Date().toISOString()
    };

    // Strict schema validation
    const valRes = validatePayload('EXECUTION_REPORT', report);
    if (!valRes.valid) {
      throw new Error(`ExecutionReport failed schema validation: ${valRes.errors?.join('; ')}`);
    }

    return report;
  }
}
