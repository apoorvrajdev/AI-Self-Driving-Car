// @ts-check
// Records the golden fixtures: `npm run golden:record`. This is the only code that writes them (ADR-0010).
// Run it only in a task whose card says so, and describe the reason in the log.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import {
  SCENARIOS,
  assertFinite,
  changingTicks,
  fixtureDir,
  formatFixture,
  runScenario,
} from '../helpers/golden.js';

const dir = fixtureDir();
mkdirSync(dir, { recursive: true });
const out = (/** @type {string} */ text) => process.stdout.write(`${text}\n`);

/** @type {Map<string, any>} */
const records = new Map();
out(`Recording on Node ${process.version} into ${dir}\n`);
out('| Scenario | Best distance (px) | Crashed AI cars | Surviving AI cars | Runtime for 1,000 ticks (ms) |');
out('| --- | --- | --- | --- | --- |');
for (const scenario of SCENARIOS) {
  let savedBrain;
  if (scenario.savedBrainFrom) savedBrain = records.get(scenario.savedBrainFrom).final.bestBrain;
  const { record, stepMs } = runScenario(scenario, { savedBrain });
  assertFinite(record);
  record.meta.node = process.version;
  record.meta.recordMs = Number(stepMs.toFixed(1));
  records.set(scenario.name, record);
  writeFileSync(join(dir, `${scenario.name}.json`), formatFixture(record));
  const { bestDistancePx, crashedCars, survivingCars } = record.metrics;
  out(`| \`${scenario.name}\` | ${bestDistancePx} | ${crashedCars} | ${survivingCars} | ${record.meta.recordMs} |`);
}
out('');
for (const [name, record] of records) {
  out(`${name}: the best car's row changed on ${changingTicks(record)} of ${record.meta.ticks} ticks`);
}
