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
| Location here | `baseline/` (11 files, byte-identical to upstream, never edited); `src/` started as the same 11 files and is derived from them |
| Course | Self-driving Car (no libraries), JavaScript: https://www.youtube.com/playlist?list=PLB0Tybl0UNfYoJE7ZwsBQoDIG4YN9ptyY |

The code in `baseline/` was written by the original author during the course above. `src/` was imported from
the same files, and the files in `src/` that are changed in later work remain derived from this baseline and
stay under the same MIT licence, with the additional copyright line for later contributions in
[LICENSE](LICENSE).

## Third-party components

| Component | Version | Licence | Used for |
| --- | --- | --- | --- |
| Mulberry32 pseudo-random number generator (Tommy Ettinger, 2017) | n/a (inline, about 10 lines) | CC0 1.0 (translated from the original C source; see note below) | Seeded random numbers in tests (`makeSeededRandom` in `tests/helpers/loadLegacy.js`) |

Mulberry32: the algorithm and constants are by Tommy Ettinger (2017). His C implementation, `mulberry32.c`,
carries the header "Written in 2017 by Tommy Ettinger ... the author has dedicated all copyright and related and
neighboring rights to this software to the public domain worldwide", with a link to the CC0 1.0 dedication
(http://creativecommons.org/publicdomain/zero/1.0/). Source: Tommy Ettinger, Mulberry32 PRNG, gist
46a874533244883189143505d203312c (https://gist.github.com/tommyettinger/46a874533244883189143505d203312c),
last content revision 2017-11-06, checked 2026-11-20. The function `makeSeededRandom` in
`tests/helpers/loadLegacy.js` is a line-by-line translation of that C function into JavaScript (`Math.imul` and
`>>> 0` stand in for unsigned 32-bit arithmetic), checked against the C source on 2026-11-20.
`tests/mulberry32.test.js` pins its first 10,000 outputs for six seeds, and those outputs equal those of
the earlier version. The generator only seeds tests and is not suitable for security purposes.

Development dependencies are added with their licences when they are introduced.
