# System Requirements Specification

## 1. Document control

| Field | Value |
| --- | --- |
| Document ID | SRS-PHASE-1 |
| Status | Owner-review draft; Phase 1 gate not passed |
| Authority | Persian architecture PDF plus subsequent explicit owner instructions |
| Translation | English repository documentation is the version-controlled implementation translation |
| Conflict rule | The owner's latest explicit instruction prevails |
| Implementation state | Documentation only; no executable system exists |

Requirement status is `LOCKED` when the behavior is already owner-approved, and `BLOCKED` when implementation depends on an unresolved P0/P1 decision. A blocked requirement is not permission to choose a default.

Traceability follows:

```text
PDF / Owner Instruction
        |
DEC-* -> REQ-* -> INV-* / RISK-* -> THR-*
        |
OPEN-* blocker and verification evidence
```

## 2. Product intent and non-goals

The planned product is a personal, single-user, multi-market trading analysis and execution-control system for Windows and Android. It is intended to discover, explain, review, and eventually control opportunities through deterministic calculations and tightly bounded analytical AI roles.

Phase 1 produces requirements and safety documentation only. Application code, contracts, schemas, dependencies, connectors, secrets, network clients, AI calls, model downloads, paper trading, OMS, and real execution are non-goals.

## 3. Requirements

### 3.1 Authority and lifecycle

| ID | Requirement | Status | Source | Invariant | Risk rule | Threat | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-AUTH-001 | The Persian PDF and subsequent explicit owner instructions shall be product authority; the latest explicit owner instruction shall prevail on conflict. | LOCKED | Owner instruction; DEC-036 | INV-019 | RISK-020 | THR-030 | Document review against authority wording |
| REQ-AUTH-002 | Work shall proceed one roadmap phase at a time; each phase shall state scope, owner decisions, and unsafe assumptions before work begins. | LOCKED | Owner instruction; DEC-036 | INV-019 | RISK-019 | THR-030 | Phase-gate checklist review |
| REQ-AUTH-003 | An unresolved P0/P1 decision shall not be silently resolved or bypassed; work affected by it shall wait for owner approval. | LOCKED | Owner instruction; DEC-036 | INV-002, INV-019 | RISK-019 | THR-009 | Open-issue and change review |
| REQ-AUTH-004 | Compilation or a lower-level technical check shall not by itself complete a roadmap phase. | LOCKED | Owner instruction; DEC-036 | INV-019 | RISK-019 | THR-030 | Acceptance evidence review |
| REQ-AUTH-005 | Owner-facing conversation and progress reporting shall be in Persian unless the owner explicitly requests another language; technical identifiers remain stable. | LOCKED | Owner instruction; DEC-037 | INV-019 | RISK-019 | THR-030 | Review owner-facing reports and identifier stability |
| REQ-AUTH-006 | Owner questions shall use interactive selectable options when supported; otherwise one short Persian question shall be asked at a time and silence shall not imply approval. | LOCKED | Owner instruction; DEC-039 | INV-019 | RISK-019 | THR-030 | Review owner decision interactions and recorded approvals |

### 3.2 Product and market scope

