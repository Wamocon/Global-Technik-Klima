# L7-03  precise `load` cut, images, fonts
`load` cut = PerformanceResourceTiming snapshot taken inside a capture-phase `load`
listener installed via addInitScript (runs before any page listener).

## A. Payload strictly before loadEventEnd
| locale/vp | req | transfer KB | html | css | js | font | image |
|---|---|---|---|---|---|---|---|
| tr/mobile | 14 | 373.9 | 0 | 10.4 | 13.1 | 130.4 | 220 |
| de/mobile | 12 | 333.6 | 0 | 10.4 | 13.1 | 90 | 220 |
| ru/mobile | 19 | 552.7 | 0 | 10.4 | 13.1 | 125.9 | 403.2 |
| en/mobile | 12 | 333.6 | 0 | 10.4 | 13.1 | 90 | 220 |
| tr/desktop | 21 | 705.9 | 0 | 10.4 | 13.1 | 130.4 | 552 |
| de/desktop | 12 | 333.6 | 0 | 10.4 | 13.1 | 90 | 220 |
| ru/desktop | 22 | 701.5 | 0 | 10.4 | 13.1 | 125.9 | 552 |
| en/desktop | 12 | 333.6 | 0 | 10.4 | 13.1 | 90 | 220 |

### JS strictly before load (the ~22 KB claim)
- tr/mobile: transfer median 13.1 KB (13.1–13.1) · decoded median 26 KB — files: Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js, Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js, ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js, preload-helper.CxFQXtKk.js
- de/mobile: transfer median 13.1 KB (13.1–13.1) · decoded median 26 KB — files: Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js, Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js, ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js, preload-helper.CxFQXtKk.js
- ru/mobile: transfer median 13.1 KB (13.1–13.1) · decoded median 26 KB — files: Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js, Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js, ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js, preload-helper.CxFQXtKk.js
- en/mobile: transfer median 13.1 KB (13.1–13.1) · decoded median 26 KB — files: Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js, Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js, ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js, preload-helper.CxFQXtKk.js
- tr/desktop: transfer median 13.1 KB (13.1–57.3) · decoded median 26 KB — files: Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js, Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js, ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js, ScrollTrigger.D7MWR7hw.js, gsap.D1O2useh.js, preload-helper.CxFQXtKk.js
- de/desktop: transfer median 13.1 KB (13.1–13.1) · decoded median 26 KB — files: Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js, Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js, ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js, preload-helper.CxFQXtKk.js
- ru/desktop: transfer median 13.1 KB (13.1–13.1) · decoded median 26 KB — files: Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js, Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js, ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js, preload-helper.CxFQXtKk.js
- en/desktop: transfer median 13.1 KB (13.1–13.1) · decoded median 26 KB — files: Assistant.astro_astro_type_script_index_0_lang.BcbU-EHO.js, Base.astro_astro_type_script_index_0_lang.BHPdlKSv.js, ExplodedUnit.astro_astro_type_script_index_0_lang.CJdPwLsS.js, preload-helper.CxFQXtKk.js

### GSAP / ScrollTrigger — before or after load?
- tr/mobile: gsap+ScrollTrigger entries present at load = 0,0,0 · three = 0,0,0
- de/mobile: gsap+ScrollTrigger entries present at load = 0,0,0 · three = 0,0,0
- ru/mobile: gsap+ScrollTrigger entries present at load = 0,0,0 · three = 0,0,0
- en/mobile: gsap+ScrollTrigger entries present at load = 0,0,0 · three = 0,0,0
- tr/desktop: gsap+ScrollTrigger entries present at load = 0,0,2 · three = 0,0,0
- de/desktop: gsap+ScrollTrigger entries present at load = 0,0,0 · three = 0,0,0
- ru/desktop: gsap+ScrollTrigger entries present at load = 0,0,0 · three = 0,0,0
- en/desktop: gsap+ScrollTrigger entries present at load = 0,0,0 · three = 0,0,0

## B. Images — over-delivery

