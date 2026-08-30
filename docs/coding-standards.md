# Coding Standards

## 1. Governing principles

- Preserve the authority chain in `docs/decision-register.md`.
- Prefer explicit state machines, immutable data, pure functions, and replayable events.
- Fail closed at market-data, policy, schema, risk, and execution boundaries.
- Keep AI, UI, and infrastructure unable to bypass deterministic policy and risk.
- Do not add a dependency, connector, network client, credential, or model artifact without explicit approval.

## 2. TypeScript

- Use strict TypeScript. The shared baseline enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, and `useUnknownInCatchVariables`.
- Avoid `any`; validate `unknown` at boundaries and narrow it deliberately.
- Use exhaustive discriminated unions for state machines and decisions. An unrecognized state is an error, never a permissive fallback.
- Keep domain functions deterministic: no implicit clock, randomness, environment, locale, filesystem, or network access. Pass these inputs explicitly through ports.
- Use decimal strings for `Price`, `Quantity`, `Money`, `Percent`, and `R:R` at wire boundaries. Use arbitrary-precision Decimal values for authoritative internal financial calculations; JavaScript `number` is prohibited. Read symbol precision from versioned symbol metadata. The Decimal package/runtime and rounding policy require separate approval before risk work begins.
- Initially quantize order quantity by rounding down to the venue's permitted `stepSize`. If that quantity is below `minQty` or `minNotional`, raise it only to the minimum venue-valid quantity and rerun every policy, risk, margin, correlation, and venue validation. Any failure rejects the trade. Do not infer price, fee, FX, risk-amount, or remaining constraint-order rounding rules.
- Use branded identifiers or equally strong domain types once contracts are implemented. Do not interchange symbol, account, order, event, device, and correlation IDs as plain strings inside domain code.

## 3. Contracts and events

- JSON Schema 2020-12 will be the canonical wire format. TypeScript types must derive from the same schema definitions.
- Every externally received or cross-process message requires runtime validation before use.
- Every event must include the minimum envelope defined in the architecture. Timestamps use an approved UTC instant format; exchange and local receipt time remain separate.
- Schema changes require a version, compatibility assessment, migration/replay effect, and decision-register update when behavior changes.
- Events are immutable. Corrections are new linked events rather than edits to historical records.
- Persist evidence references and concise auditable reasons. Never persist hidden chain-of-thought.

## 4. Package boundaries

- `apps/pwa` depends only on shared contracts and UI-safe utilities. It contains no broker, exchange, credential, risk, or OMS logic.
- `apps/local-trading-node` owns future deterministic domain behavior and infrastructure adapters behind explicit ports.
- `packages/contracts` is data-only. It contains no I/O or business authority.
- Imports must follow `pwa -> contracts <- local-trading-node`; no application-to-application imports.
- Keep strategy, policy, risk, OMS, AI, storage, and external adapters as separately testable boundaries when source code is later approved.

## 5. Error and state handling

- Model expected domain failures as typed results or states. Reserve thrown exceptions for programmer faults or unrecoverable infrastructure boundaries.
- Never convert timeout, stale data, missing data, invalid schema, NaN/infinite input, unknown enum, or unresolved conflict into approval.
- Retries must be bounded, observable, and idempotent. Retrying must not duplicate an order or mutate historical decisions.
- Log event IDs, correlation IDs, state transitions, and safe reason codes. Redact secrets and account data before any logging boundary.

## 6. UI and accessibility

- The product is Persian-first with English technical terminology. Support RTL layout without encoding domain identifiers or wire values in localized text.
- Use semantic HTML, keyboard-accessible controls, visible focus, sufficient contrast, and screen-reader labels.
- Distinguish analytical approval, deterministic policy, risk approval, order state, and execution state visually and textually.
- Never use color alone to communicate trading direction, risk, stale data, or failure.

## 7. Review requirements

- Changes to contracts, calculations, policy, risk, OMS, security, persistence, or audit behavior require tests and a decision-impact note.
- Changes must not weaken disabled external-capability defaults.
- Format-only refactors must not alter serialized data, numeric behavior, event ordering, or replay results.
- Generated files, when later introduced, must identify their source and must not be edited manually.

## 8. Phase 1 decision baseline

When implementation is separately approved, apply DEC-044 through DEC-067 and [the delegated Phase 1 profile](phase-1-delegated-decisions-fa.md) as the locked safety baseline. These decisions do not override the phase gate or permit a dependency, source file, connector, secret, AI call, model download, or execution feature now.
