# Repository Instructions for Agents

## Authority

The Persian architecture PDF and subsequent explicit owner instructions are the product authority. English repository documentation is the version-controlled implementation translation. If a conflict exists, the owner's latest explicit instruction prevails.

Read `docs/decision-register.md` and `docs/architecture-v2.md` before proposing or changing product behavior. Record new material decisions and conflicts; do not silently resolve an open safety issue.

## Owner communication

Communicate with the owner in Persian unless the owner explicitly requests another language. Keep technical identifiers stable and do not translate wire values, code symbols, or established document IDs.

Use interactive selectable questions when the interface supports them. If interactive controls are unavailable, ask one short Persian question at a time. Never interpret silence as approval.

## Roadmap phase gate

Work one roadmap phase at a time. Before starting a new phase:

1. State its exact in-scope and out-of-scope work.
2. List every unresolved owner decision that affects it.
3. Identify unsafe assumptions and the safe stop behavior.
4. Wait for owner approval when a P0/P1 decision is unresolved.

Do not treat compilation, a green test, or a partial artifact as completion of a roadmap phase. Do not begin a later phase until the current phase's explicit acceptance gate and owner approval are recorded.

## Current repository phase

Consolidated Phase 3 (Offline AI) is authorized by DEC-077. It may add a pinned `llama.cpp` runtime source, verified GGUF acquisition tooling, Windows local-process and Android native adapters, analytical role orchestration, and Mock/Replay benchmarks. During this phase, do not add:

- broker, exchange, market-data, notification, or cloud integrations;
- network clients or outbound calls;
- API keys, tokens, credentials, account data, or credential placeholders;
- unverified model/runtime downloads, remote AI calls, or committed model artifacts;
- live, demo, testnet, paper, OMS, or execution behavior.

Do not request secrets. Keep `LIVE_TRADING_ENABLED`, `BROKER_CONNECTORS_ENABLED`, `AI_ROUTER_ENABLED`, and `MODEL_DOWNLOADS_ENABLED` false.

## Architectural invariants

- The PWA is presentation and interaction only.
- Only deterministic Local Trading Node components can calculate risk or create a risk-approved `OrderIntent`.
- Analyst, Critic, and conditional Judge are live analytical roles. Judge returns only `APPROVE`, `REJECT`, or `REANALYZE` and has no policy, risk, or execution authority.
- Post-Trade Auditor is outside the live path and can only report and compare outcomes.
- AI and UI cannot mutate rules, models, prompts, weights, risk, settings, audit history, or execution state.
- Unknown, stale, invalid, conflicting, or timed-out state fails closed to no new trade.
- Preserve the dependency direction `apps/pwa -> packages/contracts <- apps/local-trading-node`.

## Working practices

- Use strict TypeScript and the rules in `docs/coding-standards.md` when source work is later approved.
- Add tests proportionate to risk and follow `docs/test-strategy.md`.
- Keep events immutable and audit changes through new linked records.
- Use decimal strings for financial wire values and arbitrary-precision Decimal values for authoritative internal monetary/risk calculations. Never use JavaScript `number`; symbol precision comes from versioned metadata. Follow DEC-044 through DEC-067 and `docs/phase-1-delegated-decisions-fa.md`; `decimal.js` remains a future Phase 2 dependency requiring that phase's approval.
- Initially quantize order quantity by rounding down to the venue `stepSize`. A minimum venue-valid increase is allowed only after every policy, risk, margin, correlation, and venue check runs again; any failure rejects the trade. Do not infer remaining rounding behavior.
- Never claim a broker, device, model, quota, or data capability without current evidence and an approved test.
- Preserve user changes and unrelated work in a dirty worktree.

## Foundation verification

Validate JSON/YAML syntax, workspace discovery, disabled flags, absence of dependencies/lockfiles/source code, and absence of credential or integration material. Report any verification that cannot run because dependencies are intentionally absent.

For Phase 3, verify artifact SHA-256 before load, app-private Android model storage, local-process isolation on Windows, bounded prompts/output/tokens/time, schema validation, role capability isolation, deterministic no-trade behavior on any AI failure, and recorded device benchmarks. Keep broker, cloud, and live capabilities disabled. Do not begin Consolidated Phase 4 without its separate scope declaration and explicit approval.
