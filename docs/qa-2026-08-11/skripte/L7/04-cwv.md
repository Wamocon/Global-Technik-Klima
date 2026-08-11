# L7-04 Core Web Vitals under CDP throttling — `/` (Turkish root), cold cache, 3 runs each
| config | ECT seen | FCP ms | LCP ms | LCP element | CLS@load | CLS after scroll | TBT ms | longtasks | DCL ms | load ms | bytes@load KB | imgs@load |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mobile/none/1x | 4g | 164 (164–188) | 164 (164–188) | body > header.hero > div.wrap.hero-in > p.hero-kicker | 0 (0/0/0) | 0 (0/0/0) | 36 (35–50) | 1 | 117 | 142.3 | 601.3 | 6 |
| mobile/fast3g/4x | 3g | 2008 (1992–2296) | 4544 (4460–4576) | body > header.hero > div.hero-parallax > div.hero-photo url=/images/hero-shop.webp | 0.0051 (0.0051/0.0051/0.0051) | 0.0051 (0.0051/0.0051/0.0051) | 942 (821–1227) | 7 | 2312.1 | 4490.6 | 500.3 | 4 |
| mobile/fast3g/6x | 3g | 2192 (2136–2204) | 4800 (4688–4932) | body > header.hero > div.hero-parallax > div.hero-photo url=/images/hero-shop.webp | 0.0051 (0.0051/0.0051/0.0051) | 0.0051 (0.0051/0.0051/0.0051) | 1268 (1133–1592) | 10 | 2554.6 | 4749.7 | 500.3 | 4 |
| mobile/slow3g/4x | 2g | 5636 (5376–6028) | 18232 (16684–18876) | body > header.hero > div.hero-parallax > div.hero-photo url=/images/hero-shop.webp | 0.0051 (0.0051/0.0051/0.0051) | 0.0051 (0.0051/0.0051/0.0051) | 1353 (1058–2294) | 8 | 6624.8 | 20467.7 | 750 | 9 |
| mobile/slow3g/6x | 2g | 6304 (6108–6944) | 18496 (16600–18500) | body > header.hero > div.hero-parallax > div.hero-photo url=/images/hero-shop.webp | 0.0051 (0.0051/0.0051/0.0051) | 0.0051 (0.0051/0.0051/0.0051) | 3312 (2946–4608) | 12 | 7322.1 | 20500.9 | 750 | 9 |
| desktop/none/1x | 4g | 224 (208–240) | 224 (208–240) | body > header.hero > div.wrap.hero-in > p.hero-kicker | 0 (0/0/0) | 0 (0/0/0) | 38 (34–45) | 1 | 119.3 | 141.8 | 750 | 9 |
| desktop/fast3g/4x | 3g | 2264 (2056–2436) | 4776 (4768–4848) | body > header.hero > div.hero-parallax > div.hero-photo url=/images/hero-shop.webp | 0.0496 (0.0496/0.0496/0.0496) | 0.0496 (0.0496/0.0496/0.0496) | 1404 (803–1709) | 9 | 2631 | 4873.3 | 750 | 9 |
| desktop/slow3g/6x | 2g | 6636 (5660–7080) | 17708 (16672–18892) | body > header.hero > div.hero-parallax > div.hero-photo url=/images/hero-shop.webp | 0.0496 (0.0496/0.0496/0.0496) | 0.0496 (0.0496/0.0496/0.0496) | 3954 (1408–7479) | 10 | 7491.3 | 20848.1 | 789.6 | 12 |

## Layout-shift sources (all runs pooled, biggest first)
| shifting node | occurrences | summed CLS value | example prev→cur rect | configs |
|---|---|---|---|---|
| `body > header.topbar > div.wrap.tbin > nav.mainnav` | 6 | 0.2975 | [573,14,482,35] → [583,14,472,35] | 2 |
| `html.motion > body > header.hero > div.wrap.hero-in` | 3 | 0.1487 | [257,63,926,837] → [374,63,692,837] | 1 |
| `html > body > header.hero > div.wrap.hero-in` | 3 | 0.1487 | [257,63,926,837] → [374,63,692,837] | 1 |
| `header.hero > div.wrap.hero-in > h1.build > span.ln` | 12 | 0.0611 | [0,318,390,48] → [0,277,390,48] | 4 |
| `` | 16 | 0.0006 | [117,120,56,20] → [117,118,64,20] | 6 |

## Longest individual long tasks (per config, run 0)
- mobile/none/1x: 100ms @32.8ms [unknown:]
- mobile/fast3g/4x: 524ms @1464.5ms [unknown:] · 227ms @4261.3ms [unknown:] · 138ms @2064.7ms [unknown:] · 126ms @3599.8ms [unknown:]
- mobile/fast3g/6x: 706ms @1481.7ms [unknown:] · 272ms @2206ms [unknown:] · 268ms @4449.8ms [unknown:] · 137ms @3592.4ms [unknown:]
- mobile/slow3g/4x: 637ms @4726.9ms [unknown:] · 267ms @5532.9ms [unknown:] · 240ms @13635.5ms [unknown:] · 75ms @5447.8ms [unknown:]
- mobile/slow3g/6x: 2185ms @4741ms [unknown:] · 934ms @6973.1ms [unknown:] · 630ms @17956.3ms [unknown:] · 278ms @15813.9ms [unknown:]
- desktop/none/1x: 88ms @29.6ms [unknown:]
- desktop/fast3g/4x: 513ms @1475.1ms [unknown:] · 150ms @2099.7ms [unknown:] · 127ms @5212.2ms [unknown:] · 97ms @1998.1ms [unknown:]
- desktop/slow3g/6x: 2258ms @4726.5ms [unknown:] · 839ms @7039.2ms [unknown:] · 551ms @17798.8ms [unknown:] · 168ms @14427.5ms [unknown:]

## Long tasks DURING the scroll phase (after load) — run 0
- mobile/none/1x: 1 long tasks, blocking 92 ms, worst 142 ms
- mobile/fast3g/4x: 0 long tasks, blocking 0 ms, worst 0 ms
- mobile/fast3g/6x: 4 long tasks, blocking 24 ms, worst 62 ms
- mobile/slow3g/4x: 0 long tasks, blocking 0 ms, worst 0 ms
- mobile/slow3g/6x: 10 long tasks, blocking 99 ms, worst 69 ms
- desktop/none/1x: 1 long tasks, blocking 84 ms, worst 134 ms
- desktop/fast3g/4x: 4 long tasks, blocking 8 ms, worst 54 ms
- desktop/slow3g/6x: 9 long tasks, blocking 52 ms, worst 61 ms