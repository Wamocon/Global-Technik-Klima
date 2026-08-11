# L7-05 waterfall / priorities / attribution  (mobile 390x844 DPR2, Fast 3G, CPU 4x)

| discovered ms | finished ms | prio | KB | resource |
|---|---|---|---|---|
| 0 | 664.4 | undefined | 16.6 | / |
| 595.5 | 1563.4 | undefined | 23.2 | /fonts/cormorant-600-normal-latin.woff2 |
| 597.6 | 1579.5 | undefined | 26.3 | /fonts/jost-300-600-normal-latin.woff2 |
| 597.8 | 1266.1 | undefined | 3.2 | /_astro/Base.BOhWYFVS.css |
| 597.9 | 1359.9 | undefined | 7.2 | /_astro/Home.DV18kdMJ.css |
| 634.7 | 1282.2 | undefined | 2.4 | /_astro/ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js |
| 670.6 | 1422.5 | undefined | 8 | /_astro/Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js |
| 672.4 | 1848.1 | undefined | 1.9 | /_astro/Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js |
| 1284.3 | 1863.9 | undefined | 1.1 | /_astro/preload-helper.CxFQXtKk.js |
| 1475.7 | 2639.3 | undefined | 52 | /images/logo-light.png |
| 1480 | 4337.1 | undefined | 168 | /images/hero-shop.webp |
| 1623.6 | 3557.9 | undefined | 23.7 | /fonts/cormorant-500-italic-latin.woff2 |
| 1663.9 | 3464.1 | undefined | 20.1 | /fonts/cormorant-600-normal-latin-ext.woff2 |
| 1671.4 | 3649.7 | undefined | 17 | /fonts/jost-300-600-normal-latin-ext.woff2 |
| 2101.4 | 4367.6 | undefined | 20.2 | /fonts/cormorant-500-italic-latin-ext.woff2 |
| 2278.2 | 3416.9 | undefined | 19.4 | /images/p-duvar.webp |
| 2279.4 | 4009.4 | undefined | 62.7 | /images/p-salon.webp |
| 2779.4 | 4444.2 | undefined | 17.4 | /_astro/ScrollTrigger.D7MWR7hw.js |

FCP 2308 ms · LCP 3596 ms (P.sub url=) · load 4375.2 ms
Hero image: discovered at 1480 ms (HTML finished at 664.4 ms), priority undefined, finished 4337.1 ms → LCP 3596 ms

## Main-thread attribution from a CDP trace (mobile, Fast 3G, CPU 4x, one run)

Top main-thread event types by total duration (ms, includes nesting):
  - RunTask: 8527 ms
  - Layout: 1683.7 ms
  - Commit: 973 ms
  - BackgroundJSStreamManager::RunScriptStreamingTask: 630.7 ms
  - v8.parseOnBackground: 630.5 ms
  - v8.parseOnBackgroundWaiting: 617.5 ms
  - UpdateLayoutTree: 485.2 ms
  - RunMicrotasks: 384 ms
  - RasterTask: 294.1 ms
  - Paint: 245.6 ms
  - v8.evaluateModule: 202.2 ms
  - FunctionCall: 169.2 ms
  - FireAnimationFrame: 167.9 ms
  - PrePaint: 138.9 ms

Script execution/compile time by URL (ms):
  - /: 138.3 ms
  - (inline/unknown): 81.5 ms
  - /_astro/ScrollTrigger.D7MWR7hw.js: 14.5 ms
  - /_astro/gsap.D1O2useh.js: 11.7 ms
  - /_astro/Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js: 4.5 ms
  - /_astro/ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js: 0.3 ms
  - /_astro/preload-helper.CxFQXtKk.js: 0.2 ms
  - /_astro/Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js: 0.2 ms

## Differential experiment (mobile, Fast 3G, CPU 4x, 3 runs each, medians)
| variant | FCP ms | LCP ms | LCP element | TBT ms | load ms | bytes KB |
|---|---|---|---|---|---|---|
| baseline | 2288 (2152–2352) | 4308 (4200–4704) | DIV.hero-photo /images/hero-shop.webp | 1377 (1078–1903) | 4362.1 | 500.3 |
| no gsap/ScrollTrigger | 1956 (1908–2132) | 4708 (4648–4900) | DIV.hero-photo /images/hero-shop.webp | 514 (486–967) | 4683.5 | 456.1 |
| no hero image | 1996 (1968–2124) | 3204 (3176–3376) | P.sub | 564 (550–1056) | 3445.8 | 332.2 |
| no product images | 2232 (2008–2240) | 4836 (4640–4848) | DIV.hero-photo /images/hero-shop.webp | 1247 (1047–1293) | 4769.2 | 418.1 |
| no fonts | 2168 (1916–2192) | 4744 (4516–4808) | DIV.hero-photo /images/hero-shop.webp | 992 (744–996) | 4698.7 | 369.9 |