import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BASELINE_SCRIPTS, createBaselineSim } from './helpers/headless.js';

const srcUrl = (file) => new URL(`../src/${file}`, import.meta.url);
const SLOW_MS = 60_000;

// The T-001 baseline hash table (docs/TASKS.md, upstream commit 8b87236).
const BASELINE_HASHES = {
  'car.js': [4794, '336cf43585bfc53ce9281404d32b85dc36e4a424dd6fbea674eb44f54c690858'],
  'car.png': [6964, '3e3d3a268ca6133277f89346a7b74b5c28658e9956e91514103a7508a855dc8f'],
  'controls.js': [1427, 'b70138dd2a6026655fd4283b7aafa3996d0cdc76c5f4365c89efe757ec2d7d7b'],
  'index.html': [739, 'bcdcdb2bdcfb487176bc66e274d7abe0c889251a468e4330608c80e28b4d134f'],
  'main.js': [2463, '606b6354d9ffe797625bfd3f53be80593f1c50dddd558a00531c3d30a29b14b2'],
  'network.js': [2505, '8a6df13b9bbd97932d48fa084d932eac621ce2e99e44f6f12ab5bd0ab93b364b'],
  'road.js': [1520, '9bf0dbbc6244ec882c0a73b615be767d15bdfdc83ae4b060fa1d42225624423a'],
  'sensor.js': [3138, '97dbaa7fd1e3cbe1ac62f5b7db088d9b33cd2530583380f7e4629ff66726a2fb'],
  'style.css': [471, '4fc64d4f132574ff36eb51f2528bdcd6c5c4646cf34d596c5bb256ac99fd4e53'],
  'utils.js': [1308, '4f5b5d5836b82f7189d7744554f4a9de76112518bf7dd720a7a6527a04a84678'],
  'visualizer.js': [7098, '4f228a30318f5932db236fca82d452d6a554aa138125c088a77e44b95ac8f883'],
};

/** The traffic cars as written in src/main.js: lane index and starting y, in order. */
function trafficFromMain() {
  const text = readFileSync(srcUrl('main.js'), 'utf8');
  const found = [...text.matchAll(/new Car\(road\.getLaneCenter\((\d)\),(-\d+),30,50,"DUMMY"/g)];
  return found.map((match) => ({ lane: Number(match[1]), y: Number(match[2]) }));
}

/**
 * An independent model of a traffic car that drives straight, written from the movement rules in
 * Car.#move (src/car.js:102-139): forward is on, maxSpeed is 2, acceleration 0.2, friction 0.05, angle 0.
 * These constants are fixed here, not read from main.js, and are valid only while src/ is hash-pinned.
 */
function trafficAfter(updates, startY) {
  let speed = 0;
  let y = startY;
  for (let i = 0; i < updates; i++) {
    speed += 0.2;
    if (speed > 2) speed = 2;
    if (speed > 0) speed -= 0.05;
    if (Math.abs(speed) < 0.05) speed = 0;
    y -= Math.cos(0) * speed;
  }
  return { y, speed };
}

/** Every bias and weight of a brain as one flat list of numbers. */
const parameters = (brain) =>
  brain.levels.flatMap((level) => [...level.biases, ...level.weights.flat()]);

describe('baseline files', () => {
  it('src/ files equal the T-001 hash table', () => {
    for (const [file, [bytes, sha256]] of Object.entries(BASELINE_HASHES)) {
      const content = readFileSync(srcUrl(file));
      expect({ file, bytes: content.length }).toEqual({ file, bytes });
      expect({ file, sha256: createHash('sha256').update(content).digest('hex') }).toEqual({
        file,
        sha256,
      });
    }
  });

  it('only visualizer.js starts with a UTF-16LE byte-order mark', () => {
    for (const file of BASELINE_SCRIPTS) {
      const [first, second] = readFileSync(srcUrl(file));
      const isUtf16Bom = first === 0xff && second === 0xfe;
      expect({ file, isUtf16Bom }).toEqual({ file, isUtf16Bom: file === 'visualizer.js' });
      expect({ file, utf8Bom: first === 0xef }).toEqual({ file, utf8Bom: false });
    }
  });

  it('the harness loads the scripts in the order of src/index.html', () => {
    const html = readFileSync(srcUrl('index.html'), 'utf8');
    const order = [...html.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1]);
    expect(BASELINE_SCRIPTS).toEqual(order);
    expect(order).toHaveLength(8);
  });
});

