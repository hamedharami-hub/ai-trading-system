# Threat Model

## 1. Scope and status

This Phase 1 model uses STRIDE plus misuse/abuse cases for the planned PWA, Windows Local Trading Node, Android bridge, cloud control, local storage, device pairing, and future broker/model adapters.

No listed mitigation is implemented in Phase 1. Controls marked `LOCKED` are approved safety requirements; controls marked `PROPOSED` require later owner approval. External adapters remain disabled.

## 2. Security objectives

1. Prevent unauthorized policy, risk, order, execution, and configuration authority.
2. Preserve deterministic calculation and fail-closed behavior.
3. Protect credentials, personal trading data, device identity, and audit integrity.
4. Prevent duplicate orders, stale approvals, replay, split brain, and hidden data gaps.
5. Preserve evidence sufficient to reconstruct decisions and incidents without recording chain-of-thought or secrets.

## 3. Assets

| Asset | Security properties |
| --- | --- |
| Deterministic rules, risk limits, and configuration | Integrity, authorization, version traceability |
| Market/calendar input and timestamps | Integrity, authenticity, freshness, completeness |
| Candidate, policy, risk, intent, and order state | Integrity, ordering, idempotency, availability |
| Credentials and pairing/key material | Confidentiality, scope limitation, revocability |
| Positions, balances, orders, fills, and personal preferences | Confidentiality, integrity, availability |
| Device identity, trust, lease, and fencing state | Authenticity, integrity, freshness |
| Audit/event history | Integrity, completeness, non-repudiation, readability |
| Model artifacts and AI outputs | Provenance, integrity, bounded authority |

## 4. Actors and trust assumptions

| Actor | Trust posture |
| --- | --- |
| Owner on a trusted device | Authorized human, but still subject to stale-state, phishing, accidental action, and deterministic gates |
| PWA/browser context | Untrusted presentation boundary; may be compromised by XSS, extension, origin, or stale-state attacks |
| Windows Local Trading Node | Planned deterministic authority; high-value local target, not assumed uncompromised |
| Android bridge/device | Future constrained native boundary; background, thermal, keystore, and integrity capabilities unproven |
| Cloud control | Future untrusted infrastructure boundary; must not become silent execution authority |
| Market/calendar provider | External untrusted data source subject to gaps, tampering, delay, and semantic mismatch |
| Broker/exchange | Future external execution truth, but responses and credentials require validation and reconciliation |
| AI/model provider or local model | Untrusted analytical component and supply chain; never authoritative |
| Local attacker/malware | May read files, tamper configuration, impersonate UI/device, or exhaust resources |
| Network attacker | May observe, delay, replay, redirect, or modify unprotected traffic |

## 5. Trust boundaries and data flow

```text
[Owner]
   |
   v
[PWA / Browser] -- future authenticated local transport --> [Windows Local Trading Node]
                                                             |      |       |
                                                             |      |       +--> [Local storage]
                                                             |      +----------> [Future AI/model adapter]
                                                             +-----------------> [Future broker/data adapter]
   ^                                                                  |
   |                                                                  v
[Android bridge] <---- future pairing / fenced authority ----> [Future cloud control]
```

Each arrow is a separate trust boundary. Loopback, local filesystem access, device possession, heartbeat receipt, TLS, or cloud authentication alone is not sufficient proof of authorization.

## 6. Severity and risk acceptance

The following rubric is `PROPOSED` pending owner approval:

| Severity | Proposed meaning | Proposed disposition |
| --- | --- | --- |
| Critical | Could cause unauthorized execution, uncontrolled financial exposure, credential compromise with trade authority, or undetected safety-gate bypass | Not acceptable; blocks affected phase |
| High | Could corrupt risk/data/audit authority, cause duplicate or unprotected orders, split brain, or significant sensitive-data exposure | Not acceptable without explicit owner resolution; blocks affected phase |
| Medium | Could degrade availability, privacy, evidence quality, or analytical correctness without direct safety-gate bypass | Mitigation plan and explicit residual-risk owner required |
| Low | Limited impact with straightforward detection/recovery | Document and schedule; owner acceptance still required before production |

