/**
 * Targeted contrast measurement for the exact elements named in the task, in both
 * themes. Each element is scrolled to the vertical centre of the viewport first, so
 * its rect is fully visible and never occluded by the sticky header — the artefact
 * that poisoned the first sweep.
 *
 * Text  -> WCAG 1.4.3 / 1.4.6
 * Bord. -> WCAG 1.4.11 (non-text contrast, 3:1) measured as border pixel vs the
 *          pixel just outside and just inside the border.
 */
import { launch, openPage, revealAll, contrast, r2, saveJSON, DIR } from './lib.mjs'

const TEXT_TARGETS = [
  ['--fg-mute body copy (.lede)', '#urunler .lede'],
  ['--fg-mute body copy (.hint)', '#kesif .hint'],
  ['--fg-mute card copy (.card p)', '#hizmetler .card p'],
  ['--fg-mute tile copy (.tile p)', '#neden .tile p'],
  ['.kicker on .sec-alt (randevu)', '#randevu .kicker'],
  ['.kicker on .sec (projeler)', '#projeler .kicker'],
  ['.eyebrow section title', '#hizmetler .eyebrow'],
  ['.hero-kicker', '.hero-kicker'],
  ['h1 line 2 (champagne)', '.build .cool'],
  ['.btn-primary (form submit)', '#reqForm .rf-submit'],
  ['.btn-primary (calc CTA)', '#ccta'],
  ['.btn secondary (hero)', '.hero .cta .btn:not(.btn-primary)'],
  ['.crow .lab (accent micro-label)', '#kontakt .crow .lab'],
  ['.ab-since chip', '.ab-since'],
  ['.warranty .wb badge', '.warranty .wb'],
  ['.rev .ex example badge', '.rev .ex'],
  ['.rev .stars', '.rev .stars'],
  ['.step-n', '#projeler .step-n'],
  ['.lang a[aria-current]', '.lang a[aria-current="page"]'],
  ['.lang a (inactive)', '.lang a:not([aria-current])'],
  ['.mainnav a', '.mainnav a'],
  ['.mobar a (call)', '.mobar a:first-child'],
  ['.mobar .mo-wa', '.mobar .mo-wa'],
  ['.trustchips span', '.trustchips span'],
  ['.rf label', '#reqForm .rf > span'],
  ['.rf required asterisk', '#reqForm .rf > span b'],
  ['.rf-consent text', '.rf-consent span'],
  ['.rf-hint', '.rf-hint'],
  ['.foot legal link', '.foot .fl a'],
  ['.foot copyright', '.foot .fr'],
  ['.exp-legend inactive name', '.exp-legend li:not(.on) .txt b'],
  ['.exp-legend inactive text', '.exp-legend li:not(.on) .txt span'],
  ['.exp-legend number', '.exp-legend li:not(.on) .num'],
  ['.exp-hint', '.exp-hint'],
  ['.ba-lab before', '.ba-lab-l'],
  ['.ba-lab after', '.ba-lab-r'],
  ['.ba-ex example badge', '.ba-ex'],
  ['.calc result value', '#cbtu'],
  ['.toggle button (off)', '.toggle button:not(.on)'],
  ['.toggle button.on', '.toggle button.on'],
  ['.ratingbig number', '.ratingbig .rnum'],
  ['.ratingbig stars', '.ratingbig .stars'],
  ['.ratingbig count', '.ratingbig .rcount'],
]
const CHAT_TARGETS = [
  ['.cdisc AI disclosure', '.cdisc'],
  ['.cchips suggestion', '#cchips button'],
  ['.ci-t .on (online)', '.ci-t .on'],
  ['.cclose (x)', '#cclose'],
  ['chat bot bubble', '#chatpanel .msg.bot .b'],
  ['chat input placeholder-ish (border)', '#cin'],
]
const ERR_TARGETS = [['.rf-err error text', '#reqErr']]

const NONTEXT = [
  ['input border (--line-2)', '#reqForm input[name=name]'],
  ['select border', '#reqForm select'],
  ['textarea border', '#reqForm textarea'],
  ['.toggle group border', '.toggle'],
  ['themetog border', '#themetog'],
  ['burger border', '#burger'],
  ['card border (--line)', '#hizmetler .card'],
  ['consent checkbox', '.rf-consent input'],
  ['.wafab (WhatsApp FAB)', '.wafab'],
  ['.chatfab', '#chatfab'],
  ['.mobar top border', '.mobar'],
]

