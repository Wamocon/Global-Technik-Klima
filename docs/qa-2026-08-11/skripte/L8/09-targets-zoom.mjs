/**
 * (a) WCAG 2.5.8 target size, measuring the ACTUAL pointer-accepting region
 *     (for a wrapped control the label counts, so it is measured too).
 * (b) WCAG 1.4.4 / 1.4.10 zoom + reflow, incl. text-only scaling.
 * (c) fixed-overlay collisions.
 * Plus: reveal completion re-check, exploded canvas under reduced motion,
 *       iframe tab-stop count, chip focus loss, range PageUp.
 */
import { launch, openPage, revealAll, saveJSON, DIR } from './lib.mjs'

const browser = await launch()
const out = {}

// ── (a) touch targets at 390x844 ─────────────────────────────────────────────
for (const theme of ['dark', 'light']) {
  const { page, ctx } = await openPage(browser, { url: '/', theme, viewport: 'mobile' })
  await revealAll(page)
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  await page.click('#chatfab'); await page.waitForFunction(() => !document.getElementById('chatpanel').hidden)
  await page.click('#burger'); await page.waitForFunction(() => !document.getElementById('mobnav').hidden)
  const t = await page.evaluate(() => {
    const label = (e) => {
      const al = e.getAttribute('aria-label')
      if (al) return al
      const t = (e.textContent || '').trim().replace(/\s+/g, ' ')
      if (t) return t.slice(0, 32)
      if (e.labels && e.labels[0]) return '[label] ' + e.labels[0].textContent.trim().replace(/\s+/g, ' ').slice(0, 28)
      return e.tagName + (e.id ? '#' + e.id : '')
    }
    const groups = {
      'language switcher': '.lang a',
      'theme toggle': '#themetog',
      burger: '#burger',
      'mobile menu links': '#mobnav a',
      'hero CTAs': '.hero .cta a',
      'hero phones': '.hero .phone',
      'rating badge': '.ratingbig',
      'calc inputs': '.calc input',
      'sun toggle': '.toggle button',
      'calc CTA': '#ccta',
      'before/after slider': '#baRange',
      'form text fields': '#reqForm input[type=text],#reqForm input[type=tel],#reqForm select,#reqForm textarea',
      'consent checkbox': '.rf-consent input',
      'form submit': '#reqForm .rf-submit',
      'chat FAB': '#chatfab',
      'chat close': '#cclose',
      'chat chips': '#cchips button',
      'chat send': '#cform button',
      'chat input': '#cin',
      'mobar links': '.mobar a',
      'footer legal links': '.foot .fl a',
      'footer social links': '.fsoc a',
      'contact list links': '.crow a',
      'legal/back links': '.back',
      'project CTA buttons': '.pcta a',
      'campaign CTA': '.camp-cta',
    }
    const res = []
    for (const [g, sel] of Object.entries(groups)) {
      for (const e of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(e)
        if (cs.display === 'none' || cs.visibility === 'hidden' || !e.getClientRects().length) continue
        const r = e.getBoundingClientRect()
        // effective target: if a <label> wraps the control, the label is clickable too
        let eff = { w: r.width, h: r.height, via: 'self' }
        const lab = e.labels && e.labels[0]
        if (lab && lab.contains(e)) { const lr = lab.getBoundingClientRect(); eff = { w: lr.width, h: lr.height, via: 'wrapping <label>' } }
        res.push({ group: g, label: label(e), w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, effW: Math.round(eff.w * 10) / 10, effH: Math.round(eff.h * 10) / 10, effVia: eff.via, x: Math.round(r.x), y: Math.round(r.y) })
      }
    }
    // adjacency: nearest gap between any two interactive rects
    const inter = [...document.querySelectorAll('a[href],button,input,select,textarea')].filter((e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && e.getClientRects().length && !e.closest('.rf-hp') })
    const near = []
    for (let i = 0; i < inter.length; i++) for (let j = i + 1; j < inter.length; j++) {
      const a = inter[i].getBoundingClientRect(), b = inter[j].getBoundingClientRect()
      const dx = Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right))
      const dy = Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom))
      const gap = Math.hypot(dx, dy)
      if (gap < 8 && !(dx === 0 && dy === 0)) {
        const nm = (e) => (e.getAttribute('aria-label') || (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 22) || e.tagName)
        near.push({ a: nm(inter[i]), b: nm(inter[j]), gapPx: Math.round(gap * 10) / 10, aSize: `${Math.round(a.width)}x${Math.round(a.height)}`, bSize: `${Math.round(b.width)}x${Math.round(b.height)}` })
      }
    }
    // do the fixed overlays cover the form controls / footer legal links?
    const overlaps = []
    const fixed = ['.mobar', '.chatfab', '.wafab', '#chatpanel', '.topbar'].map((s) => ({ s, e: document.querySelector(s) })).filter((o) => o.e && getComputedStyle(o.e).display !== 'none')
    const victims = ['#reqForm .rf-submit', '.rf-consent', '.foot .fl a', '.fsoc a', '.foot .fr', '#ccta', '.crow a']
    for (const v of victims) {
      for (const e of document.querySelectorAll(v)) {
        e.scrollIntoView({ block: 'center', behavior: 'instant' })
        const r = e.getBoundingClientRect()
        for (const f of fixed) {
          const fr = f.e.getBoundingClientRect()
          const ox = Math.min(r.right, fr.right) - Math.max(r.left, fr.left)
          const oy = Math.min(r.bottom, fr.bottom) - Math.max(r.top, fr.top)
          if (ox > 0 && oy > 0) overlaps.push({ victim: v, over: f.s, overlapPx: `${Math.round(ox)}x${Math.round(oy)}`, pctOfVictim: Math.round(((ox * oy) / Math.max(1, r.width * r.height)) * 100) })
        }
      }
    }
    // and at the very bottom of the page (default position, not scrolled to centre)
    scrollTo(0, document.documentElement.scrollHeight)
    const atBottom = []
    for (const v of ['.foot .fl a', '.foot .fr', '.fsoc a']) {
      for (const e of document.querySelectorAll(v)) {
        const r = e.getBoundingClientRect()
        for (const f of fixed) {
          const fr = f.e.getBoundingClientRect()
          const ox = Math.min(r.right, fr.right) - Math.max(r.left, fr.left)
          const oy = Math.min(r.bottom, fr.bottom) - Math.max(r.top, fr.top)
          if (ox > 0 && oy > 0) atBottom.push({ victim: v, text: (e.textContent || '').trim().slice(0, 24), over: f.s, overlapPx: `${Math.round(ox)}x${Math.round(oy)}`, pctCovered: Math.round(((ox * oy) / Math.max(1, r.width * r.height)) * 100) })
        }
      }
    }
    return { res, near, overlaps, atBottom }
  })
  out[`targets-${theme}`] = t
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await page.screenshot({ path: `${DIR}/bottom-mobile-${theme}.png` })
  await ctx.close()
}