| ID | Requirement | Status | Source | Invariant | Risk rule | Threat | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-PROD-001 | The planned product shall support one owner on Windows and Android without introducing multi-user authority in v1. | LOCKED | PDF §1, §9; DEC-001 | INV-004 | RISK-020 | THR-001 | Architecture and UI authorization review |
| REQ-PROD-002 | Planned market scope shall include OpoFinance/cTrader Forex and selected metals, Binance Spot, and Binance USD-M Futures; exact instruments remain blocked. | BLOCKED | PDF §2.1; DEC-002; OPEN-010 | INV-015 | RISK-020 | THR-021 | Owner-approved instrument registry required |
| REQ-PROD-003 | Context, setup, and entry timeframes shall be 4H/1H, 15M, and 5M/1M respectively. | LOCKED | PDF §2.2; DEC-013 | INV-011 | RISK-009 | THR-029 | Configuration/golden-fixture review in later phase |
| REQ-PROD-004 | Scalp and Intraday shall remain separate strategy engines with separate statistics and drawdown accounting. | LOCKED | PDF §5.1; DEC-014 | INV-001 | RISK-019 | THR-006 | Architecture and replay-test review |
| REQ-PROD-005 | ATR, VWAP, and Volume Profile may be secondary filters; RSI, MACD, and moving averages shall not independently generate or upgrade a v1 candidate. | LOCKED | PDF §5.3; DEC-016 | INV-001 | RISK-008 | THR-009 | Deterministic strategy tests in later phase |
| REQ-PROD-006 | The default authority mode shall be Manual Confirm. Analysis Only and Constrained Auto remain future modes and are not implemented in Phase 1. | LOCKED | PDF §1.2; DEC-003 | INV-016 | RISK-013 | THR-028 | Configuration and state-machine review later |
| REQ-PROD-007 | Only grades A and A+ shall be displayed for approval; lower grades shall be retained for analysis only, and any future Auto consideration is limited to conflict-free A+. | BLOCKED | PDF §7.1; DEC-017; OPEN-001, OPEN-002 | INV-002, INV-016 | RISK-013 | THR-009 | Approved grading and conflict rules required |

### 3.3 Deterministic decision processing

| ID | Requirement | Status | Source | Invariant | Risk rule | Threat | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-DET-001 | Market data, features, strategy candidates, policy, risk, sizing, margin, leverage, order intent, OMS, reconciliation, and execution decisions shall be deterministic Local Trading Node responsibilities. | LOCKED | PDF §3, §6.4, §12.2; DEC-005, DEC-010 | INV-001 | RISK-016 | THR-009 | Boundary and dependency tests later |
| REQ-DET-002 | The planned decision flow shall be `MarketEvent -> FeatureSnapshot -> StrategyCandidate -> AnalystProposal + CriticProposal -> conditional JudgeDecision -> Deterministic PolicyGate -> RiskDecision -> OrderIntent -> ExecutionReport -> AuditEvent`. | LOCKED | Owner correction; DEC-009 | INV-001, INV-017 | RISK-016 | THR-008 | Architecture trace review |
| REQ-DET-003 | Only deterministic Local Trading Node components shall calculate risk or create a risk-approved `OrderIntent`. | LOCKED | Owner correction; DEC-010 | INV-001, INV-005 | RISK-016 | THR-009 | Import/dependency and negative authorization tests later |
| REQ-DET-004 | Definitions for BOS/CHoCH, order blocks, FVG, sweeps, displacement, mitigation, order-flow features, grading, and material conflict shall not be implemented until approved. | BLOCKED | PDF §5, §13; DEC-015; OPEN-001, OPEN-002 | INV-002, INV-011 | RISK-008 | THR-009 | Owner-approved definitions and golden data required |
| REQ-DET-005 | Every future event shall include the approved minimum envelope metadata, but no schema shall be inferred before contract questions are closed. | BLOCKED | PDF §12.3; DEC-029; OPEN-003, OPEN-018 | INV-007, INV-011 | RISK-016 | THR-008 | Schema review in Roadmap Phase 2 only |
| REQ-DET-006 | Replay, backtest, paper, and later execution shall reuse the same deterministic feature, strategy, risk, and OMS logic. | LOCKED | PDF §10, §13; DEC-032 | INV-001 | RISK-019 | THR-006 | Cross-mode golden replay tests later |
| REQ-DET-007 | `Price`, `Quantity`, `Money`, `Percent`, and `R:R` shall use decimal strings at wire boundaries; authoritative financial calculations shall not use JavaScript `number`; symbol precision shall come from versioned symbol metadata. | LOCKED | Owner instruction; DEC-038 | INV-001, INV-005, INV-011 | RISK-016 | THR-008, THR-029 | Contract examples, forbidden-type checks, metadata-version and replay tests later |
| REQ-DET-008 | Authoritative internal financial calculations shall use arbitrary-precision Decimal values. The package/runtime selection and rounding policy remain blocked until dependency approval and owner decisions. | LOCKED | Owner instruction; DEC-040 | INV-001, INV-005 | RISK-016 | THR-008, THR-029 | Decimal property, rounding, cross-device replay, and forbidden-number tests later |
| REQ-RISK-011 | Initially quantized order quantity shall round down to the permitted `stepSize`, so ordinary quantization cannot increase approved risk. The minimum-order exception is governed by `REQ-RISK-012`. | LOCKED | Owner instruction; DEC-041 | INV-005 | RISK-016 | THR-009 | Boundary and property tests against risk cap and step size later |
| REQ-RISK-012 | If initially quantized quantity is below `minQty` or `minNotional`, it may rise only to the minimum venue-valid quantity after every policy, risk, margin, correlation, and venue validation passes again; otherwise the trade is rejected. | LOCKED | Owner instruction; DEC-042 | INV-002, INV-005 | RISK-016 | THR-009 | Revalidation, venue-boundary, and risk-cap property tests later |

