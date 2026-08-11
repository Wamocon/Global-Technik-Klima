/**
 * L1-B3  Technique: decision table over {area × people × sun}, with the oracle
 *        independently re-implemented from the documented formula
 *        (area*550 + max(0,people-2)*600, ×1.15 if sun, snap to nearest device size).
 * Coverage criterion: all-combinations for a representative partition set
 *        (8 areas × 5 people × 2 sun = 80 rules), each rule asserting BOTH the
 *        displayed value and the deeplink payload. Plus live-update on input.
 */
import { LOCALES, goHome, newPage, browser, ok, eq, summary, DIR } from './lib.mjs'

const STEP = [9000, 12000, 18000, 24000, 36000, 48000]
const snap = (v) => STEP.reduce((p, s) => (Math.abs(s - v) < Math.abs(p - v) ? s : p))
const oracle = (area, people, sun) => {
  const a = Math.max(6, Math.min(200, area))
  const p = Math.max(1, Math.min(12, people))
  let btu = a * 550 + Math.max(0, p - 2) * 600
  if (sun) btu *= 1.15
  return { a, p, btu: snap(btu) }
}
const digits = (s) => s.replace(/[^\d]/g, '')

const AREAS = [6, 25, 40, 60, 80, 100, 150, 200]
const PEOPLE = [1, 2, 3, 6, 12]
const SUN = [0, 1]

const b = await browser()
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await newPage(ctx)
await goHome(page, 'tr')
await page.locator('#kesif').scrollIntoViewIfNeeded()

// --- default state ---
eq('default area/people inputs', [await page.inputValue('#ca'), await page.inputValue('#cp')], ['25', '2'])
const d0 = oracle(25, 2, 0)
eq('default #cbtu matches oracle (25 m², 2 ppl, no sun)', digits(await page.locator('#cbtu').innerText()), String(d0.btu))
ok('sun toggle default = "no" is the .on button',
  await page.locator('[data-sun="0"]').evaluate((e) => e.classList.contains('on')) &&
  !(await page.locator('[data-sun="1"]').evaluate((e) => e.classList.contains('on'))))

// --- live update on input, no blur / no submit ---
await page.locator('#ca').fill('')
await page.locator('#ca').type('60', { delay: 20 })
await page.waitForFunction(() => document.getElementById('cbtu').textContent.replace(/\D/g, '') === '36000', null, { timeout: 3000 })
  .catch(() => {})
eq('live update while typing area=60 (no blur)', digits(await page.locator('#cbtu').innerText()), String(oracle(60, 2, 0).btu))
ok('#ca still focused (value applied without blur)', await page.evaluate(() => document.activeElement?.id === 'ca'))

// --- decision table ---
let sunState = 0
let rules = 0, bad = []
for (const sun of SUN) {
  if (sun !== sunState) {
    await page.locator(`[data-sun="${sun}"]`).click()
    // visual state must follow
    const on = await page.locator(`[data-sun="${sun}"]`).evaluate((e) => e.classList.contains('on'))
    const off = await page.locator(`[data-sun="${1 - sun}"]`).evaluate((e) => e.classList.contains('on'))
    ok(`sun toggle .on moved to data-sun="${sun}"`, on && !off, `on=${on} otherStillOn=${off}`)
    sunState = sun
  }
  for (const area of AREAS) {
    for (const people of PEOPLE) {
      await page.locator('#ca').fill(String(area))
      await page.locator('#cp').fill(String(people))
      const exp = oracle(area, people, sun)
      await page.waitForFunction((e) => document.getElementById('cbtu').textContent.replace(/\D/g, '') === e,
        String(exp.btu), { timeout: 2000 }).catch(() => {})
      const shown = digits(await page.locator('#cbtu').innerText())
      const href = await page.locator('#ccta').getAttribute('href')
      const payload = decodeURIComponent((href || '').split('?text=')[1] || '')
      rules++
      const okShown = shown === String(exp.btu)
      const okHref = (href || '').startsWith('https://wa.me/905330461387?text=')
      const okBtu = payload.includes(`BTU: ${exp.btu}`)
      const okArea = payload.includes(`${exp.a} m²`)
      const okPpl = new RegExp(`\\b${exp.p} ki`).test(payload)
      if (!(okShown && okHref && okBtu && okArea && okPpl)) {
        bad.push({ area, people, sun, expected: exp.btu, shown, payload, okShown, okHref, okBtu, okArea, okPpl })
      }
    }
  }
}
ok(`decision table: ${rules} rules, all display+deeplink correct`, bad.length === 0,
  bad.length ? JSON.stringify(bad.slice(0, 6), null, 1) : '')
console.log(`      rules exercised: ${rules}`)

// --- a few named rules spelled out for the record ---
const NAMED = [
  [25, 2, 0, 12000], [25, 2, 1, 18000], [40, 2, 0, 24000], [40, 5, 0, 24000],
  [6, 1, 0, 9000], [200, 12, 0, 48000], [200, 12, 1, 48000], [60, 2, 0, 36000],
]
for (const [area, people, sun, expect] of NAMED) {
  ok(`oracle sanity: ${area}m²/${people}p/sun=${sun} -> ${expect}`, oracle(area, people, sun).btu === expect,
    `oracle=${oracle(area, people, sun).btu}`)
}

// --- deeplink example, logged verbatim ---
await page.locator('[data-sun="0"]').click()
await page.locator('#ca').fill('35'); await page.locator('#cp').fill('4')
await page.waitForFunction(() => document.getElementById('cbtu').textContent.replace(/\D/g, '') === '24000', null, { timeout: 2000 }).catch(() => {})
console.log('      example href: ' + (await page.locator('#ccta').getAttribute('href')))
console.log('      example payload: ' + decodeURIComponent((await page.locator('#ccta').getAttribute('href')).split('?text=')[1]))

ok('no console/page errors on BTU section', page.__errors.length === 0, page.__errors.join(' | '))
await ctx.close()

// --- cross-locale: the number FORMAT that each locale shows ---
console.log('\n--- BTU display format per locale (36.000 BTU case) ---')
for (const loc of LOCALES) {
  const c2 = await b.newContext({ viewport: { width: 1440, height: 1000 } })
  const p2 = await newPage(c2)
  await goHome(p2, loc)
  await p2.locator('#kesif').scrollIntoViewIfNeeded()
  await p2.locator('#ca').fill('60'); await p2.locator('#cp').fill('2')
  await p2.waitForFunction(() => document.getElementById('cbtu').textContent.replace(/\D/g, '') === '36000', null, { timeout: 3000 }).catch(() => {})
  const raw = (await p2.locator('#cbtu').innerText()).trim()
  const nativeExpect = (36000).toLocaleString(loc === 'tr' ? 'tr-TR' : loc)
  ok(`[${loc}] BTU numeric value correct`, digits(raw) === '36000', `raw="${raw}"`)
  console.log(`      [${loc}] shown="${raw}"   locale-native would be "${nativeExpect}"`)
  ok(`[${loc}] BTU grouping matches the page locale`, raw === nativeExpect, `shown="${raw}" expected-native="${nativeExpect}"`)
  const suffix = (await p2.locator('#kesif .result .rv').innerText()).replace(raw, '').trim()
  ok(`[${loc}] result suffix present`, suffix.length > 0, `suffix="${suffix}"`)
  if (raw !== nativeExpect) await p2.screenshot({ path: `${DIR}/btu-format-${loc}.png`, clip: await p2.locator('#kesif .calc').boundingBox() })
  await c2.close()
}
await b.close()
summary('t3-btu')
