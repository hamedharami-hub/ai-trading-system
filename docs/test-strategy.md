# Test Strategy

## 1. Objectives

Testing must demonstrate deterministic, replayable, fail-closed behavior before profitability is considered. AI output, UI state, external availability, and historical performance are never substitutes for deterministic policy, risk, OMS, or reconciliation tests.

No test in the foundation phase contacts a network, broker, exchange, AI provider, model registry, notification provider, or cloud service.

## 2. Test layers

### Contract tests

- Validate every future contract against JSON Schema at producer and consumer boundaries.
- Verify accepted and rejected examples, unknown fields policy, enum exhaustiveness, timestamp rules, identifiers, units, precision, and schema-version compatibility.
- Verify financial wire fields accept canonical decimal strings and reject JavaScript `number` wire values, malformed decimals, excess precision, and metadata-version mismatches.
- Verify arbitrary-precision Decimal behavior across property tests and replay fixtures; no authoritative financial path may coerce through JavaScript `number`.
- Verify initial quantity rounds down to `stepSize`; any minimum-venue increase reruns all gates and is rejected if it exceeds any policy, risk, margin, correlation, or venue limit.
- Assert that Judge output accepts only `APPROVE`, `REJECT`, or `REANALYZE`.
- Assert that analytical proposals cannot be deserialized as policy, risk, or order-intent messages.

### Deterministic unit tests

- Cover feature formulas, policy predicates, expiry, news/session rules, sizing, correlation, costs, rounding, margin, and risk caps with approved fixtures.
- Supply time, randomness, market metadata, and conversion rates explicitly.
- Exercise zero, negative, boundary, NaN, infinity, missing, stale, duplicate, and out-of-order inputs.

### Property-based tests

- Risk-approved size never exceeds per-trade, correlation, margin, or total-open-risk caps.
- Increasing risk constraints cannot increase approved size.
- Invalid or less-fresh inputs cannot upgrade a rejection to approval.
- Retries preserve idempotency and cannot create duplicate intents or orders.
- AI/UI input cannot mutate deterministic rules or bypass a rejection.

### Golden-data and replay tests

- Approve versioned datasets for every SMC/order-flow definition before implementation.
- Replay identical events with canonical serialization and assert identical feature, strategy, policy, risk, and OMS outputs.
- Run cross-device fixtures and define exact-versus-tolerance rules before claiming Windows/Android equivalence.
- Keep Scalp and Intraday fixtures and statistics separate.

### State-machine and recovery tests

- Exhaustively test future candidate, council, policy, risk, intent, order, fill, cancel/replace, reconciliation, and kill-switch transitions.
- Cover restart, network loss, delayed/duplicate execution reports, partial fills, stale state, and conflicting device authority.
- Require append-only audit reconstruction of every transition.

### Integration tests with fakes

- Use in-memory or file fixtures only until external access is separately approved.
- Fake clocks, market feeds, calendars, account state, brokers, AI roles, storage failures, and lease behavior through explicit ports.
- Verify the exact corrected decision flow and conditional Judge invocation.
- Verify Post-Trade Auditor output is read-only and cannot reach configuration or domain mutation ports.

### PWA tests

- Test RTL rendering, keyboard operation, screen-reader labels, stale/error states, approval expiry, and clear separation of analytical and deterministic decisions.
- Browser end-to-end tests use local fixtures only and assert that no external request occurs.

### Security and privacy tests

- Scan tracked files, logs, snapshots, crash fixtures, and generated artifacts for credential patterns and account data.
- Test local transport authentication, origin protection, authorization, encryption, revocation, and data classification only after those designs are approved.
- Assert external-capability flags are disabled by default and cannot be enabled by AI or UI input.

### Later paper/live-gate tests

- Compare internal live-data simulation with official demo/testnet paths while reporting fills, rejects, costs, and latency separately.
- Run soak, chaos, backup/restore, integrity, sleep/wake, device failover, battery, thermal, and quota-exhaustion tests.
- Apply each market-and-strategy live gate independently. No passing result implies authorization for another market or strategy.

## 3. Foundation acceptance tests

The current phase passes only when:

1. JSON and YAML configuration parses and pnpm discovers the three private workspaces.
2. There is no application source code, dependency, or lockfile.
3. There is no broker/exchange SDK, network client, AI call, model URL/artifact, or credential-shaped placeholder.
4. All live, connector, AI-router, and model-download flags are explicitly false.
5. Documentation contains the corrected four AI roles, conditional Judge semantics, corrected decision flow, and authority wording.
6. Repository links resolve and the Git diff contains only approved foundation artifacts.

## 4. Future quality gates

When dependencies and source code are approved, CI will run formatting checks, lint, typecheck, unit/property tests, contract tests, replay/golden tests, integration tests, PWA accessibility tests, secret scanning, and build verification. No flaky test may be silently retried into a pass; nondeterminism is a defect to investigate.

## 5. Delegated-decision coverage

Future tests must turn DEC-044 through DEC-067 into executable evidence: exact decimal/contract/replay fixtures, feature golden datasets, council transitions, risk/drawdown properties, market-data fault cases, OMS and lease chaos cases, authorization negative tests, and retention/statistical-gate evidence. This section schedules no tooling or implementation before its roadmap phase is approved.
