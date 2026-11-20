// @ts-check
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { createBaselineSim } from './headless.js';

export const FORMAT_VERSION = 1;
export const TICKS = 1000;
export const UPSTREAM_COMMIT = '8b8723685bb4ab94cf504998466b6c337c35335c';

/** Per-tick columns, in order. `crashed` is the number of damaged AI cars. */
export const COLUMNS = ['bestIndex', 'x', 'y', 'angle', 'speed', 'damaged', 'crashed'];
const CAR_FIELDS = ['x', 'y', 'angle', 'speed', 'damaged'];

/**
 * The four golden scenarios. `seed-4-gen2` starts from the best brain at the end of `seed-1`, as the
 * original page does after the owner presses save and reloads (one generation on).
 * @type {{ name: string, seed: number, savedBrainFrom?: string }[]}
 */
export const SCENARIOS = [
  { name: 'seed-1', seed: 1 },
  { name: 'seed-2', seed: 2 },
  { name: 'seed-3', seed: 3 },
  { name: 'seed-4-gen2', seed: 4, savedBrainFrom: 'seed-1' },
];

/** Directory of the fixtures. GOLDEN_FIXTURE_DIR points the replay test at a scratch copy. */
export function fixtureDir() {
  return process.env.GOLDEN_FIXTURE_DIR || fileURLToPath(new URL('../golden/', import.meta.url));
}

/**
 * @param {string} name
 * @param {string} [dir]
 * @returns {any}
 */
export function loadFixture(name, dir = fixtureDir()) {
  return JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'));
}

/**
 * Runs one scenario against the baseline for TICKS ticks and records it (see recordScenario).
 * @param {{ name: string, seed: number }} scenario
 * @param {{ savedBrain?: object, srcDir?: string }} [options]
 * @returns {{ record: any, stepMs: number }}
 */
export function runScenario({ name, seed }, { savedBrain, srcDir } = {}) {
  const sim = createBaselineSim({ seed, savedBrain, srcDir });
  return recordScenario(sim, { name, seed }, savedBrain);
}

/**
 * Steps a simulation for TICKS ticks and records it. Tick 0 is the state after load (see headless.js), so
 * `ticks[n]` is the state after n steps. state() only reads, so taking snapshots does not change the run.
 * The simulation is a baseline sim or a module sim: both offer step() and state().
 * @param {{ step: (n: number) => void, state: () => any }} sim
 * @param {{ name: string, seed: number }} scenario
 * @param {object} [savedBrain] the brain the sim was started from, kept in the record's meta
 * @returns {{ record: any, stepMs: number }}
 */
export function recordScenario(sim, { name, seed }, savedBrain) {
  /** @param {any} s */
  const row = (s) => {
    const best = s.cars[s.bestIndex];
    const crashed = s.cars.filter((/** @type {any} */ car) => car.damaged).length;
    return [s.bestIndex, best.x, best.y, best.angle, best.speed, best.damaged, crashed];
  };
  const ticks = [row(sim.state())];
  let stepMs = 0;
  for (let i = 0; i < TICKS; i++) {
    const start = performance.now();
    sim.step(1);
    stepMs += performance.now() - start;
    ticks.push(row(sim.state()));
  }
  const last = sim.state();
  const crashedCars = last.cars.filter((/** @type {any} */ car) => car.damaged).length;
  const meta = {
    formatVersion: FORMAT_VERSION,
    upstreamCommit: UPSTREAM_COMMIT,
    scenario: name,
    seed,
    ticks: TICKS,
  };
  if (savedBrain !== undefined) Object.assign(meta, { savedBrain });
  const record = {
    meta,
    columns: COLUMNS,
    ticks,
    final: {
      tick: last.tick,
      bestIndex: last.bestIndex,
      cars: last.cars,
      traffic: last.traffic,
      bestBrain: last.bestBrain,
    },
    metrics: {
      bestDistancePx: 100 - last.cars[last.bestIndex].y,
      crashedCars,
      survivingCars: last.cars.length - crashedCars,
    },
  };
  return { record, stepMs };
}

/**
 * Throws on NaN, an infinity or undefined anywhere in a value, naming the path (ADR-0010).
 * @param {any} value
 * @param {string} [path]
 */
export function assertFinite(value, path = 'record') {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} is ${value}`);
  } else if (value === undefined) {
    throw new Error(`${path} is undefined`);
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      assertFinite(item, Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`);
    }
  }
}

/**
 * The fixture as text: valid JSON, LF line endings, one tick row and one car per line (about a quarter of the
 * size of pretty-printed JSON).
 * @param {any} record
 * @returns {string}
 */
export function formatFixture(record) {
  const lines = (/** @type {any[]} */ items) =>
    items.map((item) => JSON.stringify(item)).join(',\n');
  const { tick, bestIndex, cars, traffic, bestBrain } = record.final;
  return [
    `{"meta":${JSON.stringify(record.meta)},`,
    `"columns":${JSON.stringify(record.columns)},`,
    '"ticks":[',
    lines(record.ticks),
    '],',
    `"final":{"tick":${tick},"bestIndex":${bestIndex},`,
    '"cars":[',
    lines(cars),
    '],',
    '"traffic":[',
    lines(traffic),
    '],',
    `"bestBrain":${JSON.stringify(bestBrain)}},`,
    `"metrics":${JSON.stringify(record.metrics)}}`,
    '',
  ].join('\n');
}

