/**
 * L1-B6  Technique: state-transition testing (dark -> light -> dark) with
 *        persistence across a reload, plus verification that the repaint actually
 *        happened (computed colours), the meta theme-color follows, and exactly one
 *        icon is visible per state.
 * Coverage criterion: all 4 transitions of the 2-state machine (initial, ->light,
 *        ->dark, reload-in-light) × 4 locales; every documented side effect asserted.
 */
import { LOCALES, goHome, newPage, browser, ok, eq, summary, DIR, BASE, HOME } from './lib.mjs'

const BAR = { dark: '#100D0B', light: '#f6f3ee' }

async function snapshot(page) {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme ?? null,
    ls: (() => { try { return localStorage.getItem('theme') } catch { return 'ERR' } })(),
    meta: document.getElementById('tcolor')?.getAttribute('content') ?? null,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyFg: getComputedStyle(document.body).color,
    barBg: getComputedStyle(document.querySelector('.topbar')).backgroundColor,
    sunVisible: !!document.querySelector('#themetog .ic-sun') &&
      getComputedStyle(document.querySelector('#themetog .ic-sun')).display !== 'none',
    moonVisible: !!document.querySelector('#themetog .ic-moon') &&
      getComputedStyle(document.querySelector('#themetog .ic-moon')).display !== 'none',
    logo: getComputedStyle(document.querySelector('.blogo')).backgroundImage,
  }))
}
const lum = (rgb) => {
  const m = rgb.match(/[\d.]+/g).map(Number)
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]
}

const b = await browser()
for (const loc of LOCALES) {
  console.log(`\n--- theme toggle, ${loc} ---`)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  await goHome(page, loc)

  // S0 : dark default
  const s0 = await snapshot(page)
  eq(`[${loc}] S0 dataset.theme unset (dark default)`, s0.theme, null)
  eq(`[${loc}] S0 localStorage.theme unset`, s0.ls, null)
  eq(`[${loc}] S0 meta theme-color = dark bar`, s0.meta, BAR.dark)
  ok(`[${loc}] S0 body background is dark (lum=${lum(s0.bodyBg).toFixed(1)})`, lum(s0.bodyBg) < 60, s0.bodyBg)
  eq(`[${loc}] S0 sun icon shown, moon hidden`, [s0.sunVisible, s0.moonVisible], [true, false])
  ok(`[${loc}] S0 logo is the light-on-dark asset`, /logo-light\.png/.test(s0.logo), s0.logo)

  // S0 -> S1 : light
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 3000 })
  const s1 = await snapshot(page)
  eq(`[${loc}] S1 dataset.theme=light`, s1.theme, 'light')
  eq(`[${loc}] S1 localStorage.theme=light`, s1.ls, 'light')
  eq(`[${loc}] S1 meta theme-color = light bar`, s1.meta, BAR.light)
  ok(`[${loc}] S1 body background actually repainted light (lum=${lum(s1.bodyBg).toFixed(1)})`,
    lum(s1.bodyBg) > 200, `dark=${s0.bodyBg} light=${s1.bodyBg}`)
  ok(`[${loc}] S1 body text colour flipped dark`, lum(s1.bodyFg) < lum(s0.bodyFg),
    `darkFg=${s0.bodyFg} lightFg=${s1.bodyFg}`)
  ok(`[${loc}] S1 topbar repainted too`, s1.barBg !== s0.barBg, `${s0.barBg} -> ${s1.barBg}`)
  eq(`[${loc}] S1 moon icon shown, sun hidden`, [s1.sunVisible, s1.moonVisible], [false, true])
  ok(`[${loc}] S1 logo swapped to the dark-ink asset`, /logo-dark\.png/.test(s1.logo), s1.logo)

  // S1 persists across a full reload (and no dark flash: inline head script)
  await page.reload({ waitUntil: 'domcontentloaded' })
  const themeAtDomReady = await page.evaluate(() => document.documentElement.dataset.theme)
  eq(`[${loc}] light survives reload, already set at DOMContentLoaded`, themeAtDomReady, 'light')
  const s1b = await snapshot(page)
  eq(`[${loc}] after reload localStorage still light`, s1b.ls, 'light')
  ok(`[${loc}] after reload background still light`, lum(s1b.bodyBg) > 200, s1b.bodyBg)
  eq(`[${loc}] after reload moon icon shown`, [s1b.sunVisible, s1b.moonVisible], [false, true])
  // NOTE: the meta tag is re-rendered from static HTML on reload; check whether it follows.
  if (!ok(`[${loc}] after reload meta theme-color matches the light theme`, s1b.meta === BAR.light,
    `meta="${s1b.meta}" expected="${BAR.light}" (page bg=${s1b.bodyBg})`)) {
    await page.screenshot({ path: `${DIR}/theme-meta-stale-${loc}.png`, clip: { x: 0, y: 0, width: 1440, height: 200 } })
  }

  // S1 -> S0 : back to dark
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === undefined, null, { timeout: 3000 })
  const s2 = await snapshot(page)
  eq(`[${loc}] S2 dataset.theme removed`, s2.theme, null)
  eq(`[${loc}] S2 localStorage.theme=dark`, s2.ls, 'dark')
  eq(`[${loc}] S2 meta theme-color = dark bar`, s2.meta, BAR.dark)
  ok(`[${loc}] S2 background back to dark`, lum(s2.bodyBg) < 60, s2.bodyBg)
  eq(`[${loc}] S2 sun icon shown again`, [s2.sunVisible, s2.moonVisible], [true, false])

  // explicit dark also survives a reload
  await page.reload({ waitUntil: 'domcontentloaded' })
  const s3 = await snapshot(page)
  // The head script re-stamps data-theme="dark" (the click handler deletes it). Both
  // representations render identically because only [data-theme='light'] is styled.
  eq(`[${loc}] explicit dark survives reload (localStorage)`, s3.ls, 'dark')
  ok(`[${loc}] explicit dark renders dark after reload`, lum(s3.bodyBg) < 60, `theme=${s3.theme} bg=${s3.bodyBg}`)
  eq(`[${loc}] explicit dark keeps the dark meta bar`, s3.meta, BAR.dark)
  eq(`[${loc}] explicit dark shows the sun icon`, [s3.sunVisible, s3.moonVisible], [true, false])

  ok(`[${loc}] no console/page errors (theme)`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}

// Light theme must persist across a locale switch too (same-origin localStorage).
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await newPage(ctx)
  await goHome(page, 'tr')
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light', null, { timeout: 3000 })
  for (const loc of ['de', 'ru', 'en']) {
    await page.goto(BASE + HOME[loc], { waitUntil: 'domcontentloaded' })
    eq(`light theme carries into /${loc}/`, await page.evaluate(() => document.documentElement.dataset.theme), 'light')
  }
  await page.goto(BASE + '/de/kvkk', { waitUntil: 'domcontentloaded' })
  eq('light theme carries onto a legal page', await page.evaluate(() => document.documentElement.dataset.theme), 'light')
  const legalBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  ok('legal page repaints light too', lum(legalBg) > 200, legalBg)
  await page.screenshot({ path: `${DIR}/theme-light-legal-de.png` })
  await ctx.close()
}
await b.close()
summary('t6-theme')
