// @ts-check
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/**
 * The frozen copy of the original files (ADR-0011). The harness, the recorder, the golden replay and the
 * characterization tests read from here by default, so later changes to src/ cannot affect them.
 */
export const BASELINE_DIR = new URL('../../baseline/', import.meta.url);

/**
 * Mulberry32: a small seeded generator returning numbers in [0, 1).
 *
 * A line-by-line translation of the C original by Tommy Ettinger (2017, CC0 1.0), mulberry32.c:
 * https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 *
 *     uint32_t next(void) {
 *       uint32_t z = (x += 0x6D2B79F5UL);
 *       z = (z ^ (z >> 15)) * (z | 1UL);
 *       z ^= z + (z ^ (z >> 7)) * (z | 61UL);
 *       return z ^ (z >> 14);
 *     }
 *
 * C unsigned arithmetic wraps modulo 2^32: `>>> 0` does that for sums and Math.imul for products.
 * @param {number} seed
 * @returns {() => number}
 */
export function makeSeededRandom(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x + 0x6d2b79f5) >>> 0;
    let z = x;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z = (z ^ (z + Math.imul(z ^ (z >>> 7), z | 61))) >>> 0;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A generator that returns the given values in order and then repeats the last one.
 * @param {number[]} values
 * @returns {() => number}
 */
export function makeSequenceRandom(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

/**
 * Loads baseline scripts from baseline/ into one fresh vm context, unedited, and returns named top-level
 * functions and classes. The context has its own Math, whose random() is replaced by `random`, so the
 * host is never affected. Objects created inside the context belong to its realm: compare their
 * contents (numbers, lengths, JSON), not their prototypes.
 * @param {string[]} files file names under baseline/, in load order (for example ['utils.js', 'network.js'])
 * @param {string[]} names top-level names to return
 * @param {{ random?: () => number }} [options]
 * @returns {Record<string, any>}
 */
export function loadLegacy(files, names, { random = makeSeededRandom(1) } = {}) {
  const context = vm.createContext({ __random: random });
  vm.runInContext('Math.random = __random;', context);
  for (const file of files) {
    const url = new URL(file, BASELINE_DIR);
    const source = readFileSync(url, 'utf8');
    new vm.Script(source, { filename: file }).runInContext(context);
  }
  // Top-level function and class declarations are not properties of the context object, but they stay
  // visible to later scripts run in the same context.
  return vm.runInContext(`({ ${names.join(', ')} })`, context);
}
