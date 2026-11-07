import { describe, expect, it } from 'vitest';
import { loadLegacy, makeSeededRandom, makeSequenceRandom } from './helpers/loadLegacy.js';

const files = ['utils.js', 'network.js'];
const names = ['NeuralNetwork', 'Level'];
const load = (random) => loadLegacy(files, names, { random });

/** Weights and biases as plain JSON, so snapshots compare across the vm realm. */
const snapshot = (net) =>
  JSON.parse(JSON.stringify(net.levels.map((level) => ({ w: level.weights, b: level.biases }))));

/** A one-output network with two inputs and hand-set weights and bias. */
function handMadeNet(NeuralNetwork, weights, bias) {
  const net = new NeuralNetwork([2, 1]);
  net.levels[0].weights = [[weights[0]], [weights[1]]];
  net.levels[0].biases[0] = bias;
  return net;
}

describe('NeuralNetwork construction', () => {
  it('NeuralNetwork([5,6,4]) has two levels with the right shapes', () => {
    const { NeuralNetwork } = load(makeSeededRandom(1));
    const net = new NeuralNetwork([5, 6, 4]);
    expect(net.levels).toHaveLength(2);

    const [first, second] = net.levels;
    expect([first.inputs.length, first.outputs.length, first.biases.length]).toEqual([5, 6, 6]);
    expect(first.weights).toHaveLength(5);
    expect(first.weights.every((row) => row.length === 6)).toBe(true);

    expect([second.inputs.length, second.outputs.length, second.biases.length]).toEqual([6, 4, 4]);
    expect(second.weights).toHaveLength(6);
    expect(second.weights.every((row) => row.length === 4)).toBe(true);
  });

  it('draws every weight and bias as random()*2-1, so they lie in [-1, 1)', () => {
    const { NeuralNetwork } = load(makeSeededRandom(7));
    const values = snapshot(new NeuralNetwork([5, 6, 4])).flatMap((l) => [...l.w.flat(), ...l.b]);
    expect(values.every((v) => v >= -1 && v < 1)).toBe(true);

    const low = load(makeSequenceRandom([0]));
    const lowValues = snapshot(new low.NeuralNetwork([2, 1])).flatMap((l) => [
      ...l.w.flat(),
      ...l.b,
    ]);
    expect(lowValues).toEqual([-1, -1, -1]);
  });

  it('draws weights row by row first, then the biases', () => {
    // Two outputs per input, so row-by-row and column-by-column order give different matrices.
    const { NeuralNetwork } = load(makeSequenceRandom([0, 0.25, 0.5, 0.75, 0.5, 1]));
    const [level] = snapshot(new NeuralNetwork([2, 2]));
    expect(level.w).toEqual([
      [-1, -0.5],
      [0, 0.5],
    ]);
    expect(level.b).toEqual([0, 1]);
  });

  it('gives the same network for the same seed', () => {
    const a = new (load(makeSeededRandom(42)).NeuralNetwork)([5, 6, 4]);
    const b = new (load(makeSeededRandom(42)).NeuralNetwork)([5, 6, 4]);
    expect(snapshot(a)).toEqual(snapshot(b));
  });

  it('quirk: a single-entry layer list builds no levels, and feedForward then throws', () => {
    const { NeuralNetwork } = load(makeSeededRandom(1));
    const net = new NeuralNetwork([3]);
    expect(net.levels).toHaveLength(0);
    let error;
    try {
      NeuralNetwork.feedForward([1, 2, 3], net);
    } catch (e) {
      error = e;
    }
    // The error comes from the vm realm, so check its name rather than `instanceof TypeError`.
    expect(error?.name).toBe('TypeError');
  });
});

describe('NeuralNetwork.feedForward', () => {
  it('returns 4 outputs, each exactly 0 or 1', () => {
    const { NeuralNetwork } = load(makeSeededRandom(3));
    const net = new NeuralNetwork([5, 6, 4]);
    const outputs = NeuralNetwork.feedForward([0.2, 0.9, 0.5, 0, 1], net);
    expect(outputs).toHaveLength(4);
    expect(Array.from(outputs).every((v) => v === 0 || v === 1)).toBe(true);
  });

  it('outputs 1 only when the weighted sum is above the bias', () => {
    const { NeuralNetwork } = load(makeSeededRandom(1));
    const net = handMadeNet(NeuralNetwork, [1, 1], 1);
    expect(Array.from(NeuralNetwork.feedForward([0.6, 0.5], net))).toEqual([1]);
    expect(Array.from(NeuralNetwork.feedForward([0.2, 0.2], net))).toEqual([0]);
  });

  it('outputs 0 when the weighted sum equals the bias exactly (strict comparison)', () => {
    const { NeuralNetwork } = load(makeSeededRandom(1));
    const net = handMadeNet(NeuralNetwork, [1, 1], 1);
    expect(Array.from(NeuralNetwork.feedForward([0.5, 0.5], net))).toEqual([0]);
  });

  it('feeds each level’s outputs into the next level', () => {
    const { NeuralNetwork } = load(makeSeededRandom(1));
    const net = new NeuralNetwork([2, 1, 1]);
    // Level 1 fires when x0 + x1 > 1. Level 2 inverts its input (fires when -input > -0.5).
    net.levels[0].weights = [[1], [1]];
    net.levels[0].biases[0] = 1;
    net.levels[1].weights = [[-1]];
    net.levels[1].biases[0] = -0.5;
    // Level 1 fires (sum 1.3), so level 2 does not. If level 1 were skipped or fed the raw inputs,
    // level 2 would see 0.4 and fire.
    expect(Array.from(NeuralNetwork.feedForward([0.4, 0.9], net))).toEqual([0]);
    // Level 1 stays silent (sum 0.4), so level 2 fires. If level 2 were skipped the result would be 0.
    expect(Array.from(NeuralNetwork.feedForward([0.2, 0.2], net))).toEqual([1]);
  });

  it('supports negative weights', () => {
    const { NeuralNetwork } = load(makeSeededRandom(1));
    const net = handMadeNet(NeuralNetwork, [-1, 0], -0.5);
    expect(Array.from(NeuralNetwork.feedForward([0.2, 0], net))).toEqual([1]);
    expect(Array.from(NeuralNetwork.feedForward([0.9, 0], net))).toEqual([0]);
  });

  it('quirk: returns the last level’s own outputs array, so a later call overwrites an earlier result', () => {
    const { NeuralNetwork } = load(makeSeededRandom(1));
    const net = handMadeNet(NeuralNetwork, [1, 1], 1);
    const first = NeuralNetwork.feedForward([0.6, 0.5], net);
    expect(first).toBe(net.levels[0].outputs);
    const firstCopy = Array.from(first);
    const second = NeuralNetwork.feedForward([0.2, 0.2], net);
    expect(second).toBe(first);
    expect(firstCopy).toEqual([1]);
    expect(Array.from(first)).toEqual([0]);
  });

  it('quirk: missing inputs become undefined, the sum is NaN and the output is 0', () => {
    const { NeuralNetwork } = load(makeSeededRandom(1));
    const net = handMadeNet(NeuralNetwork, [1, 1], -100);
    expect(Array.from(NeuralNetwork.feedForward([1], net))).toEqual([0]);
  });
});

