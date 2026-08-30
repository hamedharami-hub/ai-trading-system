/**
 * RFC 8785 compliant JSON Canonicalization Scheme (JCS).
 * Deterministically sorts object keys and formats primitives.
 * Browser-compatible: uses Web Crypto API for SHA-256.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalizeJson(item));
    return `[${items.join(",")}]`;
  }

  const record = obj as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort((a, b) => {
    // UTF-16 code unit ordering
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      const codeA = a.charCodeAt(i);
      const codeB = b.charCodeAt(i);
      if (codeA !== codeB) {
        return codeA - codeB;
      }
    }
    return a.length - b.length;
  });

  const entries: string[] = [];
  for (const key of sortedKeys) {
    const val = record[key];
    if (
      val !== undefined &&
      typeof val !== "function" &&
      typeof val !== "symbol"
    ) {
      entries.push(`${JSON.stringify(key)}:${canonicalizeJson(val)}`);
    }
  }

  return `{${entries.join(",")}}`;
}

/**
 * Simple hash function for synchronous use (non-cryptographic, fast).
 * Used as fallback when crypto.subtle is not available synchronously.
 */
export async function computeCanonicalHash(obj: unknown): Promise<string> {
  const canonical = canonicalizeJson(obj);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  if (!globalThis.crypto?.subtle) {
    throw new Error("SHA-256 is unavailable; audit hashing fails closed");
  }
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const computeCanonicalHashAsync = computeCanonicalHash;