// ── (b) zoom / reflow ────────────────────────────────────────────────────────
const zoomCases = [
  { name: '200pct-1280', width: 640, height: 360, dsf: 2, note: '200% page zoom at 1280 CSS px  => 640x360 layout viewport' },
  { name: '400pct-1280', width: 320, height: 180, dsf: 4, note: '400% page zoom at 1280 CSS px  => 320x180 layout viewport (1.4.10 reflow)' },
  { name: '320w', width: 320, height: 512, dsf: 1, note: '320 CSS px wide (reflow reference)' },
  { name: 'landscape-phone', width: 844, height: 390, dsf: 1, note: '390x844 phone rotated to landscape' },
]
for (const theme of ['dark', 'light']) {
  for (const z of zoomCases) {
    const { page, ctx, errors } = await openPage(browser, { url: '/', theme, viewport: { width: z.width, height: z.height }, deviceScaleFactor: z.dsf })
    await revealAll(page)
    await page.waitForFunction(() => document.fonts.status === 'loaded')
    const m = await page.evaluate(() => {
      const de = document.documentElement
      const wide = [...document.querySelectorAll('body *')].filter((e) => {
        const r = e.getBoundingClientRect()
        return r.width > innerWidth + 2 && getComputedStyle(e).position !== 'fixed' && r.height > 2
      }).slice(0, 8).map((e) => ({ tag: e.tagName, cls: (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter((c) => c && !c.startsWith('astro-')).slice(0, 2).join('.'), w: Math.round(e.getBoundingClientRect().width) }))
      // clipped text: element whose scrollWidth exceeds clientWidth while overflow is hidden
      const clipped = [...document.querySelectorAll('body *')].filter((e) => {
        const cs = getComputedStyle(e)
        return (cs.overflowX === 'hidden' || cs.overflow === 'hidden') && e.scrollWidth > e.clientWidth + 2 && e.textContent.trim().length > 3 && e.children.length === 0
      }).slice(0, 8).map((e) => ({ cls: (typeof e.className === 'string' ? e.className : '').split(/\s+/)[0], text: e.textContent.trim().slice(0, 30), scrollW: e.scrollWidth, clientW: e.clientWidth }))
      return {
        docScrollW: de.scrollWidth, innerW: innerWidth, hScroll: de.scrollWidth > innerWidth + 1,
        bodyScrollW: document.body.scrollWidth,
        wide, clipped,
        topbarH: Math.round(document.querySelector('.topbar')?.getBoundingClientRect().height || 0),
        mobarVisible: (() => { const m = document.querySelector('.mobar'); return m ? getComputedStyle(m).display !== 'none' : false })(),
      }
    })
    // chat panel in this viewport
    let chat = null
    if (await page.$('#chatfab')) {
      await page.click('#chatfab')
      await page.waitForFunction(() => !document.getElementById('chatpanel').hidden)
      chat = await page.evaluate(() => {
        const p = document.getElementById('chatpanel'); const r = p.getBoundingClientRect()
        const cb = document.getElementById('cbody').getBoundingClientRect()
        return { panel: { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }, viewport: { w: innerWidth, h: innerHeight }, pctOfViewportH: Math.round((r.height / innerHeight) * 100), bodyH: Math.round(cb.height), inputVisible: (() => { const i = document.getElementById('cin').getBoundingClientRect(); return i.bottom <= innerHeight && i.top >= 0 })() }
      })
      await page.screenshot({ path: `${DIR}/zoom-${theme}-${z.name}-chat.png` })
      await page.click('#cclose')
      await page.waitForFunction(() => document.getElementById('chatpanel').hidden)
    }
    await page.screenshot({ path: `${DIR}/zoom-${theme}-${z.name}.png` })
    out[`zoom-${theme}-${z.name}`] = { note: z.note, ...m, chat, errors }
    await ctx.close()
  }
}

// ── text-only zoom to 200% ───────────────────────────────────────────────────
for (const theme of ['dark', 'light']) {
  const { page, ctx } = await openPage(browser, { url: '/', theme, viewport: { width: 1280, height: 800 } })
  await revealAll(page)
  await page.addStyleTag({ content: 'html{font-size:34px !important}' }) // 2x the 17px body base
  await page.waitForFunction(() => parseFloat(getComputedStyle(document.documentElement).fontSize) > 30)
  await revealAll(page)
  const m = await page.evaluate(() => ({
    hScroll: document.documentElement.scrollWidth > innerWidth + 1,
    docScrollW: document.documentElement.scrollWidth, innerW: innerWidth,
    clipped: [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); return (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden') && (e.scrollHeight > e.clientHeight + 4 || e.scrollWidth > e.clientWidth + 4) && e.textContent.trim().length > 3 }).slice(0, 10).map((e) => ({ cls: (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter((c) => c && !c.startsWith('astro-'))[0], text: e.textContent.trim().slice(0, 34), sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight })),
    topbarH: Math.round(document.querySelector('.topbar').getBoundingClientRect().height),
  }))
  await page.screenshot({ path: `${DIR}/textzoom200-${theme}.png` })
  out[`textzoom-${theme}`] = m
  await ctx.close()
}

// ── extras ───────────────────────────────────────────────────────────────────
{
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'desktop' })
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  // reveal completion, properly waited
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 350) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)) } })
  const settle = await page.waitForFunction(() => [...document.querySelectorAll('[data-reveal]')].every((n) => Number(getComputedStyle(n).opacity) > 0.9), null, { timeout: 6000 }).then(() => 'all revealed').catch(() => 'STILL HIDDEN')
  const stillHidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((n) => Number(getComputedStyle(n).opacity) < 0.9).map((n) => ({ cls: n.className.split(' ').filter((c) => !c.startsWith('astro-')).join('.'), op: getComputedStyle(n).opacity, y: Math.round(n.getBoundingClientRect().top + scrollY) })))
  out.revealSettle = { settle, stillHidden }

  // iframe tab stops
  await page.evaluate(() => { scrollTo(0, 0); document.activeElement?.blur?.() })
  let pressesToIframe = 0
  for (let i = 0; i < 60; i++) { await page.keyboard.press('Tab'); const t = await page.evaluate(() => document.activeElement?.tagName); pressesToIframe++; if (t === 'IFRAME') break }
  let insideIframe = 0
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab')
    const back = await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id, text: (document.activeElement?.textContent || '').trim().slice(0, 24) }))
    insideIframe++
    if (back.tag !== 'IFRAME' && back.tag !== 'BODY') break
    if (back.tag === 'BODY') break
  }
  const afterIframe = await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: (document.activeElement?.textContent || '').trim().slice(0, 30) }))
  out.iframeTabs = { pressesToReachIframe: pressesToIframe, tabPressesSpentInsideIframe: insideIframe, landedOn: afterIframe }

  // range: PageUp / PageDown granularity
  await page.evaluate(() => { document.getElementById('ba').scrollIntoView({ block: 'center', behavior: 'instant' }); document.getElementById('baRange').focus() })
  const r0 = await page.evaluate(() => document.getElementById('baRange').value)
  await page.keyboard.press('PageUp')
  const r1 = await page.evaluate(() => document.getElementById('baRange').value)
  await page.keyboard.press('ArrowRight')
  const r2 = await page.evaluate(() => document.getElementById('baRange').value)
  out.rangeSteps = { start: r0, afterPageUp: r1, afterArrowRight: r2 }

  // chip: where does focus go after activating a chip with the keyboard?
  await page.click('#chatfab'); await page.waitForFunction(() => !document.getElementById('chatpanel').hidden)
  await page.evaluate(() => document.querySelector('#cchips button').focus())
  const beforeChip = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 24))
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => getComputedStyle(document.getElementById('cchips')).display === 'none')
  const afterChip = await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id, text: (document.activeElement?.textContent || '').trim().slice(0, 24), isBody: document.activeElement === document.body, insideHidden: !!document.activeElement?.closest?.('[style*="display: none"]') }))
  await page.keyboard.press('Tab')
  const nextAfterChip = await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id, text: (document.activeElement?.textContent || '').trim().slice(0, 24) }))
  out.chipFocus = { beforeChip, afterChip, nextAfterChip }
  await ctx.close()
}
// exploded canvas under reduced motion: does it actually draw?
{
  const { page, ctx } = await openPage(browser, { url: '/', theme: 'dark', viewport: 'desktop', reducedMotion: 'reduce' })
  await page.evaluate(() => document.getElementById('expStage').scrollIntoView({ block: 'center', behavior: 'instant' }))
  const drawn = await page.waitForFunction(() => {
    const c = document.getElementById('expCanvas')
    if (!c || !c.width) return false
    try { const d = c.toDataURL(); return d.length > 3000 } catch { return true }
  }, null, { timeout: 15000 }).then(() => true).catch(() => false)
  const info = await page.evaluate(() => { const c = document.getElementById('expCanvas'); return { w: c.width, h: c.height, dataLen: (() => { try { return c.toDataURL().length } catch { return -1 } })(), legendOn: document.querySelectorAll('#expLegend li.on').length, legendTotal: document.querySelectorAll('#expLegend li').length, legendOpacities: [...document.querySelectorAll('#expLegend li')].map((l) => getComputedStyle(l).opacity) } })
  await page.screenshot({ path: `${DIR}/reduced-exploded.png`, clip: await page.evaluate(() => { const r = document.getElementById('expStage').getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(1440, r.width), height: Math.min(900, r.height) } }) })
  out.reducedExploded = { drawn, info }
  await ctx.close()
}
await browser.close()
saveJSON('targets-zoom-raw.json', out)
console.log(JSON.stringify({ ...out, 'targets-dark': undefined, 'targets-light': undefined }, null, 1))
console.log('\n===== TARGET SIZES (390x844) =====')
for (const theme of ['dark']) {
  const t = out[`targets-${theme}`]
  const bad24 = t.res.filter((r) => Math.min(r.effW, r.effH) < 24)
  const bad44 = t.res.filter((r) => Math.min(r.effW, r.effH) < 44)
  const seen = new Set()
  console.log('--- under 24x24 (WCAG 2.5.8 AA):')
  bad24.forEach((r) => console.log(`   ${r.group.padEnd(22)} ${String(r.w + 'x' + r.h).padEnd(12)} eff ${r.effW}x${r.effH} via ${r.effVia}  "${r.label}"`))
  console.log('--- under 44x44 (recommended / 2.5.5 AAA):')
  bad44.forEach((r) => { const k = r.group + r.label; if (seen.has(k)) return; seen.add(k); console.log(`   ${r.group.padEnd(22)} ${String(r.w + 'x' + r.h).padEnd(12)} eff ${r.effW}x${r.effH} via ${r.effVia}  "${r.label}"`) })
  console.log('--- all measured:')
  const g = {}
  t.res.forEach((r) => { g[r.group] ??= []; g[r.group].push(`${r.w}x${r.h}`) })
  Object.entries(g).forEach(([k, v]) => console.log(`   ${k.padEnd(24)} ${[...new Set(v)].join(', ')}`))
  console.log('--- adjacent pairs closer than 8px:')
  t.near.slice(0, 25).forEach((n) => console.log(`   ${n.gapPx}px  "${n.a}" (${n.aSize})  <->  "${n.b}" (${n.bSize})`))
  console.log('--- fixed overlay overlaps (element scrolled to centre):')
  const uniq = new Set()
  t.overlaps.forEach((o) => { const k = o.victim + o.over; if (uniq.has(k)) return; uniq.add(k); console.log(`   ${o.victim} covered by ${o.over}: ${o.overlapPx} (${o.pctOfVictim}% of it)`) })
  console.log('--- at the natural bottom of the page:')
  t.atBottom.forEach((o) => console.log(`   "${o.text}" (${o.victim}) covered by ${o.over}: ${o.overlapPx} = ${o.pctCovered}%`))
}
