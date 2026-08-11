# L7-07 memory & long-session behaviour (mobile 390x844 DPR2, CPU 4x, 3 reps)
Every row sampled AFTER HeapProfiler.collectGarbage(), so these are retained bytes.
| checkpoint | JS heap KB (median) | range | Δ vs baseline KB | DOM nodes | listeners | Documents | chat .msg nodes | canvases | WebGL ctx | ctx lost |
|---|---|---|---|---|---|---|---|---|---|---|
| baseline after load | 2422.8 | 2422.7–2422.8 | 0 | 590 | 68 | 2 | 1 | 2 | 0 | 0 |
| A chat open/close x10 | 3255.3 | 3255.2–3255.9 | 832.6 | 590 | 81 | 2 | 1 | 2 | 0 | 0 |
| A chat open/close x20 | 3259.4 | 3259.3–3259.4 | 836.6 | 590 | 81 | 2 | 1 | 2 | 0 | 0 |
| A chat open/close x30 | 3263.3 | 3263.2–3263.4 | 840.6 | 590 | 81 | 2 | 1 | 2 | 0 | 0 |
| A chat open/close x40 | 3286.8 | 3286.6–3286.8 | 864 | 590 | 81 | 2 | 1 | 2 | 0 | 0 |
| A chat open/close x50 | 3292.1 | 3292.1–3292.1 | 869.3 | 590 | 81 | 2 | 1 | 2 | 0 | 0 |
| B theme toggle x10 | 3298.2 | 3298.1–3298.2 | 875.4 | 590 | 81 | 2 | 1 | 2 | 0 | 0 |
| B theme toggle x20 | 3303.8 | 3303.8–3303.8 | 881.1 | 590 | 81 | 2 | 1 | 2 | 0 | 0 |
| B theme toggle x30 | 3307.3 | 3307.2–3307.3 | 884.5 | 590 | 81 | 2 | 1 | 2 | 0 | 0 |
| C full-page scroll pass x2 | 11001.6 | 10983.7–11049.3 | 8578.9 | 590 | 213 | 5 | 1 | 2 | 1 | 0 |
| C full-page scroll pass x4 | 12523.6 | 11217.6–12557.2 | 10100.9 | 590 | 335 | 33 | 1 | 2 | 1 | 0 |
| C full-page scroll pass x6 | 12589.4 | 12565.6–12611.1 | 10166.7 | 590 | 335 | 33 | 1 | 2 | 1 | 0 |
| C full-page scroll pass x8 | 12609.3 | 12573.4–12619.8 | 10186.5 | 590 | 335 | 33 | 1 | 2 | 1 | 0 |
| C full-page scroll pass x10 | 12615.9 | 12580.1–12626.9 | 10193.2 | 590 | 335 | 33 | 1 | 2 | 1 | 0 |
| D resize mobile<->desktop x5 | 13441 | 13439.6–13459.9 | 11018.3 | 590 | 340 | 33 | 1 | 2 | 1 | 0 |
| D resize mobile<->desktop x10 | 13728 | 13725.4–13746.1 | 11305.3 | 590 | 346 | 33 | 1 | 2 | 1 | 0 |
| D resize mobile<->desktop x15 | 13947.8 | 13937.4–13960.5 | 11525.1 | 590 | 350 | 33 | 1 | 2 | 1 | 0 |
| D resize mobile<->desktop x20 | 14147.3 | 13982.3–14147.5 | 11724.6 | 590 | 356 | 33 | 1 | 2 | 1 | 0 |
| E after 3 s idle + GC | 14142.7 | 13977.6–14142.9 | 11720 | 590 | 355 | 33 | 1 | 2 | 1 | 0 |

## Per-action deltas (median across 3 reps)
| action | Δ heap KB | Δ DOM nodes | Δ listeners |
|---|---|---|---|
| A 50 chat open/close | 869.3 | 0 | 13 |
| B 30 theme toggles | 15.2 | 0 | 0 |
| C 10 scroll passes (3D) | 9308.7 | 0 | 254 |
| D 20 resizes | 1531.4 | 0 | 21 |
| E 3 s idle + GC | -4.6 | 0 | -1 |

Total heap growth baseline → end: 11720 KB (483.7 %)
Total node growth baseline → end: 0
Total listener growth baseline → end: 287
Layout count baseline 30 → end 869
Style recalcs baseline 305 → end 2618
WebGL contexts created: 1 · contexts lost: 0 · canvas elements: 2