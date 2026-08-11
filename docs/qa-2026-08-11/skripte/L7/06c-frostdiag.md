# L7-06c FrostHero loop — root cause of the inconsistent hidden-tab result, and CPU cost

## (1) Who re-arms rAF after document.hidden becomes true? (5 reps, parked on #teknik)
| rep | fills in 1st 500ms after hidden | fills 500–1500ms | WebGL draws after hidden | cancelAnimationFrame calls | first rAF stacks after hidden |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 2 | ["    at window.requestAnimationFrame (<anonymous>:12:77) /     at u (http://localhost:4321/_astro/gsap.D1O2useh.js:1:14973)","    at window.requestAnimationFrame (<anonymous>:12:77) /     at e (http://localhost:4321/_as |
| 1 | 0 | 0 | 0 | 2 | ["    at window.requestAnimationFrame (<anonymous>:12:77) /     at u (http://localhost:4321/_astro/gsap.D1O2useh.js:1:14973)","    at window.requestAnimationFrame (<anonymous>:12:77) /     at e (http://localhost:4321/_as |
| 2 | 0 | 0 | 0 | 2 | ["    at window.requestAnimationFrame (<anonymous>:12:77) /     at u (http://localhost:4321/_astro/gsap.D1O2useh.js:1:14973)","    at window.requestAnimationFrame (<anonymous>:12:77) /     at e (http://localhost:4321/_as |
| 3 | 0 | 0 | 0 | 2 | ["    at window.requestAnimationFrame (<anonymous>:12:77) /     at u (http://localhost:4321/_astro/gsap.D1O2useh.js:1:14973)","    at window.requestAnimationFrame (<anonymous>:12:77) /     at e (http://localhost:4321/_as |
| 4 | 0 | 0 | 0 | 2 | ["    at window.requestAnimationFrame (<anonymous>:12:77) /     at u (http://localhost:4321/_astro/gsap.D1O2useh.js:1:14973)","    at window.requestAnimationFrame (<anonymous>:12:77) /     at e (http://localhost:4321/_as |

fills after hidden (500–1500 ms window) across 5 reps: 0, 0, 0, 0, 0 → ALWAYS stops

## (2) Main-thread busy time over a 3000 ms idle window (CDP Performance.getMetrics TaskDuration)
| state | rep | TaskDuration delta ms | busy % of 3000 ms | 2D fills | WebGL draws |
|---|---|---|---|---|---|
| a idle on hero (frost running) | 0 | 2236.4 | 74 | 37128 | 0 |
| a idle on hero (frost running) | 1 | 1705.6 | 56 | 37332 | 0 |
| a idle on hero (frost running) | 2 | 2103.2 | 68.7 | 37128 | 0 |
| b idle on footer (frost running, 3D paused) | 0 | 1783.5 | 59 | 28764 | 0 |
| b idle on footer (frost running, 3D paused) | 1 | 1655.8 | 54.9 | 28356 | 0 |
| b idle on footer (frost running, 3D paused) | 2 | 2074.2 | 68.3 | 24480 | 0 |
| c idle on footer, prefers-reduced-motion:reduce | 0 | 1169.5 | 24.5 | 0 | 0 |
| c idle on footer, prefers-reduced-motion:reduce | 1 | 1280.5 | 42.3 | 0 | 0 |
| c idle on footer, prefers-reduced-motion:reduce | 2 | 543.5 | 18 | 0 | 0 |
| d idle on #teknik (frost + 3D both running) | 0 | 2956.8 | 96 | 23664 | 6250 |
| d idle on #teknik (frost + 3D both running) | 1 | 2920.7 | 94.6 | 23460 | 6200 |
| d idle on #teknik (frost + 3D both running) | 2 | 2855.6 | 93.3 | 23664 | 5800 |

Medians:
- a idle on hero (frost running): TaskDuration 2103.2 ms (1705.6–2236.4) = 68.7 % busy · fills 37128 · WebGL draws 0
- b idle on footer (frost running, 3D paused): TaskDuration 1783.5 ms (1655.8–2074.2) = 59 % busy · fills 28356 · WebGL draws 0
- c idle on footer, prefers-reduced-motion:reduce: TaskDuration 1169.5 ms (543.5–1280.5) = 24.5 % busy · fills 0 · WebGL draws 0
- d idle on #teknik (frost + 3D both running): TaskDuration 2920.7 ms (2855.6–2956.8) = 94.6 % busy · fills 23664 · WebGL draws 6200