# Safety Invariants

## 1. Purpose and status

These invariants are conditions the planned system must never violate. `LOCKED` invariants derive from approved decisions. An invariant may be locked while its enforcement design remains blocked; the linked `OPEN-*` items identify that gap.

| ID | Invariant | Enforcement boundary | Violation response | Evidence required | Status / blockers |
| --- | --- | --- | --- | --- | --- |
| INV-001 | Only deterministic Local Trading Node components calculate authoritative market features, policy, risk, sizing, margin, leverage, or a risk-approved `OrderIntent`. | Local Node domain and package boundaries | Reject transition; emit audit event; no new trade | Dependency tests, golden calculations, policy/risk property tests | LOCKED; OPEN-001, OPEN-003, OPEN-004, OPEN-006 |
| INV-002 | Unknown, stale, invalid, incomplete, conflicting, timed-out, or out-of-policy state never becomes approval for a new trade. | Every data, council, policy, risk, and OMS boundary | Fail closed; record reason; require fresh evaluation | Fault fixtures, exhaustive state tests, negative contract tests | LOCKED; OPEN-002, OPEN-003, OPEN-007, OPEN-008 |
| INV-003 | AI output is analytical, structured, evidence-referenced, and rejectable; it has no calculation, policy, risk, execution, credential, or settings authority. | AI adapter and deterministic PolicyGate | Reject unauthorized field/capability; audit violation | Capability tests, schema tests, dependency tests | LOCKED; OPEN-002, OPEN-003, OPEN-016 |
| INV-004 | The PWA presents state and submits user requests only; it cannot own feeds, secrets, risk, OMS, execution, or large-model runtime. | PWA bundle and local transport | Deny request; no state mutation; security event | Bundle/dependency scan, authorization tests | LOCKED; OPEN-019, OPEN-020 |
| INV-005 | UI, AI, user edits, and infrastructure cannot bypass deterministic policy or risk; any size/risk change passes every gate again. | PolicyGate, risk core, intent factory | Reject intent; invalidate prior approval | Property tests and negative authorization tests | LOCKED; OPEN-004, OPEN-005, OPEN-006, OPEN-013-OPEN-017 |
| INV-006 | Outcomes and reports never automatically change rules, prompts, weights, models, risk, or settings. | Configuration, model catalog, reporting | Reject mutation; preserve report; audit attempt | Read-only capability and mutation-path tests | LOCKED; OPEN-017, OPEN-028 |
| INV-007 | Audit and decision history is append-only; corrections create linked events and never silently replace history. | Event log, persistence, export | Stop affected write path; integrity alarm | Hash/integrity checks, reconstruction and export tests | LOCKED; OPEN-018, OPEN-022 |
| INV-008 | Internal chain-of-thought is never displayed, logged, synchronized, or persisted. | AI adapter, UI, logs, storage, cloud sync | Drop payload; record safe reason code | Content scanning and redaction tests | LOCKED; OPEN-003, OPEN-021 |
| INV-009 | Secrets, credentials, and account data never enter prompts, logs, crash reports, analytics, repository files, or unapproved storage. | All process and persistence boundaries | Block/redact; security event; revoke if exposure suspected | Secret scans, logging tests, incident drill | LOCKED; OPEN-021, OPEN-022 |
| INV-010 | Live trading, connectors, AI routing, model downloads, and real execution remain disabled until explicit owner approval in a later phase. | Build/runtime flags, packages, network egress | Refuse start/capability; audit attempt | Flag checks, dependency/source/egress scans | LOCKED |
| INV-011 | External data is untrusted until identity, schema, timestamp, sequence, gap, freshness, and source limitations are validated. | Market/calendar/model/broker adapter ingress | Quarantine input; invalidate dependent candidates | Fault injection and source-label tests | LOCKED; OPEN-003, OPEN-007, OPEN-012, OPEN-018 |
| INV-012 | A retry never creates a duplicate order or intent. | Intent factory, OMS, future adapters | Deduplicate or halt reconciliation; alert | Idempotency property and recovery tests | LOCKED; OPEN-008, OPEN-018 |
| INV-013 | A future open position is never intentionally left without approved protective handling; broker truth wins reconciliation after restart/failover. | OMS and future broker adapter | Stop new entries; reconcile; escalate | Restart, partial-fill, disconnect, and recovery tests | LOCKED; OPEN-008, OPEN-015 |
| INV-014 | At most one fenced executor authority may act; heartbeat timing alone is insufficient proof of exclusivity. | Device pairing, cloud lease, Local Node/Android bridge | Fence stale authority; stop new entries; reconcile | Split-brain and lease-expiry tests | LOCKED; OPEN-009, OPEN-020, OPEN-021 |
| INV-015 | Broker, exchange, cloud, Android bridge, model, and notification boundaries are future untrusted adapters and remain isolated and disabled in Phase 1. | Architecture and repository boundary | Reject capability; no outbound access | Repository scan and threat-boundary review | LOCKED; OPEN-010, OPEN-020, OPEN-021, OPEN-026, OPEN-027 |
| INV-016 | Manual approval is time- and state-bound; an expired, invalidated, repriced, or changed-risk approval cannot be reused. | Candidate lifecycle, PolicyGate, risk core, OMS | Expire approval; require new evaluation | State-machine and stale-approval tests | LOCKED; OPEN-013, OPEN-014, OPEN-017 |
| INV-017 | Analyst and Critic are independent live analytical roles; Judge is conditional for material conflict or A+ and returns only `APPROVE`, `REJECT`, or `REANALYZE`. | AI council and PolicyGate boundary | Reject invalid council transition/output | Role isolation and exhaustive transition tests | LOCKED; OPEN-002, OPEN-003 |
| INV-018 | Post-Trade Auditor is outside the live path and can only report and compare outcomes. | Reporting capability boundary | Deny mutation or live-path access | Capability and dependency tests | LOCKED; OPEN-028 |
| INV-019 | Roadmap phases are sequential; scope, decisions, and unsafe assumptions precede work; unresolved P0/P1 decisions require owner approval; compilation alone cannot complete a phase. | Project governance and acceptance review | Stop phase transition; report blockers | Phase checklist and owner approval record | LOCKED; all affected OPEN-* issues |

## 2. Invariant precedence

When requirements appear to conflict, the safer invariant applies until the owner explicitly resolves the conflict. This rule does not create product behavior: it stops affected work or produces no new trade. It cannot be used to invent a formula, threshold, protocol, schema, or recovery policy.

## 3. Review gate

Phase 1 review must confirm that each locked invariant is represented in the SRS and threat model. DEC-043 through DEC-067 resolve the originally open P0/P1 planning decisions; enforcement designs still remain future implementation work and must not be described as implemented.
