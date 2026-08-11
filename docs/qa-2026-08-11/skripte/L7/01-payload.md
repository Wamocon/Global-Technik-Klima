# L7-01 Initial payload budget (mobile 390x844 DPR2, cold cache, cut at `load`)
Transferred = CDP Network.loadingFinished encodedDataLength (gzip as astro preview serves it).
Decoded = PerformanceResourceTiming.decodedBodySize.

## TR  (http://localhost:4321/)
- requests to load: median 21 (range 21–21)
- transferred to load: median 618.3 KB (range 574–618.3 KB)
- DCL median 99.6 ms (92–101.4) · load median 117.5 ms (114.3–125.8)
| bucket | n | transferred KB | decoded KB |
|---|---|---|---|
| html | 1 | 16.6 | (nav/inline) |
| css | 2 | 10.5 | 53.4 |
| js | 6 | 57.7 | 136 |
| font | 6 | 130.5 | 128.6 |
| image | 6 | 403 | 401.5 |

Largest single resources at `load`:
  - 168 KB  /images/hero-shop.webp  [image]
  - 62.7 KB  /images/p-salon.webp  [image]
  - 61.4 KB  /images/p-home.webp  [image]
  - 52 KB  /images/logo-light.png  [image]
  - 39.5 KB  /images/p-multi.webp  [image]
  - 26.9 KB  /_astro/gsap.D1O2useh.js  [js]
  - 26.3 KB  /fonts/jost-300-600-normal-latin.woff2  [font]
  - 23.7 KB  /fonts/cormorant-500-italic-latin.woff2  [font]

Resource set identical across 3 runs: true
three.js requests before `load`: 0, 0, 0  (want 0,0,0)
initial JS transferred: median 57.7 KB (13.4–57.7) · decoded median 136 KB

After scrolling #teknik into view (full page then scrolled):
- total requests 27 (27–27), transferred median 976.3 KB (976.3–976.3 KB)
- delta vs load: +358 KB, +6 requests
- three chunk transferred median 179.5 KB, decoded median 707.5 KB
- three requested within 241/204/226 ms of the scroll; seen=true,true,true
- console/page errors across runs: none

## DE  (http://localhost:4321/de/)
- requests to load: median 19 (range 19–19)
- transferred to load: median 533.4 KB (range 533.4–533.4 KB)
- DCL median 91.6 ms (90.5–98.6) · load median 101.7 ms (98.1–105.8)
| bucket | n | transferred KB | decoded KB |
|---|---|---|---|
| html | 1 | 16.4 | (nav/inline) |
| css | 2 | 10.5 | 53.4 |
| js | 6 | 13.4 | 26 |
| font | 4 | 90.1 | 88.9 |
| image | 6 | 403 | 401.5 |

Largest single resources at `load`:
  - 168 KB  /images/hero-shop.webp  [image]
  - 62.7 KB  /images/p-salon.webp  [image]
  - 61.4 KB  /images/p-home.webp  [image]
  - 52 KB  /images/logo-light.png  [image]
  - 39.5 KB  /images/p-multi.webp  [image]
  - 26.3 KB  /fonts/jost-300-600-normal-latin.woff2  [font]
  - 23.7 KB  /fonts/cormorant-500-italic-latin.woff2  [font]
  - 23.2 KB  /fonts/cormorant-600-normal-latin.woff2  [font]

Resource set identical across 3 runs: true
three.js requests before `load`: 0, 0, 0  (want 0,0,0)
initial JS transferred: median 13.4 KB (13.4–13.4) · decoded median 26 KB

After scrolling #teknik into view (full page then scrolled):
- total requests 24 (24–24), transferred median 853.8 KB (853.8–853.8 KB)
- delta vs load: +320.5 KB, +5 requests
- three chunk transferred median 179.5 KB, decoded median 707.5 KB
- three requested within 208/201/211 ms of the scroll; seen=true,true,true
- console/page errors across runs: none

## RU  (http://localhost:4321/ru/)
- requests to load: median 22 (range 22–22)
- transferred to load: median 615 KB (range 570.7–615 KB)
- DCL median 114.3 ms (111.4–129.3) · load median 152.5 ms (147.7–174.6)
| bucket | n | transferred KB | decoded KB |
|---|---|---|---|
| html | 1 | 17.8 | (nav/inline) |
| css | 2 | 10.5 | 53.4 |
| js | 6 | 57.7 | 136 |
| font | 7 | 126.1 | 123.9 |
| image | 6 | 403 | 401.5 |

Largest single resources at `load`:
  - 168 KB  /images/hero-shop.webp  [image]
  - 62.7 KB  /images/p-salon.webp  [image]
  - 61.4 KB  /images/p-home.webp  [image]
  - 52 KB  /images/logo-light.png  [image]
  - 39.5 KB  /images/p-multi.webp  [image]
  - 26.9 KB  /_astro/gsap.D1O2useh.js  [js]
  - 26.3 KB  /fonts/jost-300-600-normal-latin.woff2  [font]
  - 23.7 KB  /fonts/cormorant-500-italic-latin.woff2  [font]

Resource set identical across 3 runs: true
three.js requests before `load`: 0, 0, 0  (want 0,0,0)
initial JS transferred: median 57.7 KB (13.4–57.7) · decoded median 136 KB

After scrolling #teknik into view (full page then scrolled):
- total requests 27 (27–27), transferred median 891.2 KB (891.2–891.2 KB)
- delta vs load: +276.1 KB, +5 requests
- three chunk transferred median 179.5 KB, decoded median 707.5 KB
- three requested within 186/217/218 ms of the scroll; seen=true,true,true
- console/page errors across runs: none

## EN  (http://localhost:4321/en/)
- requests to load: median 19 (range 19–19)
- transferred to load: median 533.3 KB (range 533.3–577.6 KB)
- DCL median 111.1 ms (110.6–129.3) · load median 118.9 ms (118–134.9)
| bucket | n | transferred KB | decoded KB |
|---|---|---|---|
| html | 1 | 16.2 | (nav/inline) |
| css | 2 | 10.5 | 53.4 |
| js | 6 | 57.7 | 136 |
| font | 4 | 90.1 | 88.9 |
| image | 6 | 403 | 401.5 |

Largest single resources at `load`:
  - 168 KB  /images/hero-shop.webp  [image]
  - 62.7 KB  /images/p-salon.webp  [image]
  - 61.4 KB  /images/p-home.webp  [image]
  - 52 KB  /images/logo-light.png  [image]
  - 39.5 KB  /images/p-multi.webp  [image]
  - 26.9 KB  /_astro/gsap.D1O2useh.js  [js]
  - 26.3 KB  /fonts/jost-300-600-normal-latin.woff2  [font]
  - 23.7 KB  /fonts/cormorant-500-italic-latin.woff2  [font]

Resource set identical across 3 runs: true
three.js requests before `load`: 0, 0, 0  (want 0,0,0)
initial JS transferred: median 13.4 KB (13.4–57.7) · decoded median 26 KB

After scrolling #teknik into view (full page then scrolled):
- total requests 24 (24–24), transferred median 853.7 KB (853.7–853.7 KB)
- delta vs load: +320.5 KB, +5 requests
- three chunk transferred median 179.5 KB, decoded median 707.5 KB
- three requested within 249/237/276 ms of the scroll; seen=true,true,true
- console/page errors across runs: none
