import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { verifyArtifact } from "../src/artifacts/artifact-verifier.js";
import { extractJsonObject } from "../src/runtime/llama-cli-runtime.js";

describe("offline runtime safety", () => {
  it("extracts only a complete JSON object from local CLI output", () => {
    expect(extractJsonObject('noise\n{"decision":"REJECT"}\n')).toEqual({
      decision: "REJECT",
    });
    expect(() => extractJsonObject("no json")).toThrow();
  });

  it("verifies both artifact size and SHA-256 before load", async () => {
    const directory = await mkdtemp(join(tmpdir(), "offline-ai-artifact-"));
    const path = join(directory, "artifact.bin");
    const bytes = Buffer.from("verified artifact", "utf8");
    writeFileSync(path, bytes);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await expect(
      verifyArtifact(path, {
        id: "fixture",
        version: "1",
        url: "https://invalid.example/unused",
        fileName: "artifact.bin",
        sizeBytes: bytes.length,
        sha256,
        license: "test",
      }),
    ).resolves.toBeUndefined();
    await expect(
      verifyArtifact(path, {
        id: "fixture",
        version: "1",
        url: "https://invalid.example/unused",
        fileName: "artifact.bin",
        sizeBytes: bytes.length,
        sha256: "0".repeat(64),
        license: "test",
      }),
    ).rejects.toThrow(/SHA-256/);
  });
});
