// @ts-check
import { describe, expect, it } from 'vitest';
import {
  assertFinite,
  changingTicks,
  firstMismatch,
  formatFixture,
  parseMetricsTable,
} from './helpers/golden.js';

/** A small record in the fixture shape: 3 tick rows, 2 AI cars, 1 traffic car. */
function makeRecord() {
  const car = (/** @type {number} */ x) => ({ x, y: -5, angle: 0.5, speed: 1.5, damaged: false });
  return {
    meta: { formatVersion: 1, upstreamCommit: 'abc', scenario: 's', seed: 7, ticks: 2 },
    columns: ['bestIndex', 'x', 'y', 'angle', 'speed', 'damaged', 'crashed'],
    ticks: [
      [1, 100, -1, 0, 0.2, false, 0],
      [1, 100, -2, 0, 0.4, false, 0],
      [1, 100, -3, 0, 0.6, false, 1],
    ],
    final: {
      tick: 2,
      bestIndex: 1,
      cars: [car(90), car(100)],
      traffic: [car(110)],
      bestBrain: {
        levels: [
          {
            weights: [
              [1, 2],
              [3, 4],
            ],
            biases: [0, 0],
          },
        ],
      },
    },
    metrics: { bestDistancePx: 103, crashedCars: 1, survivingCars: 1 },
  };
}

/** @param {(r: any) => void} change */
function mutated(change) {
  const record = makeRecord();
  change(record);
  return record;
}

describe('firstMismatch', () => {
  it('returns null for identical records, and does not compare the sign of zero', () => {
    expect(firstMismatch('s', makeRecord(), makeRecord())).toBeNull();
    const negative = mutated((r) => (r.ticks[1][3] = -0));
    expect(firstMismatch('s', makeRecord(), negative)).toBeNull();
  });

  it('names the scenario, tick, best car and field of a changed tick row', () => {
    const actual = mutated((r) => (r.ticks[2][2] = -3.0000000001));
    const found = firstMismatch('seed-2', makeRecord(), actual);
    expect(found?.message).toBe(
      'seed-2: tick 2, best car (index 1), field y: expected -3 but got -3.0000000001',
    );
    expect(found).toMatchObject({ tick: 2, field: 'y' });
  });

  it('reports a change in the number of crashed cars as all AI cars', () => {
    const actual = mutated((r) => (r.ticks[1][6] = 1));
    expect(firstMismatch('s', makeRecord(), actual)?.message).toBe(
      's: tick 1, all AI cars, field crashedCars: expected 0 but got 1',
    );
  });

  it('reports a boolean field and a missing tick row', () => {
    const flag = mutated((r) => (r.ticks[0][5] = true));
    expect(firstMismatch('s', makeRecord(), flag)?.field).toBe('damaged');
    const short = mutated((r) => r.ticks.pop());
    expect(firstMismatch('s', makeRecord(), short)).toMatchObject({ tick: 2, field: 'presence' });
  });

  it('names the car and field of a changed final state', () => {
    const ai = mutated((r) => (r.final.cars[0].x = 91));
    expect(firstMismatch('s', makeRecord(), ai)?.message).toBe(
      's: tick 2, AI car 0, field x: expected 90 but got 91',
    );
    const traffic = mutated((r) => (r.final.traffic[0].speed = 1.6));
    expect(firstMismatch('s', makeRecord(), traffic)?.message).toBe(
      's: tick 2, traffic car 0, field speed: expected 1.5 but got 1.6',
    );
    const flag = mutated((r) => (r.final.cars[1].damaged = true));
    expect(firstMismatch('s', makeRecord(), flag)).toMatchObject({
      car: 'AI car 1',
      field: 'damaged',
    });
  });

  it('names the path of a changed brain weight and the field of a changed metric', () => {
    const brain = mutated((r) => (r.final.bestBrain.levels[0].weights[1][0] = 3.5));
    expect(firstMismatch('s', makeRecord(), brain)?.message).toBe(
      's: tick 2, best brain, field levels[0].weights[1][0]: expected 3 but got 3.5',
    );
    const metric = mutated((r) => (r.metrics.crashedCars = 2));
    expect(firstMismatch('s', makeRecord(), metric)?.message).toBe(
      's: tick 2, metrics, field crashedCars: expected 1 but got 2',
    );
  });

  it('reports the earliest difference when several exist', () => {
    const actual = mutated((r) => {
      r.final.cars[0].x = 0;
      r.ticks[1][1] = 0;
      r.metrics.crashedCars = 9;
    });
    expect(firstMismatch('s', makeRecord(), actual)).toMatchObject({ tick: 1, field: 'x' });
  });

  it('treats NaN as different from NaN', () => {
    const both = mutated((r) => (r.ticks[0][1] = NaN));
    expect(firstMismatch('s', both, both)).toMatchObject({ tick: 0, field: 'x' });
  });
});

describe('assertFinite', () => {
  it('accepts a normal record', () => {
    expect(() => assertFinite(makeRecord())).not.toThrow();
  });

  it.each([
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['undefined', undefined],
  ])('rejects %s and names where it is', (_label, value) => {
    const record = mutated((r) => (r.final.cars[1].speed = value));
    expect(() => assertFinite(record)).toThrow('record.final.cars[1].speed');
  });
});

describe('formatFixture', () => {
  it('writes valid JSON that reads back as the same record', () => {
    const text = formatFixture(makeRecord());
    expect(JSON.parse(text)).toEqual(makeRecord());
  });

  it('puts one tick row and one car per line, uses LF and ends with a newline', () => {
    const text = formatFixture(makeRecord());
    expect(text).toContain('\n[1,100,-2,0,0.4,false,0],\n');
    expect(text).toContain('\n{"x":90,"y":-5,"angle":0.5,"speed":1.5,"damaged":false},\n');
    expect(text).not.toContain('\r');
    expect(text.endsWith('}\n')).toBe(true);
  });

  it('round-trips awkward doubles exactly', () => {
    const record = mutated((r) => (r.ticks[1][2] = -285.24999999999994));
    expect(JSON.parse(formatFixture(record)).ticks[1][2]).toBe(-285.24999999999994);
  });
});

describe('changingTicks', () => {
  it('counts the ticks whose row differs from the tick before', () => {
    expect(changingTicks(makeRecord())).toBe(2);
    const still = mutated((r) => (r.ticks = [r.ticks[0], r.ticks[0], r.ticks[0]]));
    expect(changingTicks(still)).toBe(0);
  });
});

describe('parseMetricsTable', () => {
  it('reads one row per scenario and keeps the cells as text', () => {
    const markdown = [
      '| Scenario | Best distance (px) | Crashed AI cars | Surviving AI cars | Runtime (ms) |',
      '| --- | --- | --- | --- | --- |',
      '| `seed-1` | 1234.5 | 90 | 10 | 4000.1 |',
      '| `seed-4-gen2` | 99 | 1 | 99 | 3900 |',
      'Some other line | with | pipes',
    ].join('\r\n');
    const table = parseMetricsTable(markdown);
    expect([...table.keys()]).toEqual(['seed-1', 'seed-4-gen2']);
    expect(table.get('seed-1')).toEqual({
      bestDistancePx: '1234.5',
      crashedCars: '90',
      survivingCars: '10',
      runtimeMs: '4000.1',
    });
  });
});
