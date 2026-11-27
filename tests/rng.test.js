// @ts-check
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { makeSeededRandom } from './helpers/loadLegacy.js';
import { MODULES_DIR, loadSrcModules } from './helpers/moduleSim.js';

// Loaded through the bridge so that MODULES_SRC_DIR (mutation checks) points these tests at a scratch copy.
const { createRng, parseSeed } = await loadSrcModules(['sim/rng.js']);

/** @param {() => number} random @param {number} count */
const take = (random, count) => Array.from({ length: count }, () => random());

describe('createRng (Mulberry32)', () => {
  // makeSeededRandom recorded the goldens, and tests/mulberry32.test.js pins its outputs by digest.
  it.each([0, 1, 2, 3, 7, 4294967295])(
    'createRng(%i) returns the same first 10,000 numbers as makeSeededRandom',
    (seed) => {
      expect(take(createRng(seed), 10000)).toEqual(take(makeSeededRandom(seed), 10000));
    },
  );

  it('returns numbers in [0, 1)', () => {
    for (const value of take(createRng(12345), 10000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('the same seed gives the same sequence; seeds 1 and 2 differ', () => {
    expect(take(createRng(1), 64)).toEqual(take(createRng(1), 64));
    expect(take(createRng(1), 64)).not.toEqual(take(createRng(2), 64));
  });
});

describe('src/ has no global generator', () => {
  it('no script in src/ mentions Math.random', () => {
    const dir = fileURLToPath(MODULES_DIR);
    const files = readdirSync(dir, { recursive: true, encoding: 'utf8' })
      .map((file) => file.replaceAll('\\', '/'))
      .filter((file) => /\.(js|html)$/.test(file));
    // The files that drew before T-203 and the generator itself must be among those scanned.
    expect(files).toEqual(
      expect.arrayContaining(['main.js', 'network.js', 'utils.js', 'car.js', 'sim/rng.js']),
    );
    const offenders = files.filter((file) =>
      /\bMath\s*(\.\s*random\b|\[\s*['"`]random)/.test(readFileSync(dir + file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});

describe('parseSeed', () => {
  it.each([
    ['0', 0],
    ['1', 1],
    ['4294967295', 4294967295],
    ['007', 7],
  ])('accepts %j as %i', (text, seed) => {
    expect(parseSeed(text)).toBe(seed);
  });

  it.each(['', '-1', '4294967296', '1.5', '1e3', 'abc', ' 1', '1 ', '+1', '0x10', null, undefined])(
    'rejects %j',
    (text) => {
      expect(parseSeed(text)).toBeNull();
    },
  );
});
