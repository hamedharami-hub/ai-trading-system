# Data Classification and Secrets Handling

## 1. Status and authority

This document separates approved handling rules from a proposed classification framework. Proposed classifications are conservative review material, not resolved owner policy. `OPEN-021` (cloud/security) and `OPEN-022` (storage) remain open.

No secret, credential, account connection, broker adapter, cloud service, or model provider is present or authorized in Phase 1.

## 2. Source-approved handling rules

| ID | Approved rule | Status | Source |
| --- | --- | --- | --- |
| DATA-LOCK-001 | API keys, tokens, credentials, and account data shall not appear in prompts, logs, crash reports, analytics, or repository files. | LOCKED | PDF §1.3, §9.4, §12.3; DEC-030; INV-009 |
| DATA-LOCK-002 | Withdrawal permission shall never be enabled for a future Binance credential. | LOCKED intent; future implementation blocked | PDF §1.3, §9.4 |
| DATA-LOCK-003 | Future sensitive settings, Auto mode, risk caps, and credential management require stronger authorization than ordinary analysis interaction. | LOCKED intent; mechanism blocked | PDF §6.2, §9.4; OPEN-017, OPEN-021 |
| DATA-LOCK-004 | The PWA shall not hold trading credentials. | LOCKED | PDF §12.1; DEC-026; INV-004 |
| DATA-LOCK-005 | AI roles shall not receive credentials or account secrets. | LOCKED | PDF §1.3, §6.4; DEC-005; INV-003, INV-009 |
| DATA-LOCK-006 | Audit history shall be append-only and readable for incident review. | LOCKED | PDF §10, §13; DEC-030; INV-007 |
| DATA-LOCK-007 | External connectors, cloud control, secrets, AI calls, and model downloads remain disabled in Phase 1. | LOCKED | Owner instruction; DEC-035, DEC-036; INV-010 |

## 3. Proposed classification framework

The following levels are `PROPOSED` pending owner approval under `OPEN-021` and `OPEN-022`.

| Level | Proposed name | Description | Proposed default handling |
| --- | --- | --- | --- |
| C0 | Public | Material intentionally approved for public release | No confidentiality requirement; integrity and source attribution still required |
| C1 | Internal | Non-public product documentation, non-sensitive configuration, and sanitized operational metadata | Owner/device access only; no public synchronization by default |
| C2 | Sensitive | Personal trading behavior, strategy details, device identity, account metadata, positions, balances, derived analytics, and audit content | Encrypt at rest and in transit; least privilege; redact from ordinary logs; explicit retention |
| C3 | Restricted secret | Credentials, private keys, access/refresh tokens, recovery codes, encryption keys, pairing secrets, and authentication factors | Hardware/OS-backed storage where available; never export or synchronize in plaintext; never log, prompt, or commit |

The labels and default controls above are proposals, not locked implementation requirements. Future approval must define encryption, key custody, recovery, deletion, retention, export, and incident response.

## 4. Proposed data inventory

| Data asset | Proposed class | Rationale | Permitted in Phase 1 | Unresolved decisions |
| --- | --- | --- | --- | --- |
| Published product overview or owner-approved public documentation | C0 | Intended public material | Documentation only if explicitly approved for release | Public-release approval process |
| Architecture, SRS, threat model, risk rules, and decision register | C1 | Non-public implementation and safety context | Yes, repository-local | Repository access and backup policy |
| Non-secret feature flags and development configuration | C1 | Internal operational metadata | Yes, with all external capabilities false | Configuration authorization model |
| Raw public market data | C1 proposed | Publicly observable but may be licensed and operationally sensitive | No data acquired in Phase 1 | Licensing, provider terms, retention |
| Derived features, SMC objects, strategy candidates, and model evidence | C2 proposed | Reveals proprietary strategy and decision context | Documentation references only | Retention, synchronization, export |
| AI proposals, Judge decisions, and Post-Trade Auditor reports | C2 proposed | Reveals trading analysis and personal behavior | No runtime data in Phase 1 | Prompt/evidence minimization, retention |
| User drawings, revisions, preferences, schedules, and watchlists | C2 proposed | Personal behavior and potentially strategy-sensitive | Documentation references only | Scope authorization, rollback, sync |
| Account identifiers, balances, equity, positions, orders, fills, and execution reports | C2 proposed | Personal financial and trading data | Prohibited from repository and Phase 1 runtime | Data minimization, local/cloud storage, export |
| Event and audit logs after approved redaction | C2 proposed | Incident, trading, device, and behavior history | Documentation only | Retention, integrity, backup, deletion |
| Device ID, pairing state, trust status, lease/fencing state | C2 proposed | Enables device correlation and command authority | No pairing/runtime data in Phase 1 | Identity lifecycle, recovery, revocation |
| Crash diagnostics after approved redaction | C2 proposed | May reveal paths, identifiers, or state | No collection in Phase 1 | Redaction, consent, retention |
| Broker/exchange API keys and OAuth tokens | C3 | Direct account access | Prohibited | Per-device versus shared key, storage, rotation, revocation |
| Cloud credentials, signing keys, database keys, and push tokens | C3 | Infrastructure and command-channel access | Prohibited | Provider, key custody, rotation, recovery |
| Pairing secrets, device private keys, recovery codes, biometrics-derived authorization artifacts | C3 | Device/control-plane authority | Prohibited | Pairing protocol, hardware support, revocation |
| Local-model files and checksums | C1/C2 proposed | Licensed artifact plus supply-chain and strategy implications | Prohibited | Model catalog, license, provenance, integrity |