describe('loading and tick 0 (the state after main.js has loaded)', () => {
  it('runs all eight scripts and builds 100 AI cars, 7 traffic cars and a 2-level brain', () => {
    const state = createBaselineSim().state();
    expect(state.cars).toHaveLength(100);
    expect(state.traffic).toHaveLength(7);
    expect(state.bestBrain.levels).toHaveLength(2);
  });

  it('puts every AI car at the centre of lane 1 with y = 100, at rest and undamaged', () => {
    const state = createBaselineSim().state();
    expect(state.tick).toBe(0);
    expect(state.bestIndex).toBe(0);
    for (const car of state.cars) {
      expect(car).toEqual({ x: 100, y: 100, angle: 0, speed: 0, damaged: false });
    }
  });

  it('puts the 7 traffic cars at the lanes and y values written in main.js, after the one load-time update', () => {
    const written = trafficFromMain();
    expect(written).toHaveLength(7);
    const { traffic } = createBaselineSim().state();
    expect(traffic).toHaveLength(written.length);
    written.forEach(({ lane, y }, i) => {
      const after = trafficAfter(1, y);
      expect(traffic[i]).toEqual({
        x: 40 + lane * 60,
        y: after.y,
        angle: 0,
        speed: after.speed,
        damaged: false,
      });
    });
    expect(traffic[0].y).toBeCloseTo(-100.15, 10);
    expect(traffic[0].speed).toBeCloseTo(0.15, 10);
  });
});

describe('step', () => {
  it('advances exactly n ticks', () => {
    const a = createBaselineSim({ seed: 4 });
    const b = createBaselineSim({ seed: 4 });
    a.step(0);
    expect(a.state().tick).toBe(0);
    expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
    a.step(1);
    expect(a.state().tick).toBe(1);
    a.step(2);
    b.step(3);
    expect(a.state().tick).toBe(3);
    expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
    expect(JSON.stringify(a.state())).not.toBe(
      JSON.stringify(createBaselineSim({ seed: 4 }).state()),
    );
  });

  it('calls animate with a timestamp of tick × 1000/60 ms', () => {
    const sim = createBaselineSim();
    sim.step(3);
    // main.js sets the network canvas lineDashOffset to -time / 50 on every frame.
    const networkContext = sim.canvases[1].getContext('2d');
    expect(networkContext.lineDashOffset).toBeCloseTo(-((3 * 1000) / 60) / 50, 10);
  });

  it('sets the canvas height from window.innerHeight, fixed at 800', () => {
    expect(createBaselineSim().canvases[0].height).toBe(800);
  });

  it('rejects a count that is not a non-negative integer', () => {
    const sim = createBaselineSim();
    for (const bad of [-1, 1.5, Number.NaN, '2']) expect(() => sim.step(bad)).toThrow(RangeError);
  });

  it('moves every traffic car as an independent calculation from the movement rules says', () => {
    const sim = createBaselineSim();
    sim.step(100);
    const written = trafficFromMain();
    const { traffic } = sim.state();
    written.forEach(({ y }, i) => {
      // One update at load plus 100 ticks.
      const expected = trafficAfter(101, y);
      expect(traffic[i].y).toBe(expected.y);
      expect(traffic[i].speed).toBe(expected.speed);
    });
    expect(traffic[0].y).toBeCloseTo(-285.25, 8);
    expect(traffic[0].speed).toBeCloseTo(1.95, 10);
  });
});

