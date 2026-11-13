# Setup

How to get the project running on a development machine. The npm commands work in PowerShell, Git Bash and any
POSIX shell. The commit hooks have only been used on Windows; the hook files are not marked executable, so on
Linux or macOS Git would skip them.

## Prerequisites

| Tool | Required | Detected when this guide was written |
| --- | --- | --- |
| Node.js | 20 or newer (`engines` in `package.json`); CI uses 22 | 24.12.0 |
| npm | the version that ships with Node.js | 11.6.2 |
| Git | any recent version | 2.52.0 (Windows) |
| A browser | any current one, to view the simulation | not detected |

## Get the code and install

```sh
git clone https://github.com/apoorvrajdev/AI-Self-Driving-Car.git
cd AI-Self-Driving-Car
npm ci
```

`npm ci` installs the exact versions in `package-lock.json`. The only dependencies are development tools
(Vite, Vitest, ESLint, Prettier); the simulation itself uses no libraries.

## Run the simulation

```sh
npm run dev
```

Vite serves `src/` and prints the address, normally http://localhost:5173. The page shows the road, the traffic,
the sensor rays and the network panel. Stop the server with Ctrl+C.

`src/visualizer.js` is stored as UTF-16, as in the original. A small plugin in `vite.config.js` decodes it when
it is served; the file itself is not changed.

## Test and lint

| Command | What it does |
| --- | --- |
| `npm test` | Runs every test in `tests/` once |
| `npm run lint` | Runs ESLint over the project |
| `npm run check` | `npm run lint` and then `npm test`; run it before every commit |
| `npm run format` | Rewrites the tooling files and `tests/` with Prettier |

CI runs `npm ci`, `npm run lint` and `npm test` on every pull request and on every push to `main`.

On Windows, run Vitest from an uppercase-drive path (`D:\...`); a lowercase `d:\...` working directory gives "reading 'config'" errors.

## Enable the commit hooks

The hooks in `.githooks/` check that the commit author and committer match one email address, reject
attribution trailers in commit messages and block files that must not be committed. They need Node.js and are
off until you opt in. Run these once per clone:

```sh
git config core.hooksPath .githooks
git config authorguard.email "<your email>"
```

Use the email address you commit with. Without `authorguard.email`, the pre-commit hook refuses to commit. The
reasons are in ADR-0006 and ADR-0009 in [DECISIONS.md](DECISIONS.md).

## Where to go next

[ARCHITECTURE.md](ARCHITECTURE.md) explains the design, [TASKS.md](TASKS.md) lists the work and its status.
