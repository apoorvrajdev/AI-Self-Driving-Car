# Tasks

The task board for the project. One task is `in-progress` at a time. Each task is small enough to review as
one change and has acceptance criteria that can be checked with evidence.

**Statuses:** `todo` → `in-progress` (branch open) → `done`. `review` is used
only while a pull request waits for an owner check; a normal task goes straight from `in-progress` to `done`.
`blocked` = stopped, reason in the Log.
A task becomes `done` in the pull request that delivers it (the status is set in the branch's last commit and
takes effect when the pull request merges).
`in-progress` and `review` exist only on the task branch; `main` shows `todo`, `blocked` or `done`.

## Current phase: 2 — Restructure without changing behaviour

Turn the baseline into ES modules with a DOM-free simulation core, one seeded generator passed in explicitly,
a fixed tick and a headless runner. The restructured code must reproduce the golden fixtures exactly after every
commit (ADR-0008, ADR-0010, ADR-0011, ADR-0012). No new driving features.

**Gate (owner signs off):**

- [ ] `baseline/` holds the 11 original files, and a test checks them against the T-001 hash table
- [ ] `src/` is ES modules; no file in `src/sim/` uses the DOM or `Math.random`, enforced by lint and a test
- [ ] The golden replay passes against the restructured core (`createWorld`), not only against `baseline/`,
      locally (Windows, Node 24) and in CI (Linux, Node 22)
- [ ] The page runs 60 ticks per second whatever the display rate, and `/?seed=1&ticks=1001` shows the
      `seed-1` metrics (OWNER-CHECK)
- [ ] `npm run sim` reproduces the metrics of all four golden scenarios; its runtime is recorded
- [ ] Every test task passed a mutation check
- [ ] ARCHITECTURE.md describes the Phase 2 structure; ADR-0011 and ADR-0012 accepted or revised

## Phase 1 — Understand and measure the baseline

Explain the original simulation, run it headless and unchanged, and record reference runs that the Phase 2
restructure must reproduce (ADR-0008, ADR-0010). `src/` stays byte-identical throughout.

**Gate (owner signs off): signed by the owner on 2026-11-20**

- [x] `docs/baseline-walkthrough.md` is read by the owner, who can explain the frame loop with it (2026-11-14)
- [x] The headless harness runs the unmodified baseline; `src/` hashes still equal the T-001 table
- [x] Golden fixtures are recorded, and the replay test is green locally (Windows, Node 24) and in CI (Linux,
      Node 22)
- [x] `docs/baseline-metrics.md` records distance, crashes and runtime for every recorded scenario
- [x] Every test task passed a mutation check (learned rule, 2026-11-08)
- [x] ADR-0010 accepted or revised

## Phase 0 — Foundation

**Gate (owner signs off): signed by the owner on 2026-11-09**

- [x] The original simulation runs from `npm run dev` exactly as the original `index.html` does
- [x] `src/` files are byte-identical to upstream (hash table recorded in the Log)
- [x] `npm run check` is green locally and in CI
- [x] Every commit is authored by the owner, with no co-author trailers; merge commits created by GitHub may show GitHub as committer
- [x] ADR-0007 and ADR-0008 accepted or revised

## Board

Phase 0 gate: signed by the owner on 2026-11-09. Phase 1 gate: signed by the owner on 2026-11-20 (T-101 to
T-103 are done). Phase 2 is planned as T-201 to T-206, with T-204 split into T-204a and T-204b, and with
ADR-0011 and ADR-0012 proposed.

`main` is protected by the `protect-main` ruleset: `lint and test` is a required check, so a pull request
cannot merge until it is green.

| ID | Title | Phase | Status | Depends on |
| --- | --- | --- | --- | --- |
| T-000 | Reference corpus | 0 | done | — |
| T-001 | Import baseline, licence and notice | 0 | done | T-000 |
| T-002 | Tooling: package.json, dev server, tests, lint | 0 | done | T-001 |
| T-003 | Characterization tests: utils and network | 0 | done | T-002 |
| T-004 | Tests for the commit guards | 0 | done | T-002 |
| T-005 | Continuous integration | 0 | done | T-003, T-004 |
| T-006 | README and setup guide | 0 | done | T-002 |
| T-101 | Baseline walkthrough document | 1 | done | T-001 |
| T-102 | Headless harness for the unmodified baseline | 1 | done | T-003 |
| T-103 | Baseline metrics and golden trajectories | 1 | done | T-102 |
| T-201 | Freeze the baseline in `baseline/` | 2 | done | T-103 |
| T-202 | ES modules, behaviour unchanged | 2 | todo | T-201 |
| T-203 | One seeded generator, passed in explicitly | 2 | todo | T-202 |
| T-204a | DOM-free world core | 2 | todo | T-203 |
| T-204b | Render layer and page code | 2 | todo | T-204a |
| T-205 | Fixed time step in the browser | 2 | todo | T-204b |
| T-206 | Headless runner | 2 | todo | T-204a |

---

### T-000 — Reference corpus

- **Status:** done (2026-11-05)
- **Goal:** Read-only clones of the original repositories in `reference/` (gitignored), used as the retrieval
  corpus for how the original code works.
- **Result:** `reference/self-driving-car` at `8b8723685bb4ab94cf504998466b6c337c35335c`;
  `reference/virtual-world` at `b9482cf3ec387c9d46b0b7c7a5976e85e91d0f72`. Plain file copies of a clone made with
  `core.autocrlf=false` (no `.git` inside); the commit hash is in each folder's `UPSTREAM_COMMIT.txt`.
  Note: the upstream files use CRLF line endings.

### T-001 — Import baseline, licence and notice

- **Status:** done (2026-11-08) — criteria 1 and 2 verified 2026-11-05; criterion 3 (OWNER-CHECK) confirmed by
  the owner: `src/index.html` opened in the browser on 2026-11-07 and worked
- **Goal:** `src/` contains the 11 files of `9. Fine-tuning`, byte-identical, with correct credit.
- **Context:** `reference/self-driving-car/9. Fine-tuning/`, `reference/self-driving-car/LICENSE`,
  `reference/self-driving-car/README.md`, DECISIONS ADR-0001 and ADR-0006.
- **Deliverables:**
  - `src/`: car.js, car.png, controls.js, index.html, main.js, network.js, road.js, sensor.js, style.css,
    utils.js, visualizer.js — copied, not retyped.
  - `LICENSE`: MIT text with `Copyright (c) 2022 Radu Mariescu-Istodor` and `Copyright (c) 2026 Apoorv Raj`.
  - `NOTICE.md`: source repository, folder, commit hash (T-000), import date, licence, link to the course
    playlist from the original README; a "Third-party components" section.
- **Acceptance criteria:**
  1. SHA-256 of all 11 files in `src/` equals the reference files (upstream uses CRLF; keep it unchanged).
  2. `LICENSE` and `NOTICE.md` exist with the content above.
  3. Opening `src/index.html` in Chrome shows one controlled car, traffic, sensor rays and the network panel (OWNER-CHECK).
- **Owner commit:** `chore: import baseline from gniziemazity/self-driving-car (MIT)` — `src/`, `LICENSE`,
  `NOTICE.md` only.

### T-002 — Tooling: package.json, dev server, tests, lint

- **Status:** done (2026-11-08) — criteria 1, 3 and 4 verified; criterion 2 (OWNER-CHECK) confirmed by the
  owner: `npm run dev` at localhost:5173 showed the road, traffic, sensor rays and network panel, same as the
  direct `index.html` view
- **Goal:** Standard commands for running, testing and linting, without touching `src/`.
- **Context:** ARCHITECTURE §5, ADR-0002, `.gitignore`, `.gitattributes`.
- **Deliverables:** `package.json` (`"private": true`, `"type": "module"`, `"engines": {"node": ">=20"}`;
  scripts `dev`, `test`, `lint`, `format`, `check`; no `build` yet), exact-pinned devDependencies vite, vitest,
  eslint, @eslint/js, globals, prettier; `package-lock.json`; `vite.config.js` (root `src`);
  `eslint.config.js` (lints config files, `tests/`, `.githooks/*.mjs`; ignores `src/` until Phase 2);
  `.prettierrc`, `.prettierignore` (excludes `src/`, `.githooks/`, lockfile); `.editorconfig`.
- **Acceptance criteria:**
  1. `npm install` succeeds from a clean checkout.
  2. `npm run dev` serves the unchanged simulation: one controlled car, traffic, sensor rays and the network
     panel, as `src/index.html` opened directly. The page loads 8 scripts and 1 stylesheet; `car.js` loads
     `car.png` (OWNER-CHECK).
  3. `npm run lint` passes; `npm run check` runs lint then tests.
  4. `src/` hashes unchanged.
- **Result:** pinned vite 8.3.6, vitest 4.1.12, eslint 10.14.0, @eslint/js 10.0.1, globals 17.14.0, prettier
  3.9.10 (all MIT). Vitest 5.1.0 needs Node 22.12 or newer, so 4.1.12 keeps `engines` at `>=20` (owner decision).
  `test` used `--passWithNoTests` until T-003 added tests (flag removed there). `format` covers config files and
  `tests/` only, so it never rewrites `README.md` or `docs/`.
  `src/visualizer.js` is UTF-16LE with a BOM; Vite cannot parse it, so `vite.config.js` has a small plugin that
  decodes it when served (`src/` unchanged). Remove it if Phase 2 re-encodes the file.
  Quirks: `eslint.config.js` turns off `no-useless-assignment` for `.githooks/*.mjs` (it flags
  `check-pre-commit.mjs:43`, which is owner-managed); `npm install` reports 4 moderate audit findings in
  dev-only eslint packages (`npm audit --omit=dev` reports none); Vite serves `.js` with an inline source-map
  comment appended, so served bytes differ from `src/` (files on disk are byte-identical).

