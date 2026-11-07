// @ts-check
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/**
 * Mulberry32: a small seeded generator returning numbers in [0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
export function makeSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
 * Loads baseline scripts from src/ into one fresh vm context, unedited, and returns named top-level
 * functions and classes. The context has its own Math, whose random() is replaced by `random`, so the
 * host is never affected. Objects created inside the context belong to its realm: compare their
 * contents (numbers, lengths, JSON), not their prototypes.
 * @param {string[]} files file names under src/, in load order (for example ['utils.js', 'network.js'])
 * @param {string[]} names top-level names to return
 * @param {{ random?: () => number }} [options]
 * @returns {Record<string, any>}
 */
export function loadLegacy(files, names, { random = makeSeededRandom(1) } = {}) {
  const context = vm.createContext({ __random: random });
  vm.runInContext('Math.random = __random;', context);
  for (const file of files) {
    const url = new URL(`../../src/${file}`, import.meta.url);
    const source = readFileSync(url, 'utf8');
    new vm.Script(source, { filename: file }).runInContext(context);
  }
  // Top-level function and class declarations are not properties of the context object, but they stay
  // visible to later scripts run in the same context.
  return vm.runInContext(`({ ${names.join(', ')} })`, context);
}
