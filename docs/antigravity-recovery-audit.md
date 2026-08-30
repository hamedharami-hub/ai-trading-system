# Antigravity Recovery Audit

## Authority and reviewed baseline

The Persian architecture PDF, locked decisions in this repository, and later explicit owner instructions are authoritative. Antigravity commits are untrusted implementation candidates.

- Clean baseline: `6724f6a`
- Reviewed Antigravity head: `fc0df3a`
- Recovery branch: `codex/recovery-phase-1`
- Review status: file-level triage complete; no Antigravity implementation has been promoted yet

## Recovery rule

`REUSE` means copy or reimplement only after semantic review and tests. `REWRITE` means the idea or fixture may be retained but the implementation is not trusted. `QUARANTINE` means it must not enter the clean product line.

| Area | Disposition | Evidence / reason |
| --- | --- | --- |
| Monorepo manifests and workspace layout | REUSE | Structurally useful, but versions and scripts require a fresh dependency review and lockfile. |
| JSON Schema event families | REUSE | Useful starting coverage; must be audited against DEC-045 and the authoritative flow before promotion. |
| Generated TypeScript contract types | REWRITE | Generated output is not a source of truth and must be regenerated from approved schemas. |
| Decimal parsing and quantity quantization | REUSE | `decimal.js` direction and round-down intent align with DEC-044/041; global rounding and embedded sizing behavior require correction. |
| Position sizing inside `packages/contracts` | QUARANTINE | Violates the data-only contract boundary and omits authoritative venue/FX/cost semantics. |
| JCS canonicalization and hashing | REWRITE | The synchronous implementation can silently substitute a non-cryptographic hash padded to SHA-256 length. Audit integrity must never downgrade silently. |
| Schema validator | REUSE | AJV strict validation is a viable base; registration, formats, error handling, and compatibility need contract tests. |
| Feed normalizers and sequence utilities | REWRITE | Useful fixtures and structure, but no real feed authority, provider semantics, or approved soak evidence exists. |
| Feature and strategy engines | REWRITE | Algorithms are not demonstrated against the approved golden datasets and cannot be accepted from test count alone. |
| Risk core | QUARANTINE | Defaults conflict with locked limits: 1% per trade, 3% daily, 6% drawdown, and 3% portfolio open risk appear in Antigravity code. |
| OMS and simulated connector | REWRITE | May supply test ideas, but simulated fills and shallow state transitions are not approved OMS behavior. |
| In-memory event/audit storage | REWRITE | Arrays and maps are not SQLite WAL, durable append-only audit, or recovery evidence. |
| AI mock roles and prompt templates | REWRITE | Role separation is useful, but no offline runtime, model benchmark, capability isolation, or complete Auditor implementation is proven. |
| PWA visual shell and RTL components | REUSE | Visual work can be recovered after removing browser authority, random data, execution simulation, and misleading capability claims. |
| `BrowserTradingEngine` | QUARANTINE | Places trading state and behavior in the PWA, contradicting DEC-005, DEC-010, and DEC-026. |
| Firebase auth/sync code | REWRITE | Firebase/Vercel are now owner-approved future infrastructure, but existing code has not passed data classification, rules, pairing, revocation, or secrets review. |
| In-browser model-download experience | QUARANTINE | It simulates capability and does not provide verified GGUF acquisition, integrity, native runtime, compatibility, or resource gates. |
| Existing unit tests and fixtures | REUSE | Test ideas are useful; passing 94 tests proves only the assertions written, not roadmap completion or product safety. |
| “All 13 phases complete” documentation | QUARANTINE | Contradicted by missing native Android/Windows runtimes, durable storage, real validation evidence, and locked risk rules. |

## Confirmed unsafe findings

1. Antigravity's default risk configuration conflicts with approved 0.25%-0.75% adaptive risk, 1% total open risk, 1.5% daily limit, 3% risk reduction, and 5% stop.
2. The PWA contains browser-owned trading behavior, generated prices/order flow, automatic position changes, and simulated fills.
3. A non-cryptographic hash can be emitted in a 64-character form that resembles SHA-256.
4. Firebase configuration and cloud mutation paths were introduced without the required pairing, authorization, classification, and revocation evidence.
5. Storage implementations are memory-only despite roadmap claims for SQLite/Parquet/DuckDB.
6. No evidence supports native Windows and Android offline inference, four paper/demo weeks, 500 valid signals, real connector semantics, or a live gate.

## Recovery acceptance gate

- The clean baseline remains recoverable and Antigravity is not merged wholesale.
- False phase-completion decisions are excluded from the authoritative branch.
- Locked risk values and authority boundaries remain unchanged.
- Every Antigravity area has an explicit recovery disposition.
- External capability flags remain disabled.
- No secret, connector, model, AI call, or execution behavior is introduced.

## Next phase boundary

Consolidated Phase 2 may implement the deterministic foundation from reviewed material: canonical contracts, deterministic math, event validation, replay-only market fixtures, feature/strategy/risk policy boundaries, durable local storage foundations, and tests. It requires its own phase declaration and owner gate before work starts.
