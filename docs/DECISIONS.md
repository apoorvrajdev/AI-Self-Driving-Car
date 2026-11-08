# Decisions

Architecture Decision Records (ADRs). Each records one decision: its context, the options, the choice and its
consequences. Statuses: **Proposed** (awaiting the owner), **Accepted**, **Accepted · amended by ADR-NNNN**
(still in force, partly changed by a later ADR), **Superseded by ADR-NNNN**, **Rejected**.
Accepted decisions change only through a new ADR.

| ADR | Decision | Status | Date |
| --- | --- | --- | --- |
| [0001](#adr-0001) | Import only the final lecture folder as the baseline | Accepted | 2026-11-05 |
| [0002](#adr-0002) | JavaScript at runtime; Python only for offline training | Accepted | 2026-11-05 |
| [0003](#adr-0003) | CARLA and ROS 2 out of core scope | Accepted | 2026-11-05 |
| [0004](#adr-0004) | Avoid AGPL-licensed models | Accepted | 2026-11-05 |
| [0005](#adr-0005) | Use virtual-world as the world and map layer | Accepted | 2026-11-05 |
| [0006](#adr-0006) | Single-author repository with enforced commit identity | Accepted · amended by ADR-0009 | 2026-11-05 |
| [0007](#adr-0007) | Modular stack with swappable drivers and a safety supervisor | Accepted | 2026-11-05 |
| [0008](#adr-0008) | Determinism before features | Accepted | 2026-11-05 |
| [0009](#adr-0009) | Pull-request delivery flow | Accepted | 2026-11-07 |
| [0010](#adr-0010) | Golden trajectories: exact comparison, deliberate re-recording | Proposed | 2026-11-09 |

---

## ADR-0001

**Import only the final lecture folder as the baseline** · Accepted · 2026-11-05

- **Context:** The original repository holds 10 lecture folders; each is a full snapshot, so most code is
  duplicated. Folder `9. Fine-tuning` is the complete version.
- **Options:** (a) all 10 folders; (b) history import via subtree; (c) final folder only.
- **Decision:** (c). Copy the 11 files of `9. Fine-tuning` into `src/`, byte-identical, in a dedicated commit.
  Credit the source in `LICENSE` and `NOTICE.md`.
- **Consequences:** Clean starting point and a clear import commit. Earlier lecture states stay available in the
  original repository for learning.

## ADR-0002

**JavaScript at runtime; Python only for offline training** · Accepted · 2026-11-05

- **Context:** The baseline is browser JavaScript. Most ML tooling is Python.
- **Options:** (a) migrate to Python; (b) JavaScript only; (c) JavaScript runtime + offline Python training,
  bridged by ONNX models run with ONNX Runtime Web.
- **Decision:** (c).
- **Consequences:** The demo runs in any browser with no server. Python never runs inside the simulation loop.
  ONNX export compatibility must be checked for every model.

## ADR-0003

**CARLA and ROS 2 out of core scope** · Accepted · 2026-11-05

- **Context:** CARLA 0.10 release notes recommend at least 16 GB of GPU memory; CARLA 0.9.x needs at least
  6 GB. The development machine has 4 GB.
- **Decision:** Not part of the core roadmap. A CARLA or ROS 2 bridge is an optional stretch goal on rented
  hardware.
- **Consequences:** The simulation stays lightweight and reproducible. Interfaces stay simple enough to bridge
  later.

## ADR-0004

**Avoid AGPL-licensed models** · Accepted · 2026-11-05

- **Context:** Ultralytics YOLO is licensed AGPL-3.0 (or a commercial licence). This repository is MIT.
- **Decision:** Do not use AGPL or GPL code or models. Train our own small models or use permissively licensed
  ones, recorded in `NOTICE.md`.
- **Consequences:** Some extra training work; no licence conflict.

## ADR-0005

**Use virtual-world as the world and map layer** · Accepted · 2026-11-05

- **Context:** The same author's [virtual-world](https://github.com/gniziemazity/virtual-world) (MIT, 2023)
  provides a road-graph editor, OpenStreetMap import, markings (stop, yield, crossing, parking, start, target)
  and timed traffic lights.
- **Decision:** From Phase 3, adapt it as the world and map layer instead of building a road graph from scratch.
- **Consequences:** Faster progress on realistic roads; its code must be brought into the module structure and
  credited in `NOTICE.md`.

## ADR-0006

**Single-author repository with enforced commit identity** · Accepted · amended by ADR-0009 · 2026-11-05

- **Context:** The owner is the sole author and contributor of this repository.
- **Decision:** Only the owner commits, pushes, tags and publishes. Hooks in `.githooks/` reject commits whose
  author or committer email differs from `authorguard.email`, messages with co-author or attribution trailers,
  and assistant configuration files.
- **Consequences:** Clean, accurate history. Hooks must be enabled per clone
  (`git config core.hooksPath .githooks`) and need Node.js.

## ADR-0007

**Modular stack with swappable drivers and a safety supervisor** · Accepted · 2026-11-05

- **Context:** Modern research includes end-to-end and vision-language-action driving models, which need large
  real datasets and GPUs. Deployed systems are commonly organised as modular pipelines.
- **Options:** (a) end-to-end learned driver only; (b) modular stack only; (c) modular stack plus swappable
  learned drivers, all behind one `driver.act()` contract, followed by an independent safety supervisor.
- **Decision:** (c). Accepted by the owner on 2026-11-09.
- **Consequences:** Every driver is compared on the same scenarios; the original evolved network remains as a
  baseline driver; end-to-end research is documented, not built.

## ADR-0008

**Determinism before features** · Accepted · 2026-11-05

- **Context:** The baseline ties physics to the frame rate and uses unseeded randomness, so results cannot be
  reproduced or tested.
- **Decision:** Accepted by the owner on 2026-11-09. Phase 2 introduces a fixed time step, a seeded RNG and a headless runner before any
  new driving feature. The refactor must reproduce golden trajectories recorded from the baseline.
- **Consequences:** Phase 2 adds no visible features but makes testing, training and fair comparison possible.
- **Revisit:** At T-103, if recording a baseline run for the golden trajectories proves impractical, revisit
  this ADR (through a new ADR) before starting Phase 2.

## ADR-0009

**Pull-request delivery flow** · Accepted · 2026-11-07

- **Context:** ADR-0006 says only the owner commits, pushes, tags and publishes, but it does not say how a change
  reaches `main`. Committing straight to `main` gives no review step, no place for checks to run, and no
  record of why a group of commits belongs together.
- **Options:** (a) commit directly to `main`; (b) pull requests merged by squash; (c) pull requests merged with
  a merge commit.
- **Decision:** (c), because every atomic commit stays visible in the history of `main` while the merge commit
  groups them into one reviewed change.
  - Work is delivered on short-lived branches. Task work uses `<type>/t-xxx-<slug>` (for example
    `test/t-003-characterization`). Docs-only or process work that has no task card uses `docs/<slug>`, and its
    pull request body states "Task: none (process change)".
  - Each branch holds atomic Conventional Commits: one logical change per commit, each one leaving the checks
    passing. No empty or artificially split commits.
  - Each branch is merged through a pull request with a merge commit (no squash, no rebase), only after all
    checks pass. The branch is deleted after the merge.
  - Nothing is pushed directly to `main`.
  - Every commit, push, pull request and merge uses the owner's Git identity.
  - The commit hooks from ADR-0006 stay in force.
- **Consequences:** ADR-0006 still applies, with this amendment: changes reach `main` only through a merged pull
  request. A task becomes `done` in the pull request that delivers it. Once continuous integration exists
  (T-005), its checks gate every merge.

## ADR-0010

**Golden trajectories: exact comparison, deliberate re-recording** · Proposed · 2026-11-09

- **Context:** T-103 records runs of the unmodified baseline that the Phase 2 restructure must reproduce
  (ADR-0008). Sources checked on 2026-11-09:
  - ECMAScript leaves `Math.sin`, `cos`, `atan2` and `hypot` "implementation-approximated" (ECMA-262 §21.3.2),
    while `+ - * /` are exact IEEE 754 binary64 operations with round-ties-to-even (§6.1.6.1).
  - Node 22 (V8 12.4) and Node 24 (V8 13.6) compute `sin`, `cos` and `atan2` with V8's own fdlibm port
    (`src/base/ieee754.cc`), not the platform's maths library. The 2-argument `Math.hypot` used by the baseline
    reduces to the same operations in both.
  - V8's main branch moved `sin`, `cos` and `atan2` to LLVM's libm in May 2026 (commits `7c1d2c3`, `43f04a5`).
    A future Node major will ship that change, and results may differ in the last bit.
  - The simulation is chaotic: one bit of difference can flip a collision or sensor comparison, after which
    the runs diverge instead of drifting, so no fixed tolerance separates "equal" from "different".
- **Options:** (a) exact equality of every recorded number; (b) a fixed numeric tolerance; (c) compare summary
  metrics only (distance, crash count).
- **Decision (proposed):** (a).
  - Fixtures are JSON. A JavaScript number written by `JSON.stringify` reads back as the same number. The sign
    of zero is not compared (JSON writes `-0` as `0`), and the recorder rejects `NaN` and infinities.
  - A mismatch reports the first tick, car and field that differ, not just "not equal".
  - Fixtures are written only by an explicit record command, run in a task whose card says so. Tests never
    write fixtures.
  - CI keeps a pinned Node major (22). Moving CI or the local toolchain to a Node major with a different V8
    maths library means checking the goldens in that task; if they change, they are re-recorded there, with
    a Log entry that names both Node versions.
- **Consequences:**
  - The strongest possible guard for the Phase 2 restructure: any change of behaviour fails a test.
  - Phase 2 must keep the baseline's order of arithmetic operations until the goldens are deliberately
    retired, because even a reordered sum can change the last bit.
  - Equality between Windows with Node 24 (local) and Linux with Node 22 (CI) is an assumption, checked by
    T-103. If it fails, this ADR and ADR-0008 are revisited before Phase 2 (the ADR-0008 revisit note).

---

## Template

```markdown
## ADR-NNNN

**Title** · Proposed · YYYY-MM-DD

- **Context:** what forces the decision; facts with sources.
- **Options:** (a) …; (b) …; (c) …
- **Decision (proposed):** which option and why.
- **Consequences:** what becomes easier, harder, or must be done next.
```
