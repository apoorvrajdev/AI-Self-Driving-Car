# Tasks

The task board for the project. One task is `in-progress` at a time. Each task is small enough to review as
one change and has acceptance criteria that can be checked with evidence.

**Statuses:** `todo` → `in-progress` → `review` (implemented and verified, waiting for the owner) → `done`
(owner reviewed and committed). `blocked` = stopped, reason in the Log.
Only the owner moves a task to `done`.

## Current phase: 0 — Foundation

**Gate (owner signs off):**

- [ ] The original simulation runs from `npm run dev` exactly as the original `index.html` does
- [ ] `src/` files are byte-identical to upstream (hash table recorded in the Log)
- [ ] `npm run check` is green locally and in CI
- [ ] `git log` shows only the owner as author and committer, with no co-author trailers
- [ ] ADR-0007 and ADR-0008 accepted or revised

## Board

| ID | Title | Phase | Status | Depends on |
| --- | --- | --- | --- | --- |
| T-000 | Reference corpus | 0 | done | — |
| T-001 | Import baseline, licence and notice | 0 | todo | T-000 |
| T-002 | Tooling: package.json, dev server, tests, lint | 0 | todo | T-001 |
| T-003 | Characterization tests: utils and network | 0 | todo | T-002 |
| T-004 | Tests for the commit guards | 0 | todo | T-002 |
| T-005 | Continuous integration | 0 | todo | T-003, T-004 |
| T-006 | README and setup guide | 0 | todo | T-002 |
| T-101 | Baseline walkthrough document | 1 | todo | T-001 |
| T-102 | Headless harness for the unmodified baseline | 1 | todo | T-003 |
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

- **Status:** todo
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
  3. Opening `src/index.html` in Chrome shows 100 cars, traffic, sensor rays and the network panel (OWNER-CHECK).
- **Owner commit:** `chore: import baseline from gniziemazity/self-driving-car (MIT)` — `src/`, `LICENSE`,
  `NOTICE.md` only.

### T-002 — Tooling: package.json, dev server, tests, lint

- **Status:** todo
- **Goal:** Standard commands for running, testing and linting, without touching `src/`.
- **Context:** ARCHITECTURE §5, ADR-0002, `.gitignore`, `.gitattributes`.
- **Deliverables:** `package.json` (`"private": true`, `"type": "module"`, `"engines": {"node": ">=20"}`;
  scripts `dev`, `test`, `lint`, `format`, `check`; no `build` yet), exact-pinned devDependencies vite, vitest,
  eslint, @eslint/js, globals, prettier; `package-lock.json`; `vite.config.js` (root `src`);
  `eslint.config.js` (lints config files, `tests/`, `.githooks/*.mjs`; ignores `src/` until Phase 2);
  `.prettierrc`, `.prettierignore` (excludes `src/`, `.githooks/`, lockfile); `.editorconfig`.
- **Acceptance criteria:**
  1. `npm install` succeeds from a clean checkout.
  2. `npm run dev` serves the unchanged simulation (OWNER-CHECK).
  3. `npm run lint` passes; `npm run check` runs lint then tests.
  4. `src/` hashes unchanged.

### T-003 — Characterization tests: utils and network

- **Status:** todo
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

### T-004 — Tests for the commit guards

- **Status:** todo
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

### T-005 — Continuous integration

- **Status:** todo
- **Goal:** Lint and tests run on every push and pull request.
- **Deliverables:** `.github/workflows/ci.yml` — ubuntu-latest, Node 22 with npm cache, `npm ci`,
  `npm run lint`, `npm test`; current major versions of the actions.
- **Acceptance criteria:** 1. The workflow file is valid YAML and mirrors `npm run check`.
  2. After the owner pushes, the run is green (OWNER-CHECK).

### T-006 — README and setup guide

- **Status:** todo
- **Goal:** A newcomer can understand and run the project in five minutes.
- **Deliverables:** `README.md` (what it is, status, quick start, short project tree, links to `docs/`,
  credits and licence, CI badge); `docs/setup.md` (prerequisites with detected versions, commands, enabling
  the hooks with `core.hooksPath` and `authorguard.email`).
- **Acceptance criteria:** 1. Every command in both files was run and works.
  2. Nothing ignored by git is listed in the project tree.

### T-101 — Baseline walkthrough document

- **Status:** todo · **Phase 1**
- **Goal:** `docs/baseline-walkthrough.md` explains each baseline file and the frame loop in plain language,
  with `path:line` references, so the owner can explain every part in an interview.

### T-102 — Headless harness for the unmodified baseline

- **Status:** todo · **Phase 1**
- **Goal:** Run the original `src/` code in Node with stubbed canvas, image, `localStorage` and a seeded
  `Math.random`, stepping `animate` a fixed number of times — without editing `src/`.

### T-103 — Baseline metrics and golden trajectories

- **Status:** todo · **Phase 1**
- **Goal:** Record, for fixed seeds, the best car's distance, crash count and per-tick positions as JSON
  fixtures. These become the golden reference for the Phase 2 restructure (ADR-0008).

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
