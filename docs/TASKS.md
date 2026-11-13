# Tasks

The task board for the project. One task is `in-progress` at a time. Each task is small enough to review as
one change and has acceptance criteria that can be checked with evidence.

**Statuses:** `todo` → `in-progress` (branch open) → `done`. `review` is used
only while a pull request waits for an owner check; a normal task goes straight from `in-progress` to `done`.
`blocked` = stopped, reason in the Log.
A task becomes `done` in the pull request that delivers it (the status is set in the branch's last commit and
takes effect when the pull request merges).
`in-progress` and `review` exist only on the task branch; `main` shows `todo`, `blocked` or `done`.

## Current phase: 1 — Understand and measure the baseline

Explain the original simulation, run it headless and unchanged, and record reference runs that the Phase 2
restructure must reproduce (ADR-0008, ADR-0010). `src/` stays byte-identical throughout.

**Gate (owner signs off):**

- [x] `docs/baseline-walkthrough.md` is read by the owner, who can explain the frame loop with it (2026-11-14)
- [ ] The headless harness runs the unmodified baseline; `src/` hashes still equal the T-001 table
- [ ] Golden fixtures are recorded, and the replay test is green locally (Windows, Node 24) and in CI (Linux,
      Node 22)
- [ ] `docs/baseline-metrics.md` records distance, crashes and runtime for every recorded scenario
- [ ] Every test task passed a mutation check (learned rule, 2026-11-08)
- [ ] ADR-0010 accepted or revised

## Phase 0 — Foundation

**Gate (owner signs off): signed by the owner on 2026-11-09**

- [x] The original simulation runs from `npm run dev` exactly as the original `index.html` does
- [x] `src/` files are byte-identical to upstream (hash table recorded in the Log)
- [x] `npm run check` is green locally and in CI
- [x] Every commit is authored by the owner, with no co-author trailers; merge commits created by GitHub may show GitHub as committer
- [x] ADR-0007 and ADR-0008 accepted or revised

## Board

Phase 0 gate: signed by the owner on 2026-11-09. Phase 1 is current (T-101 to T-103); T-101 is done, T-102 is
next, and T-103 needs T-102.

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
| T-103 | Baseline metrics and golden trajectories | 1 | todo | T-102 |

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

- **Status:** todo · **Phase 1**
- **Goal:** Record, for fixed seeds, the best car's distance, crash count and per-tick positions as JSON
  fixtures. These become the golden reference for the Phase 2 restructure (ADR-0008).
- **Context:** `tests/helpers/headless.js` (T-102), ADR-0008 (including its revisit note), ADR-0010,
  `.github/workflows/ci.yml`.
- **Deliverables:**
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
- **Verification:** `npm run check` green; `gh pr checks` green on Node 22; the mutation and mismatch tables;
  fixture sizes.
- **Branch and commits:** `test/t-103-golden-trajectories`; `test(golden): add recorder and replay test`,
  `test(golden): record baseline fixtures`, `docs(metrics): add baseline metrics`, `docs(tasks): complete T-103`.
- **Size:** about 100 lines for the recorder, 120 for the test and 60 for the metrics doc; generated fixtures
  are not counted.

---

## Later phases (broken into tasks at each gate)

| Phase | Epic |
| --- | --- |
| 2 | ES modules, simulation/render split, fixed time step, seeded RNG, headless runner, golden-trajectory tests |
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
| 2026-11-14 | T-102 | Criterion 9 is only partly met: the original C Mulberry32 is CC0 1.0 (Tommy Ettinger's gist, checked 2026-11-14) and bryc's notes are headed "Public domain", but the licence of the StackOverflow-posted JavaScript form could not be checked (site unreachable). `NOTICE.md` says so. Owner to accept this, or to ask for the function to be rewritten from the C original | `NOTICE.md`; researcher report |

### Baseline hash table (T-001, upstream commit `8b87236`)

Text files use CRLF line endings, as upstream (`.gitattributes` marks `src/**` as `-text`). `LICENSE` and `NOTICE.md` use LF.

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
