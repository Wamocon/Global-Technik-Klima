# L7-09 concurrency + chat under load

## (A) Pure-HTTP burst against `astro preview` (node fetch, no browser)
| concurrency | round | wall ms | throughput req/s | latency min/median/p95/max ms | bytes total | failures |
|---|---|---|---|---|---|---|
| 1 | 0 | 27 | 37 | 27/27/27/27 | 61 KB | 0 |
| 1 | 1 | 5 | 200 | 5/5/5/5 | 61 KB | 0 |
| 1 | 2 | 4 | 250 | 4/4/4/4 | 61 KB | 0 |
| 8 | 0 | 18 | 444.4 | 7/16/17/17 | 488.2 KB | 0 |
| 8 | 1 | 16 | 500 | 14/15/15/15 | 488.2 KB | 0 |
| 8 | 2 | 14 | 571.4 | 12/13/13/13 | 488.2 KB | 0 |
| 16 | 0 | 21 | 761.9 | 11/15.5/20/20 | 976.3 KB | 0 |
| 16 | 1 | 18 | 888.9 | 16/17/18/18 | 976.3 KB | 0 |
| 16 | 2 | 17 | 941.2 | 15/16/16/16 | 976.3 KB | 0 |
| 32 | 0 | 36 | 888.9 | 19/30/34/34 | 1952.6 KB | 0 |
| 32 | 1 | 40 | 800 | 35/37.5/38/39 | 1952.6 KB | 0 |
| 32 | 2 | 39 | 820.5 | 31/36/37/37 | 1952.6 KB | 0 |

Medians: c=1: wall 5 ms, p95 latency 5 ms · c=8: wall 16 ms, p95 latency 15 ms · c=16: wall 18 ms, p95 latency 18 ms · c=32: wall 39 ms, p95 latency 37 ms

## (B) 8 simultaneous real page loads (8 contexts, unthrottled) — CPU-bound on one host
- sequential baseline (3 runs): TTFB median 3.7 ms, load median 112.7 ms, wall median 128 ms
- round 0: 8 loads in 355 ms wall · TTFB min/med/max 4/7.2/13.9 ms · load min/med/max 152.2/184.5/219.7 ms · bytes median 557.1 KB
- round 1: 8 loads in 385 ms wall · TTFB min/med/max 4.1/7.4/13.8 ms · load min/med/max 180.5/206.8/218.6 ms · bytes median 557.1 KB
- round 2: 8 loads in 394 ms wall · TTFB min/med/max 4/13.1/19.4 ms · load min/med/max 191/230.9/245.4 ms · bytes median 557.1 KB

## (C) Chat under load — 20 messages
| variant | wall ms | messages accepted (.msg.me) | LOST | order preserved | bot bubbles | /api/chat calls | DOM nodes +| heap KB + | latency med / p95 / max ms |
|---|---|---|---|---|---|---|---|---|---|
| real 404 → local engine · burst | 515 | 1 of 20 (1–1) | 19 | true | 2 | 1 | 6 | -47.4 | n/a (burst) |
  · console/page errors: ["Failed to load resource: the server responded with a status of 404 (Not Found)"]
  · accepted messages, run 0: ["mesaj-01"]
| real 404 → local engine · serial | 5933 | 20 of 20 (20–20) | 0 | true | 21 | 20 | 120 | 77.5 | 298 / 300 / 310 |
  · console/page errors: ["Failed to load resource: the server responded with a status of 404 (Not Found)"]
  · latency per message, run 0: 307, 299, 298, 299, 297, 298, 298, 299, 298, 298, 298, 298, 299, 281, 297, 284, 297, 283, 298, 298 ms → first 5 median 299, last 5 median 297
| mocked 200 /api/chat · burst | 508 | 1 of 20 (1–1) | 19 | true | 2 | 1 | 6 | 23.2 | n/a (burst) |
  · accepted messages, run 0: ["mesaj-01"]
| mocked 200 /api/chat · serial | 5932 | 20 of 20 (20–20) | 0 | true | 21 | 20 | 120 | 63.1 | 298 / 300 / 300 |
  · latency per message, run 0: 295, 297, 299, 299, 281, 298, 298, 299, 298, 298, 282, 282, 298, 297, 300, 297, 299, 300, 281, 297 ms → first 5 median 297, last 5 median 297