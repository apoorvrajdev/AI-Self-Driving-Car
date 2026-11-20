// @ts-check
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createModuleSim } from './helpers/moduleSim.js';

/** The host objects the page needs and the bridge stubs. */
const STUBBED = ['document', 'window', 'localStorage', 'Image', 'requestAnimationFrame'];

/** Math.random and the property descriptors of the stubbed globals (descriptors never run a getter). */
const hostState = () => ({
  random: Math.random,
  descriptors: STUBBED.map((name) => Object.getOwnPropertyDescriptor(globalThis, name)),
  present: STUBBED.map((name) => name in globalThis),
});

/** @type {{ dispose: () => void }[]} */
const open = [];
afterEach(() => {
  while (open.length) /** @type {{ dispose: () => void }} */ (open.pop()).dispose();
});
/** @param {Parameters<typeof createModuleSim>[0]} [options] */
async function start(options) {
  const sim = await createModuleSim(options);
  open.push(sim);
  return sim;
}

describe('module bridge: leaves the host as it found it', () => {
  it('puts Math.random and the five stubbed globals back after dispose()', async () => {
    const before = hostState();
    const sim = await start({ seed: 3 });
    sim.step(5);
    // While the sim exists the host really is stubbed, so the checks after dispose() mean something.
    expect(Math.random).not.toBe(before.random);
    for (const name of STUBBED) expect(name in globalThis).toBe(true);

    sim.dispose();
    const after = hostState();
    expect(after.random).toBe(before.random);
    expect(after.descriptors).toEqual(before.descriptors);
    expect(after.present).toEqual(before.present);
    // On Node 22 and 24 none of the five exists, so each is undefined again.
    for (const [i, name] of STUBBED.entries()) {
      if (!before.present[i])
        expect(typeof (/** @type {any} */ (globalThis)[name])).toBe('undefined');
    }
  });

  it('dispose() can be called twice', async () => {
    const before = hostState();
    const sim = await start();
    sim.dispose();
    sim.dispose();
    expect(hostState()).toEqual(before);
  });

  it('restores the host when the import fails, then rethrows', async () => {
    const before = hostState();
    await expect(
      createModuleSim({ srcDir: join(tmpdir(), 'no-such-src-directory') }),
    ).rejects.toThrow();
    expect(hostState()).toEqual(before);
  });
});

describe('module bridge: each run is a fresh evaluation', () => {
  it('two sims with the same seed start identically, although the first was stepped', async () => {
    const first = await start({ seed: 5 });
    const startState = first.state();
    const startBrains = first.brains();
    first.step(30);
    expect(first.state().cars).not.toEqual(startState.cars);
    first.dispose();

    const second = await start({ seed: 5 });
    expect(second.state()).toEqual(startState);
    expect(second.brains()).toEqual(startBrains);
  });

  it('different seeds give different brains', async () => {
    const a = await start({ seed: 1 });
    const brainsA = a.brains();
    a.dispose();
    const b = await start({ seed: 2 });
    expect(b.brains()).not.toEqual(brainsA);
  });
});

describe('module bridge: the page behaviour is reachable', () => {
  it('a saved brain goes to every car, mutated for all but car 0', async () => {
    const donor = await start({ seed: 7 });
    const saved = donor.brains()[3];
    donor.dispose();

    const sim = await start({ seed: 8, savedBrain: saved });
    const brains = sim.brains();
    expect(brains[0]).toEqual(saved);
    expect(brains[1]).not.toEqual(saved);
    expect(brains[1]).not.toEqual(brains[2]);
  });

  it('the save and discard buttons use the listeners main.js added', async () => {
    const sim = await start({ seed: 2 });
    sim.step(10);
    sim.click('saveButton');
    expect(JSON.parse(/** @type {string} */ (sim.storage.getItem('bestBrain')))).toEqual(
      sim.state().bestBrain,
    );
    sim.click('discardButton');
    expect(sim.storage.getItem('bestBrain')).toBeNull();
  });

  it('save() and discard() call the exported functions', async () => {
    const sim = await start({ seed: 2 });
    sim.save();
    expect(sim.storage.getItem('bestBrain')).not.toBeNull();
    sim.discard();
    expect(sim.storage.getItem('bestBrain')).toBeNull();
  });

  it('step() accepts only a non-negative integer, and 0 changes nothing', async () => {
    const sim = await start();
    const before = sim.state();
    sim.step(0);
    expect(sim.state()).toEqual(before);
    expect(() => sim.step(-1)).toThrow(RangeError);
    expect(() => sim.step(1.5)).toThrow(RangeError);
  });

  it('state() follows bestCar as it changes (a live binding, read each time)', async () => {
    const sim = await start({ seed: 1 });
    const seen = new Set();
    for (let i = 0; i < 400; i++) {
      sim.step(1);
      seen.add(sim.state().bestIndex);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