function parseRGB(s) {
  const m = String(s).match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
}

const shots = async (page) => {
  const a = (await page.screenshot({ type: 'png' })).toString('base64')
  await page.addStyleTag({ content: '#l8hide{}\n*,*::before,*::after{color:transparent !important;text-shadow:none !important;-webkit-text-fill-color:transparent !important}' })
  await page.waitForFunction(() => getComputedStyle(document.body).color === 'rgba(0, 0, 0, 0)')
  const b = (await page.screenshot({ type: 'png' })).toString('base64')
  await page.evaluate(() => { [...document.querySelectorAll('style')].filter((s) => s.textContent.includes('l8hide')).forEach((s) => s.remove()) })
  await page.waitForFunction(() => getComputedStyle(document.body).color !== 'rgba(0, 0, 0, 0)')
  return { a, b }
}

const MEASURE = async ({ a, b, sel, mode }) => {
  const load = async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0)
    return { d: cx.getImageData(0, 0, cv.width, cv.height).data, w: cv.width, h: cv.height }
  }
  const A = await load(a), B = await load(b)
  const at = (I, x, y) => { const i = (y * I.w + x) * 4; return [I.d[i], I.d[i + 1], I.d[i + 2]] }
  const dist = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2])
  const el = document.querySelector(sel)
  if (!el) return { missing: true }
  const cs = getComputedStyle(el)
  const R = el.getBoundingClientRect()
  if (mode === 'border') {
    // sample the mid-point of the top border and of the left border in shot B
    const bw = { t: parseFloat(cs.borderTopWidth), l: parseFloat(cs.borderLeftWidth) }
    const probes = []
    const cx = Math.round(R.left + R.width / 2), cy = Math.round(R.top + R.height / 2)
    if (bw.t >= 1 && R.top > 2) probes.push({ side: 'top', on: [cx, Math.round(R.top + bw.t / 2)], out: [cx, Math.round(R.top - 2)], in: [cx, Math.round(R.top + bw.t + 2)] })
    if (bw.l >= 1 && R.left > 2) probes.push({ side: 'left', on: [Math.round(R.left + bw.l / 2), cy], out: [Math.round(R.left - 2), cy], in: [Math.round(R.left + bw.l + 2), cy] })
    return {
      sel, rect: { x: R.x, y: R.y, w: R.width, h: R.height },
      borderColor: cs.borderTopColor, borderWidth: cs.borderTopWidth, bgColor: cs.backgroundColor,
      probes: probes.map((p) => ({ side: p.side, on: at(B, ...p.on), out: at(B, ...p.out), inn: at(B, ...p.in) })),
    }
  }
  if (mode === 'shape') {
    // filled control: its own fill vs the page behind it, plus icon vs fill
    const cx = Math.round(R.left + R.width / 2), cy = Math.round(R.top + R.height / 2)
    const fill = at(B, cx, cy)
    const outside = [at(B, Math.round(R.left - 4), cy), at(B, Math.round(R.right + 4), cy), at(B, cx, Math.round(R.top - 4))].filter((p) => p)
    // icon: pixels inside that differ most from fill in shot A
    let icon = null, best = -1
    for (let y = Math.max(0, Math.round(R.top)); y < Math.min(B.h, Math.round(R.bottom)); y++) {
      for (let x = Math.max(0, Math.round(R.left)); x < Math.min(B.w, Math.round(R.right)); x++) {
        const p = at(A, x, y), d = dist(p, fill)
        if (d > best) { best = d; icon = p }
      }
    }
    return { sel, rect: { x: R.x, y: R.y, w: R.width, h: R.height }, fill, outside, icon, cssBg: cs.backgroundColor, cssColor: cs.color }
  }
  // text mode
  const tn = []
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let t
  while ((t = w.nextNode())) if (t.nodeValue && t.nodeValue.trim()) tn.push(t)
  if (!tn.length) return { missing: 'no text node' }
  const rects = []
  for (const n of tn) { const rg = document.createRange(); rg.selectNodeContents(n); rects.push(...[...rg.getClientRects()].filter((r) => r.width > 1 && r.height > 1)) }
  const hist = new Map(); const glyph = []
  for (const r of rects) {
    for (let y = Math.max(0, Math.round(r.top)); y < Math.min(B.h, Math.round(r.bottom)); y++) {
      for (let x = Math.max(0, Math.round(r.left)); x < Math.min(B.w, Math.round(r.right)); x++) {
        const pb = at(B, x, y), pa = at(A, x, y)
        const k = pb[0] * 65536 + pb[1] * 256 + pb[2]
        hist.set(k, (hist.get(k) || 0) + 1)
        if (dist(pa, pb) > 12) glyph.push(pa)
      }
    }
  }
  if (!hist.size) return { missing: 'no pixels' }
  const ent = [...hist.entries()].sort((x, y) => y[1] - x[1])
  const dec = (k) => [(k >> 16) & 255, (k >> 8) & 255, k & 255]
  const bg = dec(ent[0][0])
  let fgPix = null
  if (glyph.length >= 4) {
    const s = glyph.map((p) => ({ p, d: dist(p, bg) })).sort((x, y) => x.d - y.d)
    fgPix = s[Math.min(s.length - 1, Math.floor(s.length * 0.9))].p
  }
  let op = 1, n2 = el
  while (n2 && n2 !== document.documentElement) { op *= parseFloat(getComputedStyle(n2).opacity); n2 = n2.parentElement }
  return {
    sel, text: tn[0].nodeValue.trim().slice(0, 42), color: cs.color, fontSize: parseFloat(cs.fontSize),
    fontWeight: cs.fontWeight, opacityChain: Math.round(op * 1000) / 1000,
    bg, bgShare: Math.round((ent[0][1] / hist.size ? ent[0][1] / [...hist.values()].reduce((s, v) => s + v, 0) : 0) * 100) / 100,
    fgPix, glyphN: glyph.length, samples: [...hist.values()].reduce((s, v) => s + v, 0),
    rect: { x: R.x, y: R.y, w: R.width, h: R.height },
  }
}

