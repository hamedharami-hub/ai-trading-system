#!/usr/bin/env node

import { createLocalNodeOfflineDiagnostic } from "./index.js";

process.stdout.write(`${JSON.stringify(createLocalNodeOfflineDiagnostic())}\n`);
