# L7-08 repeat visit / caching — `astro preview` (NOT production)
transferSize 0 = served from memory/disk cache without hitting the network.
A 304 shows up as status 304 with a small encodedDataLength (headers only).

| phase | requests | bytes | from cache (transferSize 0) | 304 revalidations | 200 full re-downloads |
|---|---|---|---|---|---|
| cold | 18 (18–18) | 557.1 KB | 0 | 0 | 19 |
| warm-reload | 18 (18–18) | 3.5 KB | 6 | 12 | 7 |
| warm-nav-de | 18 (18–18) | 3.5 KB | 6 | 11 | 11 |

## What the preview server sends per bucket (run 0, cold phase)
- html: Cache-Control: "no-cache" ETag:false
- font: Cache-Control: "no-cache" ETag:true
- css: Cache-Control: "no-cache" ETag:true
- js: Cache-Control: "no-cache" ETag:true
- image: Cache-Control: "no-cache" ETag:true

## Warm reload, per resource (run 0)
| resource | cold bytes | warm bytes | status on warm |
|---|---|---|---|
| /fonts/cormorant-600-normal-latin.woff2 | 23696 | 300 | 304 |
| /fonts/jost-300-600-normal-latin.woff2 | 26876 | 300 | 304 |
| /_astro/Base.BOhWYFVS.css | 3302 | 300 | 304 |
| /_astro/Home.DV18kdMJ.css | 7376 | 300 | 304 |
| /_astro/ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js | 2430 | 300 | 304 |
| /_astro/Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js | 8082 | 300 | 304 |
| /_astro/Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js | 1910 | 300 | 304 |
| /images/p-duvar.webp | 19884 | 300 | 304 |
| /images/p-salon.webp | 64258 | 300 | 304 |
| /images/p-multi.webp | 40514 | 300 | 304 |
| /images/p-home.webp | 62946 | 300 | 304 |
| /_astro/preload-helper.CxFQXtKk.js | 1029 | 300 | 304 |
| /fonts/cormorant-500-italic-latin-ext.woff2 | 20688 | 0 | 200 |
| /fonts/cormorant-500-italic-latin.woff2 | 24224 | 0 | 200 |
| /fonts/cormorant-600-normal-latin-ext.woff2 | 20604 | 0 | 200 |
| /fonts/jost-300-600-normal-latin-ext.woff2 | 17404 | 0 | 200 |
| /images/logo-light.png | 53232 | 0 | 200 |
| /images/hero-shop.webp | 172062 | 0 | 200 |

## Cross-locale nav / → /de/ (run 0): which assets were reused?
- /fonts/cormorant-600-normal-latin.woff2: 300 bytes status 200 (same URL as previous page)
- /_astro/Base.BOhWYFVS.css: 300 bytes status 304 (same URL as previous page)
- /fonts/jost-300-600-normal-latin.woff2: 300 bytes status 200 (same URL as previous page)
- /_astro/Home.DV18kdMJ.css: 300 bytes status 304 (same URL as previous page)
- /_astro/ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js: 300 bytes status 304 (same URL as previous page)
- /_astro/Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js: 300 bytes status 304 (same URL as previous page)
- /_astro/Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js: 300 bytes status 304 (same URL as previous page)
- /images/p-duvar.webp: 300 bytes status 304 (same URL as previous page)
- /images/p-salon.webp: 300 bytes status 304 (same URL as previous page)
- /images/p-multi.webp: 300 bytes status 304 (same URL as previous page)
- /images/p-home.webp: 300 bytes status 304 (same URL as previous page)
- /_astro/preload-helper.CxFQXtKk.js: 300 bytes status 304 (same URL as previous page)
- /fonts/cormorant-500-italic-latin-ext.woff2: 0 bytes status 200 (same URL as previous page)
- /fonts/cormorant-500-italic-latin.woff2: 0 bytes status 200 (same URL as previous page)
- /fonts/cormorant-600-normal-latin-ext.woff2: 0 bytes status 200 (same URL as previous page)
- /fonts/jost-300-600-normal-latin-ext.woff2: 0 bytes status 200 (same URL as previous page)
- /images/logo-light.png: 0 bytes status 200 (same URL as previous page)
- /images/hero-shop.webp: 0 bytes status 200 (same URL as previous page)