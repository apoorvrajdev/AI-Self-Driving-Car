import { describe, expect, it } from 'vitest';
import { loadLegacy, makeSequenceRandom } from './helpers/loadLegacy.js';
import { bindRandom, loadSrcModules } from './helpers/moduleSim.js';

const names = ['lerp', 'getIntersection', 'polysIntersect', 'getRGBA', 'getRandomColor'];
const srcUtils = await loadSrcModules(['utils.js']);

/**
 * The two implementations every case runs against: the frozen baseline (classic script in a vm) and the
 * src/ module. `load(random)` gives a handle whose Math.random is `random`; the functions of a default
 * handle (seed 1) are spread into each entry so a case can take them as parameters.
 */
const IMPLEMENTATIONS = [
  { label: 'baseline (vm)', load: (random) => loadLegacy(['utils.js'], names, { random }) },
  { label: 'src modules', load: (random) => bindRandom(srcUtils, random) },
].map(({ label, load }) => ({ label, load, ...load() }));

const square = (x, y, size) => [
  { x, y },
  { x: x + size, y },
  { x: x + size, y: y + size },
  { x, y: y + size },
];

describe.each(IMPLEMENTATIONS)('lerp ($label)', ({ lerp }) => {
  it('returns A at t=0, B at t=1 and the midpoint at t=0.5', () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('extrapolates outside 0..1 instead of clamping', () => {
    expect(lerp(10, 20, 2)).toBe(30);
    expect(lerp(10, 20, -1)).toBe(0);
  });
});

describe.each(IMPLEMENTATIONS)('getIntersection ($label)', ({ getIntersection }) => {
  const A = { x: 0, y: 0 };
  const B = { x: 10, y: 10 };

  it('returns the crossing point and the offset along AB for crossing segments', () => {
    const hit = getIntersection(A, B, { x: 0, y: 10 }, { x: 10, y: 0 });
    expect(hit.x).toBeCloseTo(5);
    expect(hit.y).toBeCloseTo(5);
    expect(hit.offset).toBeCloseTo(0.5);
  });

  it('reports an offset that is the fraction of the way along AB', () => {
    const hit = getIntersection(A, B, { x: 2, y: 0 }, { x: 2, y: 10 });
    expect(hit.x).toBeCloseTo(2);
    expect(hit.y).toBeCloseTo(2);
    expect(hit.offset).toBeCloseTo(0.2);
  });

  it('returns null for parallel segments', () => {
    expect(getIntersection(A, B, { x: 0, y: 5 }, { x: 10, y: 15 })).toBeNull();
  });

  it('returns null when the lines cross outside the segments', () => {
    expect(getIntersection(A, B, { x: 20, y: 0 }, { x: 20, y: 10 })).toBeNull();
    expect(getIntersection(A, B, { x: 0, y: 20 }, { x: 5, y: 15 })).toBeNull();
  });

  it('counts a segment that only touches at an endpoint as an intersection', () => {
    const hit = getIntersection(A, B, { x: 10, y: 10 }, { x: 20, y: 0 });
    expect(hit.offset).toBeCloseTo(1);
    expect(hit.x).toBeCloseTo(10);
    expect(hit.y).toBeCloseTo(10);
  });

  it('counts a segment whose start lies on the other segment as an intersection at offset 0', () => {
    const hit = getIntersection({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: -5 }, { x: 0, y: 5 });
    expect(hit.offset).toBe(0);
    expect(hit.x).toBe(0);
    expect(hit.y).toBe(0);
  });

  it('quirk: returns null for collinear overlapping segments', () => {
    expect(getIntersection(A, B, { x: 5, y: 5 }, { x: 15, y: 15 })).toBeNull();
  });
});

describe.each(IMPLEMENTATIONS)('polysIntersect ($label)', ({ polysIntersect }) => {
  it('is true for overlapping squares', () => {
    expect(polysIntersect(square(0, 0, 10), square(5, 5, 10))).toBe(true);
  });

  it('is false for separate squares', () => {
    expect(polysIntersect(square(0, 0, 10), square(20, 20, 10))).toBe(false);
  });

  it('quirk: is false when one square lies fully inside another (only edges are tested)', () => {
    expect(polysIntersect(square(0, 0, 100), square(40, 40, 10))).toBe(false);
  });
});

describe.each(IMPLEMENTATIONS)('getRGBA and getRandomColor ($label)', ({ getRGBA, load }) => {
  it('maps negative values to blue-ish, positive to yellow-ish, with alpha = |value|', () => {
    expect(getRGBA(-1)).toBe('rgba(0,0,255,1)');
    expect(getRGBA(1)).toBe('rgba(255,255,0,1)');
    expect(getRGBA(0.5)).toBe('rgba(255,255,0,0.5)');
  });

  it('quirk: zero gives white at alpha 0', () => {
    expect(getRGBA(0)).toBe('rgba(255,255,255,0)');
  });

  it('builds the hue from Math.random as 290 + r * 260 (can exceed 360)', () => {
    const low = load(makeSequenceRandom([0]));
    const high = load(makeSequenceRandom([1]));
    expect(low.getRandomColor()).toBe('hsl(290, 100%, 60%)');
    expect(high.getRandomColor()).toBe('hsl(550, 100%, 60%)');
  });
});
