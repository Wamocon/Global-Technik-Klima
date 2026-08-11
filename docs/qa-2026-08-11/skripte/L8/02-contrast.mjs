/**
 * Contrast, computed for real — pixel-truth method.
 *
 * axe-core reports color-contrast as INCOMPLETE for 43 elements per page on this
 * site ("background color could not be determined due to a background image"),
 * because the design leans on color-mix(), radial gradients, backdrop-filter,
 * a <canvas> hero and mix-blend-mode. So contrast is measured from real pixels:
 *
 *   1. Text-node client rects via Range (no DOM mutation -> no layout shift).
 *   2. Shot A: the page exactly as rendered.
 *   3. Inject `*{color:transparent!important}` -> glyphs vanish, every background
 *      layer stays. Shot B.
 *   4. bg  = modal pixel colour inside the rect in shot B (the real background).
 *      fg  = the glyph core: among pixels that changed between A and B, the colour
 *            at the 90th percentile of distance from bg (robust to antialiasing).
 *   5) WCAG 2.x ratio on those two. A rect with no changed pixels means the text
 *      is not actually rendered -> skipped, not reported.
 *
 * Also reports the NOMINAL ratio (computed `color` composited over the sampled bg
 * using the full opacity chain) so token-level claims can be checked directly.
 */
import { launch, openPage, revealAll, contrast, r2, saveJSON } from './lib.mjs'

const TARGETS = [
  { id: 'tr', url: '/' },
  { id: 'de', url: '/de/' },
  { id: 'kvkk', url: '/kvkk' },
  { id: '404', url: '/definitely-not-a-page-xyz' },
]

function parseRGB(s) {
  const m = String(s).match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
}

const COLLECT = () => {
  const out = []
  const pathOf = (el) => {
    const parts = []
    let n = el
    while (n && n.nodeType === 1 && parts.length < 5) {
      let s = n.tagName.toLowerCase()
      if (n.id) { s += '#' + n.id; parts.unshift(s); break }
      const cls = (typeof n.className === 'string' ? n.className.trim().split(/\s+/).filter((c) => c && !c.startsWith('astro-') && c !== 'shown') : []).slice(0, 2)
      if (cls.length) s += '.' + cls.join('.')
      parts.unshift(s)
      n = n.parentElement
    }
    return parts.join('>')
  }
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let t
  while ((t = w.nextNode())) {
    if (!t.nodeValue || !t.nodeValue.trim()) continue
    const el = t.parentElement
    if (!el || el.closest('.rf-hp') || el.closest('script') || el.closest('style') || el.closest('noscript')) continue
    const h = el.closest('[hidden]')
    if (h && h.hidden) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const rng = document.createRange()
    rng.selectNodeContents(t)
    const rects = [...rng.getClientRects()]
      .filter((r) => r.width > 1 && r.height > 1)
      // FULLY inside the viewport only. A partially clipped rect gets clamped to
      // row 0, where the sticky topbar is painted -> the sample would be the header,
      // not the element. (This produced ~30 false "1.7:1" hits in the first run.)
      .filter((r) => r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth)
      // and not covered by a fixed overlay (topbar / mobar / chat panel / FABs):
      // the element under the probe points must be el itself or related to it.
      .filter((r) => {
        const pts = [[r.left + 2, r.top + r.height / 2], [r.left + r.width / 2, r.top + r.height / 2], [r.right - 2, r.top + r.height / 2]]
        let ok = 0
        for (const [x, y] of pts) {
          const hit = document.elementFromPoint(x, y)
          if (hit && (hit === el || el.contains(hit) || hit.contains(el))) ok++
        }
        return ok >= 2
      })
    if (!rects.length) continue
    let op = 1, n2 = el
    while (n2 && n2 !== document.documentElement) { op *= parseFloat(getComputedStyle(n2).opacity); n2 = n2.parentElement }
    out.push({
      path: pathOf(el), tag: el.tagName.toLowerCase(), text: t.nodeValue.trim().slice(0, 48),
      color: cs.color, fontSize: parseFloat(cs.fontSize), fontWeight: cs.fontWeight,
      opacityChain: Math.round(op * 1000) / 1000,
      rects: rects.map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) })),
    })
  }
  return out
}

