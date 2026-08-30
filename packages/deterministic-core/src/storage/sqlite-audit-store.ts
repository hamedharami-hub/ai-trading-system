import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { canonicalizeJson } from "@trade/contracts";

export interface AuditRecord {
  readonly eventId: string;
  readonly eventType: string;
  readonly createdAt: string;
  readonly payload: unknown;
}

export class SqliteAuditStore {
  readonly #database: DatabaseSync;

  constructor(path: string) {
    this.#database = new DatabaseSync(path);
    this.#database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS audit_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL UNIQUE,
        event_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        canonical_payload TEXT NOT NULL,
        previous_hash TEXT,
        event_hash TEXT NOT NULL UNIQUE
      ) STRICT;
    `);
  }

  append(record: Readonly<AuditRecord>): string {
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      const previous = this.#database
        .prepare(
          "SELECT event_hash FROM audit_events ORDER BY sequence DESC LIMIT 1",
        )
        .get() as { event_hash: string } | undefined;
      const canonicalPayload = canonicalizeJson(record.payload);
      const canonicalRecord = canonicalizeJson({
        eventId: record.eventId,
        eventType: record.eventType,
        createdAt: record.createdAt,
        canonicalPayload,
        previousHash: previous?.event_hash ?? null,
      });
      const eventHash = createHash("sha256")
        .update(canonicalRecord, "utf8")
        .digest("hex");
      this.#database
        .prepare(
          `
        INSERT INTO audit_events
          (event_id, event_type, created_at, canonical_payload, previous_hash, event_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        )
        .run(
          record.eventId,
          record.eventType,
          record.createdAt,
          canonicalPayload,
          previous?.event_hash ?? null,
          eventHash,
        );
      this.#database.exec("COMMIT");
      return eventHash;
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  count(): number {
    const row = this.#database
      .prepare("SELECT COUNT(*) AS count FROM audit_events")
      .get() as { count: number };
    return row.count;
  }

  close(): void {
    this.#database.close();
  }
}
