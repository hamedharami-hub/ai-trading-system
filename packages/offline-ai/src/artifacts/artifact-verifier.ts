import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { VerifiedArtifactManifest } from "./model-manifest.js";

export async function sha256File(path: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

export async function verifyArtifact(
  path: string,
  manifest: Readonly<VerifiedArtifactManifest>,
): Promise<void> {
  const metadata = await stat(path);
  if (!metadata.isFile())
    throw new Error("Artifact path is not a regular file");
  if (metadata.size !== manifest.sizeBytes) {
    throw new Error(
      `Artifact size mismatch: expected ${manifest.sizeBytes}, got ${metadata.size}`,
    );
  }
  const actualHash = await sha256File(path);
  if (actualHash !== manifest.sha256)
    throw new Error("Artifact SHA-256 mismatch");
}
