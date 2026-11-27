// @ts-check

/**
 * A generator of numbers in [0, 1). Everything in the simulation that needs randomness receives one
 * explicitly; nothing reads a global generator (ADR-0012).
 * @typedef {() => number} Random
 */

/** The largest seed: seeds are unsigned 32-bit integers. */
const MAX_SEED = 4294967295;

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
 * C unsigned arithmetic wraps modulo 2^32: `>>> 0` does that for sums and Math.imul for products. It is the
 * same function as the test helper that recorded the golden trajectories, so a seed replays them exactly.
 * Not suitable for security purposes.
 * @param {number} seed an integer from 0 to 4294967295
 * @returns {Random}
 */
export function createRng(seed) {
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
 * Reads a seed written in decimal digits only (leading zeros allowed: '007' is 7). Signs, spaces, decimal
 * points, exponents and values above 4294967295 are rejected.
 * @param {string | null | undefined} text for example the value of `?seed=`
 * @returns {number | null} the seed, or null if the text is not one
 */
export function parseSeed(text) {
  if (typeof text !== 'string' || !/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value <= MAX_SEED ? value : null;
}
