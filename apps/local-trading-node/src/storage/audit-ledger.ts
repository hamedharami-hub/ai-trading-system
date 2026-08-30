import type { AuditEventPayload, UUIDv7 } from '@trade/contracts';
import { computeCanonicalHash, validatePayload } from '@trade/contracts';
import type { AuditRecordInput } from './types.js';

let auditCounter = 1;
function generateMockUUIDv7(): UUIDv7 {
  const hex = (auditCounter++).toString(16).padStart(12, '0');
  return `018f3a55-0000-7000-8000-${hex}` as UUIDv7;
}

export class AuditLedger {
  private ledger: AuditEventPayload[] = [];
  private lastHash: string = '0'.repeat(64); // Genesis hash baseline

  public record(input: AuditRecordInput): AuditEventPayload {
    const auditId = generateMockUUIDv7();
    const recordedAt = new Date().toISOString();

    const dataToHash = {
      audit_id: auditId,
      parent_event_id: input.parentEventId,
      action: input.action,
      actor: input.actor,
      entity_type: input.entityType,
      entity_id: input.entityId,
      state_before: input.stateBefore,
      state_after: input.stateAfter,
      recorded_at: recordedAt,
      previous_hash: this.lastHash
    };

    const canonicalHash = computeCanonicalHash(dataToHash);

    const payload: AuditEventPayload = {
      audit_id: auditId,
      action: input.action,
      actor: input.actor,
      entity_type: input.entityType,
      entity_id: input.entityId,
      canonical_hash: canonicalHash,
      recorded_at: recordedAt
    };

    if (input.parentEventId) {
      payload.parent_event_id = input.parentEventId;
    }
    if (input.stateBefore) {
      payload.state_before = input.stateBefore;
    }
    if (input.stateAfter) {
      payload.state_after = input.stateAfter;
    }

    // Fail-closed schema validation
    const valRes = validatePayload('AUDIT_EVENT', payload);
    if (!valRes.valid) {
      throw new Error(`AuditEvent failed schema validation: ${valRes.errors?.join('; ')}`);
    }

    this.ledger.push(payload);
    this.lastHash = canonicalHash;

    return payload;
  }

  public getEntries(): AuditEventPayload[] {
    return [...this.ledger];
  }

  public get length(): number {
    return this.ledger.length;
  }
}
