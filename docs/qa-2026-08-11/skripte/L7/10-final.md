# L7-10 remaining measurements

## (a) Chat: how close together may two messages be sent before one is silently dropped?
Method: type msg A, press Enter, wait N ms, type msg B, press Enter. Then count .msg.me bubbles.
| gap ms | rep | accepted | 2nd message present | input box after | verdict |
|---|---|---|---|---|---|
| 50 | 0 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 50 | 1 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 50 | 2 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 100 | 0 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 100 | 1 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 100 | 2 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 200 | 0 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 200 | 1 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 200 | 2 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 260 | 0 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 260 | 1 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 260 | 2 | 1 | false | "BBB montaj fiyat" | 2nd DROPPED |
| 300 | 0 | 2 | true | "" | both sent |
| 300 | 1 | 2 | true | "" | both sent |
| 300 | 2 | 2 | true | "" | both sent |
| 400 | 0 | 2 | true | "" | both sent |
| 400 | 1 | 2 | true | "" | both sent |
| 400 | 2 | 2 | true | "" | both sent |
| 600 | 0 | 2 | true | "" | both sent |
| 600 | 1 | 2 | true | "" | both sent |
| 600 | 2 | 2 | true | "" | both sent |

Summary: 50ms → 0/3 delivered · 100ms → 0/3 delivered · 200ms → 0/3 delivered · 260ms → 0/3 delivered · 300ms → 3/3 delivered · 400ms → 3/3 delivered · 600ms → 3/3 delivered

## (b) Total image weight once the whole page has been seen (per locale, mobile 390x844 DPR2)
| locale | image files | image KB | total page KB | total requests |
|---|---|---|---|---|
| tr | 11 | 581.9 | 959.3 | 27 |
  · /images/ba-cool.webp=18KB, /images/ba-hot.webp=12KB, /images/hero-shop.webp=168KB, /images/logo-light.png=52KB, /images/p-duvar.webp=19KB, /images/p-home.webp=61KB, /images/p-isipompasi.webp=82KB, /images/p-multi.webp=40KB, /images/p-salon.webp=63KB, /images/p-ticari.webp=32KB, /images/p-yedek.webp=35KB
| de | 11 | 581.9 | 919 | 25 |
  · /images/ba-cool.webp=18KB, /images/ba-hot.webp=12KB, /images/hero-shop.webp=168KB, /images/logo-light.png=52KB, /images/p-duvar.webp=19KB, /images/p-home.webp=61KB, /images/p-isipompasi.webp=82KB, /images/p-multi.webp=40KB, /images/p-salon.webp=63KB, /images/p-ticari.webp=32KB, /images/p-yedek.webp=35KB
| ru | 11 | 581.9 | 954.9 | 28 |
  · /images/ba-cool.webp=18KB, /images/ba-hot.webp=12KB, /images/hero-shop.webp=168KB, /images/logo-light.png=52KB, /images/p-duvar.webp=19KB, /images/p-home.webp=61KB, /images/p-isipompasi.webp=82KB, /images/p-multi.webp=40KB, /images/p-salon.webp=63KB, /images/p-ticari.webp=32KB, /images/p-yedek.webp=35KB
| en | 11 | 581.9 | 919 | 25 |
  · /images/ba-cool.webp=18KB, /images/ba-hot.webp=12KB, /images/hero-shop.webp=168KB, /images/logo-light.png=52KB, /images/p-duvar.webp=19KB, /images/p-home.webp=61KB, /images/p-isipompasi.webp=82KB, /images/p-multi.webp=40KB, /images/p-salon.webp=63KB, /images/p-ticari.webp=32KB, /images/p-yedek.webp=35KB

### Theme switch cost (dark → light → dark, mobile)
- logo requests before toggle: ["/images/logo-light.png=53232"]
- logo requests after toggle:  ["/images/logo-light.png=53232","/images/logo-dark.png=49253"]

## (c) FOUT window (font-display: swap) — FCP → document.fonts.ready
| net | locale | rep | FCP ms | fonts.ready ms | FOUT window ms | LCP ms |
|---|---|---|---|---|---|---|
| fast3g | tr | 0 | 1880 | 4156.2 | 2276.2 | 4544 |
| fast3g | tr | 1 | 1840 | 4132.1 | 2292.1 | 3172 |
| fast3g | tr | 2 | 1844 | 4097.3 | 2253.3 | 4512 |
| fast3g | ru | 0 | 1908 | 4045.9 | 2137.9 | 4552 |
| fast3g | ru | 1 | 1964 | 4016.2 | 2052.2 | 4528 |
| fast3g | ru | 2 | 1868 | 4045.6 | 2177.6 | 4492 |
| slow3g | tr | 0 | 5328 | 10435 | 5107 | 16636 |
| slow3g | tr | 1 | 5112 | 10375.5 | 5263.5 | 16612 |
| slow3g | tr | 2 | 5164 | 10423.3 | 5259.3 | 16524 |
| slow3g | ru | 0 | 5208 | 11404.7 | 6196.7 | 17992 |
| slow3g | ru | 1 | 5196 | 11315.6 | 6119.6 | 18336 |
| slow3g | ru | 2 | 5200 | 11430.4 | 6230.4 | 18156 |

Medians: fast3g/tr: FOUT 2276.2 ms · fast3g/ru: FOUT 2137.9 ms · slow3g/tr: FOUT 5259.3 ms · slow3g/ru: FOUT 6196.7 ms

### Filmstrip (mobile, Fast 3G, CPU 4x) — screenshots at fixed offsets after navigation start
- C:/Users/WALERI%7E1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L7/film-1000ms.png
- C:/Users/WALERI%7E1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L7/film-2000ms.png
- C:/Users/WALERI%7E1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L7/film-2500ms.png
- C:/Users/WALERI%7E1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L7/film-3000ms.png
- C:/Users/WALERI%7E1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L7/film-4000ms.png
- C:/Users/WALERI%7E1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L7/film-5000ms.png