const SAMPLE = async ({ a, b, cands }) => {
  const load = async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0)
    return { d: cx.getImageData(0, 0, cv.width, cv.height).data, w: cv.width, h: cv.height }
  }
  const A = await load(a), B = await load(b)
  const dist = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2])
  return cands.map((c) => {
    const hist = new Map(); const glyph = []
    for (const r of c.rects) {
      const x0 = Math.max(0, r.x), y0 = Math.max(0, r.y)
      const x1 = Math.min(B.w, r.x + r.w), y1 = Math.min(B.h, r.y + r.h)
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * B.w + x) * 4
        const pb = [B.d[i], B.d[i + 1], B.d[i + 2]]
        const pa = [A.d[i], A.d[i + 1], A.d[i + 2]]
        const k = pb[0] * 65536 + pb[1] * 256 + pb[2]
        hist.set(k, (hist.get(k) || 0) + 1)
        if (dist(pa, pb) > 12) glyph.push(pa)
      }
    }
    if (!hist.size) return { ...c, bgMode: null, glyphN: 0 }
    const ent = [...hist.entries()].sort((x, y) => y[1] - x[1])
    const total = ent.reduce((s, e) => s + e[1], 0)
    const dec = (k) => [(k >> 16) & 255, (k >> 8) & 255, k & 255]
    const bg = dec(ent[0][0])
    let fgPix = null
    if (glyph.length >= 6) {
      const sorted = glyph.map((p) => ({ p, d: dist(p, bg) })).sort((x, y) => x.d - y.d)
      fgPix = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))].p
    }
    return {
      ...c, bgMode: bg, bgModeShare: Math.round((ent[0][1] / total) * 100) / 100, samples: total,
      bgAll: ent.slice(0, 40).map((e) => ({ c: dec(e[0]), n: e[1] })),
      glyphN: glyph.length, fgPix,
    }
  })
}

function judge(rec) {
  if (!rec.bgMode) return null
  if ((rec.samples || 0) < 30) return { skipped: 'sample area < 30px — excluded' }
  if (!rec.fgPix) return { skipped: 'glyphs not rendered (opacity/clip) — excluded' }
  const bg = rec.bgMode
  const nominalRGB = parseRGB(rec.color)
  const alpha = (nominalRGB?.a ?? 1) * (rec.opacityChain ?? 1)
  const comp = (f, b, a) => [Math.round(f[0] * a + b[0] * (1 - a)), Math.round(f[1] * a + b[1] * (1 - a)), Math.round(f[2] * a + b[2] * (1 - a))]
  const nominalEff = nominalRGB ? comp([nominalRGB.r, nominalRGB.g, nominalRGB.b], bg, alpha) : null
  const ratioPix = contrast(rec.fgPix, bg)
  const ratioNom = nominalEff ? contrast(nominalEff, bg) : null
  // Judge on the more forgiving of the two (avoids penalising thin antialiasing).
  const ratio = Math.max(ratioPix, ratioNom ?? 0)
  let worst = Infinity, worstC = null
  for (const s of rec.bgAll || []) {
    if (s.n / rec.samples < 0.05) continue
    const rr = contrast(rec.fgPix, s.c)
    if (rr < worst) { worst = rr; worstC = s.c }
  }
  const bold = parseInt(rec.fontWeight, 10) >= 700
  const large = rec.fontSize >= 24 || (bold && rec.fontSize >= 18.66)
  const need = large ? 3 : 4.5
  const needAAA = large ? 4.5 : 7
  return {
    ratio: r2(ratio), ratioPix: r2(ratioPix), ratioNom: ratioNom == null ? null : r2(ratioNom),
    worst: r2(worst === Infinity ? ratio : worst), worstBg: worstC,
    need, needAAA, pass: ratio >= need - 0.005, passAAA: ratio >= needAAA - 0.005, large, bold,
    bg, fgPix: rec.fgPix, nominalEff, opacityChain: rec.opacityChain,
    fontSize: rec.fontSize, fontWeight: rec.fontWeight, bgModeShare: rec.bgModeShare,
  }
}

const browser = await launch()
const all = []
const skipped = []

