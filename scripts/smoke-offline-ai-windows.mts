import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LlamaCliRuntime,
  OFFLINE_AI_PROFILE,
} from "../packages/offline-ai/src/index.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const runtime = new LlamaCliRuntime({
  executablePath: join(
    root,
    "models",
    "offline-ai",
    "runtime-b10621-cpu",
    "llama-cli.exe",
  ),
  modelPath: join(
    root,
    "models",
    "offline-ai",
    OFFLINE_AI_PROFILE.testModel.fileName,
  ),
  modelManifest: OFFLINE_AI_PROFILE.testModel,
  contextTokens: 2_048,
});

const result = await runtime.generate({
  systemPrompt:
    "Architecture smoke-test only. You have no policy, risk, order, or execution authority.",
  userPrompt: "Reject because no deterministic market evidence was supplied.",
  jsonSchema: {
    type: "object",
    additionalProperties: false,
    required: ["decision", "reason"],
    properties: {
      decision: { type: "string", enum: ["REJECT"] },
      reason: { type: "string" },
    },
  },
  maxTokens: 64,
  timeoutMs: 90_000,
});

const value = result.json as { decision?: unknown; reason?: unknown };
if (value.decision !== "REJECT" || typeof value.reason !== "string") {
  throw new Error("Offline model smoke test returned an invalid fail-closed result");
}

process.stdout.write(
  `${JSON.stringify({ result: value, elapsedMs: result.elapsedMs })}\n`,
);
