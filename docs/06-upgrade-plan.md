# 06 — Code Review & Upgrade Plan

Internal build document. Written in English (the other docs 01–05 are the client-facing
German set). Basis: the filled client questionnaire
(`Fragebogen_Website_optimiert tr_5160.docx`, returned 29.07.2026) plus a full read of
the current source at commit `a38e360`.

---

## Part 1 — Code Review

### 1.1 The honest headline

This is **not** a basic landing page that needs rescuing. It is a carefully built
4-language site with a real design system, calculated accessibility, a build-time
guard, and an 8-context browser acceptance suite. The upgrade job is **extend and
elevate**, not **fix and replace**.

What already exists and should be protected:

| Asset | Where |
|---|---|
| Canvas particle hero (hot→cool colour transition, idle-scheduled, visibility-aware) | `src/components/FrostHero.astro` |
| three.js exploded unit, procedural geometry, camera fitted by NDC projection, scroll-driven, lazy-imported | `src/components/ExplodedUnit.astro` |
| WCAG-AAA colour tokens with contrast ratios computed, not guessed | `src/styles/tokens.css` |
| Build guard: Turkish dotted-i trap, Google-Fonts ban, glossary bans, per-string length budgets, `blocked` register | `scripts/guard.mjs` |
| Playwright acceptance suite, 4 locales × 2 viewports | `scripts/acceptance.mjs` |
| Self-hosted fonts, JSON-LD, i18n sitemap + hreflang | `public/fonts`, `Schema.astro`, `astro.config.mjs` |

**Rule for this upgrade: `npm run abnahme` must stay at 0 errors.** That suite is the
verification loop. Every phase below ends with it green.

### 1.2 Findings

Severity: **H** = blocks go-live · **M** = fix during this upgrade · **L** = tidy-up.

---

**F1 · H · The map ships as a KVKK violation.**
`src/content/home.ts:614` sets `mapMode: 'embed'`. The comment directly above states
this is the **demo** setting and that `'consent'` is required for go-live, because a
Google iframe connects the visitor's browser to Google — a cross-border transfer under
KVKK Art. 9. The legal texts already claim the map loads only after consent. Today the
code and the legal text contradict each other.
*Fix: one word. Must happen before any production deploy.*

---

**F2 · H · There is no e-mail address on the site, and that was deliberate.**
`src/i18n/ui.ts:159-162`: `email: null`, because the business's real address is a Gmail
account and Kurul decision 2019/157 treats Gmail use as itself a cross-border transfer.

This directly collides with the client's new requests (Q15: e-mail contact; Q16: quote
form; Q21: automatic appointment booking). **Any form that delivers to Gmail reproduces
exactly the transfer this decision was made to avoid.**

*Three ways out, in order of preference:*
1. Explicit consent (`açık rıza`) checkbox on every form + named disclosure of where the
   data goes. KVKK Art. 9 permits transfer with explicit consent. Cheapest, legal, honest.
2. Turkish-hosted mailbox on the new domain (`info@alanyaglobalteknik.com.tr` at a
   Turkish registrar) — removes the problem at the root, and looks more professional
   than Gmail anyway.
3. Deliver to WhatsApp Business API only — but Meta is also a foreign transfer, so this
   solves nothing on its own.

**Recommendation: 2 + 1 together.** The new domain is being bought anyway; add mail to it.

---

**F3 · H · Warranty — RESOLVED, and there is a deadline.**
*Corrected after reading `docs/02-glossar.md`. My first pass called this "blocked pending
the Gree document". The document is already in this repo.*

[`02-glossar.md:132-141`](02-glossar.md) records the researched Gree table:

| Rule | Term |
|---|---|
| Manufacturer warranty, all parts incl. compressor | **3 years** |
| Extension to **10 years**, wall units, **Aphro excluded**, installed by the contract service | **expires 31.07.2026** |
| **6 years** for I-Shine and Multisplit, installed by the TLC contract service | to 31.12.2026 |
| Maximum repair time | 20 working days |

So the client's *"10 yıla varan garanti"* is **accurate, not a marketing claim.** But the
glossary's advice to put it in the hero was written on 9 July, when 22 days remained.
**Today is 30 July — that campaign expires tomorrow.**

*Therefore: do NOT feature the 10-year figure. It would be a one-day banner and a support
burden every time a later customer asks for it.* The **6-year** campaign (I-Shine and
Multisplit, to 31.12.2026) has five months of runway and is the one worth featuring.

The glossary also rules that warranty terms are **invariant facts**: they belong in the
CMS with a visible as-of date and are never written as prose in any language. Re-check
against `gree.com.tr/sayfa/garanti-sartlari` on the day of go-live.