### 3.4 Analytical AI roles

| ID | Requirement | Status | Source | Invariant | Risk rule | Threat | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-AI-001 | Live analytical roles shall be Analyst, Critic, and conditional Judge; the Post-Trade Auditor shall be non-live. | LOCKED | PDF §6.1; owner correction; DEC-006, DEC-007 | INV-017, INV-018 | RISK-016 | THR-023 | Architecture/role capability review |
| REQ-AI-002 | The Judge shall be invoked only for material conflict or A+ and shall return only `APPROVE`, `REJECT`, or `REANALYZE`; exact conflict and transition rules remain blocked. | BLOCKED | Owner correction; DEC-006; OPEN-002 | INV-002, INV-017 | RISK-016 | THR-024 | Owner-approved policy and later contract tests |
| REQ-AI-003 | Judge `APPROVE` shall be analytical only and shall not represent policy, risk, or execution authorization. | LOCKED | Owner correction; DEC-005, DEC-010 | INV-003, INV-005 | RISK-016 | THR-009 | Negative authority tests later |
| REQ-AI-004 | The Post-Trade Auditor may report and compare outcomes only and shall not change rules, models, prompts, weights, risk, settings, or execution behavior. | LOCKED | Owner correction; DEC-007 | INV-018 | RISK-019 | THR-006 | Read-only capability review later |
| REQ-AI-005 | AI outputs shall be structured, evidence-referenced, rejectable analytical inputs; authoritative price and risk ownership remains blocked pending a precise contract. | BLOCKED | PDF §6.3-6.4; DEC-010; OPEN-003, OPEN-016 | INV-003 | RISK-016 | THR-024 | Contract and negative authority tests later |
| REQ-AI-006 | Internal chain-of-thought shall not be displayed or persisted. Auditable evidence, uncertainty, reason codes, and structured decisions may be recorded. | LOCKED | PDF §6.3; DEC-012 | INV-008 | RISK-016 | THR-027 | Storage/log content tests later |
| REQ-AI-007 | Outcomes shall not automatically change learning, rules, prompts, weights, models, risk, or settings. | LOCKED | PDF §1.3, §6; DEC-008 | INV-006 | RISK-019 | THR-006 | Mutation-path and permissions tests later |
| REQ-AI-008 | AI calls, providers, runtimes, and model downloads shall remain disabled until an explicitly approved later phase. | LOCKED | Owner instruction; DEC-035, DEC-036 | INV-010, INV-015 | RISK-019 | THR-025 | Repository and runtime egress checks |

### 3.5 Market data and policy

