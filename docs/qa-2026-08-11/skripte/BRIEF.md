# Shared QA brief — Alanya Global Teknik (Gree Alanya) upgrade demo

## System under test
Astro 7 **static** site, 4 locales, dark-first "Anadolu-Royal" design system, with a light theme toggle.
Project root (cwd for all commands): `D:\01 Antigrafity Projekte\25 Global-Technik-Klima`

**Running server (already up, do NOT start another):** `http://localhost:4321`
It serves the **built** `dist/` via `astro preview`. Routes:
- `/` (Turkish, default locale at root), `/de/`, `/ru/`, `/en/`
- Legal: `/kvkk`, `/gizlilik`, `/cerez` and `/{de,ru,en}/kvkk` etc. (12 pages)
- `/sitemap-index.xml`, `/sitemap-0.xml`, `/robots.txt`, `/og.jpg`, `/favicon.svg`
- 404: any unknown path (astro preview returns the 404 page)

**Important:** `api/chat.js` is a **Vercel serverless function** and is NOT served by `astro preview`.
So `POST /api/chat` returns 404 → the chat client falls back to its built-in intent engine
(`src/content/kb.ts`). That is a legitimate production state (no `ANTHROPIC_API_KEY`).
To test the LLM-backed path, intercept with Playwright `page.route('**/api/chat', …)`.

## How to execute tests (mandatory — you must actually RUN things)
Playwright is already installed in the project and Chromium works.

```bash
cd "D:/01 Antigrafity Projekte/25 Global-Technik-Klima" && node <yourdir>/test.mjs
```

Write your scripts into **your own** scratchpad subdirectory (given in your task) so agents
don't collide. Use ESM (`import { chromium } from 'playwright'`).

Discipline (this decides whether your results are trustworthy):
- **No fixed sleeps as stabilisation.** Wait on conditions: `waitForSelector`,
  `waitForFunction`, `waitUntil:'networkidle'`, `expect`-style polling loops.
  (A short settle wait *after* an animation-bound assertion is acceptable, but say so.)
- **A step with no assertion cannot pass.** Assert the outcome, not that the click happened.
- **Re-run every failure at least twice** before you call it a defect. Inconsistent = quarantine
  and root-cause, do NOT report as a defect.
- Screenshot every visual defect: `page.screenshot({path: '<yourdir>/<name>.png', fullPage:false})`.
- Collect `console` errors and `pageerror` on every page you open, and report them.
- Log your inputs so anything can be replayed.

## Key components / logic (read the source before you test)
| File | What |
|---|---|
| `src/layouts/Base.astro` | header, mainnav, burger + `#mobnav`, language switch, **theme toggle `#themetog`** (localStorage `theme`), hreflang, og tags, motion failsafe |
| `src/components/Home.astro` | services, products, campaign, why+warranty, reviews, about, contact+map, footer, `.mobar`, `.wafab`, **BTU calculator** (`#ca` area, `#cp` people, `[data-sun]`, `#cbtu`, `#ccta`) |
| `src/components/RequestForm.astro` | **`#reqForm`** appointment form → builds a `wa.me` deeplink via `window.open`. Fields: name*, phone*, place, service(select), when, note, honeypot `website`, consent checkbox*. Error node `#reqErr` |
| `src/components/Assistant.astro` | chat: `#chatfab`, `#chatpanel`, `#cin`, `#cform`, `#cchips`, `#cclose`. Tries `POST /api/chat`, falls back to `localAnswer()` intent engine |
| `src/content/kb.ts` | INTENTS keyword table, PRICE_KW, HANDOFF_KW, AREA_WORDS, BTU_A |
| `src/components/ExplodedUnit.astro` | Three.js exploded drawing, **dynamically imported** on IntersectionObserver; `#expCanvas`, `#expLegend li.on` |
| `src/components/BeforeAfter.astro` | drag slider `#ba` with `--pos`, keyboard via `#baRange` |
| `src/components/Projects.astro` | B2B section `#projeler` (segments, systems, 5-step flow, CTA) |
| `src/components/FrostHero.astro` | canvas hero effect |
| `src/components/Schema.astro` | JSON-LD `HVACBusiness`+`LocalBusiness`+`WebSite` |
| `src/scripts/motion.ts` | GSAP reveal system, `data-reveal`, `data-count` counters, parallax |
| `src/i18n/utils.ts` | `pathFor`, `hreflangs`, `upper` (Turkish-safe casing) |
| `scripts/guard.mjs` | build guardrails: no `toUpperCase/toLowerCase`, no Google Fonts, forbidden words |
| `api/chat.js` | serverless LLM endpoint + in-memory rate limit (8/min/IP, 800 chars) |