The site's current text — a 3-year badge plus "extended campaign applies" with no figure
— is accurate and safe. It stays until someone decides on the 6-year line.

---

**F4 · M · `guard.mjs`'s `blocked` register has gone decorative for one key.**
`ui.ts:38-44` marks `hero.eyebrow` as blocked because *"Servicepartner (yetkili servis)
unbelegt"*. But `home.ts` ships "Yetkili Bayi ve Servisi" in all four languages, with a
comment at `home.ts:7` arguing the business asserts both publicly itself.

That argument is defensible — repeating the client's own public claim is different from
inventing one. But the guard now flags a restriction the code ignores, which trains
everyone to ignore the guard. *Either lift the block with the reasoning recorded, or
honour it. Pick one.*

---

**F5 · M · Nothing below the hero animates.**
This is the actual "wow gap", and it is the real answer to the client's request. The hero
has staggered line reveals, a drawn rule, a gradient sheen and a particle canvas. Every
section after it simply exists — `Home.astro` renders static cards with hover transforms
only. Scroll down and the site goes flat after 900 px.

---

**F6 · M · Products read as a catalogue, not as premium.**
`Home.astro:52-57`: flat `<img>` on a light plate with `mix-blend-mode: multiply`. Seven
identical tiles, no depth, no motion, no reason to look twice.

---

**F7 · M · `html { scroll-behavior: smooth }` will fight any scroll library.**
`src/styles/global.css:31`. Native smooth scroll and GSAP ScrollTrigger/ScrollSmoother
compete for the same scroll position and produce jitter. Must be removed if scroll
orchestration is added.

---

**F8 · M · The site's configured domain is the old one.**
`astro.config.mjs:20`: `site: 'https://alanyagreeyetkilibayi.com.tr'`. This feeds
canonical, hreflang, sitemap and `og:url`. The client wants
`alanyaglobalteknik.com.tr` ("YENİ ALMAK İSTİYORUM"). One constant, wide blast radius.

---

**F9 · M · Social proof is thin in exactly the markets they target.**
`home.ts` carries three real Turkish Google reviews. German, Russian and English each
carry **one** real review plus **one labelled "example"** review. The labelling is
honest — but the client's stated audience is explicitly German- and Russian-speaking
property owners, and a placeholder review is weak proof for them.
*Ask the client to collect 2–3 reviews per language, or replace the device with something
that doesn't need fabrication (e.g. a review count + a link to the live Google profile).*

---

**F10 · M · Adding analytics means rewriting the legal texts.**
`src/content/legal.ts:57, 175, 281, 387, 452` state in all four languages that there is
no Google Analytics, no pixel, no tracking. The client's Q16/Q23 explicitly ask for GA4,
Search Console and conversion tracking. That is a consent banner **plus** a rewrite of
three legal documents in four languages — twelve texts.

---

**F14 · H · `--card` was never defined — every card surface on the page was invisible.**
*Found after the first review pass, while handling a design-hook finding. It is the most
consequential item in this document.*

`var(--card)` appeared at **11 places** — `.card`, `.tile`, `.rev`, `.warranty`, `.cr`,
`.prod` — and was declared nowhere. An undefined custom property makes the whole
declaration invalid, so every one of those surfaces computed to `rgba(0, 0, 0, 0)`:
fully transparent. Verified in the browser, not assumed.

**This, and not the gradients, was the real reason the page went flat below the hero.**
The cards were never cards. They were outlines on the section background, so no shadow
could land and no elevation could read. Chasing this with more animation would have
treated a symptom.

*Fixed:* `--card: #17120f` for the dark theme, `var(--bg-3)` for light. The dark value
sits one blue bit below the existing `--noir-2` (`#171310`) on purpose — `--noir-2` puts
`--stone` at 6.98:1 and misses AAA by two hundredths, while `#17120f` holds 7.02:1. All
four foreground tokens verified AAA, computed rather than guessed, as the rest of
`tokens.css` requires.

---

**F11 · L · Duplicated `.wrap` rule.** Defined at `global.css:27` and again at
`Home.astro:239`, identically. Delete the local copy.

**F12 · L · Radius token contradicts itself.** `tokens.css:45` declares
`--radius: 2px` with the comment "sharp. Only chat and WhatsApp go soft", but
`FrostHero.astro:115` hardcodes `border-radius: 6px` on the rating badge. Promote a
second token rather than a magic number.

**F13 · L · Three sections have no `id`.** "Why us", "Reviews" and the warranty block
can't be linked to. Cheap to add; useful once there's more navigation.

### 1.3 Quality gates that must stay green

