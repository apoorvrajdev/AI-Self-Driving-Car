# Notice

This project builds on third-party work. This file records what was used, where it came from and under which
licence. The full licence text is in [LICENSE](LICENSE).

## Imported baseline

| Item | Value |
| --- | --- |
| Source repository | https://github.com/gniziemazity/self-driving-car |
| Author | Radu Mariescu-Istodor |
| Folder imported | `9. Fine-tuning` |
| Upstream commit | `8b8723685bb4ab94cf504998466b6c337c35335c` |
| Import date | 2026-11-05 |
| Licence | MIT, Copyright (c) 2022 Radu Mariescu-Istodor |
| Location here | `src/` (11 files, byte-identical to upstream at import) |
| Course | Self-driving Car (no libraries), JavaScript: https://www.youtube.com/playlist?list=PLB0Tybl0UNfYoJE7ZwsBQoDIG4YN9ptyY |

The code in `src/` was written by the original author during the course above. Files in `src/` that are changed
in later work remain derived from this baseline and stay under the same MIT licence, with the additional
copyright line for later contributions in [LICENSE](LICENSE).

## Third-party components

| Component | Version | Licence | Used for |
| --- | --- | --- | --- |
| Mulberry32 pseudo-random number generator (Tommy Ettinger, 2017) | n/a (inline, 10 lines) | CC0 1.0 for the original C algorithm; licence of the JavaScript form not verified (see note below) | Seeded random numbers in tests (`makeSeededRandom` in `tests/helpers/loadLegacy.js`) |

Mulberry32: the algorithm and constants are by Tommy Ettinger (2017). The original C implementation dedicates
them to the public domain under CC0 1.0 (https://gist.github.com/tommyettinger/46a874533244883189143505d203312c,
checked 2026-11-14). The JavaScript function in `tests/helpers/loadLegacy.js` has the same constants and
operations as the widely circulated JavaScript port, with the state kept unsigned. That port is documented in
bryc's notes, which are headed "Public domain"
(https://github.com/bryc/code/blob/master/jshash/PRNGs.md, checked 2026-11-14), and is commonly found in a
StackOverflow answer whose own licence could not be checked (the site was not reachable when this was
researched). The licence of the JavaScript form as posted is therefore not verified. The function is ten lines
and the algorithm is fixed by Ettinger's public-domain definition. If this matters, the function can be rewritten
from the C original. The generator only seeds tests and is not suitable for security purposes.

Development dependencies are added with their licences when they are introduced.
