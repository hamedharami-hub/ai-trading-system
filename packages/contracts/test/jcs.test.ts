import { describe, it, expect } from "vitest";
import {
  canonicalizeJson,
  computeCanonicalHash,
} from "../src/canonical/jcs.js";

describe("RFC 8785 Canonical JSON & Hashing", () => {
  it("produces identical canonical strings and SHA-256 hashes regardless of key ordering", async () => {
    const objA = {
      zebra: 1,
      apple: "fruit",
      nested: { beta: true, alpha: false },
    };

    const objB = {
      apple: "fruit",
      nested: { alpha: false, beta: true },
      zebra: 1,
    };

    const strA = canonicalizeJson(objA);
    const strB = canonicalizeJson(objB);

    expect(strA).toBe(strB);
    expect(strA).toBe(
      '{"apple":"fruit","nested":{"alpha":false,"beta":true},"zebra":1}',
    );

    const hashA = await computeCanonicalHash(objA);
    const hashB = await computeCanonicalHash(objB);

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64); // SHA-256 hex string
  });

  it("matches a known SHA-256 digest", async () => {
    await expect(computeCanonicalHash({ a: 1 })).resolves.toBe(
      "015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862",
    );
  });
});
