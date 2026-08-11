/** Last verification batch: borderline kicker, theme-toggle state, lang attrs,
 *  input border 1.4.11 with a scanning probe, and the mobile conversion walk. */
import { launch, openPage, revealAll, saveJSON, DIR, contrast, r2 } from './lib.mjs'

const browser = await launch()
const out = {}

// ── borderline .kicker + accent-on-paper, measured cleanly at both viewports ──
out.kicker = {}
for (const vp of ['desktop', 'mobile']) {
  for (const theme of ['dark', 'light']) {
    const { page, ctx } = await openPage(browser, { url: '/', theme, viewport: vp })
    await revealAll(page)
    await page.waitForFunction(() => document.fonts.status === 'loaded')
    const res = {}
    for (const [k, sel] of [['randevu kicker', '#randevu .kicker'], ['projeler kicker', '#projeler .kicker'], ['step-n', '#projeler .step-n'], ['crow lab', '#kontakt .crow .lab']]) {
      await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center', behavior: 'instant' }), sel)
      await revealAll(page)
      const a = (await page.screenshot({ type: 'png' })).toString('base64')
      await page.addStyleTag({ content: '#hh{}\n*,*::before,*::after{color:transparent !important;-webkit-text-fill-color:transparent !important}' })
      await page.waitForFunction(() => getComputedStyle(document.body).color === 'rgba(0, 0, 0, 0)')
      const b = (await page.screenshot({ type: 'png' })).toString('base64')
      await page.evaluate(() => [...document.querySelectorAll('style')].filter((s) => s.textContent.includes('-webkit-text-fill-color:transparent')).forEach((s) => s.remove()))
      await page.waitForFunction(() => getComputedStyle(document.body).color !== 'rgba(0, 0, 0, 0)')
      res[k] = await page.evaluate(async ({ a, b, sel }) => {
        const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0); return { d: x.getImageData(0, 0, c.width, c.height).data, w: c.width } }
        const A = await load(a), B = await load(b)
        const e = document.querySelector(sel); if (!e) return null
        const cs = getComputedStyle(e)
        const hist = new Map()
        const at = (I, x, y) => { const i = (y * I.w + x) * 4; return [I.d[i], I.d[i + 1], I.d[i + 2]] }
        const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let t; const rects = []
        while ((t = w.nextNode())) if (t.nodeValue.trim()) { const rg = document.createRange(); rg.selectNodeContents(t); rects.push(...[...rg.getClientRects()]) }
        for (const r of rects) for (let y = Math.max(0, Math.round(r.top)); y < Math.round(r.bottom); y++) for (let x = Math.max(0, Math.round(r.left)); x < Math.round(r.right); x++) { const p = at(B, x, y); const k = p[0] * 65536 + p[1] * 256 + p[2]; hist.set(k, (hist.get(k) || 0) + 1) }
        if (!hist.size) return null
        const ent = [...hist.entries()].sort((x, y) => y[1] - x[1])
        return { bg: [(ent[0][0] >> 16) & 255, (ent[0][0] >> 8) & 255, ent[0][0] & 255], color: cs.color, fontSize: cs.fontSize, text: e.textContent.trim().slice(0, 30) }
      }, { a, b, sel })
    }
    out.kicker[`${theme}/${vp}`] = res
    await ctx.close()
  }
}

// ── theme toggle: is the current theme conveyed to AT at all? ────────────────
{
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'desktop' })
  const cdp = await ctx.newCDPSession(page); await cdp.send('Accessibility.enable')
  const ax = async (expr) => { const { result } = await cdp.send('Runtime.evaluate', { expression: expr }); const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false }); const n = nodes[nodes.length - 1]; return { role: n?.role?.value, name: n?.name?.value, props: (n?.properties || []).map((p) => `${p.name}=${JSON.stringify(p.value.value)}`).join(' ') } }
  const dark = await ax("document.getElementById('themetog')")
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
  const light = await ax("document.getElementById('themetog')")
  const persists = await (async () => { await page.reload({ waitUntil: 'domcontentloaded' }); return page.evaluate(() => document.documentElement.dataset.theme) })()
  out.themeToggle = { asDark: dark, asLight: light, afterReload: persists, iconOnly: await page.evaluate(() => ({ sun: getComputedStyle(document.querySelector('.ic-sun')).display, moon: getComputedStyle(document.querySelector('.ic-moon')).display })) }
  // lang attributes on the language links
  out.langLinks = await page.evaluate(() => [...document.querySelectorAll('.lang a')].map((a) => ({ text: a.textContent.trim(), lang: a.getAttribute('lang'), hreflang: a.getAttribute('hreflang'), ariaCurrent: a.getAttribute('aria-current'), href: a.getAttribute('href') })))
  await ctx.close()
}