### T-003 — Characterization tests: utils and network

- **Status:** done (2026-11-08)
- **Goal:** Pin the current behaviour of the pure parts of the baseline before anything changes.
- **Context:** `src/utils.js`, `src/network.js`, ARCHITECTURE §2 and §6.
- **Deliverables:** `tests/helpers/loadLegacy.js` (loads legacy scripts into a Node `vm` context and returns
  named top-level functions and classes, without editing them); `tests/utils.test.js`; `tests/network.test.js`.
- **Acceptance criteria:**
  1. `lerp`; `getIntersection` for crossing (point and offset), parallel and non-touching segments;
     `polysIntersect` for overlapping and separate squares.
  2. `NeuralNetwork([5,6,4])` has 2 levels with correct shapes; `feedForward` returns 4 outputs, each 0 or 1,
     and 1 only when the weighted sum exceeds the bias; `mutate(net, 0)` changes nothing; `mutate(net, 1)`
     changes weights.
  3. Randomness is stubbed or seeded inside the context; tests pass 10 runs in a row.
  4. Quirks found are recorded in the Log, not fixed.
- **Result:** 32 tests in `tests/utils.test.js` and `tests/network.test.js`, loaded through
  `tests/helpers/loadLegacy.js`. The loader runs the unedited `src/` scripts in one `node:vm` context whose own
  `Math.random` is replaced by a seeded or sequence stub, so the host is untouched. Objects from the context
  belong to another realm, so tests compare numbers, lengths and JSON, not prototypes. The `--passWithNoTests`
  flag is removed from `npm test`. Quirks are in the Log.

### T-004 — Tests for the commit guards

- **Status:** done (2026-11-08)
- **Goal:** Prove the existing hooks in `.githooks/` behave as intended (the hooks themselves are owner-managed
  and not edited).
- **Context:** `.githooks/check-commit-msg.mjs`, `.githooks/check-pre-commit.mjs`, ADR-0006.
- **Deliverables:** `tests/hooks.test.js`.
- **Acceptance criteria:**
  1. `findViolations` rejects one sample for every forbidden pattern defined in `check-commit-msg.mjs`
     (co-author trailer and each attribution pattern); accepts three normal Conventional Commits messages,
     one of which names a tool in plain prose.
  2. `blockedPaths` blocks one sample path for every rule defined in `check-pre-commit.mjs`, at the root and
     in a subfolder, plus a Windows backslash path; allows `src/car.js`, `README.md`, `docs/TASKS.md`.
  3. `emailFromIdent("A B <a@b.c> 1700000000 +0530")` returns `a@b.c`.
  4. Running each script as a child process gives exit code 1 for a rejected case and 0 for an accepted one.
- **Result:** 52 tests in `tests/hooks.test.js` (84 in the suite). The guards are imported in-process and run as
  child processes (`spawnSync`, no shell, a temp directory as working directory, pre-commit in its `--files`
  mode, so no test calls git or touches the repository). Samples that name a vendor are built from fragments at
  runtime, so the test file holds no literal vendor names (rule 2 of `CLAUDE.md`). The hooks are not edited.

### T-005 — Continuous integration

- **Status:** done (2026-11-08)
- **Goal:** Lint and tests run on every push and pull request.
- **Deliverables:** `.github/workflows/ci.yml` — ubuntu-latest, Node 22 with npm cache, `npm ci`,
  `npm run lint`, `npm test`; current major versions of the actions.
- **Acceptance criteria:** 1. The workflow file is valid YAML and mirrors `npm run check`.
  2. On the task's pull request, the CI run triggered by the `pull_request` event completes green
     (`gh pr checks <n>` shows every check passing) before the PR is merged.
- **Result:** `.github/workflows/ci.yml`, job `lint and test` (ubuntu-latest, Node 22, npm cache): `npm ci`,
  `npm run lint`, `npm test`, the same commands in the same order as `npm run check`, run as separate steps so a
  failure names its step. It runs on pull requests and on pushes to `main` only: ADR-0009 forbids direct pushes
  to `main`, and a trigger on every branch would run each PR commit twice. Permissions are `contents: read`;
  runs of a pull request are cancelled when a newer commit arrives, runs on `main` are not. Actions:
  `actions/checkout@v7` and `actions/setup-node@v7`. Criterion 2 was reworded from OWNER-CHECK to the PR flow;
  the merge waits for a green `gh pr checks`. Nothing in the repo enforces the gate: making `lint and test` a
  required status check is a repository setting for the owner.

### T-006 — README and setup guide

- **Status:** done (2026-11-09) — the owner confirmed the two OWNER-CHECK items: `git config core.hooksPath`
  prints `.githooks` and `git config authorguard.email` prints the owner's address, so the hook commands in
  `docs/setup.md` are correct; and the `npm run dev` render (road, traffic, sensor rays, network panel at
  localhost:5173) was seen on 2026-11-08
- **Goal:** A newcomer can understand and run the project in five minutes.
- **Deliverables:** `README.md` (what it is, status, quick start, short project tree, links to `docs/`,
  credits and licence, CI badge); `docs/setup.md` (prerequisites with detected versions, commands, enabling
  the hooks with `core.hooksPath` and `authorguard.email`).
- **Acceptance criteria:** 1. Every command in both files was run and works.
  2. Nothing ignored by git is listed in the project tree.
- **Result:** `README.md` (what it is, status, quick start, project layout, documentation links, credits and
  licence, CI badge) and `docs/setup.md` (prerequisites with detected versions Node 24.12.0, npm 11.6.2, Git
  2.52.0; install, run, test and lint commands; enabling the hooks). The npm commands were run in a clean
  `git archive` copy; the two `git config` commands were run by the owner. The hook files are not marked
  executable, so Git would skip them on Linux or macOS; `setup.md` says so and `.githooks/` is not edited.

### T-101 — Baseline walkthrough document

- **Status:** done (2026-11-14) · **Phase 1**
- **Goal:** `docs/baseline-walkthrough.md` explains each baseline file and the frame loop in plain language,
  with `path:line` references, so the owner can explain every part in an interview.
- **Context:** `src/*.js`, `src/index.html`, ARCHITECTURE §2 and §6, the T-003 and T-004 quirks in the Log,
  `tests/utils.test.js`, `tests/network.test.js`.
- **Deliverables:**
  - `docs/baseline-walkthrough.md`:
    - one section per file, in `index.html` load order (`visualizer.js`, `network.js`, `sensor.js`,
      `utils.js`, `road.js`, `controls.js`, `car.js`, `main.js`), plus `index.html` and `style.css` briefly
    - the frame loop step by step, following `main.js` `animate`
    - the path from sensor readings to network outputs to controls to movement
    - the learning cycle (save, discard, mutate on reload)
    - coordinates and units
    - the known quirks, linked to the Log rather than repeated
    - a short glossary
  - ARCHITECTURE §2 corrected wherever the walkthrough shows it is wrong or stale (for example "no tests" under
    Known limitations).
- **Acceptance criteria:**
  1. Every baseline file has a section, and the frame-loop section follows the order of statements in `animate`.
  2. Every `path:line` reference points at the code the sentence describes. The verifier checks every one with
     a throwaway script and lists any mismatch.
  3. No statement contradicts the code or a characterization test. Each numeric constant quoted (speeds,
     ray count, network shape, mutation amount) matches the source.
  4. The owner reads the document and confirms they can explain the frame loop with it (OWNER-CHECK).
     Confirmed by the owner on 2026-11-14.
- **Verification:** verifier reference check (criterion 2) plus a constants table checked against `src/`;
  reviewer reads for accuracy and plain language; `npm run check` green.
- **Branch and commits:** `docs/t-101-baseline-walkthrough`; `docs(baseline): add baseline walkthrough`,
  `docs(architecture): correct the baseline section` (only if §2 needs it), `docs(tasks): complete T-101`.
- **Size:** about 250 to 350 lines of prose; no code.

### T-102 — Headless harness for the unmodified baseline

- **Status:** done · **Phase 1**
- **Goal:** Run the original `src/` code in Node with stubbed canvas, image, `localStorage` and a seeded
  `Math.random`, stepping `animate` a fixed number of times — without editing `src/`.
- **Context:** `src/index.html` (load order), `src/main.js`, `src/car.js`, `src/sensor.js`, `src/controls.js`,
  `src/visualizer.js` (UTF-16LE with BOM), `tests/helpers/loadLegacy.js`, `vite.config.js` (UTF-16 decoding),
  ADR-0008, ADR-0010.
