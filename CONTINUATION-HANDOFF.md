# Project Continuation Handoff

This file is the starting point for any new ChatGPT, Codex Cloud, Google Agent, or human contributor. It records the repository state as of 2026-09-05. It does not replace the authoritative decisions in `docs/decision-register.md` and `docs/architecture-v2.md`.

## Repository

- GitHub: `https://github.com/hamedharami-hub/ai-trading-system`
- Default branch: `main`
- Verified handoff commit: `f2628ae` (`feat(replay): summarize EURUSD M1 Golden evidence`)
- Owner-facing language: Persian. Keep technical identifiers, decision IDs, and wire values unchanged.

## Product goal

Build a personal Windows and Android trading-analysis and execution-control system. The immediate working scope is strictly local `EURUSD / M1 / Historical Replay` evidence. The product is not approved for live trading.

The long-term decision flow is:

`MarketEvent -> FeatureSnapshot -> StrategyCandidate -> AnalystProposal + CriticProposal -> JudgeDecision -> PolicyGate -> RiskDecision -> OrderIntent -> ExecutionReport -> AuditEvent`

Only the deterministic Local Trading Node may eventually calculate risk or create a risk-approved `OrderIntent`. The PWA is presentation only. AI is advisory only and cannot create or execute orders.

## Roadmap status

| Macro phase | Status | Notes |
| --- | --- | --- |
| 1 Recovery and reuse audit | Accepted | `DEC-074` |
| 2 Deterministic core | Accepted | `DEC-076` |
| 3 Offline AI foundations | Accepted | `DEC-079`; this does not mean a production local model service is running |
| 4 PWA and cloud-control boundary | Accepted | `DEC-083`; cloud is non-authoritative |
| 5 Read-only data and Paper/Demo | Active | Local Replay evidence only. Paper entry, fill, position and P&L are not implemented or authorized |
| 6 Hardening and Live Gate | Not started | Requires Phase 5 acceptance and separate owner decisions |

The current Phase 5 scope is accepted through `DEC-256`.

## Implemented local Replay evidence

The deterministic core can observe and audit local `EURUSD / M1 / REPLAY` facts. These are evidence only, never a trading signal or order:

- Candle and confirmed Swing facts
- ATR-14 and displacement facts
- BOS and FVG facts
- Order Block origin and later state
- FVG later state
- Liquidity Sweep/Raid facts
- Immutable observation bundles, JCS canonicalization and SHA-256 digests
- Bounded batches of cursor evidence and their audit digests
- Golden Dataset manifest validation
- Opaque owner-label-set cursor binding, digest and digest verification
- A fail-closed Golden evidence readiness aggregation

`GOLDEN_EVIDENCE_READY` means only that supplied local manifest, label binding and expected digest agree. It does not assert market-data quality, label correctness, strategy quality, Paper/Demo readiness or execution authority.

## Trading design already decided

The intended style is a deterministic market-structure / Smart Money approach with separate Scalp and Intraday engines. Important locked design rules are in `docs/phase-1-delegated-decisions-fa.md`:

- A candidate needs a liquidity event, displacement plus BOS/CHoCH, a valid OB/FVG entry area and invalidation, order-flow confirmation, no severe spread/volatility conflict, net R:R of at least 1.5 after costs, and no policy/risk prohibition.
- A and A+ are the only future grades displayed for approval. A uses 0.25% risk, A+ uses 0.5%, and an exceptional A+ may use 0.75% only under the locked extra constraints.
- Order Flow definitions such as OFI/CVD, exact grading thresholds and a complete deterministic candidate algorithm are not yet implemented. Do not invent them from trading folklore.
- Any unknown, stale, invalid, conflicting or timed-out state fails closed to no new trade.

## Non-negotiable boundaries

Do not add any of the following without a separately scoped decision and explicit owner acceptance:

- Broker, exchange or market-data client
- Credentials, API keys, tokens, account data or credential placeholders
- Remote AI calls, model downloads or cloud AI authority
- Live, Demo, Testnet, broker, OMS or execution behavior
- Paper entry, fill, position or P&L lifecycle
- A feature that changes any of these flags to true: `LIVE_TRADING_ENABLED`, `BROKER_CONNECTORS_ENABLED`, `AI_ROUTER_ENABLED`, `MODEL_DOWNLOADS_ENABLED`