const browser = await launch()
const rows = []

for (const theme of ['dark', 'light']) {
  for (const vp of ['desktop', 'mobile']) {
    const { page, ctx } = await openPage(browser, { url: '/', theme, viewport: vp })
    await revealAll(page)
    await page.waitForFunction(() => document.fonts.status === 'loaded')
    await page.waitForFunction(() => document.getAnimations().filter((a) => a.playState === 'running').length === 0, null, { timeout: 8000 }).catch(() => {})

    const run = async (list, mode) => {
      for (const [label, sel] of list) {
        const exists = await page.$(sel)
        if (!exists) { rows.push({ theme, vp, label, sel, mode, missing: 'selector not present' }); continue }
        const vis = await page.evaluate((s) => {
          const e = document.querySelector(s)
          const cs = getComputedStyle(e)
          return !(cs.display === 'none' || cs.visibility === 'hidden' || e.getClientRects().length === 0)
        }, sel)
        if (!vis) { rows.push({ theme, vp, label, sel, mode, missing: 'not displayed at this viewport' }); continue }
        // centre it so nothing sticky can cover it
        await page.evaluate((s) => {
          const e = document.querySelector(s)
          const fixed = getComputedStyle(e).position === 'fixed' || !!e.closest('.mobar,.chatfab,.wafab,#chatpanel,.topbar')
          if (!fixed) e.scrollIntoView({ block: 'center', behavior: 'instant' })
        }, sel)
        await page.waitForFunction((s) => {
          const e = document.querySelector(s); const r = e.getBoundingClientRect()
          return r.top >= 0 && r.bottom <= innerHeight
        }, sel, { timeout: 4000 }).catch(() => {})
        await revealAll(page)
        const { a, b } = await shots(page)
        const m = await page.evaluate(MEASURE, { a, b, sel, mode })
        rows.push({ theme, vp, label, sel, mode, ...m })
      }
    }

    await run(TEXT_TARGETS, 'text')
    // chat states
    await page.click('#chatfab')
    await page.waitForSelector('#chatpanel:not([hidden])')
    await run(CHAT_TARGETS, 'text')
    await page.click('#cclose')
    await page.waitForFunction(() => document.getElementById('chatpanel').hidden)
    // error state
    await page.evaluate(() => document.getElementById('reqForm').scrollIntoView({ block: 'center', behavior: 'instant' }))
    await page.click('#reqForm .rf-submit')
    await page.waitForSelector('#reqErr:not([hidden])')
    await run(ERR_TARGETS, 'text')
    await run(NONTEXT.filter((n) => ['.wafab (WhatsApp FAB)', '.chatfab'].includes(n[0])), 'shape')
    await run(NONTEXT.filter((n) => !['.wafab (WhatsApp FAB)', '.chatfab'].includes(n[0])), 'border')
    await page.screenshot({ path: `${DIR}/state-${theme}-${vp}-formerror.png` })
    await ctx.close()
  }
}
await browser.close()
saveJSON('targeted-raw.json', rows)