- **Deliverables:**
  - `tests/helpers/headless.js` (`// @ts-check`, JSDoc): `createBaselineSim({ seed, savedBrain })`.
    - Loads the eight scripts in `index.html` order into one `node:vm` context. `visualizer.js` is decoded
      from UTF-16LE when it starts with a byte-order mark; other files are read as UTF-8.
    - Stubs, all inside the context:
      - `document.getElementById` and `document.createElement('canvas')` return canvas stubs.
      - A canvas stub has `width`, `height` and `getContext('2d')`. The context stub has no-op drawing
        methods, assignable properties and a `canvas` back-reference, which `visualizer.js` reads.
      - `Image` never fires `onload`; the mask only affects drawing.
      - `localStorage` is in memory and can be pre-loaded with `bestBrain`.
      - `window.innerHeight` is fixed at 800.
      - `requestAnimationFrame` stores the callback without scheduling it.
    - `Math.random` is Mulberry32 seeded with `seed` (reused from `loadLegacy.js`).
    - Returns:
      - `step(n)`: calls the stored `animate` callback `n` times; one call is one tick, with a timestamp of
        `tick × 1000/60` ms.
      - `state()`: a plain JSON snapshot with `tick`, the index of the best car, every AI car's `x`, `y`,
        `angle`, `speed` and `damaged`, every traffic car's state, and the best car's brain.
      - `save()` and `discard()`: call the page's own functions.
      - `storage`: the localStorage stub.
      - Test hooks: `canvases` (every canvas stub the page created; owner-approved 2026-11-14) and `brains()`
        (the brain of every AI car, needed for criterion 5).
    - Top-level `const` and `let` values in `main.js` (`cars`, `traffic`, `bestCar`) are read by evaluating
      their names in the context.
  - `loadLegacy.js` may share the reader and the generator with the harness, but the T-003 tests stay
    unchanged and green.
  - `tests/headless.test.js`.
  - The provenance and licence of Mulberry32 are confirmed by the researcher with a source, and recorded in
    `NOTICE.md` (it is already used since T-003).
- **Acceptance criteria:**
  1. The harness runs all eight baseline scripts unedited, and the `src/` hashes still equal the T-001 table.
  2. At tick 0 there are 100 AI cars at the centre of lane 1 with `y = 100`, and 7 traffic cars at the lanes
     and `y` values written in `main.js` (lines 24 to 32), each advanced by the one update that `main.js`
     itself performs at load (`y` less 0.15, speed 0.15). Tick 0 means "after load" (owner decision,
     2026-11-14).
  3. `step(n)` advances exactly `n` ticks. After 100 ticks, a traffic car's `y` and `speed` equal an independent
     calculation in the test, written from the movement rules in `car.js` (`#move`), not taken from the harness.
  4. The same seed gives identical `state()` JSON after 500 ticks; seeds 1 and 2 give different brains.
  5. Pre-loading `bestBrain`: car 0's brain equals it exactly, and every other car's differs (`mutate`, 0.1).
     `save()` writes the best car's brain to the stub, and `discard()` removes it.
  6. The host is untouched: `globalThis.Math.random` is unchanged, and `document`, `window`, `localStorage`
     and `Car` stay undefined in the host.
  7. The time for 1,000 ticks is measured and recorded in the Log, with no threshold set.
  8. Mutation check: the verifier applies at least five mutations in scratch copies (off-by-one in `step`,
     traffic not updated, a wrong load order, the seed ignored, `onload` fired), and the tests catch every one.
  9. Mulberry32's licence is confirmed with a cited source, and `NOTICE.md` is updated.
- **Verification:** `npm run check` green, run 10 times in a row; the mutation table (criterion 8); a hash
  check of `src/`.
- **Branch and commits:** `test/t-102-headless-harness`; `test(harness): run the unmodified baseline
  headless`, `docs(notice): record Mulberry32 provenance`, `docs(tasks): complete T-102`.
- **Size:** about 150 lines of harness and 150 lines of tests.

### T-103 — Baseline metrics and golden trajectories

- **Status:** done · **Phase 1**
- **Goal:** Record, for fixed seeds, the best car's distance, crash count and per-tick positions as JSON
  fixtures. These become the golden reference for the Phase 2 restructure (ADR-0008).
- **Context:** `tests/helpers/headless.js` (T-102), ADR-0008 (including its revisit note), ADR-0010,
  `.github/workflows/ci.yml`, `tests/helpers/loadLegacy.js`, `NOTICE.md`, `README.md` (lines 81 and 106).