| ID | Requirement | Status | Source | Invariant | Risk rule | Threat | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-DATA-001 | External market data shall be untrusted until schema, time, sequence, gap, and freshness validation passes; exact thresholds remain blocked. | BLOCKED | PDF §3.2, §12.3; DEC-011; OPEN-007 | INV-002, INV-011, INV-015 | RISK-016 | THR-007 | Approved thresholds and fault fixtures required |
| REQ-DATA-002 | Forex DOM from one broker shall be secondary evidence and shall not be presented as global Forex liquidity. | LOCKED | PDF §4.1; DEC-024 | INV-011 | RISK-008 | THR-007 | Evidence-label and feature-source tests later |
| REQ-DATA-003 | Planned BTC/ETH L2 processing assumes 50 bid and 50 ask levels, with a 30-day raw-retention target; exact storage controls remain blocked. | BLOCKED | PDF §4.2, §10.1; DEC-025; OPEN-022 | INV-011 | RISK-019 | THR-013 | Owner-approved retention and disk-pressure policy |
| REQ-DATA-004 | High-impact news shall be a safety filter, not a directional predictor, and shall block new entries 30 minutes before and 15 minutes after a relevant event. | LOCKED | PDF §4.4; DEC-023 | INV-002, INV-011 | RISK-014 | THR-029 | Deterministic boundary tests later |
| REQ-DATA-005 | A stale or unavailable calendar shall block affected assets only; provider, mapping, and stale thresholds remain blocked. | BLOCKED | PDF §4.4; DEC-023; OPEN-012 | INV-002, INV-011 | RISK-015 | THR-020 | Approved mapping and failure fixtures required |
| REQ-DATA-006 | Session schedules shall support per-symbol/per-day rules and Sydney display with DST conversion; authoritative time and schedules remain blocked. | BLOCKED | PDF §2.3; DEC-011; OPEN-011 | INV-011 | RISK-016 | THR-029 | Owner-approved schedules/time authority required |

### 3.6 Risk and candidate lifecycle

| ID | Requirement | Status | Source | Invariant | Risk rule | Threat | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-RISK-001 | Per-trade risk shall remain within the approved 0.25%-0.75% range; the adaptive mapping shall not be implemented until `OPEN-004` is resolved. | BLOCKED | PDF §8.1; DEC-019; OPEN-004 | INV-005 | RISK-001 | THR-009 | Owner-approved mapping and property tests required |
| REQ-RISK-002 | Total open portfolio risk shall not exceed 1%, with no more than three concurrent positions. | LOCKED | PDF §8.1; DEC-019 | INV-005 | RISK-002, RISK-003 | THR-009 | Property and boundary tests later |
| REQ-RISK-003 | Default daily loss shall be 1.5%; at 3% drawdown risk shall be halved, and at 5% new entries shall stop pending review. Definitions remain blocked. | BLOCKED | PDF §8.1; DEC-020; OPEN-005 | INV-002, INV-005 | RISK-004, RISK-005, RISK-006 | THR-009 | Approved accounting/reset definitions required |
| REQ-RISK-004 | Raising a daily loss limit after a daily stop shall not restart trading that day; the new value applies no earlier than the next day. | BLOCKED | PDF §8.1; DEC-020; OPEN-005, OPEN-011 | INV-002, INV-005 | RISK-007 | THR-028 | Approved day boundary and state-transition tests required |
| REQ-RISK-005 | Net R:R shall be dynamic but shall never be below 1.5 after costs; cost calculation remains blocked. | BLOCKED | PDF §5.2, §8.1; DEC-015; OPEN-014 | INV-005 | RISK-008 | THR-009 | Approved cost model and golden calculations required |
| REQ-RISK-006 | Counter-trend trading shall be future Manual Confirm only, A+ only, at fixed 0.25% risk, and prohibited in Auto. | BLOCKED | PDF §2.2, §8.1; DEC-013; OPEN-001, OPEN-002 | INV-005, INV-016 | RISK-009 | THR-009 | Approved A+ definition and policy tests required |
| REQ-RISK-007 | Future Binance Futures behavior shall use isolated margin, adaptive 1x-3x leverage, and no simultaneous long/short on one symbol. | BLOCKED | PDF §8.3; DEC-022; OPEN-004, OPEN-006, OPEN-010 | INV-005 | RISK-010, RISK-011, RISK-012 | THR-021 | Owner-approved leverage/instrument rules required |
| REQ-RISK-008 | Future Auto trials shall be limited to conflict-free A+, one session, and 0.25% risk for the first 100 trades. | BLOCKED | PDF §1.2, §8.3; DEC-022; OPEN-002, OPEN-011 | INV-002, INV-005, INV-016 | RISK-013 | THR-009 | Explicit later Auto approval and policy tests required |
| REQ-RISK-009 | Candidate validity, price, spread, slippage, account state, and risk shall be revalidated immediately before any future send; exact behavior remains blocked. | BLOCKED | PDF §3.2, §7.2; DEC-018, DEC-021; OPEN-006, OPEN-013, OPEN-014 | INV-002, INV-005, INV-016 | RISK-016 | THR-009 | Approved lifecycle/cost rules required |
| REQ-RISK-010 | A pending entry shall be cancelled on invalidation or after at most three entry-timeframe candles, and the system shall not chase a missed fill; lifecycle details remain blocked. | BLOCKED | PDF §7.2; DEC-018; OPEN-013 | INV-002, INV-016 | RISK-017 | THR-010 | Approved state-machine tests required |

