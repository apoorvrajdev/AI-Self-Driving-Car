// @ts-check
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { makeSeededRandom } from './loadLegacy.js';

/** The baseline scripts in the order src/index.html loads them. */
export const BASELINE_SCRIPTS = [
  'visualizer.js',
  'network.js',
  'sensor.js',
  'utils.js',
  'road.js',
  'controls.js',
  'car.js',
  'main.js',
];

/** Milliseconds between two ticks: one tick is one animation frame at 60 Hz. */
export const TICK_MS = 1000 / 60;

/**
 * Reads a baseline script. A file that starts with the UTF-16LE byte-order mark (only visualizer.js does) is
 * decoded as UTF-16LE; every other file is read as UTF-8. This is the rule used in vite.config.js.
 * @param {URL} url
 * @returns {string}
 */
export function readScript(url) {
  const bytes = readFileSync(url);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return bytes.subarray(2).toString('utf16le');
  return bytes.toString('utf8');
}

const CONTEXT_METHODS = [
  'arc',
  'beginPath',
  'drawImage',
  'fill',
  'fillText',
  'lineTo',
  'moveTo',
  'rect',
  'restore',
  'rotate',
  'save',
  'setLineDash',
  'stroke',
  'strokeText',
  'translate',
];

/**
 * Copies a value from the vm context into plain host objects. Numbers are copied as they are, so NaN stays
 * visible (JSON.stringify would turn it into null).
 * @param {any} value
 * @returns {any}
 */
function toPlain(value) {
  if (Array.isArray(value)) return Array.from(value, toPlain);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toPlain(item)]));
  }
  return value;
}

/**
 * Runs the unmodified baseline in Node. All eight scripts run in one fresh vm context with stubbed canvas,
 * image, localStorage and requestAnimationFrame, and with Math.random replaced by a seeded generator inside
 * that context only, so the host is never affected.
 *
 * Tick 0 means "after load": main.js itself calls animate() once while it loads, as a browser does, so every
 * car has been updated once before the first step.
 * @param {{ seed?: number, savedBrain?: object }} [options]
 */
export function createBaselineSim({ seed = 1, savedBrain } = {}) {
  /** @type {Map<string, string>} */
  const items = new Map();
  const storage = {
    getItem: (/** @type {string} */ key) =>
      items.has(key) ? /** @type {string} */ (items.get(key)) : null,
    setItem: (/** @type {string} */ key, /** @type {unknown} */ value) =>
      void items.set(key, String(value)),
    removeItem: (/** @type {string} */ key) => void items.delete(key),
  };
  if (savedBrain !== undefined) storage.setItem('bestBrain', JSON.stringify(savedBrain));

  const contextPrototype = Object.fromEntries(CONTEXT_METHODS.map((name) => [name, () => {}]));
  /** @type {object[]} */
  const canvases = [];
  const createCanvas = () => {
    /** @type {any} */
    const canvas = { width: 300, height: 150 };
    const context = Object.assign(Object.create(contextPrototype), {
      canvas,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      lineWidth: 1,
      lineDashOffset: 0,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
    });
    canvas.getContext = () => context;
    canvases.push(canvas);
    return canvas;
  };

  /** @type {((time?: number) => void) | undefined} */
  let animateCallback;
  const sandbox = {
    __random: makeSeededRandom(seed),
    window: { innerHeight: 800 },
    document: { getElementById: createCanvas, createElement: createCanvas },
    localStorage: storage,
    // The image never loads, so no onload handler runs. The mask only affects drawing.
    Image: function Image() {},
    requestAnimationFrame: (/** @type {(time?: number) => void} */ callback) => {
      animateCallback = callback;
      return 1;
    },
  };
  const context = vm.createContext(sandbox);
  vm.runInContext('Math.random = __random;', context);
  for (const file of BASELINE_SCRIPTS) {
    const source = readScript(new URL(`../../src/${file}`, import.meta.url));
    new vm.Script(source, { filename: file }).runInContext(context);
  }

  const snapshot = new vm.Script(`(() => {
    const car = (c) => ({ x: c.x, y: c.y, angle: c.angle, speed: c.speed, damaged: c.damaged });
    return {
      bestIndex: cars.indexOf(bestCar),
      cars: cars.map(car),
      traffic: traffic.map(car),
      bestBrain: bestCar.brain,
    };
  })()`);
  const allBrains = new vm.Script('cars.map((c) => c.brain)');
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
    /** A plain JSON-style snapshot of the simulation. */
    state() {
      return { tick, ...toPlain(snapshot.runInContext(context)) };
    },
    /** The brain of every AI car, in car order (a test hook; state() only carries the best car's brain). */
    brains() {
      return toPlain(allBrains.runInContext(context));
    },
    /** Calls the page's own save(). */
    save() {
      vm.runInContext('save()', context);
    },
    /** Calls the page's own discard(). */
    discard() {
      vm.runInContext('discard()', context);
    },
    /** The localStorage stub. */
    storage,
    /** Every canvas stub the page created (a test hook): the two page canvases, then one mask per car. */
    canvases,
  };
}