describe('NeuralNetwork.mutate', () => {
  it('mutate(net, 0) changes nothing', () => {
    const { NeuralNetwork } = load(makeSeededRandom(5));
    const net = new NeuralNetwork([5, 6, 4]);
    const before = snapshot(net);
    NeuralNetwork.mutate(net, 0);
    expect(snapshot(net)).toEqual(before);
  });

  it('mutate(net, 1) replaces every weight and bias with a fresh random value', () => {
    // Construction draws 0.5 three times, so every value starts at 0. The mutation then draws 0, 0.25
    // and 0.75: the bias first, then the two weights.
    const { NeuralNetwork } = load(makeSequenceRandom([0.5, 0.5, 0.5, 0, 0.25, 0.75]));
    const net = new NeuralNetwork([2, 1]);
    const [before] = snapshot(net);
    expect([...before.w.flat(), ...before.b]).toEqual([0, 0, 0]);

    NeuralNetwork.mutate(net, 1);
    const [after] = snapshot(net);
    expect(after.b).toEqual([-1]);
    expect(after.w).toEqual([[-0.5], [0.5]]);
  });

  it('mutates every level of a multi-level network', () => {
    // [5,6,4] has 5*6+6 + 6*4+4 = 64 values. Construction draws 0.5 for each (values start at 0);
    // the mutation then draws 0.75 for each, which maps to 0.5.
    const draws = [...Array(64).fill(0.5), 0.75];
    const { NeuralNetwork } = load(makeSequenceRandom(draws));
    const net = new NeuralNetwork([5, 6, 4]);
    const valuesOf = () => snapshot(net).flatMap((l) => [...l.w.flat(), ...l.b]);
    expect(valuesOf()).toHaveLength(64);
    valuesOf().forEach((v) => expect(v).toBe(0));

    NeuralNetwork.mutate(net, 1);
    valuesOf().forEach((v) => expect(v).toBeCloseTo(0.5));
  });

  it('moves each value part of the way to the new random value for 0 < amount < 1', () => {
    const { NeuralNetwork } = load(makeSequenceRandom([0.5, 0.5, 0.5, 1]));
    const net = new NeuralNetwork([2, 1]);
    // After construction every value is 0; the next draws are all 1, so the target is 1.
    NeuralNetwork.mutate(net, 0.25);
    const [level] = snapshot(net);
    expect(level.b[0]).toBeCloseTo(0.25);
    level.w.flat().forEach((v) => expect(v).toBeCloseTo(0.25));
  });

  it('uses amount 1 when none is given', () => {
    const a = load(makeSeededRandom(9));
    const b = load(makeSeededRandom(9));
    const netA = new a.NeuralNetwork([5, 6, 4]);
    const netB = new b.NeuralNetwork([5, 6, 4]);
    a.NeuralNetwork.mutate(netA);
    b.NeuralNetwork.mutate(netB, 1);
    expect(snapshot(netA)).toEqual(snapshot(netB));
  });

  it('draws the new biases before the new weights within each level', () => {
    // Construction draws 6 times (4 weights, 2 biases), so every value starts at 0. The mutation then
    // draws the two biases (0, 1), then the four weights row by row (0, 0.25, 0.5, 0.75).
    const draws = [...Array(6).fill(0.5), 0, 1, 0, 0.25, 0.5, 0.75];
    const { NeuralNetwork } = load(makeSequenceRandom(draws));
    const net = new NeuralNetwork([2, 2]);
    NeuralNetwork.mutate(net, 1);
    const [level] = snapshot(net);
    expect(level.b).toEqual([-1, 1]);
    expect(level.w).toEqual([
      [-1, -0.5],
      [0, 0.5],
    ]);
  });
});