### 3.7 Execution, platform, security, and audit

| ID | Requirement | Status | Source | Invariant | Risk rule | Threat | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-SEC-001 | The PWA shall be presentation and interaction only and shall not own feeds, credentials, risk, OMS, execution, or large-model runtime. | LOCKED | PDF §12.1; DEC-026 | INV-004 | RISK-016 | THR-001, THR-004 | Boundary and bundle tests later |
| REQ-SEC-002 | The Windows Local Trading Node shall be the planned deterministic authority; no Local Node source is created in Phase 1. | LOCKED | PDF §12.1; DEC-027 | INV-001 | RISK-016 | THR-005 | Architecture review |
| REQ-SEC-003 | Android background execution, secure storage, and failover shall require a later approved native bridge; “full capability” shall not be assumed. | BLOCKED | PDF §9, §12.1; DEC-026, DEC-028; OPEN-020 | INV-014, INV-015 | RISK-019 | THR-014, THR-015 | Device threat/benchmark approval required |
| REQ-SEC-004 | Future cloud control may synchronize encrypted state, notifications, device status, and executor lease but shall not run continuous v1 analysis or execution; details remain blocked. | BLOCKED | PDF §9.3; DEC-028; OPEN-009, OPEN-021 | INV-014, INV-015 | RISK-019 | THR-017, THR-018, THR-019 | Cloud/device design approval required |
| REQ-SEC-005 | Exactly one future executor authority shall be active, but heartbeat timing alone shall not establish exclusivity. | BLOCKED | PDF §9.2; DEC-031; OPEN-009 | INV-014 | RISK-016 | THR-017 | Approved fenced-lease design and tests required |
| REQ-SEC-006 | Secrets, credentials, and account data shall not appear in prompts, logs, crash reports, analytics, or repository files. | LOCKED | PDF §1.3, §12.3; DEC-030 | INV-009 | RISK-019 | THR-027 | Secret scanning and negative logging tests |
| REQ-SEC-007 | Live trading, external connectors, secrets, AI calls, and model downloads shall remain disabled until explicit later owner approval. | LOCKED | Owner instruction; DEC-035, DEC-036 | INV-010, INV-015 | RISK-019 | THR-028 | Flags, dependency, source, and egress review |
| REQ-SEC-008 | Future `OrderIntent` processing shall be idempotent and future restart/failover shall reconcile against broker truth; exact OMS behavior remains blocked. | BLOCKED | PDF §12.3, §13; DEC-029, DEC-031; OPEN-008, OPEN-009 | INV-012, INV-013, INV-014 | RISK-018 | THR-010, THR-022 | Approved OMS state machine and recovery tests required |
| REQ-AUD-001 | Audit/event history shall be append-only, readable for incident review, and corrected through new linked events rather than silent rewrite. | LOCKED | PDF §10, §12.3; DEC-030 | INV-007 | RISK-019 | THR-026 | Append-only and reconstruction tests later |
| REQ-AUD-002 | Local storage is planned as SQLite WAL with later Parquet/DuckDB analysis; retention, encryption, backup, restore, and disk-pressure behavior remain blocked. | BLOCKED | PDF §10, §12.1; DEC-025, DEC-028; OPEN-022 | INV-007, INV-015 | RISK-019 | THR-011, THR-012, THR-013 | Owner-approved storage policy required |