/**
 * Compares two values that were stored as JSON numbers, booleans and containers. Numbers use `===`, so the
 * sign of zero is not compared (ADR-0010) and NaN never equals anything.
 * @param {any} expected
 * @param {any} actual
 * @param {string} path
 * @returns {{ path: string, expected: any, actual: any } | null}
 */
function firstDeepDifference(expected, actual, path) {
  if (
    expected !== null &&
    typeof expected === 'object' &&
    actual !== null &&
    typeof actual === 'object'
  ) {
    const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])];
    for (const key of keys) {
      const child = Array.isArray(expected) ? `${path}[${key}]` : `${path}.${key}`;
      const found = firstDeepDifference(expected[key], actual[key], child);
      if (found) return found;
    }
    return null;
  }
  return expected === actual ? null : { path, expected, actual };
}

/** Text for a value in a mismatch message: containers as JSON, everything else as it is. */
const show = (/** @type {any} */ value) =>
  value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value);

/**
 * Finds the first difference between a fixture and a live record, in this order: meta, the per-tick rows
 * (by tick, then column), the final state, the metrics.
 * @param {string} scenario
 * @param {any} expected
 * @param {any} actual
 * @returns {{ tick: number | null, car: string, field: string, expected: any, actual: any, message: string } | null}
 */
export function firstMismatch(scenario, expected, actual) {
  /** @param {number | null} tick @param {string} car @param {string} field @param {any} e @param {any} a */
  const report = (tick, car, field, e, a) => ({
    tick,
    car,
    field,
    expected: e,
    actual: a,
    message: `${scenario}: ${tick === null ? '' : `tick ${tick}, `}${car}, field ${field}: expected ${show(e)} but got ${show(a)}`,
  });

  for (const key of ['formatVersion', 'seed', 'ticks']) {
    if (expected.meta[key] !== actual.meta[key]) {
      return report(null, 'meta', key, expected.meta[key], actual.meta[key]);
    }
  }
  const rows = Math.max(expected.ticks.length, actual.ticks.length);
  for (let tick = 0; tick < rows; tick++) {
    const e = expected.ticks[tick];
    const a = actual.ticks[tick];
    if (!e || !a) return report(tick, 'tick row', 'presence', Boolean(e), Boolean(a));
    for (let column = 0; column < COLUMNS.length; column++) {
      if (e[column] === a[column]) continue;
      const name = COLUMNS[column];
      if (name === 'crashed')
        return report(tick, 'all AI cars', 'crashedCars', e[column], a[column]);
      return report(tick, `best car (index ${e[0]})`, name, e[column], a[column]);
    }
  }
  const ef = expected.final;
  const af = actual.final;
  for (const key of ['tick', 'bestIndex']) {
    if (ef[key] !== af[key]) return report(ef.tick, 'final state', key, ef[key], af[key]);
  }
  for (const [group, label] of [
    ['cars', 'AI car'],
    ['traffic', 'traffic car'],
  ]) {
    if (ef[group].length !== af[group].length) {
      return report(ef.tick, `all ${label}s`, 'count', ef[group].length, af[group].length);
    }
    for (let i = 0; i < ef[group].length; i++) {
      for (const field of CAR_FIELDS) {
        if (ef[group][i][field] !== af[group][i][field]) {
          return report(ef.tick, `${label} ${i}`, field, ef[group][i][field], af[group][i][field]);
        }
      }
    }
  }
  const brain = firstDeepDifference(ef.bestBrain, af.bestBrain, '');
  if (brain)
    return report(
      ef.tick,
      'best brain',
      brain.path.replace(/^\./, ''),
      brain.expected,
      brain.actual,
    );
  const metrics = firstDeepDifference(expected.metrics, actual.metrics, '');
  if (metrics)
    return report(
      ef.tick,
      'metrics',
      metrics.path.replace(/^\./, ''),
      metrics.expected,
      metrics.actual,
    );
  return null;
}

/** How many ticks changed the best car's row compared with the tick before (a measure of how much happens). */
export function changingTicks(/** @type {any} */ record) {
  let count = 0;
  for (let tick = 1; tick < record.ticks.length; tick++) {
    if (
      record.ticks[tick].some(
        (/** @type {any} */ value, /** @type {number} */ i) => value !== record.ticks[tick - 1][i],
      )
    ) {
      count++;
    }
  }
  return count;
}

/**
 * Reads the scenario table of docs/baseline-metrics.md. Cells are kept as the raw text between the pipes
 * (backticks removed), so they can be compared with String(number).
 * @param {string} markdown
 * @returns {Map<string, { bestDistancePx: string, crashedCars: string, survivingCars: string, runtimeMs: string }>}
 */
export function parseMetricsTable(markdown) {
  const table = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith('| `')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.replaceAll('`', '').trim());
    if (cells.length !== 5) continue;
    const [name, bestDistancePx, crashedCars, survivingCars, runtimeMs] = cells;
    table.set(name, { bestDistancePx, crashedCars, survivingCars, runtimeMs });
  }
  return table;
}
