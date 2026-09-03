# Architecture v2

## 1. Authority and scope

The Persian architecture PDF and subsequent explicit owner instructions are the product authority. English repository documentation is the version-controlled implementation translation. If a conflict exists, the owner's latest explicit instruction prevails.

This document defines the system boundaries. Phases 2 and 3 added canonical contracts, deterministic offline-core foundations, and guarded offline-AI evidence. Phase 4 added the responsive PWA and an owner-initiated Firebase Authentication boundary. The accepted Phase 5 work is local and fail-closed: replay evidence and Paper-readiness helpers are not a Paper entry, fill, position, P&L, OMS, provider connection, or executable trading adapter.

## 2. Safety invariants

1. Market data, features, policy, risk, sizing, order intent, OMS, reconciliation, and execution are deterministic responsibilities of the Local Trading Node.
2. AI is analytical and advisory. It cannot calculate authoritative risk, approve risk, create a risk-approved `OrderIntent`, access credentials, alter settings, or bypass policy.
3. Uncertainty and invalid state fail closed. No new trade is the result of stale data, gaps, schema failure, timeout, unresolved conflict, failed policy, or failed risk validation.
4. The PWA is presentation and interaction only. It cannot own persistent feeds, secrets, risk, OMS, execution, or large-model runtime.
5. Audit history is append-only. Past analysis and decisions are versioned, not silently overwritten.
6. No automated learning or outcome-driven mutation is permitted.

## 3. System context and process boundaries

### Next.js PWA (`apps/pwa`)

Current responsibilities are responsive Persian-first presentation, fixed offline evidence display, and owner-initiated Firebase Google Authentication. Future responsibilities include charts, AI-role comparison, manual approval/rejection, position/order visibility, reports, and settings presentation.

The PWA may submit authenticated user commands to the Local Trading Node in a future phase. It may not directly contact a broker/exchange, hold trading credentials, calculate authoritative features or risk, manufacture an `OrderIntent`, or treat browser state as execution truth.

### Local Trading Node (`apps/local-trading-node`)

This is a future separate Windows Node.js/TypeScript process and the deterministic authority for:

- market-event validation, time synchronization, sequence and freshness checks;
- feature extraction and versioned SMC/order-flow calculations;
- Scalp and Intraday candidate generation;
- deterministic session, news, expiry, conflict, and permission policy;
- portfolio risk, sizing, margin, leverage, cost, and correlation checks;
- risk-approved `OrderIntent` creation;
- OMS state, idempotency, reconciliation, persistence, and audit emission.

The repository now includes reviewed deterministic math, policy/risk deny-only boundaries, replay, guarded intent, SQLite audit foundations, and local Paper-readiness evidence in `packages/deterministic-core`. The Local Trading Node executable, real feeds, OMS adapters, Paper entry lifecycle, and execution remain absent.

### Shared contracts (`packages/contracts`)

This future data-only package is the only contract dependency shared by the PWA and Local Trading Node. JSON Schema 2020-12 is the canonical future wire format; TypeScript types must derive from the same definitions so schemas and types cannot drift. Runtime validation is required at every process or trust boundary.

Financial wire values for `Price`, `Quantity`, `Money`, `Percent`, and `R:R` use decimal strings. Authoritative financial calculations cannot use JavaScript `number`; internally they use arbitrary-precision Decimal values, and symbol precision comes from versioned symbol metadata. `decimal.js` is pinned and approved for the Phase 2 foundation; the remaining venue-specific rounding, FX, margin, and metadata semantics in `OPEN-003` and `OPEN-006` remain unresolved and fail closed.

The package contains schemas, generated types, Decimal parsing/formatting, canonical serialization, cryptographic hashing, and deterministic validation only. It may not import either application or contain network, storage, AI, risk, or execution logic.

### Future external boundaries

- Broker/exchange adapters will be isolated behind deterministic market-data and OMS ports and introduced read-only first, then demo, then separately approved trade permission.
- Offline AI is isolated behind schema validation, deadlines, bounded retries, and fail-closed policy. It cannot reach risk or OMS interfaces. Remote AI remains absent.
- Cloud control currently provides only owner-initiated authentication. `OPEN-021` blocks synchronization, notifications, device health, and an executor lease; cloud is not an analysis or execution service.
- Android has a guarded local-AI bridge and benchmark evidence. Secure storage, notifications, background work, and execution authority remain absent.

## 4. Decision flow