### 3.8 Validation and live gate

| ID | Requirement | Status | Source | Invariant | Risk rule | Threat | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-TEST-001 | Deterministic features shall require approved golden datasets; strategy/risk/OMS behavior shall require replay, property, recovery, and chaos evidence before affected gates can pass. | BLOCKED | PDF §13; DEC-032; OPEN-001, OPEN-024 | INV-001, INV-002 | RISK-019 | THR-006, THR-029 | Approved fixtures and later automated tests required |
| REQ-TEST-002 | Paper simulation and official demo/testnet results shall be reported separately and shall include costs and slippage. | BLOCKED | PDF §10.3; DEC-032; OPEN-014 | INV-007 | RISK-008, RISK-019 | THR-022 | Approved cost model and comparative reports required |
| REQ-LIVE-001 | No real account shall connect before all applicable gates pass and the owner explicitly approves the affected market and strategy. | LOCKED | PDF §1, §13; DEC-004, DEC-033 | INV-010, INV-019 | RISK-019, RISK-020 | THR-021, THR-028 | Gate checklist and owner approval evidence |
| REQ-LIVE-002 | The planned live gate includes at least four consecutive paper/demo weeks, 500 valid signals overall, adequate per-market/path samples, positive post-cost expectancy, and execution/data/security acceptance; statistical interpretation remains blocked. | BLOCKED | PDF §13; DEC-033; OPEN-023 | INV-019 | RISK-019, RISK-020 | THR-030 | Owner-approved statistical criteria required |
| REQ-LIVE-003 | Passing one market or strategy shall not authorize another market or strategy. | LOCKED | PDF §13; DEC-033 | INV-019 | RISK-020 | THR-030 | Independent approval record review |

## 4. Decision coverage

| Decisions | Covered by requirements |
| --- | --- |
| DEC-001-DEC-004 | REQ-PROD-001, REQ-PROD-002, REQ-PROD-006, REQ-LIVE-001 |
| DEC-005-DEC-012 | REQ-DET-001-REQ-DET-003, REQ-AI-001-REQ-AI-007 |
| DEC-013-DEC-018 | REQ-PROD-003-REQ-PROD-005, REQ-RISK-005, REQ-RISK-006, REQ-RISK-009, REQ-RISK-010 |
| DEC-019-DEC-023 | REQ-RISK-001-REQ-RISK-008, REQ-DATA-004, REQ-DATA-005 |
| DEC-024-DEC-028 | REQ-DATA-002, REQ-DATA-003, REQ-SEC-001-REQ-SEC-004, REQ-AUD-002 |
| DEC-029-DEC-033 | REQ-DET-005, REQ-SEC-006, REQ-SEC-008, REQ-AUD-001, REQ-TEST-001, REQ-TEST-002, REQ-LIVE-001-REQ-LIVE-003 |
| DEC-034-DEC-035 | REQ-SEC-001, REQ-SEC-002, REQ-SEC-007; Phase 1 non-goals |
| DEC-036 | REQ-AUTH-001-REQ-AUTH-004, REQ-LIVE-001 |
| DEC-037 | REQ-AUTH-005 |
| DEC-038 | REQ-DET-007 |
| DEC-039 | REQ-AUTH-006 |
| DEC-040 | REQ-DET-008 |
| DEC-041 | REQ-RISK-011 |
| DEC-042 | REQ-RISK-012 |

