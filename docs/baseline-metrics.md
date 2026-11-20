# Baseline metrics

What the unmodified original simulation does in four fixed runs of 1,000 ticks each. These runs are the golden
reference for the Phase 2 restructure (ADR-0008): the restructured code must reproduce them exactly (ADR-0010).
They measure the original, not a driving-quality target.

| Scenario | Best distance (px) | Crashed AI cars | Surviving AI cars | Runtime for 1,000 ticks (ms) |
| --- | --- | --- | --- | --- |
| `seed-1` | 2042.95 | 24 | 76 | 3844.6 |
| `seed-2` | 2087.1499999999996 | 37 | 63 | 3629.2 |
| `seed-3` | 2053.3999999999996 | 26 | 74 | 3809.1 |
| `seed-4-gen2` | 2083.249999999999 | 13 | 87 | 4124.7 |

The numbers are pasted from the output of `npm run golden:record` and checked against the fixtures by
`tests/baseline-metrics.test.js`.

## How to read it

- **Scenarios.** `seed-1`, `seed-2` and `seed-3` start with fresh random brains from that seed. `seed-4-gen2`
  starts from the best brain at the end of `seed-1`, with the other 99 cars mutated by 0.1 using seed 4: the
  original learning loop, one generation on.
- **Tick 0** is the state after the page has loaded, which includes one update (see ADR-0010 and the T-102 log
  entry). Tick 1,000 is the state after 1,000 steps.
- **Best distance** is `100 - y` of the best car at tick 1,000, in pixels. The best car is the one furthest up the
  road, whether or not it has crashed (`bestCar` in `baseline/main.js`), so this is not a safe-driving score.
- **Crashed and surviving** count AI cars (out of 100) that are damaged at tick 1,000. Traffic cars are
  not counted.
- **Runtime** is the time spent inside `step` for 1,000 ticks, measured once while recording (Windows, Node 24.12.0,
  headless, no drawing). It depends on the machine, is not compared by any test and only gives a sense of scale.
- **The runs are not trivial.** The best car's recorded row changes on 960 (`seed-1`), 998 (`seed-2`), 979
  (`seed-3`) and 1,000 (`seed-4-gen2`) of the 1,000 ticks.

## Fixtures

`tests/golden/<scenario>.json`, about 65 KB each. Each holds `meta` (format version, upstream commit, seed, tick
count, Node version and run time of the recording), one row per tick from 0 to 1,000 (best car's index, `x`, `y`,
`angle`, `speed`, `damaged`, number of crashed AI cars), the full final state of all 100 AI cars and 7 traffic
cars with the best brain, and the `metrics` shown above.

`tests/golden.test.js` replays every scenario through the headless harness and compares every number exactly. A
mismatch names the first scenario, tick, car and field that differ.

## Re-recording

Fixtures are written only by `npm run golden:record`. Tests never write them.

Re-recording is allowed only in a task whose card says so, for one of these reasons, and it needs a log entry:

1. The baseline in `baseline/` was deliberately changed (for example when Phase 2 retires the goldens).
2. The Node major used by CI or the local toolchain changed and the replay no longer matches (ADR-0010: V8's
   `sin`, `cos` and `atan2` may differ in the last bit). The log entry names both Node versions.

It is never allowed to make a failing test pass. After recording, update the table above from the recorder's
output; `tests/baseline-metrics.test.js` fails if the table and the fixtures disagree. The figures in the prose
above (the number of ticks that change, the file size, the Node version) are not checked by a test: refresh them
by hand with the table.

Three environment variables exist for checking the checker, and are unset in normal runs and in CI:
`GOLDEN_SRC_DIR` replays against a scratch copy of `baseline/` (mutation checks), `MODULES_SRC_DIR` runs the
module replay and the module characterization cases against a scratch copy of `src/`, and `GOLDEN_FIXTURE_DIR`
reads fixtures from another directory (mismatch-reporting checks).
