import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { verifyArtifact } from "../artifacts/artifact-verifier.js";
import type { VerifiedArtifactManifest } from "../artifacts/model-manifest.js";
import type {
  OfflineAiRuntime,
  OfflineGenerationRequest,
  OfflineGenerationResult,
} from "./runtime.js";

export interface LlamaCliRuntimeOptions {
  readonly executablePath: string;
  readonly modelPath: string;
  readonly modelManifest: Readonly<VerifiedArtifactManifest>;
  readonly contextTokens?: number;
  readonly threads?: number;
}

export class LlamaCliRuntime implements OfflineAiRuntime {
  private verifiedModel: Promise<void> | undefined;

  constructor(private readonly options: Readonly<LlamaCliRuntimeOptions>) {}

  async generate(
    request: Readonly<OfflineGenerationRequest>,
  ): Promise<OfflineGenerationResult> {
    await Promise.all([
      access(this.options.executablePath),
      this.verifyModelOnce(),
    ]);
    if (request.maxTokens < 1 || request.maxTokens > 1_024)
      throw new Error("maxTokens outside safe range");
    if (request.timeoutMs < 1_000 || request.timeoutMs > 180_000)
      throw new Error("timeout outside safe range");
    if (
      request.systemPrompt.length > 8_000 ||
      request.userPrompt.length > 24_000
    )
      throw new Error("prompt exceeds safe bound");

    const constrainedSystemPrompt = `${request.systemPrompt}\nReturn exactly one JSON object matching this schema: ${JSON.stringify(request.jsonSchema)}`;
    const args = [
      "-m",
      this.options.modelPath,
      "-c",
      String(this.options.contextTokens ?? 4_096),
      "-n",
      String(request.maxTokens),
      "--temp",
      "0",
      "--seed",
      "0",
      "--no-display-prompt",
      "--single-turn",
      "--reasoning",
      "off",
      "--system-prompt",
      constrainedSystemPrompt,
      "-p",
      request.userPrompt,
    ];
    if (this.options.threads !== undefined)
      args.push("--threads", String(this.options.threads));

    const startedAt = performance.now();
    const output = await runBoundedProcess(
      this.options.executablePath,
      args,
      request.timeoutMs,
    );
    return Object.freeze({
      json: extractJsonObject(output),
      elapsedMs: Math.round(performance.now() - startedAt),
      runtime: "llama.cpp-cli",
    });
  }

  async benchmark(): Promise<Readonly<Record<string, string | number>>> {
    const startedAt = performance.now();
    await Promise.all([
      access(this.options.executablePath),
      this.verifyModelOnce(),
    ]);
    return Object.freeze({
      runtime: "llama.cpp-cli",
      artifactCheckMs: Math.round(performance.now() - startedAt),
    });
  }

  private verifyModelOnce(): Promise<void> {
    this.verifiedModel ??= verifyArtifact(
      this.options.modelPath,
      this.options.modelManifest,
    ).catch((error: unknown) => {
      this.verifiedModel = undefined;
      throw error;
    });
    return this.verifiedModel;
  }
}

async function runBoundedProcess(
  executable: string,
  args: readonly string[],
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [...args], {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Offline inference timed out"));
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      if (stdout.length > 1_000_000) child.kill();
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      if (stderr.length > 1_000_000) child.kill();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0)
        reject(
          new Error(
            `Offline inference failed with exit code ${String(code)}: ${stderr.slice(-2_000)}`,
          ),
        );
      else resolve(stdout);
    });
  });
}

export function extractJsonObject(output: string): unknown {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end < start)
    throw new Error("Offline model did not return a JSON object");
  return JSON.parse(output.slice(start, end + 1)) as unknown;
}
