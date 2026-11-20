// @ts-check
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { vi } from 'vitest';
import { TICK_MS, createHostStubs, toPlain } from './headless.js';
import { makeSeededRandom } from './loadLegacy.js';

/**
 * The ES modules under test. MODULES_SRC_DIR points the tests at a scratch copy of src/ (mutation checks);
 * it is unset in normal runs. A bridge that T-204b removes, once the simulation core is DOM-free.
 */
export const MODULES_DIR = process.env.MODULES_SRC_DIR
  ? pathToFileURL(resolve(process.env.MODULES_SRC_DIR) + sep)
  : new URL('../../src/', import.meta.url);

/** The ids of the two buttons that main.js wires with addEventListener. */
const BUTTON_IDS = new Set(['saveButton', 'discardButton']);

/**
 * Imports some src/ modules and returns their exports merged into one object. The modules must have no
 * top-level side effects (utils.js and network.js qualify; main.js does not).
 * `srcDir` loads them from another directory (a scratch copy of src/) instead of MODULES_DIR.
 * @param {string[]} files file names under src/, for example ['utils.js', 'network.js']
 * @param {{ srcDir?: string }} [options]
 * @returns {Promise<Record<string, any>>}
 */
export async function loadSrcModules(files, { srcDir } = {}) {
  const base = srcDir === undefined ? MODULES_DIR : pathToFileURL(resolve(srcDir) + sep);
  const namespaces = await Promise.all(
    files.map((file) => import(/* @vite-ignore */ new URL(file, base).href)),
  );
  return Object.assign({}, ...namespaces);
}

/**
 * Wraps module exports so that every call, construction and static call runs with Math.random replaced by
 * `random`, and puts Math.random back afterwards, even if the call throws. This is the module counterpart of
 * loadLegacy's per-context Math.random: each handle has its own generator, so two handles never share draws.
 * @param {Record<string, any>} exports
 * @param {() => number} [random]
 * @returns {Record<string, any>}
 */
export function bindRandom(exports, random = makeSeededRandom(1)) {
  /** @template T @param {() => T} fn @returns {T} */
  const withRandom = (fn) => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(random);
    try {
      return fn();
    } finally {
      spy.mockRestore();
    }
  };
  /** @param {any} value */
  const bind = (value) => {
    if (typeof value !== 'function') return value;
    /** @type {any} */
    const proxy = new Proxy(value, {
      apply: (target, thisArg, args) => withRandom(() => Reflect.apply(target, thisArg, args)),
      construct: (target, args, newTarget) =>
        withRandom(() => Reflect.construct(target, args, newTarget === proxy ? target : newTarget)),
      get: (target, property) => bind(Reflect.get(target, property)),
    });
    return proxy;
  };
  return Object.fromEntries(Object.entries(exports).map(([name, value]) => [name, bind(value)]));
}

/**
 * Runs the src/ modules in Node, as createBaselineSim runs the baseline. Every call imports src/main.js
 * afresh (vi.resetModules, then a dynamic import, which Vitest 4 re-evaluates), with the page's host objects
 * stubbed through vi.stubGlobal and Math.random replaced by a seeded generator through vi.spyOn. dispose()
 * puts all of it back; so does a failed import, before the error is rethrown.
 *
 * Tick 0 means "after load": main.js itself calls animate() once while it loads, so every car has been
 * updated once before the first step.
 * `srcDir` loads the modules from another directory (a scratch copy of src/) instead of MODULES_DIR.
 * @param {{ seed?: number, savedBrain?: object, srcDir?: string }} [options]
 */
export async function createModuleSim({ seed = 1, savedBrain, srcDir } = {}) {
  const base = srcDir === undefined ? MODULES_DIR : pathToFileURL(resolve(srcDir) + sep);
  const { storage, canvases, createCanvas } = createHostStubs(savedBrain);

  /** @type {Map<string, ((event: object) => void)[]>} */
  const listeners = new Map();
  const createButton = (/** @type {string} */ id) => ({
    addEventListener: (/** @type {string} */ type, /** @type {(event: object) => void} */ fn) => {
      const key = `${id}:${type}`;
      listeners.set(key, [...(listeners.get(key) ?? []), fn]);
    },
  });

  /** @type {((time?: number) => void) | undefined} */
  let animateCallback;
  vi.stubGlobal('window', { innerHeight: 800 });
  vi.stubGlobal('document', {
    getElementById: (/** @type {string} */ id) =>
      BUTTON_IDS.has(id) ? createButton(id) : createCanvas(),
    createElement: createCanvas,
  });
  vi.stubGlobal('localStorage', storage);
  // The image never loads, so no onload handler runs. The mask only affects drawing.
  vi.stubGlobal('Image', function Image() {});
  vi.stubGlobal('requestAnimationFrame', (/** @type {(time?: number) => void} */ callback) => {
    animateCallback = callback;
    return 1;
  });
  const randomSpy = vi.spyOn(Math, 'random').mockImplementation(makeSeededRandom(seed));

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    vi.unstubAllGlobals();
    randomSpy.mockRestore();
  };

  /** @type {any} */
  let main;
  try {
    vi.resetModules();
    main = await import(/* @vite-ignore */ new URL('main.js', base).href);
  } catch (error) {
    dispose();
    throw error;
  }

  const car = (/** @type {any} */ c) => ({
    x: c.x,
    y: c.y,
    angle: c.angle,
    speed: c.speed,
    damaged: c.damaged,
  });
  let tick = 0;

  return {
    /**
     * Calls the stored animate callback n times. One call is one tick, with a timestamp of tick * 1000/60 ms.
     * @param {number} n a non-negative integer
     */
    step(n) {
      if (!Number.isInteger(n) || n < 0)
        throw new RangeError(`step needs a non-negative integer, got ${n}`);
      if (!animateCallback) throw new Error('animate was never scheduled');
      for (let i = 0; i < n; i++) {
        tick++;
        animateCallback(tick * TICK_MS);
      }
    },
    /** A plain JSON-style snapshot of the simulation. `bestCar` is a live binding, so it is read each time. */
    state() {
      return {
        tick,
        bestIndex: main.cars.indexOf(main.bestCar),
        cars: main.cars.map(car),
        traffic: main.traffic.map(car),
        bestBrain: toPlain(main.bestCar.brain),
      };
    },
    /** The brain of every AI car, in car order (a test hook; state() only carries the best car's brain). */
    brains() {
      return toPlain(main.cars.map((/** @type {any} */ c) => c.brain));
    },
    /** Calls the page's own save(). */
    save() {
      main.save();
    },
    /** Calls the page's own discard(). */
    discard() {
      main.discard();
    },
    /**
     * Fires the listeners main.js added to a button, as a click would.
     * @param {'saveButton' | 'discardButton'} id
     */
    click(id) {
      const handlers = listeners.get(`${id}:click`);
      if (!handlers?.length) throw new Error(`no click listener on ${id}`);
      for (const handler of handlers) handler({ type: 'click' });
    },
    /** The localStorage stub. */
    storage,
    /** Every canvas stub the page created (a test hook): the two page canvases, then one mask per car. */
    canvases,
    /** Restores Math.random and removes every stubbed global. Safe to call twice. */
    dispose,
  };
}