## 5. Proposed Phase 1 acceptance criteria

The Phase 1 review package is ready for owner review when all of the following are true:

1. The SRS, safety invariants, data classification/secrets handling, threat model, approved risk rules, and decision-register blocker matrix exist and are internally linked.
2. Every locked `DEC-*` maps to at least one requirement or explicit non-goal.
3. Every `REQ-*` records source, status, invariant, risk rule, threat, and verification method.
4. Every P0/P1 issue remains open, appears in the blocker matrix, and states the affected phases and owner decision required.
5. Every requested component appears in the threat model with assets, trust boundaries, STRIDE/misuse threats, proposed mitigations, residual severity, and owner acceptance status.
6. Data handling clearly separates locked prohibitions from proposed classification, cryptography, retention, recovery, and device-trust controls.
7. Risk rules contain only source-approved limits and explicitly block unresolved formulas, accounting definitions, cost models, lifecycle transitions, and activation decisions.
8. The proposed severity model accepts no residual risk on the owner's behalf.
9. Live trading, connectors, secrets, AI calls, model downloads, dependencies, schemas, source code, and real execution remain absent or disabled.
10. The owner reviews the complete P0/P1 list and records whether the documentation baseline is accepted for further decision work.

Roadmap Phase 1 itself passes only after the review criteria above, closure of every P0 issue through explicit owner decisions, and recorded owner approval.

## 6. Phase 1 disposition

This SRS was formally accepted as the Roadmap Phase 1 baseline in DEC-068. It is not implementation authority. Starting Phase 2 still requires separate explicit approval.

## 7. Delegated-resolution traceability overlay

This overlay is authoritative where historical rows still say `BLOCKED`. It locks planning requirements only; it does not authorize source code, dependencies, schemas, network clients, integrations, AI calls, model downloads, paper/demo, or live execution.

| Decisions | Requirement coverage | Future verification evidence |
| --- | --- | --- |
| DEC-043 | REQ-AUTH-003, REQ-AUTH-006 | Decision-register and owner-instruction review |
| DEC-044–DEC-045 | REQ-DET-005, REQ-DET-007, REQ-DET-008, REQ-RISK-009, REQ-RISK-011, REQ-RISK-012 | Schema, decimal, canonicalization, metadata and sizing fixtures |
| DEC-046, DEC-047, DEC-048 | REQ-DATA-001, REQ-DET-004, REQ-AI-002, REQ-PROD-007 | Feed-fault, golden-data and council-state fixtures |
| DEC-049–DEC-050 | REQ-RISK-001 through REQ-RISK-008 | Portfolio, drawdown, timezone and property tests |
| DEC-051–DEC-052 | REQ-SEC-005, REQ-SEC-008 | OMS idempotency/recovery and lease-partition chaos tests |
| DEC-053, DEC-054, DEC-055, DEC-056, DEC-057, DEC-058 | REQ-PROD-002, REQ-DATA-005, REQ-DATA-006, REQ-RISK-005, REQ-RISK-010 | Registry/session/news/lifecycle/cost/exit fixtures |
| DEC-059, DEC-060, DEC-061 | REQ-AI-005, REQ-AUD-001, REQ-AUD-002 | Authority, human-revision and replay/audit tests |
| DEC-062, DEC-063, DEC-064, DEC-065 | REQ-SEC-001, REQ-SEC-003, REQ-SEC-004, REQ-SEC-006 | Transport, device, cloud and retention tests |
| DEC-066, DEC-067 | REQ-TEST-001, REQ-TEST-002, REQ-LIVE-002 | Statistical-gate and exact cross-device replay evidence |
| DEC-068 | REQ-AUTH-002, REQ-AUTH-004 | Recorded Phase 1 acceptance and unchanged capability prohibitions |