### tr/mobile  (doc height 16616px, viewport 844px, DPR 2)
| src | intrinsic | css box | device px needed | over-deliver | loading | w/h attr | below fold? | loaded at `load`? |
|---|---|---|---|---|---|---|---|---|
| /images/p-duvar.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (2743px) | true |
| /images/p-salon.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3063px) | true |
| /images/p-multi.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3383px) | true |
| /images/p-home.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3704px) | true |
| /images/p-isipompasi.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4024px) | false |
| /images/p-ticari.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4345px) | false |
| /images/p-yedek.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4665px) | false |
| /images/ba-cool.webp | 0x0 | 340x309 | 680x618 | 0x area | lazy | 1100x1001 | yes (8600px) | false |
| /images/ba-hot.webp | 0x0 | 340x309 | 680x618 | 0x area | lazy | 1100x1001 | yes (8600px) | false |
| /images/unit-teal.webp | 0x0 | 0x0 | 0x0 | NaNx area | lazy | 704x607 | NO — above fold | false |

CSS background images present: /images/logo-light.png, /images/hero-shop.webp
  - span.blogo: /images/logo-light.png box 73x26 @docTop 19
  - div.hero-photo: /images/hero-shop.webp box 413x1132 @docTop -56

Image bytes before load: 403.2 KB over 6 files:
  - 168 KB /images/hero-shop.webp (initiator css)
  - 62.8 KB /images/p-salon.webp (initiator img)
  - 61.5 KB /images/p-home.webp (initiator img)
  - 52 KB /images/logo-light.png (initiator css)
  - 39.6 KB /images/p-multi.webp (initiator img)
  - 19.4 KB /images/p-duvar.webp (initiator img)

### de/mobile  (doc height 16999px, viewport 844px, DPR 2)
| src | intrinsic | css box | device px needed | over-deliver | loading | w/h attr | below fold? | loaded at `load`? |
|---|---|---|---|---|---|---|---|---|
| /images/p-duvar.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (2868px) | false |
| /images/p-salon.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3188px) | false |
| /images/p-multi.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3509px) | false |
| /images/p-home.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3829px) | false |
| /images/p-isipompasi.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4149px) | false |
| /images/p-ticari.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4470px) | false |
| /images/p-yedek.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4790px) | false |
| /images/ba-cool.webp | 0x0 | 340x309 | 680x618 | 0x area | lazy | 1100x1001 | yes (8929px) | false |
| /images/ba-hot.webp | 0x0 | 340x309 | 680x618 | 0x area | lazy | 1100x1001 | yes (8929px) | false |
| /images/unit-teal.webp | 0x0 | 0x0 | 0x0 | NaNx area | lazy | 704x607 | NO — above fold | false |

CSS background images present: /images/logo-light.png, /images/hero-shop.webp
  - span.blogo: /images/logo-light.png box 73x26 @docTop 19
  - div.hero-photo: /images/hero-shop.webp box 413x1262 @docTop -70

Image bytes before load: 220 KB over 2 files:
  - 168 KB /images/hero-shop.webp (initiator css)
  - 52 KB /images/logo-light.png (initiator css)

### ru/mobile  (doc height 17003px, viewport 844px, DPR 2)
| src | intrinsic | css box | device px needed | over-deliver | loading | w/h attr | below fold? | loaded at `load`? |
|---|---|---|---|---|---|---|---|---|
| /images/p-duvar.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (2718px) | true |
| /images/p-salon.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3038px) | true |
| /images/p-multi.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3359px) | true |
| /images/p-home.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3679px) | true |
| /images/p-isipompasi.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (3999px) | false |
| /images/p-ticari.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4320px) | false |
| /images/p-yedek.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4640px) | false |
| /images/ba-cool.webp | 0x0 | 340x309 | 680x618 | 0x area | lazy | 1100x1001 | yes (8895px) | false |
| /images/ba-hot.webp | 0x0 | 340x309 | 680x618 | 0x area | lazy | 1100x1001 | yes (8895px) | false |
| /images/unit-teal.webp | 0x0 | 0x0 | 0x0 | NaNx area | lazy | 704x607 | NO — above fold | false |

CSS background images present: /images/logo-light.png, /images/hero-shop.webp
  - span.blogo: /images/logo-light.png box 73x26 @docTop 19
  - div.hero-photo: /images/hero-shop.webp box 413x1132 @docTop -56

