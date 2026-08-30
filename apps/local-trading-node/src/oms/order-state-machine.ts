import type { OrderStatus } from '@trade/contracts';

const VALID_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_NEW: ['NEW', 'REJECTED', 'CANCELLED'],
  NEW: ['PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED'],
  PARTIALLY_FILLED: ['PARTIALLY_FILLED', 'FILLED', 'CANCELLED'],
  FILLED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: []
};

export class OrderStateMachine {
  public static isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
    const allowed = VALID_TRANSITIONS[current];
    return allowed ? allowed.includes(next) : false;
  }

  public static assertValidTransition(current: OrderStatus, next: OrderStatus, orderId?: string): void {
    if (!this.isValidTransition(current, next)) {
      throw new Error(
        `Invalid order status transition from "${current}" to "${next}"${orderId ? ` for order ${orderId}` : ''}`
      );
    }
  }

  public static isTerminal(status: OrderStatus): boolean {
    return VALID_TRANSITIONS[status]?.length === 0;
  }
}