const line = (r) => {
  if (r.missing) return `   ${r.label.padEnd(34)} ${r.theme}/${r.vp}  -- ${r.missing}`
  if (r.mode === 'text') {
    const nom = parseRGB(r.color)
    const alpha = (nom?.a ?? 1) * (r.opacityChain ?? 1)
    const comp = nom ? [Math.round(nom.r * alpha + r.bg[0] * (1 - alpha)), Math.round(nom.g * alpha + r.bg[1] * (1 - alpha)), Math.round(nom.b * alpha + r.bg[2] * (1 - alpha))] : null
    const cn = comp ? contrast(comp, r.bg) : null
    const cp = r.fgPix ? contrast(r.fgPix, r.bg) : null
    const best = Math.max(cn ?? 0, cp ?? 0)
    const bold = parseInt(r.fontWeight, 10) >= 700
    const large = r.fontSize >= 24 || (bold && r.fontSize >= 18.66)
    const need = large ? 3 : 4.5, needAAA = large ? 4.5 : 7
    const verdict = best >= needAAA ? 'AAA' : best >= need ? 'AA ' : 'FAIL'
    return `   ${r.label.padEnd(34)} ${r.theme.padEnd(5)}/${r.vp.padEnd(7)} ${String(r2(best)).padStart(6)}:1  need ${need}  ${verdict}  ${r.fontSize}px/${r.fontWeight}${large ? ' LARGE' : ''}  fg ${r.color} op${r.opacityChain} -> rgb(${r.fgPix}) on rgb(${r.bg})   "${r.text}"`
  }
  if (r.mode === 'border') {
    const ps = (r.probes || []).map((p) => {
      const cOut = contrast(p.on, p.out), cIn = contrast(p.on, p.inn)
      return `${p.side}: border rgb(${p.on}) vs outside rgb(${p.out}) = ${r2(cOut)}:1 ; vs inside rgb(${p.inn}) = ${r2(cIn)}:1 -> best ${r2(Math.max(cOut, cIn))}:1 ${Math.max(cOut, cIn) >= 3 ? 'OK' : 'FAIL(1.4.11)'}`
    })
    return `   ${r.label.padEnd(34)} ${r.theme.padEnd(5)}/${r.vp.padEnd(7)} css ${r.borderColor} ${r.borderWidth}\n        ${ps.join('\n        ')}`
  }
  if (r.mode === 'shape') {
    const vsOut = (r.outside || []).map((o) => r2(contrast(r.fill, o)))
    const vsIcon = r.icon ? r2(contrast(r.icon, r.fill)) : null
    return `   ${r.label.padEnd(34)} ${r.theme.padEnd(5)}/${r.vp.padEnd(7)} fill rgb(${r.fill}) vs page ${vsOut.join('/')} :1 | icon rgb(${r.icon}) vs fill ${vsIcon}:1 ${vsIcon >= 3 ? 'OK' : 'FAIL(1.4.11)'}`
  }
  return ''
}

console.log('==================== TEXT ====================')
for (const r of rows.filter((r) => r.mode === 'text')) console.log(line(r))
console.log('==================== NON-TEXT (1.4.11) ====================')
for (const r of rows.filter((r) => r.mode !== 'text')) console.log(line(r))