Image bytes before load: 403.2 KB over 6 files:
  - 168 KB /images/hero-shop.webp (initiator css)
  - 62.8 KB /images/p-salon.webp (initiator img)
  - 61.5 KB /images/p-home.webp (initiator img)
  - 52 KB /images/logo-light.png (initiator css)
  - 39.6 KB /images/p-multi.webp (initiator img)
  - 19.4 KB /images/p-duvar.webp (initiator img)

### en/mobile  (doc height 16620px, viewport 844px, DPR 2)
| src | intrinsic | css box | device px needed | over-deliver | loading | w/h attr | below fold? | loaded at `load`? |
|---|---|---|---|---|---|---|---|---|
| /images/p-duvar.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (2758px) | true |
| /images/p-salon.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3078px) | true |
| /images/p-multi.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3399px) | true |
| /images/p-home.webp | 960x600 | 347x255 | 694x510 | 1.63x area | lazy | 480x300 | yes (3719px) | true |
| /images/p-isipompasi.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4039px) | false |
| /images/p-ticari.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4360px) | false |
| /images/p-yedek.webp | 0x0 | 347x255 | 694x510 | 0x area | lazy | 480x300 | yes (4680px) | false |
| /images/ba-cool.webp | 0x0 | 340x309 | 680x618 | 0x area | lazy | 1100x1001 | yes (8767px) | false |
| /images/ba-hot.webp | 0x0 | 340x309 | 680x618 | 0x area | lazy | 1100x1001 | yes (8767px) | false |
| /images/unit-teal.webp | 0x0 | 0x0 | 0x0 | NaNx area | lazy | 704x607 | NO — above fold | false |

CSS background images present: /images/logo-light.png, /images/hero-shop.webp
  - span.blogo: /images/logo-light.png box 73x26 @docTop 19
  - div.hero-photo: /images/hero-shop.webp box 413x1183 @docTop -61

Image bytes before load: 403.2 KB over 6 files:
  - 168 KB /images/hero-shop.webp (initiator css)
  - 62.8 KB /images/p-salon.webp (initiator img)
  - 61.5 KB /images/p-home.webp (initiator img)
  - 52 KB /images/logo-light.png (initiator css)
  - 39.6 KB /images/p-multi.webp (initiator img)
  - 19.4 KB /images/p-duvar.webp (initiator img)

### tr/desktop  (doc height 11137px, viewport 900px, DPR 1)
| src | intrinsic | css box | device px needed | over-deliver | loading | w/h attr | below fold? | loaded at `load`? |
|---|---|---|---|---|---|---|---|---|
| /images/p-duvar.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2067px) | false |
| /images/p-salon.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2067px) | false |
| /images/p-multi.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2067px) | false |
| /images/p-home.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2404px) | false |
| /images/p-isipompasi.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2404px) | false |
| /images/p-ticari.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2404px) | false |
| /images/p-yedek.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2741px) | false |
| /images/ba-cool.webp | 0x0 | 1130x635 | 1130x635 | 0x area | lazy | 1100x1001 | yes (5441px) | false |
| /images/ba-hot.webp | 0x0 | 1130x635 | 1130x635 | 0x area | lazy | 1100x1001 | yes (5441px) | false |
| /images/unit-teal.webp | 0x0 | 524x452 | 524x452 | 0x area | lazy | 704x607 | yes (6513px) | false |

CSS background images present: /images/logo-light.png, /images/hero-shop.webp
  - span.blogo: /images/logo-light.png box 96x34 @docTop 14
  - div.hero-photo: /images/hero-shop.webp box 1526x1174 @docTop -63

Image bytes before load: 220 KB over 2 files:
  - 168 KB /images/hero-shop.webp (initiator css)
  - 52 KB /images/logo-light.png (initiator css)

### de/desktop  (doc height 11391px, viewport 900px, DPR 1)
| src | intrinsic | css box | device px needed | over-deliver | loading | w/h attr | below fold? | loaded at `load`? |
|---|---|---|---|---|---|---|---|---|
| /images/p-duvar.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2125px) | false |
| /images/p-salon.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2125px) | false |
| /images/p-multi.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2125px) | false |
| /images/p-home.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2462px) | false |
| /images/p-isipompasi.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2462px) | false |
| /images/p-ticari.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2462px) | false |
| /images/p-yedek.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2798px) | false |
| /images/ba-cool.webp | 0x0 | 1130x635 | 1130x635 | 0x area | lazy | 1100x1001 | yes (5598px) | false |
| /images/ba-hot.webp | 0x0 | 1130x635 | 1130x635 | 0x area | lazy | 1100x1001 | yes (5598px) | false |
| /images/unit-teal.webp | 0x0 | 524x452 | 524x452 | 0x area | lazy | 704x607 | yes (6696px) | false |

