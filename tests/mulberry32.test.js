// @ts-check
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { makeSeededRandom } from './helpers/loadLegacy.js';

/**
 * SHA-256 of the first 10,000 outputs of makeSeededRandom(seed), each output times 2^32 written as a
 * little-endian uint32. The digests were computed from the T-102 version of the function, so a match proves
 * that any rewrite returns exactly the same numbers. Every golden trajectory depends on this generator.
 */
const DIGESTS = /** @type {const} */ ([
  [0, '1df373cba5c68800a6f8292339a9334be6668f4ae368ef88a757991c911f7b32'],
  [1, 'b6cb05c51847fb5175bdc46108f6b23021111b4f1a2f78227d94b13657740e64'],
  [2, '5a1986372ec0339ec1c067c20d5b638e86baf5bf4ad2aefc47f0b42e78f95bf0'],
  [3, 'c147bb1e1bd68bc68eccf2a21cfae99cdc542fb8bebc2d777906b28789709161'],
  [7, 'dc18f5e033ccc1b92ce0b3dd4bd0f6fdec9595b0868eca1211ed87dfcae0ad17'],
  [4294967295, '8219b5f6f9b1b15df2a3fb6048611ac0e8d213efe2c2f7b45c44ef97bd55c07b'],
]);

describe('makeSeededRandom (Mulberry32)', () => {
  it.each(DIGESTS)('seed %i: the first 10,000 outputs match the pinned digest', (seed, digest) => {
    const random = makeSeededRandom(seed);
    const bytes = Buffer.alloc(10000 * 4);
    for (let i = 0; i < 10000; i++) bytes.writeUInt32LE(random() * 4294967296, i * 4);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(digest);
  });

  it('returns numbers in [0, 1)', () => {
    const random = makeSeededRandom(12345);
    for (let i = 0; i < 10000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
