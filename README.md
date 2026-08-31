# AI Trading System

This repository has been recovered from an untrusted Antigravity implementation onto the approved architecture baseline. Consolidated Phases 2 and 3 provide the deterministic offline core and guarded offline AI evidence. Consolidated Phase 4 is active for the responsive PWA and non-execution Firebase/Vercel control boundary only.

## Authority

The Persian architecture PDF and subsequent explicit owner instructions are the product authority. English repository documentation is the version-controlled implementation translation. If a conflict exists, the owner's latest explicit instruction prevails.

## Current status

The current `main` branch contains:

- the product decision and ambiguity register;
- architecture boundaries and safety invariants;
- coding standards and test strategy;
- a pnpm/Turborepo workspace with a locked dependency graph;
- canonical JSON Schemas and generated TypeScript contracts;
- strict UUIDv7, UTC-millisecond, decimal-string, and payload validation;
- deterministic Decimal financial utilities, PolicyGate, risk limits, and guarded OrderIntent creation;
- sequence-aware Mock/Replay fixtures and a SQLite WAL append-only audit foundation.
- an installable, responsive Persian PWA hosted through Vercel;
- an owner-initiated Firebase Google Authentication boundary that fails closed when configuration is absent;
- no Firestore synchronization, device pairing, cloud lease, or execution authority.

There are no market-data, broker, exchange, OMS, paper/demo, or live-trading integrations. Firebase is limited by [the Phase 4 cloud-control boundary](docs/phase-4-cloud-control.md); it has no risk, order, execution, or AI authority. Antigravity code remains in archived Git history and is reused only after correction and tests.

## Planned architecture

| Workspace | Future responsibility | Current contents |
| --- | --- | --- |
| `apps/pwa` | Next.js/React installable PWA for presentation and trusted user interaction | Responsive presentation UI and guarded owner Google sign-in only |
| `apps/local-trading-node` | Separate Node.js/TypeScript deterministic market-data, features, strategy, policy, risk, and OMS process | Private package manifest; executable process not started |
| `packages/contracts` | Shared TypeScript contracts derived from canonical JSON Schema 2020-12 definitions | Implemented and tested |
| `packages/deterministic-core` | Authoritative offline math, policy, risk, replay, intent, and persistence boundaries | Implemented Phase 2 foundation and tests |

The planned dependency direction is:

```text
apps/pwa -> packages/contracts <- apps/local-trading-node
```

Only future deterministic Local Trading Node components may calculate risk or create a risk-approved order intent. AI roles are analytical only.

## Documentation

- [Consolidated six-phase roadmap](docs/consolidated-roadmap-fa.md)
- [Antigravity recovery audit](docs/antigravity-recovery-audit.md)
- [Phase 2 implementation report](docs/phase-2-implementation.md)
- [Phase 4 cloud-control boundary](docs/phase-4-cloud-control.md)

- [بسته تحویل به هوش مصنوعی بعدی](docs/ai-handoff-fa.md)
- [نسخه داخل‌مخزن PDF مرجع](docs/source/architecture-authority-v2.1-fa.pdf)
- [نقشه راه تاریخی سیزده‌مرحله‌ای](docs/execution-roadmap-fa.md)
- [پرسش نامه تصمیم های P0 مالک](docs/owner-decision-questionnaire-fa.md)
- [تصمیم های تفویض شده مرحله ۱](docs/phase-1-delegated-decisions-fa.md)
- [Decision register](docs/decision-register.md)
- [Architecture v2](docs/architecture-v2.md)
- [System Requirements Specification](docs/system-requirements-specification.md)
- [Safety invariants](docs/safety-invariants.md)
- [Data classification and secrets handling](docs/data-classification-and-secrets.md)
- [Threat model](docs/threat-model.md)
- [Approved risk rules](docs/risk-rules.md)
- [Coding standards](docs/coding-standards.md)
- [Test strategy](docs/test-strategy.md)

## Toolchain baseline

- Node.js 24.x
- pnpm 11.19.0
- Turborepo task orchestration
- Strict TypeScript configuration

Dependencies are pinned in `pnpm-lock.yaml`. The root scripts are active and must remain reproducible.

## Planned task interface

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Safety defaults

`.env.example` contains non-secret local switches only. Live trading, broker connectors, AI routing, and model downloads are all disabled. Do not add keys or tokens to repository files.

## Approval gate

Work proceeds one roadmap phase at a time. Each phase must state scope, unresolved owner decisions, unsafe assumptions, acceptance evidence, and receive explicit owner approval before a later phase begins. Compilation alone is not a phase gate.

The original Phase 1 requirements package was accepted in DEC-068, the consolidated recovery phase in DEC-074, Phase 2 in DEC-076, and Phase 3 in DEC-079. Consolidated Phase 4 is active under DEC-080. `OPEN-021` blocks cloud synchronization, pairing, revocation, recovery, and cloud lease implementation. External market/broker integrations, trading credentials, paper/demo mode, and execution remain prohibited.