for (const t of TARGETS) {
  for (const theme of ['dark', 'light']) {
    for (const vp of ['desktop', 'mobile']) {
      const { page, ctx } = await openPage(browser, { url: t.url, theme, viewport: vp })
      await revealAll(page)
      await page.waitForFunction(() => document.fonts.status === 'loaded')
      await page.waitForFunction(() => { const c = document.getElementById('frost'); return !c || c.classList.contains('on') }, null, { timeout: 9000 }).catch(() => {})
      if (await page.$('#chatfab')) {
        await page.click('#chatfab')
        await page.waitForSelector('#chatpanel:not([hidden])')
      }
      const H = await page.evaluate(() => document.documentElement.scrollHeight)
      const vh = await page.evaluate(() => innerHeight)
      const seen = new Map()
      for (let y = 0; y < H; y += Math.floor(vh * 0.6)) {
        await page.evaluate((yy) => scrollTo(0, yy), y)
        await page.waitForFunction((yy) => Math.abs(scrollY - yy) < 3 || scrollY + innerHeight >= document.documentElement.scrollHeight - 2, y)
        await revealAll(page)
        // CSS keyframe fades (hero) must be finished, or a mid-animation opacity
        // would be measured as a contrast failure.
        await page.waitForFunction(() => document.getAnimations().filter((a) => a.playState === 'running').length === 0, null, { timeout: 6000 }).catch(() => {})
        const cands = await page.evaluate(COLLECT)
        if (!cands.length) continue
        const shotA = (await page.screenshot({ type: 'png' })).toString('base64')
        await page.addStyleTag({ content: '#l8-hide-glyphs{}\n*,*::before,*::after{color:transparent !important;text-shadow:none !important;-webkit-text-fill-color:transparent !important}' })
        await page.waitForFunction(() => getComputedStyle(document.body).color === 'rgba(0, 0, 0, 0)')
        const shotB = (await page.screenshot({ type: 'png' })).toString('base64')
        await page.evaluate(() => {
          [...document.querySelectorAll('style')].filter((s) => s.textContent.includes('l8-hide-glyphs')).forEach((s) => s.remove())
        })
        await page.waitForFunction(() => getComputedStyle(document.body).color !== 'rgba(0, 0, 0, 0)')
        const recs = await page.evaluate(SAMPLE, { a: shotA, b: shotB, cands })
        for (const rec of recs) {
          const j = judge(rec)
          if (!j) continue
          if (j.skipped) { skipped.push({ page: t.id, theme, vp, path: rec.path, text: rec.text, why: j.skipped }); continue }
          const key = rec.path + '|' + rec.text
          const prev = seen.get(key)
          if (!prev || j.ratio < prev.ratio) seen.set(key, { page: t.id, theme, vp, path: rec.path, text: rec.text, color: rec.color, ...j })
        }
      }
      for (const v of seen.values()) all.push(v)
      console.log(`${t.id}|${theme}|${vp}: ${seen.size} runs, ${[...seen.values()].filter((v) => !v.pass).length} < AA`)
      await ctx.close()
    }
  }
}
await browser.close()
saveJSON('contrast-raw.json', all)
saveJSON('contrast-skipped.json', skipped)

const fails = all.filter((a) => !a.pass)
const grp = (list) => {
  const g = {}
  for (const f of list) {
    const k = `${f.theme}|${f.path}`
    g[k] ??= { ...f, texts: new Set(), pages: new Set(), vps: new Set(), min: f.ratio }
    g[k].texts.add(f.text); g[k].pages.add(f.page); g[k].vps.add(f.vp)
    if (f.ratio < g[k].min) { Object.assign(g[k], f); g[k].min = f.ratio }
  }
  return g
}
console.log('\n================ BELOW AA ================')
const gf = grp(fails)
for (const k of Object.keys(gf).sort((a, b) => gf[a].min - gf[b].min)) {
  const v = gf[k]
  console.log(`\n[${v.theme}] ${v.path}   ${v.min}:1  (need ${v.need}${v.large ? ' large' : ''})  worst-pixel ${v.worst}:1`)
  console.log(`   token ${v.color} opacityChain ${v.opacityChain} | measured fg rgb(${v.fgPix}) on rgb(${v.bg}) | nominal ${v.ratioNom}:1 pixel ${v.ratioPix}:1 | ${v.fontSize}px/${v.fontWeight}`)
  console.log(`   text ${[...v.texts].slice(0, 3).map((s) => JSON.stringify(s)).join(', ')}  @ ${[...v.pages].join(',')} / ${[...v.vps].join(',')}`)
}
console.log('\n================ AA but NOT AAA (design doc claims AAA on noir) ================')
const gn = grp(all.filter((a) => a.pass && !a.passAAA))
for (const k of Object.keys(gn).sort((a, b) => gn[a].min - gn[b].min)) {
  const v = gn[k]
  console.log(`[${v.theme}] ${String(v.min).padEnd(5)}:1 (AAA ${v.needAAA}) ${v.path}  "${v.text}" ${v.fontSize}px/${v.fontWeight}`)
}
console.log(`\nTOTAL runs ${all.length} | <AA ${fails.length} | <AAA ${all.filter((a) => a.pass && !a.passAAA).length} | skipped(not rendered) ${skipped.length}`)
