# Architecture v2

## 1. Authority and scope

The Persian architecture PDF and subsequent explicit owner instructions are the product authority. English repository documentation is the version-controlled implementation translation. If a conflict exists, the owner's latest explicit instruction prevails.

This document defines the system boundaries. Consolidated Phase 2 implements canonical contracts and a deterministic offline-core foundation only. It contains no data feeds, broker or exchange integrations, secrets, network clients, AI calls, model downloads, cloud operation, or executable trading adapter.

## 2. Safety invariants

1. Market data, features, policy, risk, sizing, order intent, OMS, reconciliation, and execution are deterministic responsibilities of the Local Trading Node.
2. AI is analytical and advisory. It cannot calculate authoritative risk, approve risk, create a risk-approved `OrderIntent`, access credentials, alter settings, or bypass policy.
3. Uncertainty and invalid state fail closed. No new trade is the result of stale data, gaps, schema failure, timeout, unresolved conflict, failed policy, or failed risk validation.
4. The PWA is presentation and interaction only. It cannot own persistent feeds, secrets, risk, OMS, execution, or large-model runtime.
5. Audit history is append-only. Past analysis and decisions are versioned, not silently overwritten.
6. No automated learning or outcome-driven mutation is permitted.

## 3. System context and process boundaries

### Next.js PWA (`apps/pwa`)

Future responsibilities are responsive Persian-first UI, charts, evidence display, AI-role comparison, manual approval/rejection, position/order visibility, reports, and settings presentation.

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

The repository now includes reviewed deterministic math, policy, risk, replay, guarded intent, and SQLite audit foundations in `packages/deterministic-core`. The Local Trading Node executable, real feeds, OMS adapters, and execution remain absent.

### Shared contracts (`packages/contracts`)

This future data-only package is the only contract dependency shared by the PWA and Local Trading Node. JSON Schema 2020-12 is the canonical future wire format; TypeScript types must derive from the same definitions so schemas and types cannot drift. Runtime validation is required at every process or trust boundary.

Financial wire values for `Price`, `Quantity`, `Money`, `Percent`, and `R:R` use decimal strings. Authoritative financial calculations cannot use JavaScript `number`; internally they use arbitrary-precision Decimal values, and symbol precision comes from versioned symbol metadata. The Decimal package/runtime, rounding policy, and metadata authority remain blocked by `OPEN-003` and `OPEN-006`.

The package contains schemas, generated types, Decimal parsing/formatting, canonical serialization, cryptographic hashing, and deterministic validation only. It may not import either application or contain network, storage, AI, risk, or execution logic.

### Future external boundaries

- Broker/exchange adapters will be isolated behind deterministic market-data and OMS ports and introduced read-only first, then demo, then separately approved trade permission.
- AI adapters will be isolated behind schema validation, deadlines, bounded retries, and fail-closed policy. They cannot reach risk or OMS interfaces.
- Cloud control may later synchronize encrypted state, notifications, device health, and an executor lease. It is not an always-on analysis or execution service in v1.
- Native Windows/Android bridges may later provide local-model runtime, secure storage, notifications, and background capabilities. They are not part of this foundation.

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
- SQLite WAL is the planned transactional store. Parquet/DuckDB are later archival/analysis tools. No database is created now.
- All external capability flags are build-time and runtime guarded and default off.

## 8. Current non-goals

The foundation does not implement Next.js pages, service workers, Node services, contracts, schemas, calculations, databases, authentication, encryption, feeds, brokers, exchanges, OMS, paper trading, cloud control, notifications, AI routing, model management, native bridges, or live trading.
