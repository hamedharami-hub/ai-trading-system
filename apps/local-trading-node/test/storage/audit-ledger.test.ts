import { describe, it, expect } from 'vitest';
import { AuditLedger } from '../../src/storage/audit-ledger.js';
import { validatePayload } from '@trade/contracts';

describe('Audit Ledger & Tamper-Evident Hash Chaining', () => {
  it('records state transitions and validates canonical hashes', () => {
    const ledger = new AuditLedger();

    const audit1 = ledger.record({
      action: 'RISK_APPROVED',
      actor: 'RISK_CORE',
      entityType: 'STRATEGY_CANDIDATE',
      entityId: '018f3a55-0000-7000-8000-000000000001',
      stateBefore: { status: 'PENDING_RISK' },
      stateAfter: { status: 'APPROVED', riskPercent: '0.01' }
    });

    expect(audit1.canonical_hash).toMatch(/^[a-fA-F0-9]{64}$/);
    expect(audit1.action).toBe('RISK_APPROVED');

    const valRes1 = validatePayload('AUDIT_EVENT', audit1);
    expect(valRes1.valid).toBe(true);

    const audit2 = ledger.record({
      action: 'ORDER_PLACED',
      actor: 'OMS',
      entityType: 'ORDER_INTENT',
      entityId: '018f3a55-0000-7000-8000-000000000002',
      parentEventId: audit1.audit_id
    });

    expect(audit2.canonical_hash).toMatch(/^[a-fA-F0-9]{64}$/);
    expect(audit2.parent_event_id).toBe(audit1.audit_id);
    expect(ledger.length).toBe(2);

    const valRes2 = validatePayload('AUDIT_EVENT', audit2);
    expect(valRes2.valid).toBe(true);
  });
});