describe('seeds', () => {
  it(
    'gives identical state JSON after 500 ticks for the same seed',
    () => {
      const a = createBaselineSim({ seed: 3 });
      const b = createBaselineSim({ seed: 3 });
      a.step(500);
      b.step(500);
      expect(JSON.stringify(a.state())).toBe(JSON.stringify(b.state()));
      // toEqual also tells NaN from null, which JSON cannot.
      expect(a.state()).toEqual(b.state());
      expect(a.state().bestBrain.levels[0].weights).toHaveLength(5);
    },
    SLOW_MS,
  );

  it('gives different brains for seeds 1 and 2', () => {
    const one = parameters(createBaselineSim({ seed: 1 }).state().bestBrain);
    const two = parameters(createBaselineSim({ seed: 2 }).state().bestBrain);
    expect(one).toHaveLength(two.length);
    expect(one).not.toEqual(two);
  });

  it(
    'reports damage: some AI cars crash within 300 ticks and others do not',
    () => {
      const sim = createBaselineSim({ seed: 1 });
      sim.step(300);
      const flags = sim.state().cars.map((car) => car.damaged);
      expect(flags).toContain(true);
      expect(flags).toContain(false);
    },
    SLOW_MS,
  );

  it('does not share state between two simulations', () => {
    const first = createBaselineSim({ seed: 3 });
    const tickZero = JSON.stringify(first.state());
    first.step(20);
    expect(JSON.stringify(createBaselineSim({ seed: 3 }).state())).toBe(tickZero);
  });
});

describe('saved brain, save and discard', () => {
  it('copies a saved brain exactly to car 0 and mutates it for every other car, within the bound of amount 0.1', () => {
    const saved = createBaselineSim({ seed: 7 }).state().bestBrain;
    const brains = createBaselineSim({ seed: 1, savedBrain: saved }).brains();
    const expected = parameters(saved);
    expect(brains).toHaveLength(100);
    expect(parameters(brains[0])).toEqual(expected);
    for (const brain of brains.slice(1)) {
      const actual = parameters(brain);
      expect(actual).not.toEqual(expected);
      // mutate(…, 0.1) is lerp(old, random in [-1, 1), 0.1): each value moves by at most 0.1 × 2.
      actual.forEach((value, i) => expect(Math.abs(value - expected[i])).toBeLessThanOrEqual(0.2));
    }
  });

  it(
    'save writes the best car brain to localStorage and discard removes it',
    () => {
      const sim = createBaselineSim({ seed: 1 });
      expect(sim.storage.getItem('bestBrain')).toBeNull();
      sim.step(300);
      const state = sim.state();
      // A best car other than car 0, so that saving cars[0] by mistake would be noticed. This holds for
      // seed 1 after 300 ticks (found by running it); a change of the seed or the draw order needs a new pair.
      expect(state.bestIndex).not.toBe(0);
      sim.save();
      const stored = sim.storage.getItem('bestBrain');
      expect(stored).toBe(JSON.stringify(state.bestBrain));
      expect(parameters(JSON.parse(stored))).toEqual(parameters(sim.brains()[state.bestIndex]));
      expect(parameters(JSON.parse(stored))).not.toEqual(parameters(sim.brains()[0]));
      sim.discard();
      expect(sim.storage.getItem('bestBrain')).toBeNull();
    },
    SLOW_MS,
  );
});

describe('isolation and stubs', () => {
  it('leaves the host untouched', () => {
    const random = Math.random;
    const sim = createBaselineSim({ seed: 5 });
    sim.step(5);
    expect(Math.random).toBe(random);
    for (const name of ['document', 'window', 'localStorage', 'Image', 'Car', 'animate', 'save']) {
      expect({ name, value: globalThis[name] }).toEqual({ name, value: undefined });
    }
  });

  it('never fires the image onload handler, so mask canvases stay untouched', () => {
    const sim = createBaselineSim();
    sim.step(3);
    // Two page canvases, then one mask canvas for each of the 100 AI cars and 7 traffic cars.
    expect(sim.canvases).toHaveLength(2 + 107);
    for (const canvas of sim.canvases.slice(2)) {
      const context = canvas.getContext('2d');
      expect(context.fillStyle).toBe('#000000');
      expect(context.globalCompositeOperation).toBe('source-over');
    }
  });

  it(
    'records the time for 1,000 ticks (no threshold)',
    () => {
      const sim = createBaselineSim({ seed: 1 });
      const start = performance.now();
      sim.step(1000);
      const milliseconds = performance.now() - start;
      console.info(`headless: 1,000 ticks took ${milliseconds.toFixed(0)} ms`);
      expect(sim.state().tick).toBe(1000);
      expect(Number.isFinite(milliseconds)).toBe(true);
    },
    SLOW_MS,
  );
});