No residual risk is accepted by this document. Only the owner may accept it, and acceptance must identify scope, duration, rationale, and compensating controls.

## 7. Threat register

| ID | STRIDE | Component / attack path | Threat and impact | Existing locked control | Proposed mitigation | Residual severity / owner status | Blockers |
| --- | --- | --- | --- | --- | --- | --- | --- |
| THR-001 | S/E | Attacker impersonates owner or trusted PWA origin | Unauthorized requests or misleading approval UI | INV-004, INV-005, INV-016 | Strong local authentication, origin binding, short-lived sessions, reauthentication for sensitive actions | Critical / NOT ACCEPTED | OPEN-017, OPEN-019, OPEN-021 |
| THR-002 | T | Compromised PWA alters displayed evidence or submitted command | Owner approves a different or stale proposal | INV-004, INV-016 | Bind approval to immutable candidate/version/hash; Local Node revalidates and returns authoritative display data | Critical / NOT ACCEPTED | OPEN-003, OPEN-013, OPEN-019 |
| THR-003 | I | Browser storage, extension, or UI leaks trading/account data | Personal financial or strategy disclosure | INV-004, INV-009 | Minimize browser persistence; CSP; no secrets; classified-field redaction | High / NOT ACCEPTED | OPEN-019, OPEN-021, OPEN-022 |
| THR-004 | E/D | PWA gains persistent feed/execution/model responsibility | Browser compromise bypasses deterministic authority or loses safety state | INV-004, INV-010 | Bundle/dependency guardrails and capability-deny interface | Critical / NOT ACCEPTED | OPEN-019, OPEN-020 |
| THR-005 | S/E | Local process or malware impersonates/controls Local Trading Node | Full deterministic authority compromise | INV-001, INV-005 | Signed binaries, OS ACLs, process identity, authenticated IPC, least privilege, integrity monitoring | Critical / NOT ACCEPTED | OPEN-019, OPEN-021 |
| THR-006 | T/R | Local rules, configuration, reports, or binaries are silently modified | Risk/strategy drift or false audit history | INV-006, INV-007 | Signed/versioned configuration, append-only change events, integrity checks, reproducible builds | Critical / NOT ACCEPTED | OPEN-017, OPEN-018, OPEN-022, OPEN-024 |
| THR-007 | T/D | Market or calendar stream is stale, gapped, reordered, or semantically wrong | Candidate built on invalid evidence | INV-002, INV-011 | Sequence/freshness/time validation, gap recovery, source labeling, quarantine | Critical / NOT ACCEPTED | OPEN-007, OPEN-012 |
| THR-008 | T/E | Malformed, unknown-version, duplicate, or replayed event crosses a boundary | State corruption or gate bypass | INV-002, INV-007, INV-011, INV-012 | Runtime schema validation, canonical IDs, replay windows, version compatibility policy | Critical / NOT ACCEPTED | OPEN-003, OPEN-018, OPEN-024 |
| THR-009 | E/T | AI, UI, user edit, or infrastructure bypasses PolicyGate/risk | Unauthorized size or order intent | INV-001, INV-003, INV-005 | Capability separation, pure risk library, negative authorization/property tests | Critical / NOT ACCEPTED | OPEN-002-OPEN-006, OPEN-013-OPEN-017 |
| THR-010 | T/R | Retry, race, partial fill, or reconnect creates duplicates | Duplicate exposure or false local state | INV-012, INV-013 | Idempotency keys, explicit OMS state machine, broker reconciliation, fencing | Critical / NOT ACCEPTED | OPEN-008, OPEN-009, OPEN-018 |
| THR-011 | T/R | Local database or archive is modified or rolled back | Hidden decision/execution history or unsafe recovery | INV-007 | Transactional integrity, append-only log, checkpoints, signed backups | High / NOT ACCEPTED | OPEN-018, OPEN-022 |
| THR-012 | I | Local storage, backup, or export is stolen | Account, strategy, device, and audit disclosure | INV-009 | Approved classification, encryption, OS ACLs, redacted export, key separation | High / NOT ACCEPTED | OPEN-021, OPEN-022 |
| THR-013 | D | L2/archive/log growth exhausts disk | Data loss, stale processing, or inability to manage positions | INV-002, INV-013 | Capacity monitoring, retention priority, protected open-position/audit state | High / NOT ACCEPTED | OPEN-022 |
| THR-014 | S/E | Compromised or cloned Android device claims trusted authority | Unauthorized commands or failover | INV-014, INV-015 | Hardware-backed device identity, attestation where justified, revocation, fenced lease | Critical / NOT ACCEPTED | OPEN-009, OPEN-020, OPEN-021 |
| THR-015 | D/T | Android Doze, thermal, battery, or background limits delay or corrupt authority | Missed management or unsafe failover assumption | INV-014, INV-015 | Foreground service design, battery/thermal gates, benchmark and chaos tests | High / NOT ACCEPTED | OPEN-020 |
| THR-016 | S/I/T | Pairing is intercepted, replayed, or socially engineered | Rogue device joins trust domain or pairing secret leaks | INV-009, INV-014 | Authenticated out-of-band confirmation, ephemeral pairing, key confirmation, revocation | Critical / NOT ACCEPTED | OPEN-009, OPEN-021 |
| THR-017 | S/T | Cloud lease/heartbeat permits split brain or stale authority | Two executors act concurrently | INV-014 | Fencing tokens, monotonic lease epochs, quorum/authoritative store, stop-on-uncertainty | Critical / NOT ACCEPTED | OPEN-009, OPEN-021 |
| THR-018 | I/E | Cloud operator/account compromise exposes sync data or control | Privacy loss or command authority escalation | INV-009, INV-015 | End-to-end encryption, minimized payloads, scoped service roles, no credential decryption | Critical / NOT ACCEPTED | OPEN-021, OPEN-022 |
| THR-019 | T/R | Cloud sync or command is replayed, reordered, or forged | Stale settings, false device state, or unsafe command | INV-002, INV-007, INV-014 | Signed/versioned commands, nonce/epoch, conflict rules, audit correlation | Critical / NOT ACCEPTED | OPEN-009, OPEN-018, OPEN-021, OPEN-024 |
| THR-020 | D | Cloud/calendar/model quota or service becomes unavailable | Analysis interruption or unsafe fallback | INV-002, INV-010, INV-015 | Budget/health monitoring; deterministic degraded mode; no-trade for affected path | High / NOT ACCEPTED | OPEN-012, OPEN-021, OPEN-026 |
| THR-021 | S/I/E | Future broker credential is stolen or over-scoped | Unauthorized trading or account compromise | INV-009, INV-010, INV-015 | Trade-only/no-withdrawal scope, device keystore, rotation, revocation, per-device key where supported | Critical / NOT ACCEPTED | OPEN-008, OPEN-010, OPEN-021 |
| THR-022 | T/R | Broker response is delayed, spoofed, incomplete, or disagrees with local state | Unprotected/duplicate position or incorrect reconciliation | INV-002, INV-012, INV-013 | Authenticated adapter, sequence/correlation checks, broker truth reconciliation, recovery halt | Critical / NOT ACCEPTED | OPEN-008, OPEN-014, OPEN-015 |
| THR-023 | T/E | Prompt injection or malicious market/user text alters analytical role behavior | False confidence, exfiltration attempt, or policy-bypass request | INV-003, INV-008, INV-009 | Structured evidence only, strict role capabilities, content separation, output validation | High / NOT ACCEPTED | OPEN-002, OPEN-003, OPEN-016, OPEN-017 |
| THR-024 | T/E | Invalid/free-form/model-confused output enters deterministic flow | Unsafe analytical approval or malformed evidence | INV-002, INV-003, INV-017 | Strict schema, enum-only Judge output, timeout/retry bounds, fail closed | Critical / NOT ACCEPTED | OPEN-002, OPEN-003, OPEN-016 |
| THR-025 | T/I | Model/runtime download is malicious, substituted, or unlicensed | Code execution, data leak, or silent analytical drift | INV-010, INV-015 | Disabled now; future checksum/signature, allowlist, provenance, rollback, regression benchmark | High / NOT ACCEPTED | OPEN-021, OPEN-026 |
| THR-026 | R/T | Audit records are omitted, rewritten, or cannot be linked | Incident cannot be reconstructed or disputed | INV-007 | Append-only event chain, correlation IDs, integrity checks, readable export | High / NOT ACCEPTED | OPEN-018, OPEN-022 |
| THR-027 | I | Secret/account data or chain-of-thought leaks through logs/crashes/prompts | Credential or privacy compromise | INV-008, INV-009 | Structured redaction, allowlisted fields, secret scanning, collection minimization | Critical / NOT ACCEPTED | OPEN-003, OPEN-021, OPEN-022 |
| THR-028 | E/T | Feature flags or sensitive settings are changed without authority | Premature connector/Auto/live capability | INV-005, INV-010, INV-019 | Build/runtime dual guard, strong authorization, signed configuration, audit and restart policy | Critical / NOT ACCEPTED | OPEN-017, OPEN-021 |
| THR-029 | T | Clock, timezone, DST, calendar, or numeric representation differs by device | Different expiry, session, risk, or replay result | INV-002, INV-011, INV-016 | Authoritative time, pinned timezone data, canonical decimal/serialization, cross-device fixtures | Critical / NOT ACCEPTED | OPEN-006, OPEN-007, OPEN-011, OPEN-024 |
| THR-030 | S/E | Social engineering or ambiguous phase evidence causes owner/agent to approve unsafe progress | Open blockers are treated as resolved or live gate is bypassed | INV-019 | Explicit blocker list, scoped approvals, independent market/strategy gates, signed decision record | High / NOT ACCEPTED | OPEN-023 and every phase-affecting P0/P1 |

