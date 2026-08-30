import { describe, it, expect } from 'vitest';
import { canonicalizeJson, computeCanonicalHash } from '../src/canonical/jcs.js';

describe('RFC 8785 Canonical JSON & Hashing', () => {
  it('produces identical canonical strings and hashes regardless of key ordering', () => {
    const objA = {
      zebra: 1,
      apple: 'fruit',
      nested: { beta: true, alpha: false }
    };

    const objB = {
      apple: 'fruit',
      nested: { alpha: false, beta: true },
      zebra: 1
    };

    const strA = canonicalizeJson(objA);
    const strB = canonicalizeJson(objB);

    expect(strA).toBe(strB);
    expect(strA).toBe('{"apple":"fruit","nested":{"alpha":false,"beta":true},"zebra":1}');

    const hashA = computeCanonicalHash(objA);
    const hashB = computeCanonicalHash(objB);

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64); // SHA-256 hex string
  });
});
