import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../../src/oms/order-state-machine.js';

describe('Order State Machine', () => {
  it('validates legal transitions correctly', () => {
    expect(OrderStateMachine.isValidTransition('PENDING_NEW', 'NEW')).toBe(true);
    expect(OrderStateMachine.isValidTransition('NEW', 'FILLED')).toBe(true);
    expect(OrderStateMachine.isValidTransition('NEW', 'CANCELLED')).toBe(true);
    expect(OrderStateMachine.isValidTransition('PARTIALLY_FILLED', 'FILLED')).toBe(true);
  });

  it('rejects illegal transitions and throws assertion errors', () => {
    expect(OrderStateMachine.isValidTransition('FILLED', 'CANCELLED')).toBe(false);
    expect(OrderStateMachine.isValidTransition('CANCELLED', 'NEW')).toBe(false);
    expect(() => OrderStateMachine.assertValidTransition('FILLED', 'CANCELLED', 'ORD_123')).toThrow();
  });

  it('identifies terminal states', () => {
    expect(OrderStateMachine.isTerminal('FILLED')).toBe(true);
    expect(OrderStateMachine.isTerminal('CANCELLED')).toBe(true);
    expect(OrderStateMachine.isTerminal('REJECTED')).toBe(true);
    expect(OrderStateMachine.isTerminal('EXPIRED')).toBe(true);
    expect(OrderStateMachine.isTerminal('NEW')).toBe(false);
  });
});