CSS background images present: /images/logo-light.png, /images/hero-shop.webp
  - span.blogo: /images/logo-light.png box 96x34 @docTop 14
  - div.hero-photo: /images/hero-shop.webp box 1526x1174 @docTop -63

Image bytes before load: 220 KB over 2 files:
  - 168 KB /images/hero-shop.webp (initiator css)
  - 52 KB /images/logo-light.png (initiator css)

### ru/desktop  (doc height 11306px, viewport 900px, DPR 1)
| src | intrinsic | css box | device px needed | over-deliver | loading | w/h attr | below fold? | loaded at `load`? |
|---|---|---|---|---|---|---|---|---|
| /images/p-duvar.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2092px) | true |
| /images/p-salon.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2092px) | true |
| /images/p-multi.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2092px) | true |
| /images/p-home.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2429px) | true |
| /images/p-isipompasi.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2429px) | true |
| /images/p-ticari.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2429px) | true |
| /images/p-yedek.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2765px) | true |
| /images/ba-cool.webp | 0x0 | 1130x635 | 1130x635 | 0x area | lazy | 1100x1001 | yes (5562px) | false |
| /images/ba-hot.webp | 0x0 | 1130x635 | 1130x635 | 0x area | lazy | 1100x1001 | yes (5562px) | false |
| /images/unit-teal.webp | 0x0 | 524x452 | 524x452 | 0x area | lazy | 704x607 | yes (6660px) | false |

CSS background images present: /images/logo-light.png, /images/hero-shop.webp
  - span.blogo: /images/logo-light.png box 96x34 @docTop 14
  - div.hero-photo: /images/hero-shop.webp box 1526x1174 @docTop -63

Image bytes before load: 552 KB over 9 files:
  - 168 KB /images/hero-shop.webp (initiator css)
  - 81.9 KB /images/p-isipompasi.webp (initiator img)
  - 62.8 KB /images/p-salon.webp (initiator img)
  - 61.5 KB /images/p-home.webp (initiator img)
  - 52 KB /images/logo-light.png (initiator css)
  - 39.6 KB /images/p-multi.webp (initiator img)
  - 34.9 KB /images/p-yedek.webp (initiator img)
  - 31.9 KB /images/p-ticari.webp (initiator img)
  - 19.4 KB /images/p-duvar.webp (initiator img)

### en/desktop  (doc height 11232px, viewport 900px, DPR 1)
| src | intrinsic | css box | device px needed | over-deliver | loading | w/h attr | below fold? | loaded at `load`? |
|---|---|---|---|---|---|---|---|---|
| /images/p-duvar.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2092px) | false |
| /images/p-salon.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2092px) | false |
| /images/p-multi.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2092px) | false |
| /images/p-home.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2429px) | false |
| /images/p-isipompasi.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2429px) | false |
| /images/p-ticari.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2429px) | false |
| /images/p-yedek.webp | 960x600 | 373x274 | 373x274 | 5.64x area | lazy | 480x300 | yes (2765px) | false |
| /images/ba-cool.webp | 0x0 | 1130x635 | 1130x635 | 0x area | lazy | 1100x1001 | yes (5489px) | false |
| /images/ba-hot.webp | 0x0 | 1130x635 | 1130x635 | 0x area | lazy | 1100x1001 | yes (5489px) | false |
| /images/unit-teal.webp | 0x0 | 524x452 | 524x452 | 0x area | lazy | 704x607 | yes (6586px) | false |

CSS background images present: /images/logo-light.png, /images/hero-shop.webp
  - span.blogo: /images/logo-light.png box 96x34 @docTop 14
  - div.hero-photo: /images/hero-shop.webp box 1526x1174 @docTop -63

Image bytes before load: 220 KB over 2 files:
  - 168 KB /images/hero-shop.webp (initiator css)
  - 52 KB /images/logo-light.png (initiator css)

## C. Fonts

