// @ts-check
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createModuleSim } from './helpers/moduleSim.js';

/** The host objects the page needs and the bridge stubs. */
const STUBBED = [
  'document',
  'window',
  'localStorage',
  'Image',
  'requestAnimationFrame',
  'location',
];

/**
 * Math.random, console.log and the property descriptors of the stubbed globals (descriptors never run a
 * getter).
 */
const hostState = () => ({
  random: Math.random,
  log: console.log,
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
  it('puts Math.random, console.log and the six stubbed globals back after dispose()', async () => {
    const before = hostState();
    const sim = await start({ seed: 3 });
    sim.step(5);
    // While the sim exists the host really is stubbed, so the checks after dispose() mean something.
    expect(Math.random).not.toBe(before.random);
    expect(console.log).not.toBe(before.log);
    for (const name of STUBBED) expect(name in globalThis).toBe(true);

    sim.dispose();
    const after = hostState();
    expect(after.random).toBe(before.random);
    expect(after.log).toBe(before.log);
    expect(after.descriptors).toEqual(before.descriptors);
    expect(after.present).toEqual(before.present);
    // On Node 22 and 24 none of the six exists, so each is undefined again.
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
});

describe('the page seed: ?seed= drives one generator', () => {
  /** @param {number} seed */
  async function brainsAndColors(seed) {
    const sim = await start({ seed });
    const result = { brains: sim.brains(), colors: sim.trafficColors() };
    sim.dispose();
    return result;
  }

  it('the same seed gives identical brains and traffic colours', async () => {
    const first = await brainsAndColors(1);
    const second = await brainsAndColors(1);
    // Seven real colours, so the comparison cannot pass on the stub's default fill.
    expect(first.colors).toHaveLength(7);
    for (const color of first.colors) expect(color).toMatch(/^hsl\(\d/);
    expect(second).toEqual(first);
  });

  it('seeds 1 and 2 give different brains and different traffic colours', async () => {
    const one = await brainsAndColors(1);
    const two = await brainsAndColors(2);
    expect(two.brains).not.toEqual(one.brains);
    expect(two.colors).not.toEqual(one.colors);
  });

  it('randomCalls() counts calls to Math.random while the sim is open', async () => {
    const sim = await start({ seed: 1 });
    expect(sim.randomCalls()).toBe(0);
    Math.random();
    expect(sim.randomCalls()).toBe(1);
    sim.dispose();
    expect(sim.randomCalls()).toBe(1);
  });

  it('?seed=0 is used as seed 0: crypto is not asked and the log names it', async () => {
    const cryptoSpy = vi.spyOn(crypto, 'getRandomValues');
    try {
      const sim = await start({ seed: 0 });
      expect(cryptoSpy).not.toHaveBeenCalled();
      expect(sim.logged).toEqual(['seed 0 (open ?seed=0 to repeat this run)']);
    } finally {
      cryptoSpy.mockRestore();
    }
  });

  it.each(['', '?seed=abc', '?seed=-1'])(
    'with %j the page takes its seed from crypto.getRandomValues and logs it',
    async (search) => {
      // 5, not 1: seed 1 is the default elsewhere, so a page that ignored crypto's value could still match.
      const expected = await brainsAndColors(5);
      const cryptoSpy = vi
        .spyOn(crypto, 'getRandomValues')
        .mockImplementation((/** @type {any} */ array) => {
          array[0] = 5;
          return array;
        });
      try {
        const sim = await start({ search });
        expect(cryptoSpy).toHaveBeenCalledTimes(1);
        expect(sim.logged).toEqual(['seed 5 (open ?seed=5 to repeat this run)']);
        expect(sim.brains()).toEqual(expected.brains);
      } finally {
        cryptoSpy.mockRestore();
      }
    },
  );
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