## 8. Component-specific abuse cases

| Component | Abuse case | Required safe outcome |
| --- | --- | --- |
| PWA | User approves after candidate expiry or the page displays stale data | Local Node rejects and requires a fresh evaluation |
| Windows Local Trading Node | Local configuration is tampered to increase risk or enable connectors | Refuse unsafe configuration; no new trade; audit security event |
| Android bridge | Device claims command authority after losing lease or while below resource safety limits | Fenced authority; no new entries; preserve/hand off position management only under approved rules |
| Cloud control | Cloud is unavailable or sends an old command | Current fenced executor follows approved local safety state; stale command rejected |
| Local storage | Disk is full while a position is open | Protect position/audit state, stop new entries, alert owner; exact policy remains blocked |
| Device pairing | QR/code is captured by another device | Pairing fails without mutual key confirmation and explicit owner trust decision |
| Broker adapter | Retry after timeout receives an ambiguous fill | No duplicate; reconcile broker truth before any further action |
| Model adapter | Model returns an unknown Judge value or includes a request to change risk | Reject output and fail closed; never mutate configuration |

## 9. Residual-risk ownership

All threats remain `NOT ACCEPTED`. Proposed mitigations do not close an `OPEN-*` item. The owner must approve severity, mitigation selection, residual risk, and evidence before an affected roadmap phase can pass.

## 10. Phase 1 recommendation

The threat model is suitable for formal owner acceptance after traceability validation. It is not a production security design and it does not authorize implementation, external adapters, secrets, or live operation.

## 11. Delegated mitigation baseline

DEC-044 through DEC-067 select the planning controls for the original P0/P1 threats: strict schema/canonical serialization (THR-008/029), validated freshness and replay handling (THR-007/008), deterministic authority/risk isolation (THR-009/024), idempotent OMS reconciliation (THR-010/022), fenced lease and stop-on-uncertainty (THR-014/017/019), authenticated future local transport (THR-001/005), immutable human and audit events (THR-006/026/028), and classified minimal cloud/storage handling (THR-011/012/018/027).

The mitigations are `LOCKED` architecture policy, but every threat remains `NOT ACCEPTED` for deployment until its designated later phase produces implementation and verification evidence. Future broker and model adapters remain disabled, untrusted boundaries; they acquire no exception from this document.
