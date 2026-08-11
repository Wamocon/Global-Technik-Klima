/**
 * Is "64" a sampling race or the counter's resting value?
 * Method: scroll the block in, then poll until the text is UNCHANGED for 40
 * consecutive polls (~4 s of quiet). Then read. Repeat 3x per locale.
 */
import { LOCALES, goHome, newPage, browser, DIR, nbsp } from './lib.mjs'
const b = await browser()
for (const loc of LOCALES) {
  const results = []
  for (let run = 0; run < 3; run++) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await newPage(ctx)
    await goHome(page, loc)
    await page.locator('#hakkimizda').scrollIntoViewIfNeeded()
    const settled = await page.waitForFunction(() => {
      const el = document.querySelector('#hakkimizda .ab-n')
      const rt = document.querySelector('#hakkimizda .ab-stat b')
      if (!el) return false
      const now = el.textContent + '|' + rt.textContent
      if (window.__prev === now) window.__q = (window.__q || 0) + 1
      else { window.__q = 0; window.__prev = now }
      return window.__q >= 40 ? now : false
    }, null, { timeout: 25000, polling: 100 }).then((h) => h.jsonValue()).catch(() => 'TIMEOUT')
    const raf = await page.evaluate(() => ({
      motionClass: document.documentElement.classList.contains('motion'),
      revealShown: document.querySelector('#hakkimizda .ab-stat')?.classList.contains('shown'),
      dataCount: document.querySelector('#hakkimizda .ab-n')?.dataset.count,
    }))
    results.push(`${nbsp(String(settled))}  (${JSON.stringify(raf)})`)
    if (run === 0) await page.locator('#hakkimizda').screenshot({ path: `${DIR}/counter-${loc}.png` })
    await ctx.close()
  }
  console.log(`[${loc}]`)
  results.forEach((r, i) => console.log(`   run${i + 1}: ${r}`))
}
await b.close()
