// @ts-check
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { vi } from 'vitest';
import { TICK_MS, createHostStubs, toPlain } from './headless.js';

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
 * Runs the src/ modules in Node, as createBaselineSim runs the baseline. Every call imports src/main.js
 * afresh (vi.resetModules, then a dynamic import, which Vitest 4 re-evaluates), with the page's host objects
 * stubbed through vi.stubGlobal. The seed reaches the page the way a browser gives it, through a stubbed
 * `location` (`?seed=`), and the page passes its own generator to every draw. Math.random is spied on but not
 * replaced, so randomCalls() can prove that src/ never calls it. console.log is silenced and its lines are
 * kept in `logged`. dispose() puts all of it back; so does a failed import, before the error is rethrown.
 *
 * Tick 0 means "after load": main.js itself calls animate() once while it loads, so every car has been
 * updated once before the first step.
 * `search` replaces the whole query string (default `?seed=<seed>`), to test seeds the page must reject.
 * `srcDir` loads the modules from another directory (a scratch copy of src/) instead of MODULES_DIR.
 * @param {{ seed?: number, search?: string, savedBrain?: object, srcDir?: string }} [options]
 */
export async function createModuleSim({ seed = 1, search, savedBrain, srcDir } = {}) {
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
  vi.stubGlobal('location', { search: search ?? `?seed=${seed}` });
  // Counts calls and passes them through: no generator is substituted.
  const randomSpy = vi.spyOn(Math, 'random');
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  let disposed = false;
  let randomCallsAtDispose = 0;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    randomCallsAtDispose = randomSpy.mock.calls.length;
    vi.unstubAllGlobals();
    randomSpy.mockRestore();
    logSpy.mockRestore();
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
  const logged = logSpy.mock.calls.map((args) => args.join(' '));

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
    /**
     * The colour of each traffic car's mask. The Image stub never loads, so this fires the onload handler
     * the page set, as a browser would, and reads the fill colour it used (a test hook). It paints the masks,
     * which changes what later draws use, so call it after the last step(), before dispose().
     * @returns {string[]}
     */
    trafficColors() {
      return main.traffic.map((/** @type {any} */ c) => {
        c.img.onload();
        return c.mask.getContext('2d').fillStyle;
      });
    },
    /** How many times anything called Math.random while the sim was open (src/ should never call it). */
    randomCalls() {
      return disposed ? randomCallsAtDispose : randomSpy.mock.calls.length;
    },
    /** The lines main.js logged to the console while it loaded. */
    logged,
    /** Restores Math.random and console.log and removes every stubbed global. Safe to call twice. */
    dispose,
  };
}