### tr/mobile
- preload links: /fonts/cormorant-600-normal-latin.woff2 as=font | /fonts/jost-300-600-normal-latin.woff2 as=font
- font files fetched before load: 6, 130.4 KB
   · 26.2 KB /fonts/jost-300-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 23.7 KB /fonts/cormorant-500-italic-latin.woff2 (initiator css, rb non-blocking)
   · 23.1 KB /fonts/cormorant-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 20.2 KB /fonts/cormorant-500-italic-latin-ext.woff2 (initiator css, rb non-blocking)
   · 20.1 KB /fonts/cormorant-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
   · 17 KB /fonts/jost-300-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
- FontFace objects with status 'loaded' (= actually matched to text): 6/9
   · Cormorant Garamond italic 500 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Cormorant Garamond italic 500 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Cormorant Garamond normal 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Cormorant Garamond normal 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Jost normal 300 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Jost normal 300 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
- Cyrillic subsets fetched: none
- preload-related console warnings: none

### de/mobile
- preload links: /fonts/cormorant-600-normal-latin.woff2 as=font | /fonts/jost-300-600-normal-latin.woff2 as=font
- font files fetched before load: 4, 90 KB
   · 26.2 KB /fonts/jost-300-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 23.7 KB /fonts/cormorant-500-italic-latin.woff2 (initiator css, rb non-blocking)
   · 23.1 KB /fonts/cormorant-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 17 KB /fonts/jost-300-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
- FontFace objects with status 'loaded' (= actually matched to text): 4/9
   · Cormorant Garamond italic 500 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Cormorant Garamond normal 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Jost normal 300 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Jost normal 300 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
- Cyrillic subsets fetched: none
- preload-related console warnings: none

### ru/mobile
- preload links: /fonts/cormorant-600-normal-latin.woff2 as=font | /fonts/jost-300-600-normal-latin.woff2 as=font
- font files fetched before load: 7, 125.9 KB
   · 26.2 KB /fonts/jost-300-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 23.7 KB /fonts/cormorant-500-italic-latin.woff2 (initiator css, rb non-blocking)
   · 23.1 KB /fonts/cormorant-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 17 KB /fonts/jost-300-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
   · 13 KB /fonts/cormorant-600-normal-cyrillic.woff2 (initiator css, rb non-blocking)
   · 12.7 KB /fonts/cormorant-500-italic-cyrillic.woff2 (initiator css, rb non-blocking)
   · 10.2 KB /fonts/jost-300-600-normal-cyrillic.woff2 (initiator css, rb non-blocking)
- FontFace objects with status 'loaded' (= actually matched to text): 7/9
   · Cormorant Garamond italic 500 display=swap range=U+301, U+400-45F, U+490-491, U+4B0-4B1, …
   · Cormorant Garamond italic 500 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Cormorant Garamond normal 600 display=swap range=U+301, U+400-45F, U+490-491, U+4B0-4B1, …
   · Cormorant Garamond normal 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Jost normal 300 600 display=swap range=U+301, U+400-45F, U+490-491, U+4B0-4B1, …
   · Jost normal 300 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Jost normal 300 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
- Cyrillic subsets fetched: /fonts/cormorant-600-normal-cyrillic.woff2, /fonts/cormorant-500-italic-cyrillic.woff2, /fonts/jost-300-600-normal-cyrillic.woff2
- preload-related console warnings: none

### en/mobile
- preload links: /fonts/cormorant-600-normal-latin.woff2 as=font | /fonts/jost-300-600-normal-latin.woff2 as=font
- font files fetched before load: 4, 90 KB
   · 26.2 KB /fonts/jost-300-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 23.7 KB /fonts/cormorant-500-italic-latin.woff2 (initiator css, rb non-blocking)
   · 23.1 KB /fonts/cormorant-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 17 KB /fonts/jost-300-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
- FontFace objects with status 'loaded' (= actually matched to text): 4/9
   · Cormorant Garamond italic 500 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Cormorant Garamond normal 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Jost normal 300 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Jost normal 300 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
- Cyrillic subsets fetched: none
- preload-related console warnings: none

