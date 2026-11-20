// @ts-check
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COLUMNS,
  FORMAT_VERSION,
  SCENARIOS,
  TICKS,
  UPSTREAM_COMMIT,
  assertFinite,
  firstMismatch,
  fixtureDir,
  loadFixture,
  runScenario,
} from './helpers/golden.js';

const SLOW_MS = 120_000;
// Test-only hook: run the replay against a scratch copy of baseline/ (mutation checks). Unset in normal runs.
const srcDir = process.env.GOLDEN_SRC_DIR || undefined;

describe('golden trajectories', () => {
  it.each(SCENARIOS)(
    '$name: replaying $name for 1,000 ticks reproduces every recorded number exactly',
    ({ name, seed }) => {
      const fixture = loadFixture(name);
      const { record } = runScenario(
        { name, seed },
        { savedBrain: fixture.meta.savedBrain, srcDir },
      );
      assertFinite(record);
      const mismatch = firstMismatch(name, fixture, record);
      if (mismatch) expect.fail(mismatch.message);
    },
    SLOW_MS,
  );

  it.each(SCENARIOS)('$name: the fixture has the expected format and metrics', ({ name, seed }) => {
    const { meta, columns, ticks, final, metrics } = loadFixture(name);
    expect(meta).toMatchObject({
      formatVersion: FORMAT_VERSION,
      upstreamCommit: UPSTREAM_COMMIT,
      scenario: name,
      seed,
      ticks: TICKS,
    });
    expect(columns).toEqual(COLUMNS);
    expect(ticks).toHaveLength(TICKS + 1);
    expect(final.tick).toBe(TICKS);
    expect(final.cars).toHaveLength(100);
    expect(final.traffic).toHaveLength(7);
    const crashed = final.cars.filter((/** @type {any} */ car) => car.damaged).length;
    expect(metrics).toEqual({
      bestDistancePx: 100 - final.cars[final.bestIndex].y,
      crashedCars: crashed,
      survivingCars: 100 - crashed,
    });
    expect(ticks[TICKS][6]).toBe(crashed);
  });

  it('seed-4-gen2 starts from the best brain at the end of seed-1', () => {
    expect(loadFixture('seed-4-gen2').meta.savedBrain).toEqual(
      loadFixture('seed-1').final.bestBrain,
    );
  });

  it('the fixtures are the four scenarios and add less than 1 MB', () => {
    const files = readdirSync(fixtureDir()).filter((file) => file.endsWith('.json'));
    expect(files.sort()).toEqual(SCENARIOS.map((s) => `${s.name}.json`).sort());
    const bytes = files.reduce((sum, file) => sum + statSync(join(fixtureDir(), file)).size, 0);
    expect(bytes).toBeLessThan(1_000_000);
  });

  it.each(['../golden.test.js', './golden.js', './headless.js'])(
    'neither the replay test nor its helpers write files (%s): only the recorder does',
    (file) => {
      const source = readFileSync(new URL(file, new URL('./helpers/', import.meta.url)), 'utf8');
      expect(source).not.toMatch(
        /\b(write|append|rm|unlink|mkdir|rename|copyFile|createWriteStream)[A-Za-z]*\s*\(/,
      );
    },
  );
});