`scripts/acceptance.mjs` asserts these selectors and counts. Breaking any of them fails
the build — treat the list as a contract:

- `.sdiv` ≥ 3 (eight-star dividers) · footer `.fl a` **exactly** 3 · 404 `.ways li` **exactly** 4
- `#chatfab`, `#chatpanel`, `#cin`, `#cform`, `#cclose`
- `#expCanvas` with non-zero dimensions · `#expLegend li.on` ≥ 1
- `#ba` with a `--pos` custom property · `#baRange` responding to `input`
- `.cmap iframe` ≥ 200 px tall · `[data-rating]` ≥ 24 px tall
- `.wafab` visible on desktop · `.mobar` visible on mobile
- `#burger` + `#mobnav` with ≥ 6 links, closed on load, closes on Escape and on link click
- JSON-LD: `HVACBusiness`, `aggregateRating` = 5, `geo`, `openingHoursSpecification`,
  `hasOfferCatalog` with **exactly 6** items, and **no** `foundingDate` / `priceRange`
- Sitemap ≥ 16 URLs, `/404` excluded · zero console errors · zero horizontal overflow

---

## Part 2 — Brand & Visual Direction

### 2.1 The logo problem

The client attached their real logo: a grey **GLOBAL** / **TEKNİK** wordmark, a navy
globe replacing the O, and a red rule between the two words.

**It is not usable as delivered.** What arrived is a 1600×1600 JPEG with a blurred office
photograph behind it, no transparency. Worse, the wordmark is mid-grey — on this site's
near-black background it would fall below AA contrast and look muddy.

*Needed from the client: the vector original (AI, EPS, PDF or SVG), or at minimum a
transparent PNG at 1000 px+.* Until it arrives, the header keeps its typographic wordmark
— which is a legitimate premium choice, not a placeholder, and avoids shipping a badly
cut-out logo.

I will **not** hand-rebuild their logo as SVG. A redrawn globe would be visibly wrong and
it is their trademark.

### 2.2 Palette: extend, don't replace

The tempting move is to repalette the whole site to the logo's navy/red/white. That would
be a mistake: it discards the computed AAA contrast set, and navy-red-white is the most
generic HVAC look on the internet.

The better move — and the reason it works — is that **`tokens.css` already contains the
logo's colours**:

```
--gree-blue:  #2a418e   /* ≈ the globe navy */
--gree-ember: #ea3d14   /* ≈ the red rule — 4.77:1 on noir, AA */
```

They were added as accents and never used. So:

| Role | Colour | Use |
|---|---|---|
| Base | `--noir` warm near-black | unchanged |
| Structure | **new** deep navy pole derived from `--gree-blue` | section gradients, depth, card interiors |
| Accent | `--champ` champagne | unchanged — this is what reads as expensive, and it's AAA |
| Cool | `--petrol-lt` | unchanged — semantically correct for air conditioning |
| Signal | `--gree-ember` red | **one** job only: urgency (emergency service, live badge). Never decorative. |

Result: on-brand with the logo, keeps the premium noir, keeps every contrast guarantee,
and the red gains meaning by being rare.

### 2.3 Motion language

The client asked for "more animation, gradients, GSAP, scroll effects". The honest
professional caveat, stated once:

> Premium is restraint executed precisely. Cheap is many effects. If I simply pile
> animation onto this site I will destroy the exact quality being asked for.

So: **one motion system, applied consistently to every section** — not a collection of
effects. The hero already defines the vocabulary; the rest of the page will speak it.

The vocabulary, extended from `FrostHero`:

- **Settle** — content arrives from below with a blur-to-sharp resolve. Already in the
  hero (`@keyframes settle`). Becomes the standard section entrance.
- **Draw** — rules and dividers draw from their origin. Already in the hero (`@keyframes draw`).
- **Sheen** — a slow gradient traverse on headline accents. Already in the hero.
- **Lift** — the only hover: 2 px rise plus border warm-up. Already on cards.

Constraints, per `CLAUDE.md`:
- UI interactions (hover, tap, panel open) stay **under 300 ms** with `--ease`
  `cubic-bezier(.19,1,.22,1)`. Never a CSS default keyword.
- Scroll-**linked** motion is exempt from the 300 ms rule — it is bound to scroll
  position, not to a duration.
- `transform` and `opacity` only. No animated layout properties.
- Every animation has a `prefers-reduced-motion` off-switch. `global.css:67` already kills
  all animation globally under that query — new work must not bypass it.

### 2.4 GSAP: yes, but lazily

GSAP core + ScrollTrigger is roughly 30 KB gzipped. Acceptable — but only on the same
terms as three.js, which is already correctly lazy (`ExplodedUnit.astro:100`,
`await import('three')`). GSAP loads on the same idle/intersection trigger.