Never treat passing tests, a build or an internal `OrderIntent` object as approval for execution.

## Current blockers before meaningful Paper work

1. Approved local Golden Dataset and owner-labelled examples are needed. Tooling exists, but no actual labels or data quality claim should be fabricated.
2. Locked deterministic definitions are needed for Order Flow, complete candidate scoring, grades, entry, stop, target and invalidation behavior.
3. Cost, slippage and partial-fill assumptions need approved evidence.
4. A separately authorized Paper lifecycle must be designed and tested before any simulated entry, fill, position or P&L is introduced.
5. Demo/Testnet and Live require later separate gates. Live additionally requires security/recovery evidence, at least four consecutive Paper/Demo weeks, and at least 500 valid signals under the locked statistical rules.

## Required reading order for a new agent

1. `AGENTS.md`
2. `docs/decision-register.md`
3. `docs/architecture-v2.md`
4. `docs/consolidated-roadmap-fa.md`
5. `docs/phase-1-delegated-decisions-fa.md`
6. Relevant `docs/eurusd-m1-*.md` evidence documents

Treat this handoff as an index. When it conflicts with the decision register or a later explicit owner instruction, the latter wins.

## Safe work procedure

1. Read the required files above and inspect `git status --short --branch`.
2. Work in a new branch or Pull Request. Do not push directly to `main` unless the owner explicitly asks.
3. State exact in-scope and out-of-scope behavior before a new Phase 5 capability.
4. Record a new decision ID before material behavior is added, then record acceptance only after verification.
5. Add proportionate tests and preserve immutable, deterministic, fail-closed behavior.
6. Run the verification commands below. Report any command that could not be run.
7. Summarize the capability added, the capability deliberately not added, remaining blockers, and the commit/PR link.

## Verification commands

Run from repository root with Node 24 and pnpm 11:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level high
```

Current verified state at this handoff: deterministic core has 124 tests. The complete workspace checks above passed before commit `f2628ae`.

## Copy and paste prompt for another coding agent

```text
Continue the repository https://github.com/hamedharami-hub/ai-trading-system from the current main branch. Read CONTINUATION-HANDOFF.md, AGENTS.md, docs/decision-register.md, docs/architecture-v2.md, docs/consolidated-roadmap-fa.md and docs/phase-1-delegated-decisions-fa.md before changing code.

Current authorized focus is only local EURUSD / M1 / Historical Replay evidence in Phase 5. Work in a new branch or Pull Request, not directly on main. Preserve deterministic and fail-closed behavior. Update the decision register for any material new behavior and add tests.

Do not add a broker or exchange connector, network market-data client, credentials or placeholders, remote AI, model download, Paper entry/fill/position/P&L, Demo/Testnet, OMS or any live execution behavior. Keep LIVE_TRADING_ENABLED, BROKER_CONNECTORS_ENABLED, AI_ROUTER_ENABLED and MODEL_DOWNLOADS_ENABLED false.

Do not call a roadmap phase complete merely because tests pass. Run lint, typecheck, test, build and high-severity audit before presenting a PR. In the PR state what was added, what remains prohibited, commands run, and the next unresolved owner decision.
```

## Handoff to Codex for final review

Give Codex the branch name or Pull Request URL and ask for an architecture and safety review. Codex should reject any change that weakens the restrictions above, invents market definitions, claims Paper/Live readiness without evidence, or skips verification.

## Reference map

- Product authority PDF: `docs/source/architecture-authority-v2.1-fa.pdf`
- Architecture: `docs/architecture-v2.md`
- Complete decision ledger: `docs/decision-register.md`
- Six-phase roadmap: `docs/consolidated-roadmap-fa.md`
- Trading and safety decisions: `docs/phase-1-delegated-decisions-fa.md`
- Earlier owner handoff: `docs/ai-handoff-fa.md`
