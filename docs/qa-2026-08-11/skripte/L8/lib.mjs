// Shared helpers for the accessibility/usability lens.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
// The scratchpad lives outside the project, so resolve Playwright by absolute path.
const PW = 'D:/01 Antigrafity Projekte/25 Global-Technik-Klima/node_modules/playwright/index.mjs'
export const { chromium } = await import(pathToFileURL(PW).href)

export const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L8'
export const BASE = 'http://localhost:4321'
export const AXE = fs.readFileSync(path.join(DIR, 'axe.min.js'), 'utf8')

export const PAGES = [
  { id: 'tr', url: '/' },
  { id: 'de', url: '/de/' },
  { id: 'ru', url: '/ru/' },
  { id: 'en', url: '/en/' },
  { id: 'kvkk', url: '/kvkk' },
  { id: '404', url: '/definitely-not-a-page-xyz' },
]

export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
}

export async function launch(opts = {}) {
  return chromium.launch({ args: ['--force-prefers-reduced-motion=false'], ...opts })
}

/**
 * Open a page with a given theme, viewport and (optionally) reduced motion.
 * Returns { page, ctx, errors } where errors collects console errors + pageerrors.
 */
export async function openPage(browser, { url, theme = 'dark', viewport = 'desktop', reducedMotion = 'no-preference', deviceScaleFactor = 1, extra = {} }) {
  const ctx = await browser.newContext({
    viewport: typeof viewport === 'string' ? VIEWPORTS[viewport] : viewport,
    reducedMotion,
    deviceScaleFactor,
    ...extra,
  })
  const errors = []
  if (theme === 'light') {
    await ctx.addInitScript(() => {
      try { localStorage.setItem('theme', 'light') } catch (e) {}
    })
  } else {
    await ctx.addInitScript(() => {
      try { localStorage.removeItem('theme') } catch (e) {}
    })
  }
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded' })
  // Wait on a real condition: the header must be laid out and the theme applied.
  await page.waitForSelector('header.topbar', { state: 'attached' })
  await page.waitForFunction(
    (t) => (t === 'light') === (document.documentElement.dataset.theme === 'light'),
    theme,
  )
  return { page, ctx, errors }
}

/**
 * Reveal everything. NOTE: src/scripts/motion.ts calls
 * `gsap.set(targets,{opacity:0,y:18})`, which writes an INLINE opacity:0 on every
 * [data-reveal] element until its ScrollTrigger fires. Removing the `motion` class
 * is not enough — an !important stylesheet is, because GSAP's inline style is not
 * !important. Without this, 74% of all text measures as invisible (ratio 1.0).
 */
export async function revealAll(page) {
  await page.evaluate(() => {
    document.documentElement.classList.remove('motion')
    document.querySelectorAll('[data-reveal]').forEach((n) => n.classList.add('shown'))
    const s = document.createElement('style')
    s.id = 'l8-reveal'
    s.textContent = '[data-reveal]{opacity:1 !important;transform:none !important;translate:none !important;rotate:none !important;scale:none !important}'
    document.head.appendChild(s)
  })
  await page.waitForFunction(() => {
    const n = document.querySelector('[data-reveal]')
    return !n || getComputedStyle(n).opacity === '1'
  })
}

// ── WCAG contrast maths ────────────────────────────────────────────────────────
export function srgbToLin(c) {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
export function relLum([r, g, b]) {
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b)
}
export function contrast(a, b) {
  const l1 = relLum(a), l2 = relLum(b)
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}
export function r2(n) { return Math.round(n * 100) / 100 }

export function saveJSON(name, data) {
  fs.writeFileSync(path.join(DIR, name), JSON.stringify(data, null, 2))
}
export function saveText(name, txt) {
  fs.writeFileSync(path.join(DIR, name), txt)
}