- **ScrollTrigger** — section entrances, pinned product reveal, parallax depth.
- **Not ScrollSmoother.** It hijacks native scrolling, hurts mobile, and would fight the
  existing rAF loops in the hero canvas and the three.js scene. Remove
  `scroll-behavior: smooth` (F7) and let the browser scroll natively.
- The exploded unit keeps its own rAF driver. It works, it is tuned, and handing its
  progress to ScrollTrigger buys nothing.

---

## Part 3 — Build Plan

Nine phases. Each ends with `npm run abnahme` green. Phases 1–3 are the visual upgrade;
4–7 are the client's functional asks; 8–9 are go-live.

### Phase 1 — Foundation *(no blockers)*
Extend `tokens.css` with the navy structural pole, a gradient scale, elevation tokens and
motion tokens. Fix F7 (`scroll-behavior`), F11 (duplicate `.wrap`), F12 (radius token),
F13 (missing section ids). Install GSAP, add a lazy `reveal` utility module.
*No visual change yet — this is the substrate.*

### Phase 2 — Motion system *(no blockers)*
Apply **settle** / **draw** to every section entrance via ScrollTrigger. Gradient
treatment on section transitions so the page stops being flat below the hero. Parallax
depth on the star dividers. Counter animation on the About stats.
*This is the phase that answers "wow factor".*

### Phase 3 — Product & image treatment *(no blockers)*
Rebuild the product grid: depth, gradient plates, a pinned horizontal reveal on desktop
that degrades to a scroll-snap rail on mobile. Ken-Burns drift on the hero photo. Reveal
masks on the before/after slider.

### Phase 4 — Brand integration *(blocked: logo vector)*
Real logo in the header and footer, favicon and `og.jpg` regenerated from it, red signal
colour wired to the emergency/urgency surfaces.

### Phase 5 — B2B / project section *(no blockers)*
The biggest content gap between what the client said and what exists. Hotels, apart
hotels, residences, site management, restaurants, offices, public bodies, contractors →
VRF, Multi-Split, project planning, site survey, after-sales. Own section, own CTA
("Proje teklifi isteyin"), own JSON-LD service entries.
**Careful:** the acceptance suite asserts `hasOfferCatalog` has *exactly 6* items. Adding
services means updating `acceptance.mjs` in the same commit, deliberately.

### Phase 6 — Forms *(blocked: F2 decision + mailbox)*
Contact, quote request, and survey/service request. One `api/lead.js` beside the existing
`api/chat.js`. KVKK consent checkbox, honeypot + rate limit, delivery to the new
Turkish-hosted mailbox, prefilled WhatsApp fallback. Success and failure states in all
four languages.

### Phase 7 — Content pages & CMS *(blocked: CMS decision)*
Product detail pages, campaign pages, optional blog. Git-based CMS (Sveltia or Decap) so
the client edits without a developer. This decision determines whether Phases 5 and 7 are
cheap or expensive — settle it before Phase 5 ships.

### Phase 8 — Analytics & legal *(blocked: lawyer)*
GA4 + Search Console + conversion events behind a KVKK consent banner. Rewrite three legal
documents × four languages (F10). Flip `mapMode` to `'consent'` (F1).

### Phase 9 — Go-live
Domain switch (F8), redirects from the old domain, warranty text resolved (F3), real
project photos in, `blocked` register cleared or documented (F4), real reviews per
language (F9), full acceptance run, Lighthouse pass.

### Dependency summary

```
Phases 1 → 2 → 3      run now, nothing blocking
Phase 4               needs: logo vector / transparent PNG
Phase 5               needs: nothing (but decide Phase 7 first)
Phase 6               needs: mailbox decision (F2)
Phase 7               needs: CMS choice
Phase 8               needs: lawyer review
Phase 9               needs: Gree warranty document, founding year, real photos
```

---

## Open questions for the client

Carried over from the questionnaire, still unanswered, now with the new ones:

1. Logo as **vector or transparent PNG** *(blocks Phase 4)*
2. **Founding year** — asked twice, still missing; nothing can claim a year without it
3. **Gree authorized-service document** — blocks the warranty text and the badge
4. Real photos of completed installations — promised in Q14, not attached
5. Confirmation to buy `alanyaglobalteknik.com.tr`, and **mail on that domain** *(F2)*
6. 2–3 real reviews each in German and Russian *(F9)*
7. Blog: Q11 says no, Q16 says yes — which?
8. Do their technicians work from a shared digital calendar? *(decides whether real
   appointment booking is worth building at all, or whether a request form is honest)*
