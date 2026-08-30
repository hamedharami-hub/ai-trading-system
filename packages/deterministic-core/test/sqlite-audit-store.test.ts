import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SqliteAuditStore } from "../src/storage/sqlite-audit-store.js";

describe("SQLite append-only audit store", () => {
  it("persists a hash-linked event chain and rejects duplicate event IDs", () => {
    const directory = mkdtempSync(join(tmpdir(), "trade-audit-"));
    const store = new SqliteAuditStore(join(directory, "audit.sqlite"));
    const first = store.append({
      eventId: "event-1",
      eventType: "AUDIT_EVENT",
      createdAt: "2026-08-30T00:00:00.000Z",
      payload: { b: 2, a: 1 },
    });
    const second = store.append({
      eventId: "event-2",
      eventType: "AUDIT_EVENT",
      createdAt: "2026-08-30T00:00:01.000Z",
      payload: { ok: true },
    });
    expect(first).toHaveLength(64);
    expect(second).toHaveLength(64);
    expect(second).not.toBe(first);
    expect(store.count()).toBe(2);
    expect(() =>
      store.append({
        eventId: "event-2",
        eventType: "AUDIT_EVENT",
        createdAt: "2026-08-30T00:00:02.000Z",
        payload: {},
      }),
    ).toThrow();
    store.close();
  });
});
