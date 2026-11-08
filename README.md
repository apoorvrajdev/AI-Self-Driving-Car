# AI-Self-Driving-Car

[![CI](https://github.com/apoorvrajdev/AI-Self-Driving-Car/actions/workflows/ci.yml/badge.svg)](https://github.com/apoorvrajdev/AI-Self-Driving-Car/actions/workflows/ci.yml)

A 2D top-down browser simulation in which cars driven by small neural networks learn to drive by evolutionary
search. The project starts from an educational JavaScript simulation and is being turned, step by step, into a
modular, tested and measurable autonomous-driving simulation. It is a simulation only: it never controls a real
vehicle.

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
