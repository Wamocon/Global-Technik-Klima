# L7-07b leak isolation (mobile 390x844 DPR2, CPU 4x, post-GC samples, 3 reps)

## V1 maps BLOCKED · 20 resizes, 3D never loaded
| checkpoint | heap KB | range | Δ heap vs first | DOM nodes | listeners | Documents |
|---|---|---|---|---|---|---|
| after load | 2409.1 | 2383.9–2409.3 | 0 | 998 | 68 | 2 |
| +5 resizes | 2529.9 | 2518.1–2530.1 | 120.8 | 998 | 68 | 2 |
| +10 | 2542.8 | 2530.8–2543.2 | 133.7 | 998 | 68 | 2 |
| +15 | 2601.6 | 2589.5–2601.7 | 192.5 | 998 | 68 | 2 |
| +20 | 2612.1 | 2599.9–2612.1 | 203 | 998 | 68 | 2 |
→ heap 203 KB, listeners +0, Documents +0

## V2 maps BLOCKED · 3D loaded, then 20 resizes
| checkpoint | heap KB | range | Δ heap vs first | DOM nodes | listeners | Documents |
|---|---|---|---|---|---|---|
| after 3D boot | 2411.5 | 2408.8–3022.2 | 0 | 998 | 68 | 2 |
| +5 resizes | 5340 | 5301.9–5428.6 | 2928.5 | 998 | 73 | 2 |
| +10 | 5427.4 | 5386–5537.8 | 3016 | 998 | 73 | 2 |
| +15 | 5413.5 | 5407.2–5449 | 3002 | 998 | 73 | 2 |
| +20 | 5410.4 | 5408.8–5413 | 2998.9 | 998 | 73 | 2 |
→ heap 2998.9 KB, listeners +5, Documents +0

## V3 maps BLOCKED · 10 full-page scroll passes
| checkpoint | heap KB | range | Δ heap vs first | DOM nodes | listeners | Documents |
|---|---|---|---|---|---|---|
| after load | 2391.8 | 2383.9–2391.8 | 0 | 998 | 68 | 2 |
| +2 passes | 5092 | 5089.4–5189.7 | 2700.2 | 998 | 73 | 2 |
| +4 | 5299.7 | 5299.5–5315.4 | 2907.8 | 998 | 73 | 2 |
| +6 | 5322.6 | 5321.6–5331.7 | 2930.8 | 998 | 73 | 2 |
| +8 | 5330.9 | 5330.5–5342.1 | 2939.1 | 998 | 73 | 2 |
| +10 | 5348.2 | 5338.4–5350.1 | 2956.4 | 998 | 73 | 2 |
→ heap 2956.4 KB, listeners +5, Documents +0

## V4 maps ALLOWED · 10 full-page scroll passes
| checkpoint | heap KB | range | Δ heap vs first | DOM nodes | listeners | Documents |
|---|---|---|---|---|---|---|
| after load | 2401.2 | 2401.1–2409.1 | 0 | 998 | 68 | 2 |
| +2 passes | 9940 | 9908.7–9940.7 | 7538.7 | 1142 | 188 | 5 |
| +4 | 10964.5 | 10944.9–11663.3 | 8563.3 | 1439 | 282 | 32 |
| +6 | 11767.9 | 11704.8–11785.3 | 9366.7 | 1478 | 321 | 33 |
| +8 | 11777 | 11714–11793.6 | 9375.8 | 1478 | 321 | 33 |
| +10 | 11785.3 | 11722.3–11802 | 9384.1 | 1478 | 321 | 33 |
→ heap 9384.1 KB, listeners +253, Documents +31