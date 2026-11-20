// @ts-check
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCENARIOS, loadFixture, parseMetricsTable } from './helpers/golden.js';

const table = parseMetricsTable(
  readFileSync(new URL('../docs/baseline-metrics.md', import.meta.url), 'utf8'),
);

describe('docs/baseline-metrics.md', () => {
  it('has one row for each golden scenario and nothing else', () => {
    expect([...table.keys()]).toEqual(SCENARIOS.map((s) => s.name));
  });

  it.each(SCENARIOS)(
    '$name: the row equals the metrics and run time in the fixture',
    ({ name }) => {
      const { metrics, meta } = loadFixture(name);
      expect(table.get(name)).toEqual({
        bestDistancePx: String(metrics.bestDistancePx),
        crashedCars: String(metrics.crashedCars),
        survivingCars: String(metrics.survivingCars),
        runtimeMs: String(meta.recordMs),
      });
    },
  );
});