## Non-negotiable project rules (violations are HIGH/CATASTROPHIC, this is a sales demo)
1. **No invented facts.** No prices anywhere. Founding year is exactly **2021** (confirmed).
   Rating is **5,0 / 65**. Never "since 1997".
2. **The Konya phone number `+90 332 325 25 50` must appear nowhere.** Correct numbers:
   `+90 242 513 86 51` (landline), `+90 533 046 13 87` (WhatsApp).
3. **Turkish casing trap:** `'ISI'.toLowerCase() !== 'ısı'`; `'KLIMA'.toLocaleLowerCase('tr-TR') === 'klıma'`.
   No `toUpperCase()`/`toLowerCase()` in JS. Casing via CSS `text-transform` with `lang` set.
4. **Forbidden words:** `Kühlmittel` (must be Kältemittel), `Instandhaltung` (must be Wartung),
   `кондей`, `soğutucu akışkan` in sales copy.
5. **No Google Fonts / no third-party CDN / no analytics** (KVKK: IP is personal data).
6. **JSON-LD may only assert what is visibly on the page.** No `priceRange`, no FAQ schema.
7. Dark is the committed brand default; light is an explicit visitor choice that must persist.

## Risk table (agreed — this drives depth)
| Area | Prob | Impact | Risk | Depth |
|---|---|---|---|---|
| Randevu form (new, zero existing test coverage, conversion path) | High | High | **Critical** | deep |
| Chat assistant (intent engine, Turkish casing, API fallback, injection) | High | High | **Critical** | deep |
| Theme toggle + light theme (new; existing acceptance test only runs dark) | High | Med | **High** | deep |
| Fact-safety / forbidden content (sales demo credibility) | Low | Catastrophic | **High** | deep |
| BTU calculator (clamping, locale number format, deeplink) | Med | High | **High** | deep |
| i18n completeness across 4 locales, hreflang, canonical | Med | High | **High** | deep |
| Security (XSS via chat/form, target=_blank, endpoint abuse, secrets) | Med | High | **High** | deep |
| Failure & recovery (offline, API 5xx, double submit, back/refresh) | Med | Med | Med | medium |
| Accessibility & usability (both themes, keyboard, focus, contrast) | Med | Med | Med | medium-deep |
| Performance (Three.js lazy discipline, payloads, images, memory) | Med | Med | Med | medium |
| 3D exploded unit / before-after slider | Med | Med | Med | medium |
| Legal pages (12) | Low | Med | Low | light |

**Explicitly NOT tested (do not pretend otherwise):** real Anthropic API responses (no key),
real WhatsApp message delivery, Vercel header/CDN behaviour in production, Google Maps iframe internals.

## Existing baseline
`npm run abnahme` (`scripts/acceptance.mjs`) already covers: 4 locales × desktop/mobile — JS errors,
horizontal overflow, core elements, WhatsApp per viewport, rating prominence, chat freetext (1 case),
map, exploded canvas, before/after slider, mobile menu, JSON-LD, og:image, legal pages, sitemap,
robots, 404. It reported 0 failures. **Your job is to find what it misses** — do not just re-run it.

## What to hand back
A markdown report with:
1. **Confirmed defects**, each with: title · where (`file:line` or URL+selector) · numbered repro
   steps · expected vs actual · business impact · evidence (screenshot path / console text /
   the actual values you observed) · the **test-design technique** you used · suggested fix.
2. **Candidates you refuted yourself** (one line each) — so we don't re-litigate them.
3. **Verified working** — what you tested that passed, per technique. This is required output.
4. **Coverage table**: technique · coverage criterion · #cases · pass · fail.
5. Anything you could NOT test and why.

Severity: Catastrophic (data loss/security/money/legal) · Critical (core task impossible, no
workaround) · High (major function broken, painful workaround) · Medium (workaround fine) ·
Low (cosmetic). Severity = business impact, not technical noise.

## ⚠️ Addendum — resolving `playwright` from a script outside the project
Node resolves ESM imports relative to the *script's* location, not the cwd. A script in the
scratchpad therefore cannot `import { chromium } from 'playwright'`. Use:

```js
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')
```
