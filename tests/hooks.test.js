// @ts-check
// Tests for the commit guards in .githooks/ (the guards themselves are owner-managed and not edited here).
//
// Samples that name a vendor are assembled from fragments at runtime, so this file holds no literal vendor
// names.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { findViolations } from '../.githooks/check-commit-msg.mjs';
import { blockedPaths, emailFromIdent } from '../.githooks/check-pre-commit.mjs';

/** Joins fragments without a separator. */
const cat = (...parts) => parts.join('');
const vendor = cat('cla', 'ude');
const coAuthorKey = ['Co', 'authored', 'by'].join('-');

/** One sample line per forbidden commit-message pattern. */
const FORBIDDEN_LINES = [
  ['a co-author trailer', `${coAuthorKey}: Someone <someone@example.com>`],
  ['a session trailer', `${cat('Cla', 'ude')}-Session: abc123`],
  ['a vendor no-reply address', `Signed <noreply@${cat('anthro', 'pic')}.com>`],
  ['a "generated with" line', `${cat('Gener', 'ated with ')}${cat('Cla', 'ude Code')}`],
  ['a bracketed "generated with" line', `${cat('Gener', 'ated with [')}${cat('Cla', 'ude Code')}]`],
  ['a session link', `https://${vendor}.ai/code/session_123`],
];

/** One sample path per blocked-path rule, at the root and in a subfolder. */
const BLOCKED_PATHS = [
  ['an instruction file', cat('CLA', 'UDE.md'), `docs/${cat('CLA', 'UDE.md')}`],
  ['a local instruction file', cat('CLA', 'UDE.local.md'), `app/${cat('CLA', 'UDE.local.md')}`],
  ['an instruction file in lower case', cat('cla', 'ude.md'), `docs/${cat('cla', 'ude.md')}`],
  ['an assistant config folder', `.${vendor}/settings.json`, `tools/.${vendor}/settings.json`],
  ['a skill file', 'SKILL.md', 'tools/SKILL.md'],
  ['a skills folder', 'skills/helper.md', 'tools/skills/helper.md'],
  ['a hidden skills folder', '.skills/helper.md', 'tools/.skills/helper.md'],
  ['a private notes folder', cat('ai', '-notes/plan.md'), `docs/${cat('ai', '-notes/plan.md')}`],
];

describe('commit-message guard: findViolations', () => {
  it.each(FORBIDDEN_LINES)('rejects %s', (_name, line) => {
    const violations = findViolations(`feat(sim): add lane keeping\n\n${line}\n`);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/^line 3: /);
  });

  it('rejects a trailer written in lower case or with leading spaces', () => {
    expect(findViolations(`  ${coAuthorKey.toLowerCase()}: x`)).toHaveLength(1);
    expect(findViolations(`\t${coAuthorKey.toUpperCase()}: x`)).toHaveLength(1);
  });

  it('finds a forbidden line in a message with Windows line endings', () => {
    const message = `feat: add x\r\n\r\n${FORBIDDEN_LINES[0][1]}\r\n`;
    const violations = findViolations(message);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/^line 3: /);
  });

  it('reports one violation per matching pattern when a line matches two', () => {
    const line = `${coAuthorKey}: A <noreply@${cat('anthro', 'pic')}.com>`;
    expect(findViolations(line)).toHaveLength(2);
  });

  it('ignores comment lines that start with #, even when they contain a forbidden address or link', () => {
    // These two patterns match anywhere in a line, so only the comment rule can explain the result.
    const [, noReply] = FORBIDDEN_LINES[2];
    const [, sessionLink] = FORBIDDEN_LINES[5];
    expect(findViolations(`feat: add x\n# ${noReply}\n# ${sessionLink}\n`)).toEqual([]);
    expect(findViolations(`feat: add x\n ${noReply}\n`)).toHaveLength(1);
  });

  it('only rejects a trailer at the start of a line, not when it is mentioned mid-line', () => {
    expect(findViolations(`docs: explain that ${coAuthorKey}: lines are rejected`)).toEqual([]);
    expect(findViolations(`docs: the ${cat('Cla', 'ude')}-Session: header is rejected`)).toEqual(
      [],
    );
  });

  it('accepts ordinary Conventional Commits messages', () => {
    expect(findViolations('feat(sim): add lane keeping')).toEqual([]);
    expect(
      findViolations('fix(net): clamp the bias\n\nThe bias drifted past 1 after mutation.\n'),
    ).toEqual([]);
  });

  it('accepts a message that names a tool in plain prose', () => {
    expect(findViolations('build: bundle is generated with vite')).toEqual([]);
    expect(findViolations(`docs: explain the ${coAuthorKey} trailer format`)).toEqual([]);
  });

  it('accepts an empty message', () => {
    expect(findViolations('')).toEqual([]);
  });
});