- **Deliverables:**
  - First commit of the task, before any golden run is recorded: rewrite `makeSeededRandom` in
    `tests/helpers/loadLegacy.js` from the CC0 C original (Tommy Ettinger's `mulberry32.c`), so that its
    licence is verifiable (owner decision, 2026-11-14; T-102 criterion 9 was accepted with the JavaScript form
    unverified). A test, or a script run once and shown in the PR, proves that the new function returns
    exactly the same numbers as the current one for several seeds (at least 0, 1, 2, 3, 7 and 4294967295, the
    first 10,000 outputs each). Then update `NOTICE.md`: licence CC0 1.0 for the function, and remove the
    "not verified" wording. The T-003 and T-102 tests stay unchanged and green. The pre-existing line-ending
    changes in `loadLegacy.js` are checked first (`git diff --ignore-cr-at-eol`) and are not mixed into this
    commit.
  - In the closing pull request of this task: update the stale test counts in `README.md` (line 81, "32
    characterization tests: utils (14) and network (18)", and line 106, which lists only a loader for the
    legacy scripts) so that they describe the current tests, including the headless harness tests, with the
    counts taken from a fresh `npm test` run.
  - Four scenarios of 1,000 ticks each:
    - `seed-1`, `seed-2`, `seed-3`: fresh random brains
    - `seed-4-gen2`: the best brain saved at the end of `seed-1`, pre-loaded as `bestBrain` (the original
      learning loop, one generation on)
  - `tests/golden/record.mjs` and the npm script `golden:record`. It writes `tests/golden/<scenario>.json` with:
    - `meta`: format version, upstream commit, seed, tick count, the Node version used to record
    - per tick: the best car's index, `x`, `y`, `angle`, `speed` and `damaged`, and the number of crashed AI cars
    - at the final tick: the full state of all AI cars and traffic cars
    - `metrics`: best distance in pixels (100 − the best car's `y`), crashed and surviving AI cars
  - The recorder rejects `NaN` and infinities (ADR-0010).
  - `tests/golden.test.js` replays each scenario through the harness and compares every number exactly. On a
    mismatch it reports the first tick, car and field that differ.
  - `docs/baseline-metrics.md`: a table per scenario with best distance, crashes, survivors and runtime for
    1,000 ticks, plus how to re-record and when that is allowed (ADR-0010).
  - ARCHITECTURE §5 lists `tests/golden/`.
- **Acceptance criteria:**
  1. The four fixtures exist, are produced only by `npm run golden:record`, and the test never writes them.
  2. The replay test is green locally (Windows, Node 24) and in CI (Linux, Node 22) on the task's pull request.
     If the two disagree, stop: set the task to `blocked`, record the first divergence, and revisit ADR-0010
     and ADR-0008 with the owner.
  3. Mismatch reporting works: on a scratch copy with a deliberately changed fixture value, the failure message
     names the scenario, tick, car and field.
  4. Mutation check: on scratch copies of `src/` (never the repository's `src/`), the replay fails when
     `friction` in `car.js` changes from 0.05 to 0.0500001, when the ray count changes, and when `mutate` uses
     0.11 instead of 0.1.
  5. The numbers in `docs/baseline-metrics.md` equal the `metrics` in the fixtures, checked by a script.
  6. The fixtures add less than 1 MB in total, and `src/` hashes are unchanged.
  7. The rewritten `makeSeededRandom` returns exactly the same numbers as the T-102 version (the seeds and
     length in the first deliverable), shown before the commit that records fixtures; `NOTICE.md` no longer
     says the licence is unverified, and the researcher's source for the C original is cited again.
  8. `README.md` test counts and the `tests/` description match a fresh `npm test` run.
- **Verification:** `npm run check` green; `gh pr checks` green on Node 22; the mutation and mismatch tables;
  fixture sizes; the equivalence output for criterion 7.
- **Branch and commits:** `test/t-103-golden-trajectories`; `test(harness): rewrite makeSeededRandom from the
  CC0 original`, `docs(notice): record the CC0 source of makeSeededRandom`, `test(golden): add recorder and
  replay test`, `test(golden): record baseline fixtures`, `docs(metrics): add baseline metrics`,
  `docs(readme): update the test description`, `docs(tasks): complete T-103`.
- **Size:** about 100 lines for the recorder, 120 for the test and 60 for the metrics doc; generated fixtures
  are not counted.

---

### T-201 — Freeze the baseline in `baseline/`

- **Status:** done · **Phase 2**
- **Goal:** Keep a byte-identical copy of the 11 original files in `baseline/`, so the harness, the
  characterization tests, the recorder and the walkthrough keep a fixed reference while `src/` is restructured
  (ADR-0011).
- **Context:** ADR-0010, ADR-0011, the T-001 hash table, `.gitattributes`, `tests/helpers/headless.js`,
  `tests/headless.test.js` (reads `src/` directly), `tests/helpers/loadLegacy.js`, `tests/golden/record.mjs`,
  `tests/golden.test.js` (`GOLDEN_SRC_DIR`),
  `eslint.config.js`, `.prettierignore`, `vite.config.js`, `package.json`, `NOTICE.md`, `README.md`,
  `docs/setup.md`, `docs/baseline-walkthrough.md`, ARCHITECTURE §5.
- **Deliverables:**
  - `.gitattributes`: add `baseline/** -text`. Owner-managed: the owner approves the line in the session. It is
    its own commit and comes before the files, because `* text=auto` would otherwise store them with LF.
  - `baseline/`: the 11 files of `reference/self-driving-car/9. Fine-tuning/`, copied, not retyped. The same
    commit makes `eslint.config.js` and `.prettierignore` ignore `baseline/**`; otherwise `eslint .` would lint
    the classic scripts and fail on the UTF-16 `visualizer.js`.
  - The headless harness, `loadLegacy`, the recorder and the golden replay load from `baseline/` by default,
    named by one exported constant. `srcDir` and `GOLDEN_SRC_DIR` keep working for scratch copies.
  - `tests/headless.test.js` reads `baseline/` instead of `src/` (its hash, byte-order-mark, script-order and
    traffic-position tests), so later changes to `src/` cannot break it.
  - Its hash test moves to `tests/baseline-hashes.test.js` and also checks that `baseline/` holds exactly the 11
    files. The T-001 table stays in one place in the tests, not two.
  - The npm script `dev:baseline` serves `baseline/` with Vite; the UTF-16 plugin in `vite.config.js` stays
    for it.
  - `docs/baseline-walkthrough.md`: every `src/<file>:<line>` reference becomes `baseline/<file>:<line>`. The
    line numbers stay, because the files are identical.
  - `NOTICE.md` (where the unmodified copy lives; `src/` is derived and will change), `README.md`,
    `docs/setup.md`, ARCHITECTURE status line and §5 (`baseline/` row).
- **Acceptance criteria:**
  1. All 11 files in `baseline/` have the size and SHA-256 of the T-001 table, checked by the new test. `src/`
     is not changed by this task, and its hashes still equal the table.
  2. `git ls-files --eol baseline/` shows the 9 files other than `car.png` and `visualizer.js` as `i/crlf`, and
     those two as `i/-text`, as for `src/` today, so a fresh clone gets the same bytes.
  3. Every existing test still passes, and the harness, the characterization tests and the replay demonstrably
     read `baseline/`: in a scratch copy of the repository, changing `friction` in `src/car.js` leaves
     `npm test` green, and the same change in `baseline/car.js` fails the replay and the hash test.
  4. The T-101 reference check is re-run against `baseline/` with no mismatch, and no `src/<file>:<line>`
     reference remains in the walkthrough.
  5. `npm run dev:baseline` serves the original page: `/`, `/visualizer.js` and `/main.js` return 200
     (verifier), and the owner sees the same page as with `npm run dev` (OWNER-CHECK).
  6. Mutation check: the hash test fails for a one-byte change, a missing file and an extra file, each in a
     scratch copy of `baseline/`.
- **Verification:** `npm run check` green; the hash output; `git ls-files --eol`; the scratch-copy results for
  criteria 3 and 6; the reference-check script output.
- **Branch and commits:** `chore/t-201-freeze-baseline`; `chore(git): store baseline/ byte for byte`,
  `chore(baseline): freeze a copy of the original in baseline/` (with the lint and Prettier ignores),
  `test(baseline): load the baseline from baseline/ and check its hashes`, `build(dev): serve the frozen
  baseline`, `docs(baseline): point the references at baseline/`, `docs(tasks): complete T-201`.
- **Size:** about 40 lines of test and 30 of helper, config and script changes, plus the walkthrough path edits;
  the 11 copied files are not counted.

### T-202 — ES modules, behaviour unchanged

- **Status:** todo · **Phase 2**
- **Goal:** `src/` becomes ES modules served by Vite, formatted and linted like the rest of the repository, and
  still reproduces every golden fixture exactly.
- **Context:** `src/*.js`, `src/index.html`, `baseline/` (T-201), `tests/helpers/headless.js`,
  `tests/helpers/golden.js`, `tests/golden.test.js`, `tests/helpers/loadLegacy.js`, `tests/utils.test.js`,
  `tests/network.test.js`, `eslint.config.js`, `.prettierignore`, `.gitattributes`, `vite.config.js`,
  ADR-0010, ADR-0011, the Vitest 4 notes in the Log (2026-11-20, Phase 2 planning).
- **Deliverables:**
  - First commit: `src/visualizer.js` is re-encoded from UTF-16LE with a byte-order mark to UTF-8 without one,
    keeping its four arrow characters. Prettier and `espree` read UTF-8 only, so this comes before formatting.
  - Second commit, mechanical: Prettier formats `src/*.js` with LF line endings, and `.prettierignore` stops
    excluding `src/`. Nothing else changes. Before each of these two commits, the replay runs against the
    classic scripts in `src/` (`GOLDEN_SRC_DIR=src`) and passes.
  - Third commit: `.gitattributes` drops `src/** -text`, so new files in `src/` are normalised like the rest of
    the repository. Owner-managed: the owner approves it in the session. It comes after formatting, so no file
    is renormalised.
  - `src/` modules:
    - Every file exports its classes and functions and imports what it uses; no implicit globals.
    - `index.html` loads one `<script type="module" src="main.js">`. The save and discard buttons are wired
      with `addEventListener`, because the inline `onclick` needs globals.
    - Statements and arithmetic are otherwise unchanged. `main.js` still runs at import, as the page does, and
      exports `cars`, `traffic`, `bestCar`, `save` and `discard`.
  - `tests/helpers/moduleSim.js`, a bridge that T-204b removes:
    - Imports `src/main.js` afresh for each run: `vi.resetModules()`, then a dynamic import, which the Vitest 4
      docs say re-evaluates the module. An optional `srcDir` loads a scratch copy.
    - Stubs `document`, `window`, `localStorage`, `Image` and `requestAnimationFrame` with `vi.stubGlobal`, and
      replaces `Math.random` with `makeSeededRandom(seed)` through `vi.spyOn`. Everything is restored after
      each run.
    - Offers the same `step`, `state`, `brains`, `save` and `discard` as `createBaselineSim`. `bestCar` is read
      through its export, a live binding.
  - The golden replay runs each scenario against `baseline/`, as now, and against `src/` through the bridge.
  - `tests/utils.test.js` and `tests/network.test.js` run every case against both `baseline/` (vm) and the
    `src/` modules, with `Math.random` stubbed and restored for the modules. A new case pins the start point
    lying on the other segment (offset exactly 0), for example `getIntersection({x:0,y:0}, {x:10,y:0},
    {x:0,y:-5}, {x:0,y:5})` gives offset 0, against both implementations.
  - `eslint.config.js` lints `src/**` with browser globals. A lint finding is fixed without changing
    behaviour, or listed for the owner.
  - `vite.config.js`: the UTF-16 plugin's comment says it is needed only for `baseline/`. `docs/setup.md`,
    `README.md` and the ARCHITECTURE status line are updated.
- **Acceptance criteria:**
  1. The formatting commit changes formatting only: a throwaway script parses each file before and after with
     `espree` (already installed with ESLint, not added to `package.json`), and the syntax trees are equal once
     positions and raw literal text are dropped. The replay against the formatted classic scripts is green.
  2. `index.html` loads exactly one module script; every `src/*.js` file uses `import` or `export` and passes
     `npm run lint`.
  3. The replay of all four scenarios is green against `src/` through the bridge and against `baseline/`,
     locally (Windows, Node 24) and in CI (Linux, Node 22).
  4. The utils and network characterization cases pass against both implementations.
  5. The bridge leaves the host as it found it: after a run, `Math.random` is the original function, and
     `document`, `window`, `localStorage`, `Image` and `requestAnimationFrame` are undefined again (test).
  6. `src/visualizer.js` is UTF-8 without a byte-order mark. After the re-encoding commit and before
     formatting, its text equals the decoded UTF-16 original exactly; after formatting, criterion 1 applies.
  7. Mutation check on scratch copies of `src/`: `friction` 0.0500001, ray count 4, `mutate` amount 0.11 in
     `main.js`, traffic not updated, and `getIntersection` with `t>0` instead of `t>=0`. Each makes the `src/`
     replay or a characterization case fail.
  8. `npm run dev` shows the same page as `npm run dev:baseline`. Save, then reload, keeps car 0's brain and
     mutates the others; discard removes it (OWNER-CHECK).
- **Verification:** `npm run check` green; `gh pr checks` green; the syntax-tree comparison output; the
  mutation table; the encoding check.
- **Branch and commits:** `refactor/t-202-es-modules`; `chore(src): store visualizer.js as UTF-8`,
  `style(src): format the baseline code with Prettier`,
  `chore(git): normalise line endings in src/`, `refactor(src): convert the simulation to ES modules`,
  `test(golden): replay the golden runs against the src/ modules`, `build(lint): lint src/`,
  `docs: describe the module structure`, `docs(tasks): complete T-202`.
- **Size:** about 60 lines of module wiring, 120 of bridge and test changes and 20 of config; the Prettier
  commit is mechanical and not counted.

### T-203 — One seeded generator, passed in explicitly

- **Status:** todo · **Phase 2**
- **Goal:** All randomness in `src/` comes from one generator created from a seed and passed in explicitly. The
  page takes `?seed=`, so a run can be repeated (ADR-0008, ADR-0012).
- **Context:** `src/network.js`, `src/utils.js`, `src/car.js`, `src/main.js`, `tests/helpers/loadLegacy.js`
  (`makeSeededRandom`), `tests/mulberry32.test.js`, `tests/helpers/moduleSim.js`, `NOTICE.md`, ADR-0012.
- **Deliverables:**
  - `src/sim/rng.js` (`// @ts-check`, JSDoc), the first file of the core:
    - `createRng(seed)` returns a function giving numbers in [0, 1): Mulberry32 from the CC0 C original, the
      same algorithm as `makeSeededRandom`.
    - `parseSeed(text)` returns an integer from 0 to 4294967295 written in decimal digits, or null otherwise.
  - `NeuralNetwork`, `Level`, `NeuralNetwork.mutate` and `getRandomColor` take the generator as an argument,
    and `Car` passes it to its brain. The draw order stays the baseline's: brains in car order (each level's
    weights row by row, then its biases), then the mutation of cars 1 to 99 when a brain is saved, then the
    seven traffic colours.
  - `main.js` takes the seed from `?seed=`, or else a random 32-bit seed from `crypto.getRandomValues`, and
    logs it to the console (the HUD comes in T-205).
  - The bridge passes the seed through a stubbed `location` instead of replacing `Math.random`, and spies on
    `Math.random` to prove it is never called.
  - The module side of the characterization tests passes a seeded or sequence generator.
  - `NOTICE.md`: `src/sim/rng.js` is CC0 1.0, from the same source as the test helper.
- **Acceptance criteria:**
  1. No `Math.random` anywhere in `src/` (a test scans the files), and the bridge's spy records zero calls in
     all four scenarios.
  2. The replay of all four scenarios is green against `src/` and `baseline/`, locally and in CI.
  3. `createRng` returns exactly the same numbers as `makeSeededRandom` for seeds 0, 1, 2, 3, 7 and 4294967295,
     the first 10,000 outputs each.
  4. `parseSeed` accepts `0`, `1` and `4294967295`, and rejects `''`, `-1`, `4294967296`, `1.5`, `1e3`, `abc`
     and `1` with a leading space, each covered by a test.
  5. The same seed gives identical brains and traffic colours; seeds 1 and 2 give different ones.
  6. Mutation check: a changed constant in `createRng`, mutation drawing weights before biases, colours drawn
     before brains, the generator not passed to one level, and `parseSeed` accepting a negative number. Each
     is caught.
  7. Opening `/?seed=1` twice shows the same traffic colours and the same car movement (OWNER-CHECK).
- **Verification:** `npm run check` green; `gh pr checks` green; the equivalence output for criterion 3; the
  mutation table.
- **Branch and commits:** `refactor/t-203-seeded-rng`; `feat(sim): add the seeded generator and seed parsing`,
  `refactor(src): pass the generator to every random draw`, `docs(notice): record the CC0 source of
  src/sim/rng.js`, `docs(tasks): complete T-203`.
- **Size:** about 60 lines of source and 120 of tests.

T-204 is split in two (owner decision, 2026-11-20). After T-204a the page still runs on the flat modules of
T-203, unchanged, while the new core is replayed against the goldens beside them. After T-204b the page runs on
the core and the flat modules are deleted. Between the two tasks the simulation logic exists twice in `src/`;
the same golden replay guards both copies, so they cannot drift apart unnoticed.

### T-204a — DOM-free world core

- **Status:** todo · **Phase 2**
- **Goal:** `src/sim/` holds the world state and its one-tick update with no DOM access, covered by unit tests,
  and the golden replay runs against it directly, with no stubs. The page is not changed (ADR-0007, ADR-0012).
- **Context:** `src/` after T-203, ARCHITECTURE §4 and §6, ADR-0010, ADR-0012, `tests/helpers/moduleSim.js`,
  `tests/helpers/golden.js`, `tests/golden.test.js`, `tests/utils.test.js`, `tests/network.test.js`,
  `docs/baseline-walkthrough.md` (frame loop and movement rules), `eslint.config.js`.
- **Deliverables:**
  - `src/sim/` (`// @ts-check`, JSDoc on every export):
    - `world.js`: `createWorld({ seed, savedBrain })` returns `step()`, `state()`, `tick`, and read access for
      the renderer. One `step()` does what `animate` does before drawing: update the traffic cars, update the
      AI cars, then select the best car (the first car with the smallest `y`).
    - `car.js` (movement, polygon, damage, sensor and brain update), `sensor.js` (rays and readings), `road.js`
      (lane centres and borders), `network.js`, `geometry.js` (`lerp`, `getIntersection`, `polysIntersect`),
      `controls.js` (the four flags; `DUMMY` drives forward), `rng.js` (T-203).
    - Names carry units (`speedPxPerTick`, `maxSpeedPxPerTick`, `accelerationPxPerTick2`,
      `frictionPxPerTick2`, `angleRad`, `rayLengthPx`). The arithmetic and its order are unchanged (ADR-0010).
    - Brains keep the baseline shape (`levels` of `inputs`, `outputs`, `biases` and `weights`), so brains
      saved by the original page still load and the fixture comparison of `bestBrain` holds.
    - A traffic car keeps its colour as data; the core has no `Image`, canvas or mask.
  - The golden replay calls `createWorld` directly, beside the existing replays against `baseline/` and
    against the flat modules through the bridge. Fixture tick n is world tick n + 1 (ADR-0012), and a small
    adapter maps the unit-named fields to the fixture's `x`, `y`, `angle`, `speed` and `damaged`.
  - The characterization cases also run against `src/sim/`. The runs against `baseline/` and the flat modules
    stay; T-204b removes the flat-module runs with the flat modules.
  - Unit tests of the core (`tests/sim-*.test.js`), with expected values worked out in the test from the
    movement rules, not taken from the code:
    - world: `createWorld` gives tick 0, best index 0 and all AI cars at `y = 100`; each `step()` adds one
      tick; traffic is updated before the AI cars; the best car is the first with the smallest `y`, damaged or
      not; the same seed gives the same state; with a saved brain, car 0 gets it exactly and the others differ
    - car: one tick from rest with forward gives speed `0 + 0.2 - 0.05` computed in the test, which is
      0.15000000000000002 in doubles, not 0.15; friction is applied after the cap, so with forward
      held the speed settles at the maximum minus friction (2.95 for an AI car), and in reverse at minus half
      the maximum plus friction (−1.45), both computed in the test; friction brings a small speed to 0; steering only acts while moving and is
      flipped in reverse; a damaged car stops moving, while its sensor and brain keep updating
    - sensor: 5 rays spread over 90°, a reading is the nearest touch, and nothing within 150 px gives null
    - road: the three lane centres, and an index above the last lane gives the last lane
  - `eslint.config.js`: `src/sim/**` has no browser globals and forbids `Math.random`
    (`no-restricted-properties`).
  - ARCHITECTURE §4 (as in ADR-0012) and §6 (units).
- **Acceptance criteria:**
  1. The replay of all four scenarios is green against `createWorld`, against the flat modules (bridge) and
     against `baseline/`, locally and in CI, with no global stubbed on the `createWorld` side.
  2. The core is DOM-free: `src/sim/world.js` imports and runs in Node with no stubs; on a scratch copy,
     `npm run lint` fails when a file in `src/sim/` uses `document`, `window`, `localStorage`, `Image`,
     `requestAnimationFrame` or `Math.random`; no file in `src/sim/` imports from outside `src/sim/`.
  3. The unit tests above pass and each states the rule it checks.
  4. A brain saved by the baseline harness (`save()` on `baseline/`) loads into `createWorld` as car 0's brain
     unchanged, and a brain taken from the world has the same keys and shape.
  5. The page is unchanged: no file outside `src/sim/` in `src/` is modified, and `npm run dev` still serves it
     (verifier: `/` and `/main.js` return 200).
  6. Mutation check: at least six mutants on scratch copies of `src/sim/` (friction; ray count; traffic not
     updated; the last car with the smallest `y` chosen instead of the first; the sensor keeping the farthest
     touch; AI cars updated before traffic), each failing the replay or a unit test.
- **Verification:** `npm run check` green; `gh pr checks` green; the mutation table; the lint-failure output.
  If the plan estimates more than 400 hand-written lines, it is shown to the owner before implementing.
- **Branch and commits:** `refactor/t-204a-world-core`; `refactor(sim): extract the DOM-free world core` (with
  its replay, characterization cases and unit tests), `build(lint): keep the DOM and Math.random out of
  src/sim/`, `docs(architecture): describe the world interface and units`, `docs(tasks): complete T-204a`.
  Every commit leaves `npm run check` green.
- **Size:** about 400 to 450 lines of core once formatted, most of it moved code with renamed fields, and
  about 180 of tests. Expect the 400-line clause above to apply: the plan goes to the owner before any code.

### T-204b — Render layer and page code

- **Status:** todo · **Phase 2**
- **Goal:** The page runs on the world core: `src/render/` draws a world without changing it, `src/app/` is the
  browser entry, and the flat modules and the bridge are removed (ADR-0007, ADR-0012).
- **Context:** `src/` after T-204a, `src/sim/world.js`, ARCHITECTURE §2 and §5, ADR-0011, ADR-0012,
  `tests/helpers/moduleSim.js`, `tests/golden.test.js`, `README.md` (project tree).
- **Deliverables:**
  - `src/render/`: road, cars (the renderer caches one mask canvas per car), sensor rays, `visualizer.js` and
    `getRGBA`. Rendering reads the state and never writes it.
  - `src/app/main.js`: creates the world, the renderer and the save and discard buttons (`localStorage` key
    `bestBrain`, as before), and runs one `step()` and one draw per animation frame, as now; the fixed time
    step is T-205. Saving and discarding are small functions that take the storage and the world, so they can
    be tested with a stub. Keyboard driving (`KEYS`, unused by the page, as in the baseline) moves to
    `src/app/keyboard.js`. `index.html` loads `app/main.js`.
  - The flat modules of T-202 and T-203 and the bridge `tests/helpers/moduleSim.js` are deleted (planned
    removals), with the bridge replay. The replays against `createWorld` and `baseline/` stay.
  - ARCHITECTURE §2 (the baseline now lives in `baseline/`) and §5 (the final `src/` layout); the README
    project tree.
- **Acceptance criteria:**
  1. The replay of all four scenarios is green against `createWorld` and against `baseline/`, locally and in
     CI.
  2. Rendering never changes the state: drawing every tick of a 200-tick run on a stub context leaves
     `state()` equal, value by value, to the same run without drawing.
  3. Saving stores the best car's brain under `bestBrain`, and discarding removes it (test with a storage
     stub). The test first steps the world until the best car is not car 0 (seed 1 after 300 ticks), and
     asserts that, so saving car 0 by mistake cannot pass.
  4. No file in `src/` outside `src/sim/`, `src/render/` and `src/app/` remains, apart from `index.html`,
     `style.css` and `car.png`; nothing in `src/` or `tests/` imports a deleted file.
  5. Mutation check: two mutants in `src/render/` that write to the state, each caught by the test of
     criterion 2, and one in `src/app/` that saves car 0's brain instead of the best car's, caught by the test
     of criterion 3.
  6. `npm run dev` shows the same page as `npm run dev:baseline`; save, then reload, keeps car 0's brain and
     mutates the others, and discard removes it (OWNER-CHECK).
- **Verification:** `npm run check` green; `gh pr checks` green; the mutation table. If the plan estimates more
  than 400 hand-written lines, it is shown to the owner before implementing.
- **Branch and commits:** `refactor/t-204b-render-and-page`; `refactor(render): draw the world from its state`,
  `refactor(app): run the page from the world and the renderer` (`index.html`; removes the flat modules and
  the bridge), `docs(architecture): describe the Phase 2 layout`, `docs(tasks): complete T-204b`. Every commit
  leaves `npm run check` green.
- **Size:** about 150 lines of render and app code and 60 of tests.

### T-205 — Fixed time step in the browser

- **Status:** todo · **Phase 2**
- **Goal:** The page advances the world at 60 ticks per second of real time whatever the display's refresh
  rate, draws once per frame, and can be pinned to a seed and paused at a tick, so a browser run can be checked
  against a headless one (ADR-0012).
- **Context:** `src/app/main.js`, `src/sim/world.js`, ADR-0012, the research notes in the Log (2026-11-20,
  Phase 2 planning: Fiedler 2004; MDN `requestAnimationFrame`; WHATWG HTML §8.1.7.3).
- **Deliverables:**
  - `src/app/loop.js` (`// @ts-check`, pure, no DOM), a fixed-step scheduler written from the idea in "Fix Your
    Timestep!" (the article's snippets carry no licence, so none are copied):
    - given each frame's timestamp, it returns how many ticks to run; one tick is 1000/60 ms; the first frame
      only sets the time origin and runs no tick
    - elapsed time per frame is clamped to 250 ms, so a frame runs at most 15 ticks; time beyond the clamp is
      dropped, not caught up later. The first frame after a hidden tab (where `requestAnimationFrame` pauses)
      therefore runs 15 ticks, not thousands
    - the remainder below one tick carries over. Ticks are counted from the time origin (moved forward by any
      dropped time), not by summing frame times, so long runs do not drift. Compute them as
      `elapsedMs * 60 / 1000`, not `elapsedMs / (1000 / 60)`: in doubles `250 / (1000 / 60)` is
      14.999999999999998, while `250 * 60 / 1000` is exactly 15
  - `src/app/main.js` uses it and draws the latest state, without interpolation.
  - A HUD on the page: seed, world tick, best distance in px (100 − the best car's `y`), crashed and surviving
    cars, ticks per second over the last second, and whether a saved brain was loaded.
  - URL parameters `seed` (T-203) and `ticks` (pause when the world reaches that tick); an invalid value is
    ignored with a console warning. Parsing is a pure, tested function.
- **Acceptance criteria:**
  1. Scheduler tests with simulated timestamps, frame k at (k × 1000) / rate ms, frame 0 being the origin:
     - over 10 simulated seconds, rates of 30, 60, 120 and 144 Hz each give exactly 600 ticks
     - a 5-second gap gives 15 ticks in that frame, and the frames after it run at the normal rate (no catch-up)
     - no frame runs more than 15 ticks
     - frames 10 ms apart carry the remainder: they run 0 or 1 tick each, and 60 in 1,000 ms
  2. On the owner's display the HUD shows about 60 ticks per second; the owner notes the display's refresh
     rate (OWNER-CHECK).
  3. With no saved brain, `/?seed=1&ticks=1001` pauses at world tick 1001 and the HUD shows best distance
     2042.95, 24 crashed and 76 surviving, the `seed-1` fixture metrics (OWNER-CHECK). A test runs
     `createWorld` to tick 1001 and checks the same numbers.
  4. URL parsing tests cover valid and invalid `seed` and `ticks` values.
  5. Mutation check: at least five mutants in `loop.js` (no clamp; clamped time caught up later instead of
     dropped; the remainder dropped; the tick boundary off by one, for example `ceil` for `floor` or `>` for
     `>=`; the tick length wrong), each caught.
- **Verification:** `npm run check` green; `gh pr checks` green; the mutation table; the owner's HUD readings.
- **Branch and commits:** `feat/t-205-fixed-timestep`; `feat(app): add the fixed-step scheduler`,
  `feat(app): run the page at a fixed 60 ticks per second`, `feat(app): show a HUD and accept seed and tick
  parameters`, `docs(tasks): complete T-205`.
- **Size:** about 60 lines of scheduler, 80 of app and HUD, and 120 of tests.

### T-206 — Headless runner

- **Status:** todo · **Phase 2**
- **Goal:** `npm run sim` runs the core in Node, without a browser or a test harness, prints metrics as JSON,
  and loads and saves brains, so experiments (and Phase 4 training) can run faster than real time.
- **Context:** `src/sim/world.js`, `tests/helpers/golden.js` (`parseMetricsTable`),
  `tests/baseline-metrics.test.js`, `tests/hooks.test.js` (child-process pattern), `docs/baseline-metrics.md`,
  `eslint.config.js`, `package.json`, ADR-0012, ARCHITECTURE §5.
- **Deliverables:**
  - `tools/sim.mjs` (`// @ts-check`) and the npm script `sim`:
    - options: `--seed <n>` (default 1); `--ticks <n>` world ticks (default 1000; a golden run is 1,001 world
      ticks, ADR-0012); `--brain <file>` (a saved brain, the page's `bestBrain` JSON); `--save-brain <file>`
      (the best brain at the end); `--help`
    - output: one JSON line with `seed`, `ticks`, `bestDistancePx`, `crashedCars`, `survivingCars`,
      `runtimeMs`, `ticksPerSecond` and `node`
    - bad arguments print the usage and exit with code 2; argument parsing is a pure, tested function
  - `tests/sim-cli.test.js`: child-process runs (`spawnSync`, no shell). Brain files are written only to a
    temporary directory, never to `tests/golden/`.
  - `docs/baseline-metrics.md`: a second table with the runner's runtime per scenario beside the harness
    runtime, measured, with no threshold. `parseMetricsTable` in `tests/helpers/golden.js` reads every row
    that starts with ``| ` `` and has five cells, so the new table's rows must not start that way, or the
    parser and `tests/baseline-metrics.test.js` are updated in the same commit.
  - `eslint.config.js`: a block for `tools/**` with Node globals.
  - ARCHITECTURE §5 lists `tools/`; the README commands table lists `npm run sim`.
- **Acceptance criteria:**
  1. For `seed-1`, `seed-2` and `seed-3`, `--ticks 1001` prints the fixture's `bestDistancePx`, `crashedCars`
     and `survivingCars` exactly.
  2. `--seed 1 --ticks 1001 --save-brain <tmp>` writes a brain equal to the `seed-1` fixture's `bestBrain`, and
     `--seed 4 --ticks 1001 --brain <that file>` prints the `seed-4-gen2` metrics: the original learning loop,
     run headless.
  3. Two runs with the same arguments print identical JSON apart from `runtimeMs` and `ticksPerSecond`.
  4. An unknown option, a missing value, a seed or tick count that is not an integer in range, and a missing or
     malformed brain file each exit with code 2 and a message naming the problem; `--help` exits with 0.
  5. The runtime of each scenario is measured and recorded in `docs/baseline-metrics.md` and the Log, next to
     the harness runtime, with no threshold.
  6. Mutation check: at least five mutants (the seed ignored; one tick too many or too few; the brain not
     loaded; crashed and surviving swapped; exit code 0 on bad arguments), each caught.
- **Verification:** `npm run check` green; `gh pr checks` green; the CLI outputs for criteria 1 to 3; the
  mutation table.
- **Branch and commits:** `feat/t-206-headless-runner`; `feat(tools): add the headless runner`,
  `docs(metrics): record the runner runtime`, `docs(tasks): complete T-206`.
- **Size:** about 120 lines of runner, 120 of tests and 20 of docs.

---

## Later phases (broken into tasks at each gate)

| Phase | Epic |
| --- | --- |
| 3 | virtual-world road graph, kinematic bicycle model, traffic lights, IDM/MOBIL traffic, pedestrians, scenario files |
| 4 | Parallel headless evolution with real fitness; imitation learning in PyTorch; ONNX in the browser |
| 5 | Synthetic camera, detector, light classifier, tracking, prediction, planner, safety supervisor, control |
| 6 | Scenario suite, metrics, driver comparison study |
| 7 | Profiling, spatial index, workers, live demo, write-up |

## Log

| Date | Task | Event | Evidence |
| --- | --- | --- | --- |
| 2026-11-05 | T-000 | Reference corpus cloned | Commit hashes in the T-000 card |
| 2026-11-05 | T-001 | Baseline imported to `src/`; `LICENSE` and `NOTICE.md` added; verifier PASS, reviewer APPROVE; waiting for owner check (browser run) and commit | SHA-256 table below: 11 of 11 equal to `reference/self-driving-car/9. Fine-tuning/`, sizes equal |
| 2026-11-07 | T-001 | Owner check passed: `src/index.html` opened in the browser and worked | Owner confirmation, recorded 2026-11-08 |
| 2026-11-08 | T-001 | Task set to `done`. Delivered before ADR-0009 by direct commits `b005cca` and `9f8db79`, not through a pull request | Board and T-001 card |
| 2026-11-08 | — | Process change: work is delivered through pull requests merged with a merge commit (ADR-0009); status legend updated so a task becomes `done` in the pull request that delivers it | ADR-0009 in `docs/DECISIONS.md` |
| 2026-11-08 | T-002 | Tooling added; verifier PASS (iteration 2; iteration 1 found Vite returning 500 for the UTF-16 `src/visualizer.js`, fixed in `vite.config.js`), reviewer APPROVE; status `review` until the owner confirms the browser run of `npm run dev` | `npm run check` passed just now (0 tests); `npm ci` in a clean copy passed; `src/` hashes equal the table below |
| 2026-11-08 | T-002 | Owner check passed: `npm run dev` at localhost:5173 showed the road, traffic, sensor rays and network panel, the visualizer loaded, console showed only a favicon 404 and a browser-extension warning. The baseline shows one controlled car, not 100; criterion text corrected. Owner kept the `.githooks` lint override and accepted the dev-only audit findings. Task set to `done` | Owner confirmation |
| 2026-11-08 | T-001 | Browser-check criterion corrected from "100 cars" to one controlled car, as in T-002 | Criterion 3 of the T-001 card |
| 2026-11-08 | T-003 | Characterization tests added; verifier PASS (10 runs in a row green, five mutations caught), reviewer APPROVE after 2 fix iterations (a vacuous mutate test and a multi-level `feedForward` test that a skipped level could pass) | `npm run check` passed just now (32 tests); `src/` hashes equal the table below |
| 2026-11-08 | T-003 | Quirks recorded (each pinned by a `quirk:` test, none fixed): `getIntersection` returns null for collinear overlapping segments and counts endpoint touches as hits; `polysIntersect` is false when one polygon lies fully inside another (edges only); `getRGBA(0)` is white at alpha 0; `getRandomColor` hue is `290 + r*260`, up to 550 (above 360); `NeuralNetwork([n])` builds no levels and `feedForward` then throws; `feedForward` returns the last level's own `outputs` array, so the next call overwrites an earlier result; missing inputs become `undefined`, the sum is NaN and the output is 0; `Level` draws weights row by row, then biases, and `mutate` draws biases, then weights | Tests in `tests/` |
| 2026-11-08 | T-004 | Guard tests added; verifier PASS on the third pass (earlier passes found a vacuous comment-line test, an unpinned line-start anchor and five path rules without look-alike negatives, all fixed), reviewer APPROVE; 53 mutations of the hooks in scratch copies, none of the required ones survive | `npm run check` passed just now (84 tests); `.githooks/` and `src/` unchanged |
| 2026-11-08 | T-004 | Guard behaviour worth knowing (pinned by tests, hooks not edited): a folder named `skills` is blocked at any depth, so a future `src/skills/` would be blocked; the assistant config folder is blocked with or without a trailing slash; trailers are rejected only at the start of a line, while the no-reply address and session link match anywhere in a line; only a `#` in column 0 marks a comment line; the "generated with" rule matches one tool phrase only; the commit-message guard exits 2 for a missing path argument but throws (exit 1) for an unreadable file, which is not tested | Tests in `tests/hooks.test.js` |
| 2026-11-08 | T-005 | CI workflow added; verifier PASS on criterion 1 (structural YAML check, not a full parse: no YAML parser is installed and none was added), reviewer APPROVE; criterion 2 was pending until the PR run | `npm run check` passed just now (84 tests); `npm ci`, lint and test passed in a clean `git archive HEAD` copy; action majors from the GitHub releases API (checkout v7.0.1, setup-node v7.1.0) |
| 2026-11-09 | T-006 | README and setup guide added; verifier PASS (`npm ci`, test, lint, check, format and dev run in a clean `git archive` copy; 84 tests; dev server returned 200 for `/`, `/visualizer.js`, `/main.js`), reviewer APPROVE with Minor findings fixed | Verifier table; no tracked or ignored-path mismatch in the README tree (`git check-ignore` printed nothing) |
| 2026-11-09 | T-006 | Owner checks passed: `git config core.hooksPath` prints `.githooks` and `git config authorguard.email` prints the owner's address (setup.md hook commands correct); `npm run dev` render (road, traffic, sensor rays, network panel) confirmed, seen 2026-11-08 | Owner confirmation |
| 2026-11-09 | — | History check on `main` before sign-off: 33 commits, one author (Apoorv Raj `<apoorvrajmgr@gmail.com>`); committers are the owner (24) and GitHub `<noreply@github.com>` (9: the 8 merge commits and the web-created "Initial commit" `3708de4`); 0 commits with a co-author, session, vendor or "generated with" line. Gate item 4 reworded to allow GitHub as committer of merge commits | `git log main` format and `--grep` counts, run read-only |
| 2026-11-09 | — | ADR-0007 and ADR-0008 accepted by the owner; ADR-0008 given a note to revisit it at T-103 if recording a baseline run proves impractical | `docs/DECISIONS.md` |
| 2026-11-09 | — | Phase 0 gate signed by the owner: all five gate boxes ticked | Gate list and board note at the top of this file |
| 2026-11-09 | — | Phase 1 planned: T-101 to T-103 written out with criteria, verification and commits; Phase 1 gate added; ADR-0010 proposed (exact comparison of golden trajectories). Research: ECMA-262 §21.3.2 and §6.1.6.1; Node 22 and 24 use V8's fdlibm port for `sin`, `cos`, `atan2`; V8 main moved to LLVM libm in May 2026 | ADR-0010 in `docs/DECISIONS.md`; planning pull request awaiting owner approval |
| 2026-11-14 | — | `lint and test` is a required check on `main` through the `protect-main` ruleset | Owner statement; ruleset is a GitHub setting, not stored in the repo |
| 2026-11-14 | T-101 | Owner check passed: the owner read `docs/baseline-walkthrough.md` and can explain the frame loop with it. Task set to `done` | Owner confirmation |
| 2026-11-14 | T-102 | Headless harness added (`tests/helpers/headless.js`, `tests/headless.test.js`); `src/` untouched. Verifier PASS on iteration 2 (iteration 1 failed criterion 8: five timestamp mutants, `damaged` always false and `window.innerHeight` survived; three tests added). Reviewer APPROVE after iteration 3 (the first review required a `NOTICE.md` rewording: the JavaScript form's licence had been overclaimed) | `npm run check` passed 10 runs in a row (104 tests, run by the verifier and again after the last edits); 39 mutations in scratch copies, all killed except one equivalent (swapping `network.js` and `sensor.js`, which only declare classes and functions); `src/` hashes equal the table below |
| 2026-11-14 | T-102 | Owner decision: tick 0 means "after load". `main.js:34` calls `animate()` once while it loads, so traffic cars start at `y` less 0.15 with speed 0.15 and every `step(n)` is the (n+1)th update; criterion 2 reworded. The Phase 2 runner and the T-103 golden files must reproduce "initial state plus one load-time update" (ADR-0010). The harness also exposes the test hooks `canvases` (owner-approved) and `brains()` (added to check criterion 5, which needs every car's brain) | Criterion 2 and the "Test hooks" bullet on the T-102 card |
| 2026-11-14 | T-102 | Timing for criterion 7, no threshold: 1,000 ticks took 3,986 ms in the verifier's run and 4,276 ms in a first probe (Node 24.12, Windows 11); the 100 AI cars and 7 traffic cars are updated every tick | `console.info` line of the timing test |
| 2026-11-14 | T-102 | Criterion 9 is only partly met: the original C Mulberry32 is CC0 1.0 (Tommy Ettinger's gist, checked 2026-11-14) and bryc's notes are headed "Public domain", but the licence of the StackOverflow-posted JavaScript form could not be checked (site unreachable). `NOTICE.md` says so. Owner accepted this as is on 2026-11-14, and asked that T-103 begin by rewriting the function from the C original (verified identical output) and then update `NOTICE.md`; the stale README test counts move to T-103's closing pull request | `NOTICE.md`; researcher report; T-103 card |
| 2026-11-20 | T-103 | Delivered as two pull requests (owner decision): #14 (merge commit `3da626a`) rewrote `makeSeededRandom` from the CC0 `mulberry32.c` and updated `NOTICE.md`; #15 holds the recorder, fixtures, replay test, metrics document and README. Researcher source for the C original: gist `46a874533244883189143505d203312c`, header "Written in 2017 by Tommy Ettinger ... dedicated ... to the public domain worldwide" with the CC0 1.0 link, last content revision 2017-11-06, checked 2026-11-20. PR A: verifier PASS, reviewer APPROVE (three wording Minors fixed) | Old and new function compared value by value (6 seeds x 10,000 = 60,000 values, 0 mismatches) and both against a BigInt implementation of the C function (0 of 60,000); the pinned-digest test fails for 5 mutants (constant, `\| 61`, three shifts); #14 `lint and test` green |
| 2026-11-20 | T-103 | Fixtures recorded with `npm run golden:record` on Node 24.12.0 (Windows): `seed-1` best distance 2042.95 px, 24 crashed, 76 surviving; `seed-2` 2087.1499999999996, 37, 63; `seed-3` 2053.3999999999996, 26, 74; `seed-4-gen2` 2083.249999999999, 13, 87; about 3.6 to 4.1 s per 1,000 ticks. The scenarios are not degenerate: the best car's row changes on 960, 998, 979 and 1,000 of 1,000 ticks. Criterion 2: the replay passed on Linux with Node 22.23.4 in CI, so the Windows/Node 24 fixtures match on both and the ADR-0010 assumption held. Verifier PASS, reviewer APPROVE (five Minors fixed in `da25fd3`) | `docs/baseline-metrics.md`; fixtures total 266,521 bytes; `npm run check` 148 tests (run 3 times in a row); CI run 44764311470 (8 files, 148 tests) |
| 2026-11-20 | T-103 | Mismatch and mutation checks, all on scratch copies. Mismatch (one changed fixture value): per-tick `y` gives `seed-1: tick 500, best car (index 62), field y: ...`; final AI car `x` gives `tick 1000, AI car 3, field x`; traffic car `y` gives `traffic car 2, field y`; a brain weight gives `best brain, field levels[0].weights[2][1]`. Mutation (replay fails): `friction` 0.0500001 (all four, tick 1); ray count 6 (all four) and 4 (all four); `mutate` amount 0.11 at `src/main.js:19` (only `seed-4-gen2`, `tick 43, all AI cars, field crashedCars: expected 4 but got 7`). The unmutated control passes. One mutant survives: `>` to `>=` in `feedForward`, which differs only when a neuron sum equals its bias exactly, and that never happens in these runs (not proven equivalent in general) | Verifier scratch outputs; `src/` SHA-256 unchanged and equal to the T-001 table |
| 2026-11-20 | T-103 | Decisions and scope: the replay test moved into the fixtures commit so every commit passes `npm run check` (the card had it one commit earlier); added beyond the card, with approval: `tests/helpers/golden.js`, `tests/golden-compare.test.js`, `tests/baseline-metrics.test.js`, an optional `srcDir` in `createBaselineSim`, the test-only variables `GOLDEN_SRC_DIR` and `GOLDEN_FIXTURE_DIR`, `tests/golden/*.json` in `.prettierignore`; one metrics table with a row per scenario; README lines 20, 24, 35, 81 to 82, 86, 95 to 98 and 106 corrected factually. ADR-0010 stays Proposed: the owner accepts it in a separate pull request now that CI confirmed the match | `docs/baseline-metrics.md`; `README.md` |
| 2026-11-20 | — | ADR-0010 accepted by the owner: the Windows/Node 24 fixtures matched the Linux/Node 22 CI replay, so the assumption held and ADR-0008's revisit note is not triggered. A revisit note covers the V8 maths-library risk (a future Node major with LLVM libm) | `docs/DECISIONS.md`; CI run 44764311470 |
| 2026-11-20 | — | Phase 1 gate signed by the owner: all six gate boxes ticked, none left open. Evidence for the boxes ticked in this change: (2) `src/` SHA-256 of all 11 files compared with the T-001 table just now, all equal; the headless harness (T-102) and the replay (T-103) run the unmodified `src/`. (3) Log entry of T-103: replay green on Windows/Node 24.12.0 and in CI on Linux/Node 22.23.4 (run 44764311470); `lint and test` green on `main` after #15. (4) `docs/baseline-metrics.md` has distance, crashed and surviving cars and runtime for `seed-1`, `seed-2`, `seed-3`, `seed-4-gen2`. (5) Mutation checks are in the Log for every task that added tests (T-003, T-004, T-102, T-103); T-002 (tooling, no tests of its own), T-005 (CI), T-006 and T-101 (documents) added none. Survivors recorded in the Log: the T-102 swap of `network.js` and `sensor.js` (equivalent) and the T-103 `>` to `>=` in `feedForward` (not proven equivalent in general); the T-004 entry says only that none of the required mutations survived, so any other survivors there are not listed | Log entries above; hash comparison and `gh run list` run read-only |
| 2026-11-20 | — | Phase 2 planned: T-201 to T-206 written out with criteria, verification and commits; Phase 2 gate added; ADR-0011 (frozen copy in `baseline/`) and ADR-0012 (one fixed tick, one explicit seeded generator) proposed. Research, all sources opened 2026-11-20: Glenn Fiedler, "Fix Your Timestep!" (2004-06-10): accumulator, frame time clamped to 0.25 s against the "spiral of death", optional interpolation; no licence on its snippets. MDN `requestAnimationFrame` (last modified 2026-08-21): callbacks follow the display refresh rate, an animation that ignores the timestamp "will run faster on high refresh-rate screens", callbacks pause in background tabs; WHATWG HTML §8.1.7.3. Mulberry32: 32-bit state, period 2^32; its author noted on 2022-11-10 that it cannot produce about a third of all 32-bit values; one run draws at most 12,743 numbers. Vitest 4.1.12 docs: `vi.resetModules()` then a dynamic import re-evaluates the module; `vi.unstubAllGlobals` restores `vi.stubGlobal`; `mockRestore` restores a `vi.spyOn`; `isolate` defaults to true with the `forks` pool | ADR-0011 and ADR-0012 in `docs/DECISIONS.md`; planning pull request awaiting owner approval |
| 2026-11-20 | — | Owner approved the Phase 2 scope, with ADR-0011 and ADR-0012 left Proposed, and asked to split T-204 if both halves keep the page working and the goldens matching. Split into T-204a (world core, unit tests; the page stays on the flat modules) and T-204b (render layer and page code; flat modules and bridge removed); T-205 now depends on T-204b and T-206 on T-204a. Owner approved in advance, on 2026-11-20, the two `.gitattributes` changes (add `baseline/** -text` in T-201, drop `src/** -text` in T-202); each is still shown to the owner before it is committed in its task | T-204a and T-204b cards; board |
| 2026-11-20 | T-201 | Baseline frozen in `baseline/`: 11 files copied with `cp` after the `baseline/** -text` line (owner-approved diff, own commit) was committed; sizes and SHA-256 equal the T-001 table in `baseline/` and in `src/`, which is untouched; `git ls-files --eol baseline/` shows 9 files `i/crlf` and `car.png` and `visualizer.js` `i/-text`. The harness, `loadLegacy`, the recorder and the replay read `baseline/` through one constant, `BASELINE_DIR` (`srcDir` and `GOLDEN_SRC_DIR` still work); the hash table moved to `tests/baseline-hashes.test.js`, which also checks that `baseline/` holds exactly the 11 files; 149 tests pass (148, minus the moved hash test, plus two). Scratch-copy checks (verifier): `friction` changed in `src/car.js` leaves 149 tests green, the same change in `baseline/car.js` fails 7 (hash test, 4 replays, 2 harness tests); mutations of the hash test (one-byte flip, deleted file, extra file, extra directory, wrong table digit or size) each fail it; the walkthrough's 130 `baseline/<file>:<line>` references are all in range and equal the old references one for one, no `src/<file>` reference remains (this shows range validity and an unchanged mapping, not the semantic check of T-101); `/`, `/visualizer.js`, `/main.js`, `/car.png` return 200 under `npm run dev:baseline`, and a marker test shows it serves `baseline/`. `--config vite.config.js` is passed because Vite looks for its config in the given root. Beyond the card, with approval: `docs/baseline-metrics.md` updated, and one `style(tests)` commit (Prettier line join in `tests/helpers/headless.js`, found in review). The fresh-clone check was not run; the committed blobs were hashed instead. OWNER-CHECK for criterion 5 (same page as `npm run dev`) is still open when this row is written | pull request for T-201; `tests/baseline-hashes.test.js`; verifier and reviewer reports (APPROVE) |

### Baseline hash table (T-001, upstream commit `8b87236`)

Text files use CRLF line endings, as upstream (`.gitattributes` marks `src/**` and `baseline/**` as `-text`). `LICENSE` and `NOTICE.md` use LF.

| File | Bytes | SHA-256 |
| --- | --- | --- |
| car.js | 4794 | 336cf43585bfc53ce9281404d32b85dc36e4a424dd6fbea674eb44f54c690858 |
| car.png | 6964 | 3e3d3a268ca6133277f89346a7b74b5c28658e9956e91514103a7508a855dc8f |
| controls.js | 1427 | b70138dd2a6026655fd4283b7aafa3996d0cdc76c5f4365c89efe757ec2d7d7b |
| index.html | 739 | bcdcdb2bdcfb487176bc66e274d7abe0c889251a468e4330608c80e28b4d134f |
| main.js | 2463 | 606b6354d9ffe797625bfd3f53be80593f1c50dddd558a00531c3d30a29b14b2 |
| network.js | 2505 | 8a6df13b9bbd97932d48fa084d932eac621ce2e99e44f6f12ab5bd0ab93b364b |
| road.js | 1520 | 9bf0dbbc6244ec882c0a73b615be767d15bdfdc83ae4b060fa1d42225624423a |
| sensor.js | 3138 | 97dbaa7fd1e3cbe1ac62f5b7db088d9b33cd2530583380f7e4629ff66726a2fb |
| style.css | 471 | 4fc64d4f132574ff36eb51f2528bdcd6c5c4646cf34d596c5bb256ac99fd4e53 |
| utils.js | 1308 | 4f5b5d5836b82f7189d7744554f4a9de76112518bf7dd720a7a6527a04a84678 |
| visualizer.js | 7098 | 4f228a30318f5932db236fca82d452d6a554aa138125c088a77e44b95ac8f883 |
