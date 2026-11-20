// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

/**
 * The original visualizer.js (in baseline/, and in src/ until it is restructured) is UTF-16LE with a
 * byte-order mark. Browsers decode that from a file:// URL, but Vite reads source files as UTF-8 and fails on
 * it. This plugin decodes such files when they are served; the files on disk are not changed.
 * @returns {import('vite').Plugin}
 */
function utf16LeSources() {
  return {
    name: 'utf16le-sources',
    enforce: 'pre',
    load(id) {
      const path = id.split('?')[0];
      if (!path.endsWith('.js')) return null;
      let bytes;
      try {
        bytes = readFileSync(path);
      } catch {
        return null;
      }
      if (bytes[0] === 0xff && bytes[1] === 0xfe) {
        return bytes.subarray(2).toString('utf16le');
      }
      return null;
    },
  };
}

// `npm run dev` serves src/. `npm run dev:baseline` serves the frozen original in baseline/ with this same
// config: the root given on the command line replaces `root` below.
// Vitest reads this file too, so its root and include globs are set explicitly to find tests/ at the repo root.
export default defineConfig({
  root: 'src',
  plugins: [utf16LeSources()],
  test: {
    root: '.',
    include: ['tests/**/*.test.js'],
  },
});