describe('pre-commit guard: blockedPaths', () => {
  it.each(BLOCKED_PATHS)('blocks %s at the root and in a subfolder', (_name, root, nested) => {
    const hits = blockedPaths([root, nested]);
    expect(hits).toHaveLength(2);
    expect(hits[0].startsWith(root)).toBe(true);
    expect(hits[1].startsWith(nested)).toBe(true);
  });

  it('blocks Windows backslash paths and reports the path as given', () => {
    const paths = [
      `.${vendor}\\settings.json`,
      cat('ai', '-notes\\plan.md'),
      `tools\\${cat('CLA', 'UDE.md')}`,
      `tools\\deep\\skills\\helper.md`,
    ];
    const hits = blockedPaths(paths);
    expect(hits).toHaveLength(4);
    paths.forEach((p, i) => expect(hits[i].startsWith(p)).toBe(true));
  });

  it('allows ordinary project paths', () => {
    expect(blockedPaths(['src/car.js', 'README.md', 'docs/TASKS.md'])).toEqual([]);
  });

  it('matches names case-insensitively', () => {
    const paths = [
      'skill.md',
      'tools/Skills/helper.md',
      cat('AI', '-NOTES/plan.md'),
      `.${vendor.toUpperCase()}/x`,
    ];
    expect(blockedPaths(paths)).toHaveLength(4);
  });

  it('allows look-alike names that are not whole path segments', () => {
    const paths = [
      'src/skills.js',
      'docs/skills-overview.md',
      cat('docs/ai', '-notes.md'),
      `my${cat('CLA', 'UDE.md')}`,
      `${vendor}-notes.txt`,
      `src/.${vendor}rc`,
      // One look-alike per rule whose name only differs by a prefix or a suffix, so dropping the
      // `(^|/)` or `$` anchor of that rule would make it match.
      'src/myskills/x.js',
      'src/my.skills/x.js',
      cat('docs/my-ai', '-notes/plan.md'),
      'mySKILL.md',
      `src/x.${vendor}/y.json`,
      `${cat('CLA', 'UDE.md')}.bak`,
      `${cat('CLA', 'UDE.local.md')}.bak`,
    ];
    expect(blockedPaths(paths)).toEqual([]);
  });

  it('returns nothing for an empty list', () => {
    expect(blockedPaths([])).toEqual([]);
  });

  it('quirk: a bare assistant config folder name is blocked, with no trailing slash', () => {
    expect(blockedPaths([`.${vendor}`, `tools/.${vendor}`])).toHaveLength(2);
  });

  it('quirk: a folder named skills is blocked at any depth, so a source folder with that name would be too', () => {
    expect(blockedPaths(['src/skills/index.js'])).toHaveLength(1);
  });
});

describe('pre-commit guard: emailFromIdent', () => {
  it('extracts the email from a git ident string', () => {
    expect(emailFromIdent('A B <a@b.c> 1700000000 +0530')).toBe('a@b.c');
  });

  it('trims spaces inside the angle brackets', () => {
    expect(emailFromIdent('A B < a@b.c > 1700000000 +0530')).toBe('a@b.c');
  });

  it('returns an empty string when there is no email', () => {
    expect(emailFromIdent('A B 1700000000 +0530')).toBe('');
  });
});

// The 20 s test timeout is longer than the 15 s spawn timeout, so a hung child fails with its own error.
describe('guard scripts run as child processes', { timeout: 20000 }, () => {
  const commitMsgScript = fileURLToPath(
    new URL('../.githooks/check-commit-msg.mjs', import.meta.url),
  );
  const preCommitScript = fileURLToPath(
    new URL('../.githooks/check-pre-commit.mjs', import.meta.url),
  );
  /** @type {string} */
  let dir;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'hooks-test-'));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** Runs a script with no shell, so quoting is the same on every platform. */
  const run = (script, args) =>
    spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd: dir, timeout: 15000 });

  /** Writes a commit message to a temp file and runs the commit-message guard on it. */
  const runCommitMsg = (message) => {
    const file = join(dir, 'COMMIT_EDITMSG');
    writeFileSync(file, message);
    return run(commitMsgScript, [file]);
  };

  it('commit-msg guard exits 0 for a clean message', () => {
    expect(runCommitMsg('feat(sim): add lane keeping\n').status).toBe(0);
  });

  it.each(FORBIDDEN_LINES)('commit-msg guard exits 1 for %s', (_name, line) => {
    const result = runCommitMsg(`feat: add x\n\n${line}\n`);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Commit rejected/);
  });

  it('commit-msg guard exits 1 for a forbidden line with Windows line endings', () => {
    expect(runCommitMsg(`feat: add x\r\n\r\n${FORBIDDEN_LINES[0][1]}\r\n`).status).toBe(1);
  });

  it('commit-msg guard exits 2 when no message file is given', () => {
    expect(run(commitMsgScript, []).status).toBe(2);
  });

  it('pre-commit guard exits 0 for allowed paths', () => {
    expect(
      run(preCommitScript, ['--files', 'src/car.js', 'README.md', 'docs/TASKS.md']).status,
    ).toBe(0);
  });

  it('pre-commit guard exits 0 when no paths are given', () => {
    expect(run(preCommitScript, ['--files']).status).toBe(0);
  });

  it.each(BLOCKED_PATHS)('pre-commit guard exits 1 for %s', (_name, root, nested) => {
    expect(run(preCommitScript, ['--files', root]).status).toBe(1);
    expect(run(preCommitScript, ['--files', nested]).status).toBe(1);
  });

  it('pre-commit guard exits 1 for a Windows backslash path and lists it', () => {
    const path = `.${vendor}\\settings.json`;
    const result = run(preCommitScript, ['--files', path]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Commit rejected/);
    expect(result.stderr).toContain(path);
  });
});