```text
MarketEvent
-> FeatureSnapshot
-> StrategyCandidate
-> AnalystProposal + CriticProposal
-> JudgeDecision (conditional: material conflict or A+)
-> Deterministic PolicyGate
-> RiskDecision
-> OrderIntent
-> ExecutionReport
-> AuditEvent
```

The Analyst and Critic produce independent, schema-valid analytical proposals from referenced deterministic evidence. Neither proposal is an instruction to trade.

The Judge is a conditional analytical role only. It is invoked for a material Analyst/Critic conflict or an A+ candidate and may output exactly one of `APPROVE`, `REJECT`, or `REANALYZE`. `APPROVE` means only that the analytical council did not reject the thesis; it is not policy approval, risk approval, or execution authorization.

The Deterministic PolicyGate evaluates data health, session/news rules, candidate validity, expiry, permissions, and bounded council state. Only after it passes may deterministic risk processing create a `RiskDecision`. Only deterministic Local Trading Node components may calculate risk or create a risk-approved `OrderIntent`.

The Post-Trade Auditor is outside the live path. It can compare candidates, proposals, decisions, fills, outcomes, and counterfactual reports. It cannot change rules, models, prompts, weights, risk, settings, or runtime behavior.

## 5. Future contract families

All future messages use an event envelope containing at least `schema_version`, `event_id`, `source`, `device_id`, `timestamp_exchange`, `timestamp_local`, and `correlation_id`. Order intents additionally require an idempotency key.

| Contract | Producer | Consumer | Authority |
| --- | --- | --- | --- |
| `MarketEvent` | Future market adapter | Market validation | External observation, untrusted until validated |
| `FeatureSnapshot` | Deterministic feature engine | Strategy engines and analytical roles | Authoritative calculated evidence |
| `StrategyCandidate` | Deterministic strategy engine | Analytical roles and policy | Deterministic opportunity candidate, not an order |
| `AnalystProposal` | Analyst | Policy/Judge and UI | Advisory analysis only |
| `CriticProposal` | Critic | Policy/Judge and UI | Advisory adversarial analysis only |
| `JudgeDecision` | Conditional Judge | Deterministic PolicyGate and UI | Analytical `APPROVE`, `REJECT`, or `REANALYZE` only |
| `RiskDecision` | Deterministic risk core | Order-intent factory and UI | Authoritative risk result |
| `OrderIntent` | Deterministic Local Node | Future OMS | Immutable, risk-approved intent |
| `ExecutionReport` | Future OMS/adapter | State, reconciliation, audit | Execution observation requiring reconciliation |
| `AuditEvent` | Every deterministic boundary | Append-only event log | Immutable audit record |

Phase 2 provides the initial schema set implementing DEC-044 through DEC-067. Schema evolution remains versioned and fail-closed; the presence of `ExecutionReport` and `OrderIntent` contracts does not authorize an adapter or external execution.

## 6. Dependency and trust rules

```text
apps/pwa ----------------> packages/contracts <---------------- apps/local-trading-node
   UI trust boundary              data only                     deterministic authority
```

- Application packages never import one another.
- Contracts cannot depend on applications or infrastructure.
- AI-facing code cannot import risk, OMS, execution, credential, or connector interfaces.
- UI commands are requests, not state truth. Local Node state and future broker reconciliation are authoritative.
- External data is untrusted until schema, time, sequence, and freshness validation succeeds.
- Logs and errors carry correlation/evidence identifiers, never secrets or internal chain-of-thought.

## 7. Planned deployment and persistence

- Windows hosts the future Local Trading Node and installable PWA.
- Android initially uses the shared PWA. Any executor failover, background work, secure storage, or local-model behavior requires an explicitly approved native bridge and device testing.
- SQLite WAL append-only audit foundations exist locally. Production portfolio, OMS, backup/restore, retention, and transactional state remain absent. Parquet/DuckDB are later archival/analysis tools.
- All external capability flags are build-time and runtime guarded and default off.

## 8. Current non-goals

The repository does not implement a Local Trading Node service, market-data feeds, brokers, exchanges, OMS, a Paper entry/fill/position/P&L lifecycle, cloud synchronization, notifications, remote AI routing, production model management, device authority, or live trading. The implemented PWA, Firebase Authentication boundary, offline-AI evidence, contract/math/replay foundation, SQLite audit foundation, and local Paper-readiness evidence remain non-authoritative and fail closed.