### tr/desktop
- preload links: /fonts/cormorant-600-normal-latin.woff2 as=font | /fonts/jost-300-600-normal-latin.woff2 as=font
- font files fetched before load: 6, 130.4 KB
   · 26.2 KB /fonts/jost-300-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 23.7 KB /fonts/cormorant-500-italic-latin.woff2 (initiator css, rb non-blocking)
   · 23.1 KB /fonts/cormorant-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 20.2 KB /fonts/cormorant-500-italic-latin-ext.woff2 (initiator css, rb non-blocking)
   · 20.1 KB /fonts/cormorant-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
   · 17 KB /fonts/jost-300-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
- FontFace objects with status 'loaded' (= actually matched to text): 6/9
   · Cormorant Garamond italic 500 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Cormorant Garamond italic 500 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Cormorant Garamond normal 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Cormorant Garamond normal 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Jost normal 300 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Jost normal 300 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
- Cyrillic subsets fetched: none
- preload-related console warnings: none

### de/desktop
- preload links: /fonts/cormorant-600-normal-latin.woff2 as=font | /fonts/jost-300-600-normal-latin.woff2 as=font
- font files fetched before load: 4, 90 KB
   · 26.2 KB /fonts/jost-300-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 23.7 KB /fonts/cormorant-500-italic-latin.woff2 (initiator css, rb non-blocking)
   · 23.1 KB /fonts/cormorant-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 17 KB /fonts/jost-300-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
- FontFace objects with status 'loaded' (= actually matched to text): 4/9
   · Cormorant Garamond italic 500 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Cormorant Garamond normal 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Jost normal 300 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Jost normal 300 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
- Cyrillic subsets fetched: none
- preload-related console warnings: none

### ru/desktop
- preload links: /fonts/cormorant-600-normal-latin.woff2 as=font | /fonts/jost-300-600-normal-latin.woff2 as=font
- font files fetched before load: 7, 125.9 KB
   · 26.2 KB /fonts/jost-300-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 23.7 KB /fonts/cormorant-500-italic-latin.woff2 (initiator css, rb non-blocking)
   · 23.1 KB /fonts/cormorant-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 17 KB /fonts/jost-300-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
   · 13 KB /fonts/cormorant-600-normal-cyrillic.woff2 (initiator css, rb non-blocking)
   · 12.7 KB /fonts/cormorant-500-italic-cyrillic.woff2 (initiator css, rb non-blocking)
   · 10.2 KB /fonts/jost-300-600-normal-cyrillic.woff2 (initiator css, rb non-blocking)
- FontFace objects with status 'loaded' (= actually matched to text): 7/9
   · Cormorant Garamond italic 500 display=swap range=U+301, U+400-45F, U+490-491, U+4B0-4B1, …
   · Cormorant Garamond italic 500 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Cormorant Garamond normal 600 display=swap range=U+301, U+400-45F, U+490-491, U+4B0-4B1, …
   · Cormorant Garamond normal 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Jost normal 300 600 display=swap range=U+301, U+400-45F, U+490-491, U+4B0-4B1, …
   · Jost normal 300 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Jost normal 300 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
- Cyrillic subsets fetched: /fonts/cormorant-600-normal-cyrillic.woff2, /fonts/cormorant-500-italic-cyrillic.woff2, /fonts/jost-300-600-normal-cyrillic.woff2
- preload-related console warnings: none

### en/desktop
- preload links: /fonts/cormorant-600-normal-latin.woff2 as=font | /fonts/jost-300-600-normal-latin.woff2 as=font
- font files fetched before load: 4, 90 KB
   · 26.2 KB /fonts/jost-300-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 23.7 KB /fonts/cormorant-500-italic-latin.woff2 (initiator css, rb non-blocking)
   · 23.1 KB /fonts/cormorant-600-normal-latin.woff2 (initiator link, rb non-blocking)
   · 17 KB /fonts/jost-300-600-normal-latin-ext.woff2 (initiator css, rb non-blocking)
- FontFace objects with status 'loaded' (= actually matched to text): 4/9
   · Cormorant Garamond italic 500 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Cormorant Garamond normal 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
   · Jost normal 300 600 display=swap range=U+100-2BA, U+2BD-2C5, U+2C7-2CC, U+2CE-2…
   · Jost normal 300 600 display=swap range=U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2…
- Cyrillic subsets fetched: none
- preload-related console warnings: none