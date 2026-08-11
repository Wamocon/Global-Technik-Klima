# L7-06b rAF pause verification, completed (mobile 390x844 DPR2, CPU 4x, 3000 ms windows)
| scenario | rep | document.hidden | WebGL draws/s | 2D fills/s | rAF calls |
|---|---|---|---|---|---|
| C1 real tab hidden (2nd tab fronted) | 0 | false | 1503.5 | 6134.3 | 288 |
| C2 synthetic document.hidden=true | 0 | true | 0 | 0 | 337 |
| D parked on footer (hero bottom at -14816px, #teknik top -8687px) | 0 | false | 0 | 10537.2 | 463 |
| E idle on hero, never scrolled (three.js never loaded) | 0 | false | 0 | 12300.2 | 403 |
| C1 real tab hidden (2nd tab fronted) | 1 | false | 1872.2 | 7638.7 | 354 |
| C2 synthetic document.hidden=true | 1 | true | 0 | 11144.6 | 486 |
| D parked on footer (hero bottom at -14816px, #teknik top -8687px) | 1 | false | 0 | 10247.8 | 458 |
| E idle on hero, never scrolled (three.js never loaded) | 1 | false | 0 | 12309.1 | 404 |
| C1 real tab hidden (2nd tab fronted) | 2 | false | 1329.5 | 5424.3 | 255 |
| C2 synthetic document.hidden=true | 2 | true | 0 | 11331.4 | 492 |
| D parked on footer (hero bottom at -14816px, #teknik top -8687px) | 2 | false | 0 | 8071.3 | 368 |
| E idle on hero, never scrolled (three.js never loaded) | 2 | false | 0 | 12272.8 | 402 |

## Medians
- C1 real tab hidden: WebGL draws/s 1503.5136460205915 (1329.5–1872.2) · 2D fills/s 6134.3 (5424.3–7638.7) · WebGL contexts 1
- C2 synthetic hidden: WebGL draws/s 0 (0–0) · 2D fills/s 11144.6 (0–11331.4) · WebGL contexts 1
- D parked on footer: WebGL draws/s 0 (0–0) · 2D fills/s 10247.8 (8071.3–10537.2) · WebGL contexts 1
- E idle on hero: WebGL draws/s 0 (0–0) · 2D fills/s 12300.2 (12272.8–12309.1) · WebGL contexts 0