# L7-14 scroll smoothness, constant velocity 2.2 px/ms (~2200 px/s), 5 reps
| variant | rep | frames | duration ms | mean iv | median iv | p95 iv | p99 iv | max iv | % frames >33.4ms | implied fps |
|---|---|---|---|---|---|---|---|---|---|---|
| as shipped | 0 | 377 | 7183.1 | 19.1 | 16.7 | 33.3 | 50 | 333.3 | 2.9 | 52.3 |
| as shipped | 1 | 375 | 7183.2 | 19.2 | 16.7 | 33.3 | 66.7 | 300 | 3.7 | 52.1 |
| as shipped | 2 | 388 | 7183.1 | 18.6 | 16.7 | 33.3 | 33.4 | 283.3 | 1.8 | 53.9 |
| as shipped | 3 | 379 | 7183.1 | 19 | 16.7 | 33.3 | 50.1 | 266.7 | 3.2 | 52.6 |
| as shipped | 4 | 375 | 7183 | 19.2 | 16.7 | 33.3 | 66.7 | 333.3 | 4.3 | 52.1 |
| prefers-reduced-motion: reduce (no GSAP, frost static) | 0 | 398 | 7183.1 | 18.1 | 16.7 | 16.8 | 50 | 366.7 | 1.3 | 55.3 |
| prefers-reduced-motion: reduce (no GSAP, frost static) | 1 | 404 | 7183.1 | 17.8 | 16.7 | 16.8 | 33.3 | 250 | 1 | 56.1 |
| prefers-reduced-motion: reduce (no GSAP, frost static) | 2 | 405 | 7183 | 17.8 | 16.7 | 16.8 | 33.3 | 249.9 | 1 | 56.2 |
| prefers-reduced-motion: reduce (no GSAP, frost static) | 3 | 411 | 7183.1 | 17.5 | 16.7 | 16.8 | 33.2 | 233.4 | 0.7 | 57.1 |
| prefers-reduced-motion: reduce (no GSAP, frost static) | 4 | 404 | 7183 | 17.8 | 16.7 | 16.8 | 33.3 | 233.2 | 1 | 56.1 |
| frost canvas neutralised (GSAP still on) | 0 | 393 | 7183.1 | 18.3 | 16.7 | 16.8 | 33.4 | 283.3 | 2 | 54.6 |
| frost canvas neutralised (GSAP still on) | 1 | 389 | 7183 | 18.5 | 16.7 | 33.3 | 66.7 | 266.6 | 1.8 | 54 |
| frost canvas neutralised (GSAP still on) | 2 | 392 | 7183.1 | 18.4 | 16.7 | 16.8 | 50 | 283.4 | 1.3 | 54.4 |
| frost canvas neutralised (GSAP still on) | 3 | 384 | 7183.1 | 18.8 | 16.7 | 16.8 | 83.3 | 283.4 | 3.1 | 53.3 |
| frost canvas neutralised (GSAP still on) | 4 | 390 | 7183.1 | 18.5 | 16.7 | 16.8 | 83.3 | 300 | 1.5 | 54.2 |

## Medians over 5 reps
| variant | fps | mean iv | p95 iv | max iv | % frames >33.4ms |
|---|---|---|---|---|---|
| as shipped | 52.3 (52.1–53.9) | 19.1 | 33.3 | 300 | 3.2 |
| prefers-reduced-motion: reduce (no GSAP, frost static) | 56.1 (55.3–57.1) | 17.8 | 16.8 | 249.9 | 1 |
| frost canvas neutralised (GSAP still on) | 54.2 (53.3–54.6) | 18.5 | 16.8 | 283.4 | 1.8 |