import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BASELINE_DIR } from './helpers/loadLegacy.js';

// The T-001 baseline hash table (docs/TASKS.md, upstream commit 8b87236): size in bytes and SHA-256.
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

describe('baseline/ is the frozen original', () => {
  it('each of the 11 files has the size and SHA-256 of the T-001 table', () => {
    expect(Object.keys(BASELINE_HASHES)).toHaveLength(11);
    for (const [file, [bytes, sha256]] of Object.entries(BASELINE_HASHES)) {
      const content = readFileSync(new URL(file, BASELINE_DIR));
      expect({ file, bytes: content.length }).toEqual({ file, bytes });
      expect({ file, sha256: createHash('sha256').update(content).digest('hex') }).toEqual({
        file,
        sha256,
      });
    }
  });

  it('holds exactly those 11 files and nothing else', () => {
    const entries = readdirSync(BASELINE_DIR, { withFileTypes: true });
    expect(entries.filter((entry) => !entry.isFile()).map((entry) => entry.name)).toEqual([]);
    expect(entries.map((entry) => entry.name).sort()).toEqual(Object.keys(BASELINE_HASHES).sort());
  });
});
