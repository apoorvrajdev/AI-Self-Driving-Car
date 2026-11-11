# AI-Self-Driving-Car

**A browser driving simulation made testable and measurable, one verified step at a time.**

[![CI](https://github.com/apoorvrajdev/AI-Self-Driving-Car/actions/workflows/ci.yml/badge.svg)](https://github.com/apoorvrajdev/AI-Self-Driving-Car/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20-339933)

A 2D top-down simulation in which cars driven by small neural networks learn to drive by evolutionary search. It
starts from an educational JavaScript project and is being rebuilt, step by step, into a modular and tested
simulation. It is a simulation only: it never controls a real vehicle.

**Why.** The original runs on unseeded randomness and physics tied to the frame rate, so a run cannot be
reproduced or compared. This project adds tests and determinism before it adds features.

## At a glance

| | |
| --- | --- |
| **Today** | The original simulation in `src/` (11 files, byte-identical to upstream), served by Vite, with 84 passing tests |
| **Planned** | Seeded, fixed-step, headless simulation; a road graph and traffic; swappable drivers; a safety supervisor; scenario metrics |
| **Toolchain** | Node.js 20+, Vite, Vitest, ESLint, Prettier, all exact-pinned dev dependencies; the simulation itself uses no libraries |
| **Delivery** | Pull requests only, merged with a merge commit; `lint and test` is a required check on `main` |
| **Results** | None recorded yet. Reference runs of the original are planned for Phase 1 (T-103) |

## Status

Phase 0, foundation. `src/` holds the original simulation, unchanged, and it runs as the original does. Around
it sit the dev server, linting, characterization tests for the pure parts, tests for the commit guards, and
continuous integration. Nothing in the simulation has been refactored yet. The plan is in
[docs/TASKS.md](docs/TASKS.md) and the target design in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick start

You need Node.js 20 or newer and npm. Prerequisites and details are in [docs/setup.md](docs/setup.md).

```sh
npm ci
npm run dev
```

Open <http://localhost:5173> (the address Vite prints). Other commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Serves the simulation from `src/` with Vite |
| `npm test` | Runs the test suite once (Vitest) |
| `npm run lint` | Lints the project (ESLint) |
| `npm run check` | Lint, then tests: the same steps CI runs |
| `npm run format` | Formats the tooling files and `tests/` with Prettier |

## Project layout

```text
src/                    simulation code (the original files, unchanged for now)
tests/                  characterization tests and commit-guard tests
docs/                   architecture, decisions, tasks, setup
.githooks/              commit guards (see docs/setup.md)
.github/workflows/      continuous integration
eslint.config.js        lint rules
vite.config.js          dev server and test settings
package.json            scripts and pinned dev dependencies
LICENSE  NOTICE.md      licence and third-party credits
```

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): the original design, the target design and the conventions.
- [docs/DECISIONS.md](docs/DECISIONS.md): why things are the way they are.
- [docs/TASKS.md](docs/TASKS.md): the task board, acceptance criteria and log.
- [docs/setup.md](docs/setup.md): prerequisites, commands and enabling the hooks.

## Credits and licence

The simulation in `src/` is the "Self-driving car, no libraries" course code by Radu Mariescu-Istodor
([gniziemazity/self-driving-car](https://github.com/gniziemazity/self-driving-car), folder `9. Fine-tuning`),
used under the MIT licence. Full details are in [NOTICE.md](NOTICE.md). This project is released under the same
MIT licence; see [LICENSE](LICENSE).
