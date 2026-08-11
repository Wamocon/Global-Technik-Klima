import { launch, openPage, revealAll, DIR, saveJSON } from './lib.mjs'
const browser = await launch()
const out = {}
for (const run of [1,2]) {
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'desktop', extra: { forcedColors: 'active' } })
  await revealAll(page)
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  out['run'+run] = await page.evaluate(() => {
    const cs = (s) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); return { color: c.color, bg: c.backgroundColor, border: c.borderTopColor, forced: c.forcedColorAdjust } }
    return {
      forcedActive: matchMedia('(forced-colors: active)').matches,
      body: cs('body'), btnPrimary: cs('.hero .cta .btn-primary'), lang: cs('.lang a[aria-current]'),
      chatfab: cs('#chatfab'), wafab: cs('.wafab'), mobar: cs('.mobar .mo-wa'), toggleOn: cs('.toggle button.on'),
      // borders that only exist as translucent color-mix
      input: cs('#reqForm input[name=name]'), card: cs('#hizmetler .card'),
      // does anything become invisible? sample text vs bg equality
      sameFgBg: [...document.querySelectorAll('body *')].filter((e) => { const c = getComputedStyle(e); return e.children.length === 0 && (e.textContent||'').trim() && c.color === c.backgroundColor }).length,
    }
  })
  if (run === 1) await page.screenshot({ path: `${DIR}/forced-colors.png` })
  await ctx.close()
}
await browser.close(); saveJSON('forced-raw.json', out); console.log(JSON.stringify(out, null, 1))