// ── 1.4.11 input borders with a scanning probe (find the border row) ─────────
out.borders = {}
for (const theme of ['dark', 'light']) {
  const { page, ctx } = await openPage(browser, { url: '/', theme, viewport: 'desktop' })
  await revealAll(page)
  const sels = [['name input', '#reqForm input[name=name]'], ['select', '#reqForm select'], ['textarea', '#reqForm textarea'], ['calc area input', '#ca'], ['toggle group', '.toggle'], ['themetog', '#themetog'], ['card', '#hizmetler .card'], ['consent checkbox', '.rf-consent input'], ['chat input', '#cin']]
  const res = {}
  for (const [k, sel] of sels) {
    if (k === 'chat input') { await page.click('#chatfab'); await page.waitForFunction(() => !document.getElementById('chatpanel').hidden) }
    const ok = await page.$(sel); if (!ok) { res[k] = 'absent'; continue }
    await page.evaluate((s) => { const e = document.querySelector(s); if (!e.closest('#chatpanel')) e.scrollIntoView({ block: 'center', behavior: 'instant' }) }, sel)
    await revealAll(page)
    const b = (await page.screenshot({ type: 'png' })).toString('base64')
    res[k] = await page.evaluate(async ({ b, sel }) => {
      const i = new Image(); i.src = 'data:image/png;base64,' + b; await i.decode()
      const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0)
      const d = x.getImageData(0, 0, c.width, c.height).data
      const at = (px, py) => { const k = (py * c.width + px) * 4; return [d[k], d[k + 1], d[k + 2]] }
      const e = document.querySelector(sel), cs = getComputedStyle(e), r = e.getBoundingClientRect()
      const cx = Math.round(r.left + r.width / 2)
      // scan rows from 4px above to 5px below the top edge; the border is the row
      // most different from the row 4px outside
      const outside = at(cx, Math.max(0, Math.round(r.top) - 4))
      let bestRow = null, best = -1
      for (let dy = -3; dy <= 4; dy++) {
        const py = Math.round(r.top) + dy
        if (py < 0 || py >= c.height) continue
        const p = at(cx, py)
        const dist = Math.abs(p[0] - outside[0]) + Math.abs(p[1] - outside[1]) + Math.abs(p[2] - outside[2])
        if (dist > best) { best = dist; bestRow = { dy, p } }
      }
      const inside = at(cx, Math.min(c.height - 1, Math.round(r.top) + 8))
      return { cssBorder: `${cs.borderTopStyle} ${cs.borderTopWidth} ${cs.borderTopColor}`, outside, border: bestRow?.p, borderAtDy: bestRow?.dy, inside }
    }, { b, sel })
  }
  out.borders[theme] = res
  await ctx.close()
}
await browser.close()
saveJSON('final-raw.json', out)

console.log('===== .kicker / accent on paper =====')
for (const k of Object.keys(out.kicker)) {
  for (const [n, v] of Object.entries(out.kicker[k])) {
    if (!v) continue
    const m = v.color.match(/\d+/g).map(Number)
    console.log(`  ${k.padEnd(14)} ${n.padEnd(16)} ${String(r2(contrast(m, v.bg))).padStart(5)}:1  rgb(${m}) on rgb(${v.bg}) ${v.fontSize}  "${v.text}"  ${contrast(m, v.bg) >= 4.5 ? 'AA' : 'FAIL'}`)
  }
}
console.log('\n===== theme toggle & lang links =====')
console.log(JSON.stringify(out.themeToggle, null, 1))
console.log(JSON.stringify(out.langLinks, null, 1))
console.log('\n===== 1.4.11 borders (3:1 needed) =====')
for (const theme of Object.keys(out.borders)) {
  for (const [k, v] of Object.entries(out.borders[theme])) {
    if (typeof v === 'string' || !v.border) { console.log(`  ${theme}/${k}: ${v}`); continue }
    const cOut = contrast(v.border, v.outside), cIn = contrast(v.border, v.inside)
    console.log(`  ${theme.padEnd(5)} ${k.padEnd(18)} css[${v.cssBorder}] border rgb(${v.border}) | vs outside rgb(${v.outside}) ${r2(cOut)}:1 | vs inside rgb(${v.inside}) ${r2(cIn)}:1 | best ${r2(Math.max(cOut, cIn))}:1 ${Math.max(cOut, cIn) >= 3 ? 'OK' : 'FAIL 1.4.11'}`)
  }
}
