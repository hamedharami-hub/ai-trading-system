# Aggregate Offline Verification

Run all currently approved local verification in one command:

```powershell
pnpm verify:offline
```

The command runs, in order:

1. six `@trade/offline-ai` safety tests;
2. deterministic-core tests, including the local Forex `MOCK` replay fixtures and fail-closed recovery boundaries;
3. one static production build of the PWA.

It stops on the first failure. A pass demonstrates only local test and build health. It never loads or downloads a model, contacts a network/provider/broker, accesses an account, produces a price or signal, simulates an order or fill, or permits execution.
