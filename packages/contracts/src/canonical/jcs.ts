/**
 * RFC 8785 compliant JSON Canonicalization Scheme (JCS).
 * Deterministically sorts object keys and formats primitives.
 * Browser-compatible: uses Web Crypto API for SHA-256.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalizeJson(item));
    return `[${items.join(',')}]`;
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
    if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
      entries.push(`${JSON.stringify(key)}:${canonicalizeJson(val)}`);
    }
  }

  return `{${entries.join(',')}}`;
}

/**
 * Simple hash function for synchronous use (non-cryptographic, fast).
 * Used as fallback when crypto.subtle is not available synchronously.
 */
function simpleHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return hash.toString(16).padStart(16, '0');
}

/**
 * Computes a deterministic hash of the canonicalized JSON representation.
 * Uses node:crypto (SHA-256) when available, falls back to a fast non-crypto hash.
 * For full SHA-256 in browser, use computeCanonicalHashAsync.
 */
export function computeCanonicalHash(obj: unknown): string {
  const canonical = canonicalizeJson(obj);

  // Try Node.js crypto first (available in Node runtime)
  try {
    // Dynamic import to avoid bundler issues
    const nodeCrypto = globalThis.require?.('node:crypto') as typeof import('node:crypto') | undefined;
    if (nodeCrypto) {
      return nodeCrypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
    }
  } catch {
    // Not in Node.js environment
  }

  // Fallback: deterministic non-crypto hash (suitable for paper simulation audit trail)
  const base = simpleHash(canonical);
  // Pad to 64 chars to match SHA-256 hex format
  return (base + simpleHash(canonical + '1') + simpleHash(canonical + '2') + simpleHash(canonical + '3')).padEnd(64, '0');
}

/**
 * Async SHA-256 hash using Web Crypto API (browser-native).
 */
export async function computeCanonicalHashAsync(obj: unknown): Promise<string> {
  const canonical = canonicalizeJson(obj);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