## 5. Secrets lifecycle requirements

### Phase 1 locked prohibitions

- Do not request, create, copy, test, store, transmit, or document a real secret.
- Do not add credential-shaped placeholders to `.env.example`.
- Do not add secret-loading code, vault clients, broker OAuth, token refresh, signing, or device-pairing implementation.
- Keep all external capability flags false.

### Future proposed controls - not approved

The following are threat mitigations for owner review, not current decisions:

- Generate or import secrets only inside a trusted native/Local Node boundary.
- Store C3 material in an OS/hardware-backed keystore when the target proves support.
- Use per-device credentials where supported to reduce correlated compromise.
- Keep cloud control unable to decrypt broker credentials.
- Use short-lived tokens, explicit audience/scope, rotation, revocation, and device-bound proof where feasible.
- Require explicit owner recovery and revocation procedures before device pairing is enabled.
- Redact C2/C3 fields before logging, crash capture, analytics, prompt creation, or synchronization.

Approval of this document does not approve these mechanisms or select a provider.

## 6. Logging, prompting, synchronization, and export

| Boundary | Locked minimum | Still blocked |
| --- | --- | --- |
| Logs | No credentials, account data, or internal chain-of-thought; use safe reason and correlation IDs | Field-level redaction policy, retention, access, integrity |
| Crash reports | No secrets or account data | Whether collection is enabled, consent, provider, retention |
| AI prompts | No secrets; only structured evidence needed for the analytical task | Exact minimization, model/provider policy, retention guarantees |
| Cloud sync | No plaintext secrets; cloud is not v1 execution authority | Provider, payloads, encryption, keys, recovery, revocation |
| Audit export | Must be readable and preserve integrity | Export format, redaction profile, recipient authorization |
| Backup/restore | Must not lose safety-critical or audit state | Encryption, location, recovery, retention, deletion, open-position exceptions |

## 7. Incident handling - proposed, not approved

A future security plan must define detection, containment, credential revocation, device fencing, evidence preservation, owner notification, recovery, and post-incident review. Until approved, suspected C3 exposure must be treated as requiring revocation before any future connector can resume.

## 8. Phase disposition

The approved prohibitions are implementable governance. DEC-043 and DEC-064–DEC-065 now lock the policy baseline below; provider, cryptographic library, storage engine, and runtime implementation remain deferred and no secret or cloud capability is authorized.

## 9. Delegated policy baseline

`C0` public material, `C1` internal architecture/strategy material, `C2` market-derived, personal trading, device-identity and audit data, and `C3` credentials, private keys, pairing secrets, recovery material and cloud signing material are the locked classifications for later implementation. C2/C3 require minimization, authenticated access, auditability and approved retention. C3 must never be placed in the repository, PWA, prompts, logs, analytics, crash data, exports, or cloud plaintext.

Future cloud control is limited to encrypted, minimal state/notification/device-lease data and may never become a continuous analysis or execution authority. Data keys are generated and retained within the trusted Local Trading Node/device boundary; cloud storage must not receive a broker credential or usable decryption key. Device enrollment requires explicit local owner confirmation, a unique device identity, revocation support, and an auditable recovery path. Backup/restore must preserve open-position safety and append-only audit evidence; retention or deletion must fail closed when that guarantee cannot be met.

These are `LOCKED` policy requirements (DEC-064, DEC-065), not an approved cloud provider, encryption algorithm, keystore, pairing protocol, credential, or implementation plan. All external capability flags remain disabled.
