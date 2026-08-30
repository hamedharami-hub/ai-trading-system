# AI Trading System

This repository is being recovered from an untrusted Antigravity implementation onto the approved architecture baseline. Consolidated Phase 1 is an audit and selective-reuse phase; it does not yet contain an approved trading application and cannot connect to a market, broker, exchange, AI provider, model registry, or account.

## Authority

The Persian architecture PDF and subsequent explicit owner instructions are the product authority. English repository documentation is the version-controlled implementation translation. If a conflict exists, the owner's latest explicit instruction prevails.

## Current status

The authoritative branch currently contains only:

- the product decision and ambiguity register;
- architecture boundaries and safety invariants;
- coding standards and test strategy;
- a config-only pnpm/Turborepo workspace;
- empty package manifests for the PWA, Local Trading Node, and shared contracts.

There are no dependencies, source files, lockfiles, integrations, secrets, network clients, AI calls, models, databases, or executable trading behavior. Antigravity code exists in Git history and is reviewed only as an untrusted recovery source; see the recovery audit.

## Planned architecture

| Workspace | Future responsibility | Current contents |
| --- | --- | --- |
| `apps/pwa` | Next.js/React installable PWA for presentation and trusted user interaction | Private package manifest only |
| `apps/local-trading-node` | Separate Node.js/TypeScript deterministic market-data, features, strategy, policy, risk, and OMS process | Private package manifest only |
| `packages/contracts` | Shared TypeScript contracts derived from canonical JSON Schema 2020-12 definitions | Private package manifest only |

The planned dependency direction is:

```text
apps/pwa -> packages/contracts <- apps/local-trading-node
```

Only future deterministic Local Trading Node components may calculate risk or create a risk-approved order intent. AI roles are analytical only.

## Documentation

- [Consolidated six-phase roadmap](docs/consolidated-roadmap-fa.md)
- [Antigravity recovery audit](docs/antigravity-recovery-audit.md)

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
- Turborepo task orchestration, to be installed only after separate approval
- Strict TypeScript configuration

The root scripts describe the intended future task interface, but they cannot run until dependencies are explicitly approved and installed. This phase intentionally does not create a lockfile.

## Planned task interface

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Safety defaults

`.env.example` contains non-secret local switches only. Live trading, broker connectors, AI routing, and model downloads are all disabled. Do not add keys or tokens to repository files and do not request them during foundation work.

## Approval gate

Work proceeds one roadmap phase at a time. Each phase must state scope, unresolved owner decisions, unsafe assumptions, acceptance evidence, and receive explicit owner approval before a later phase begins. Compilation alone is not a phase gate.

The original Phase 1 requirements and safety package was accepted in DEC-068. The owner subsequently approved the six-phase consolidated roadmap and Consolidated Phase 1 recovery audit in DEC-069 through DEC-073. Consolidated Phase 2 has not started and requires its own declaration and owner gate. External integrations, secrets, AI calls, model downloads, and execution remain prohibited.
