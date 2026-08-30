import crypto from 'node:crypto';

/**
 * RFC 8785 compliant JSON Canonicalization Scheme (JCS).
 * Deterministically sorts object keys and formats primitives.
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
 * Computes the SHA-256 hex digest of the canonicalized JSON representation.
 */
export function computeCanonicalHash(obj: unknown): string {
  const canonical = canonicalizeJson(obj);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}
