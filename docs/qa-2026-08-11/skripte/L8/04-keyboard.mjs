/**
 * Keyboard operability, end to end.
 *  - full focus order with the REAL accessible name (via CDP Accessibility AX tree)
 *  - focus indicator proven by pixel diff (focused vs unfocused screenshot of the
 *    element's region), not by reading CSS that may be overridden
 *  - keyboard trap detection
 *  - WCAG 2.4.11 Focus Not Obscured: does the sticky topbar / .mobar cover the
 *    focused element?
 *  - burger, chat dialog, before/after range, sun toggle, chips, skip link
 */
import { launch, openPage, revealAll, contrast, r2, saveJSON, DIR } from './lib.mjs'

const browser = await launch()

async function axName(cdp, expr) {
  const { result } = await cdp.send('Runtime.evaluate', { expression: expr })
  if (!result.objectId) return { role: null, name: null }
  try {
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false })
    const n = nodes[nodes.length - 1]
    return { role: n?.role?.value ?? null, name: n?.name?.value ?? null, props: (n?.properties || []).map((p) => `${p.name}=${JSON.stringify(p.value.value)}`).join(' ') }
  } catch { return { role: null, name: null } }
}

const ACTIVE_INFO = () => {
  const a = document.activeElement
  if (!a || a === document.body) return { tag: 'BODY', body: true }
  const r = a.getBoundingClientRect()
  const cs = getComputedStyle(a)
  const bar = document.querySelector('.topbar')?.getBoundingClientRect()
  const mob = document.querySelector('.mobar')
  const mobR = mob && getComputedStyle(mob).display !== 'none' ? mob.getBoundingClientRect() : null
  return {
    tag: a.tagName, id: a.id || null,
    cls: typeof a.className === 'string' ? a.className.split(/\s+/).filter((c) => c && !c.startsWith('astro-')).join('.') : null,
    text: (a.textContent || '').trim().slice(0, 40), href: a.getAttribute('href'), type: a.getAttribute('type'),
    ariaLabel: a.getAttribute('aria-label'), tabIndex: a.tabIndex,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor, outlineOffset: cs.outlineOffset,
    borderColor: cs.borderTopColor, boxShadow: cs.boxShadow.slice(0, 40),
    inTopbar: !!a.closest('.topbar'),
    obscuredByTopbar: !!(bar && r.top < bar.bottom && r.bottom > bar.top && !a.closest('.topbar')),
    obscuredByMobar: !!(mobR && r.bottom > mobR.top && r.top < mobR.bottom && !a.closest('.mobar')),
    inChat: !!a.closest('#chatpanel'), inMobnav: !!a.closest('#mobnav'),
    scrollY: window.scrollY,
  }
}

/** Prove a visible focus indicator by comparing pixels around the element. */
async function focusPixelDiff(page, pad = 8) {
  const box = await page.evaluate((p) => {
    const a = document.activeElement
    if (!a || a === document.body) return null
    const r = a.getBoundingClientRect()
    const x = Math.max(0, Math.floor(r.left - p)), y = Math.max(0, Math.floor(r.top - p))
    const w = Math.min(innerWidth - x, Math.ceil(r.width + 2 * p)), h = Math.min(innerHeight - y, Math.ceil(r.height + 2 * p))
    return w > 2 && h > 2 ? { x, y, width: w, height: h } : null
  }, pad)
  if (!box) return null
  const focused = await page.screenshot({ type: 'png', clip: box })
  // blur without changing the DOM focus order: focus the body
  await page.evaluate(() => { window.__prev = document.activeElement; document.activeElement.blur() })
  await page.waitForFunction(() => document.activeElement === document.body || document.activeElement === document.documentElement)
  const blurred = await page.screenshot({ type: 'png', clip: box })
  await page.evaluate(() => { if (window.__prev && window.__prev.focus) window.__prev.focus() })
  const cmp = await page.evaluate(async ({ f, b }) => {
    const dec = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return { d: x.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height } }
    const A = await dec(f), B = await dec(b)
    let changed = 0, maxd = 0, total = A.d.length / 4
    let fa = null, fb = null
    for (let i = 0; i < A.d.length; i += 4) {
      const d = Math.abs(A.d[i] - B.d[i]) + Math.abs(A.d[i + 1] - B.d[i + 1]) + Math.abs(A.d[i + 2] - B.d[i + 2])
      if (d > 24) { changed++; if (d > maxd) { maxd = d; fa = [A.d[i], A.d[i + 1], A.d[i + 2]]; fb = [B.d[i], B.d[i + 1], B.d[i + 2]] } }
    }
    return { changed, total, pct: Math.round((changed / total) * 10000) / 100, maxd, indicator: fa, under: fb }
  }, { f: focused.toString('base64'), b: blurred.toString('base64') })
  return cmp
}

const results = { focusOrder: {}, indicators: {}, burger: {}, chat: {}, range: {}, sunToggle: {}, chips: {}, skipLink: {}, traps: {} }

for (const theme of ['dark', 'light']) {
  for (const vp of ['desktop', 'mobile']) {
    const key = `${theme}/${vp}`
    const { page, ctx, errors } = await openPage(browser, { url: '/', theme, viewport: vp })
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Accessibility.enable')
    await revealAll(page)
    await page.waitForFunction(() => document.fonts.status === 'loaded')

    // ── full focus order ──────────────────────────────────────────────────────
    await page.evaluate(() => { document.body.focus(); if (document.activeElement !== document.body) document.activeElement.blur() })
    const order = []
    const seen = new Set()
    let trap = null
    for (let i = 0; i < 140; i++) {
      await page.keyboard.press('Tab')
      const info = await page.evaluate(ACTIVE_INFO)
      if (info.body) { order.push({ i, ...info }); break }
      const ax = await axName(cdp, 'document.activeElement')
      const sig = `${info.tag}#${info.id}.${info.cls}|${info.text}|${info.href}`
      if (seen.has(sig) && order.length > 5) {
        // wrapped around -> done (or trapped if we never left a small set)
        order.push({ i, wrapped: true, ...info, ...ax })
        break
      }
      seen.add(sig)
      order.push({ i, ...info, ...ax })
    }
    results.focusOrder[key] = order

    // indicator check for a representative + risky set
    const targets = [
      '.brand', '#themetog', '.lang a', '#burger', '.mainnav a',
      '.hero .cta .btn-primary', '.hero .cta .btn:not(.btn-primary)', '.ratingbig',
      '#ca', '#cp', '.toggle button', '#ccta', '#baRange',
      '#reqForm input[name=name]', '#reqForm select', '#reqForm textarea', '.rf-consent input', '#reqForm .rf-submit',
      '.foot .fl a', '.fsoc a', '.wafab', '#chatfab', '.mobar a', '.cmap iframe',
    ]
    results.indicators[key] = []
    for (const sel of targets) {
      const el = await page.$(sel)
      if (!el) { results.indicators[key].push({ sel, skip: 'absent' }); continue }
      const shown = await page.evaluate((s) => { const e = document.querySelector(s); return getComputedStyle(e).display !== 'none' && e.getClientRects().length > 0 }, sel)
      if (!shown) { results.indicators[key].push({ sel, skip: 'hidden at this viewport' }); continue }
      await page.evaluate((s) => {
        const e = document.querySelector(s)
        if (getComputedStyle(e).position !== 'fixed' && !e.closest('.mobar,.wafab,#chatfab,.topbar')) e.scrollIntoView({ block: 'center', behavior: 'instant' })
      }, sel)
      await revealAll(page)
      // focus via keyboard semantics: .focus() then force :focus-visible by pressing a key first
      await page.keyboard.press('Tab') // ensures the UA is in keyboard modality
      await page.evaluate((s) => document.querySelector(s).focus(), sel)
      await page.waitForFunction((s) => document.activeElement === document.querySelector(s), sel).catch(() => {})
      const cs = await page.evaluate((s) => {
        const e = document.querySelector(s), c = getComputedStyle(e)
        return { outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`, offset: c.outlineOffset, border: c.borderTopColor, matchesFV: e.matches(':focus-visible') }
      }, sel)
      const diff = await focusPixelDiff(page)
      results.indicators[key].push({ sel, ...cs, diff })
    }

    // ── burger ────────────────────────────────────────────────────────────────
    if (vp === 'mobile') {
      await page.evaluate(() => scrollTo(0, 0))
      await page.evaluate(() => document.getElementById('burger').focus())
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => !document.getElementById('mobnav').hidden)
      const afterOpen = await page.evaluate(ACTIVE_INFO)
      await page.keyboard.press('Tab')
      const t1 = await page.evaluate(ACTIVE_INFO)
      const seq = [t1]
      for (let i = 0; i < 9; i++) { await page.keyboard.press('Tab'); seq.push(await page.evaluate(ACTIVE_INFO)) }
      await page.keyboard.press('Escape')
      const closed = await page.evaluate(() => document.getElementById('mobnav').hidden)
      const afterEsc = await page.evaluate(ACTIVE_INFO)
      // Escape while focus is INSIDE the menu
      await page.evaluate(() => document.getElementById('burger').focus())
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => !document.getElementById('mobnav').hidden)
      await page.evaluate(() => document.querySelector('#mobnav a').focus())
      await page.keyboard.press('Escape')
      const closed2 = await page.evaluate(() => document.getElementById('mobnav').hidden)
      const afterEsc2 = await page.evaluate(ACTIVE_INFO)
      results.burger[key] = { afterOpen, tabSequence: seq, escClosed: closed, afterEsc, escFromInsideClosed: closed2, afterEscFromInside: afterEsc2 }
    }

    // ── chat dialog ───────────────────────────────────────────────────────────
    await page.evaluate(() => scrollTo(0, 0))
    const panelAttrs = await page.evaluate(() => {
      const p = document.getElementById('chatpanel')
      return { role: p.getAttribute('role'), ariaModal: p.getAttribute('aria-modal'), ariaLabel: p.getAttribute('aria-label'), ariaLabelledby: p.getAttribute('aria-labelledby'), tabindex: p.getAttribute('tabindex'), lang: document.documentElement.lang }
    })
    await page.evaluate(() => document.getElementById('chatfab').focus())
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => !document.getElementById('chatpanel').hidden)
    await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'cin', null, { timeout: 3000 }).catch(() => {})
    const chatFocused = await page.evaluate(ACTIVE_INFO)
    const chatSeq = []
    for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); const inf = await page.evaluate(ACTIVE_INFO); const ax = await axName(cdp, 'document.activeElement'); chatSeq.push({ ...inf, ...ax }) }
    // Escape
    await page.evaluate(() => document.getElementById('cin').focus())
    await page.keyboard.press('Escape')
    const chatClosed = await page.evaluate(() => document.getElementById('chatpanel').hidden)
    const afterChatEsc = await page.evaluate(ACTIVE_INFO)
    // is the closed panel still reachable by Tab? (hidden -> should not be)
    const closeBtnName = await page.evaluate(() => document.getElementById('cclose').getAttribute('aria-label'))
    const cinName = await (async () => { await page.evaluate(() => document.getElementById('chatfab').focus()); await page.keyboard.press('Enter'); await page.waitForFunction(() => !document.getElementById('chatpanel').hidden); return axName(cdp, "document.getElementById('cin')") })()
    const ccloseAx = await axName(cdp, "document.getElementById('cclose')")
    const panelAx = await axName(cdp, "document.getElementById('chatpanel')")
    const fabAx = await axName(cdp, "document.getElementById('chatfab')")
    results.chat[key] = { panelAttrs, chatFocused, chatSeq, chatClosed, afterChatEsc, closeBtnAriaLabel: closeBtnName, cinAx: cinName, ccloseAx, panelAx, fabAx }
    await page.evaluate(() => { const p = document.getElementById('chatpanel'); if (!p.hidden) document.getElementById('cclose').click() })
    await page.waitForFunction(() => document.getElementById('chatpanel').hidden)

    // ── before/after range ────────────────────────────────────────────────────
    await page.evaluate(() => document.getElementById('ba').scrollIntoView({ block: 'center', behavior: 'instant' }))
    await revealAll(page)
    const rangeAx = await axName(cdp, "document.getElementById('baRange')")
    const before = await page.evaluate(() => ({ v: document.getElementById('baRange').value, pos: document.getElementById('ba').style.getPropertyValue('--pos') }))
    await page.evaluate(() => document.getElementById('baRange').focus())
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    const afterRight = await page.evaluate(() => ({ v: document.getElementById('baRange').value, pos: document.getElementById('ba').style.getPropertyValue('--pos') }))
    await page.keyboard.press('Home')
    const atHome = await page.evaluate(() => ({ v: document.getElementById('baRange').value, pos: document.getElementById('ba').style.getPropertyValue('--pos') }))
    await page.keyboard.press('End')
    const atEnd = await page.evaluate(() => ({ v: document.getElementById('baRange').value, pos: document.getElementById('ba').style.getPropertyValue('--pos') }))
    const rangeFocusDiff = await (async () => { await page.evaluate(() => document.getElementById('baRange').focus()); return focusPixelDiff(page, 4) })()
    results.range[key] = { rangeAx, before, afterRight, atHome, atEnd, rangeFocusDiff, valuetext: await page.evaluate(() => document.getElementById('baRange').getAttribute('aria-valuetext')) }

    // ── sun toggle ────────────────────────────────────────────────────────────
    await page.evaluate(() => document.querySelector('.calc').scrollIntoView({ block: 'center', behavior: 'instant' }))
    await revealAll(page)
    const sun = await page.evaluate(() => {
      const g = document.querySelector('.toggle')
      return {
        groupRole: g.getAttribute('role'), groupLabel: g.getAttribute('aria-label'), groupLabelledby: g.getAttribute('aria-labelledby'),
        buttons: [...g.querySelectorAll('button')].map((b) => ({ text: b.textContent.trim(), cls: b.className, ariaPressed: b.getAttribute('aria-pressed'), ariaChecked: b.getAttribute('aria-checked'), role: b.getAttribute('role'), tabIndex: b.tabIndex })),
      }
    })
    const sunAx = []
    for (let i = 0; i < 2; i++) sunAx.push(await axName(cdp, `document.querySelectorAll('.toggle button')[${i}]`))
    // operate by keyboard and see whether ANY announced state changes
    await page.evaluate(() => document.querySelector('.toggle button[data-sun="1"]').focus())
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelector('.toggle button[data-sun="1"]').classList.contains('on'))
    const sunAfter = []
    for (let i = 0; i < 2; i++) sunAfter.push(await axName(cdp, `document.querySelectorAll('.toggle button')[${i}]`))
    const btuChanged = await page.evaluate(() => document.getElementById('cbtu').textContent)
    results.sunToggle[key] = { sun, sunAx, sunAfter, btuAfterSunYes: btuChanged }

    // ── chips ─────────────────────────────────────────────────────────────────
    await page.evaluate(() => document.getElementById('chatfab').click())
    await page.waitForFunction(() => !document.getElementById('chatpanel').hidden)
    const chipInfo = await page.evaluate(() => ({
      chips: [...document.querySelectorAll('#cchips button')].map((b) => ({ text: b.textContent.trim(), rect: b.getBoundingClientRect().toJSON(), minH: getComputedStyle(b).minHeight })),
      containerRole: document.getElementById('cchips').getAttribute('role'),
    }))
    await page.evaluate(() => document.querySelector('#cchips button').focus())
    const chipDiff = await focusPixelDiff(page, 6)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg').length >= 2)
    const afterChip = await page.evaluate(() => ({
      active: document.activeElement?.id || document.activeElement?.tagName,
      chipsDisplay: getComputedStyle(document.getElementById('cchips')).display,
      msgs: [...document.querySelectorAll('#chatpanel .msg')].map((m) => m.textContent.trim().slice(0, 40)),
      bodyLive: document.getElementById('cbody').getAttribute('aria-live'),
      bodyRole: document.getElementById('cbody').getAttribute('role'),
    }))
    results.chips[key] = { chipInfo, chipDiff, afterChip }

    // ── skip link presence + tabs to main content ────────────────────────────
    results.skipLink[key] = await page.evaluate(() => {
      const first = document.querySelector('body a, body button')
      const cands = [...document.querySelectorAll('a[href^="#"]')].slice(0, 3).map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 30) }))
      return { hasMain: !!document.querySelector('main, [role=main]'), firstFocusable: first ? (first.className || first.tagName) : null, firstHashLinks: cands }
    })
    results.traps[key] = { consoleErrors: errors }
    await ctx.close()
  }
}
await browser.close()
saveJSON('keyboard-raw.json', results)

// ── print ────────────────────────────────────────────────────────────────────
for (const key of Object.keys(results.focusOrder)) {
  const o = results.focusOrder[key]
  console.log(`\n===== FOCUS ORDER ${key} (${o.length} stops) =====`)
  o.forEach((s) => {
    if (s.body) return console.log(`  ${String(s.i).padStart(3)}  <BODY> — focus left the document (end of order)`)
    console.log(`  ${String(s.i).padStart(3)}  ${(s.role || s.tag).padEnd(12)} "${(s.name || s.text || '').slice(0, 46)}"  ${s.id ? '#' + s.id : ''} ${s.cls ? '.' + s.cls.split('.').slice(0, 2).join('.') : ''}${s.obscuredByTopbar ? '  [OBSCURED BY STICKY TOPBAR]' : ''}${s.obscuredByMobar ? '  [OBSCURED BY .mobar]' : ''}${s.wrapped ? '  <-- wrapped, order complete' : ''}`)
  })
}
console.log('\n===== FOCUS INDICATORS (pixel diff; changed% of the padded box) =====')
for (const key of Object.keys(results.indicators)) {
  console.log(`--- ${key}`)
  for (const r of results.indicators[key]) {
    if (r.skip) { console.log(`   ${r.sel.padEnd(34)} skip: ${r.skip}`); continue }
    const d = r.diff
    const ind = d?.indicator && d?.under ? `${r2(contrast(d.indicator, d.under))}:1 (rgb(${d.indicator}) vs rgb(${d.under}))` : 'n/a'
    console.log(`   ${r.sel.padEnd(34)} outline[${r.outline}] off ${r.offset} fv=${r.matchesFV}  changed ${d ? d.pct + '%' : 'n/a'} (${d?.changed}px)  indicator-contrast ${ind}  ${d && d.changed < 8 ? '<<< NO VISIBLE FOCUS INDICATOR' : ''}`)
  }
}
console.log('\n===== BURGER =====');   console.log(JSON.stringify(results.burger, null, 1))
console.log('\n===== CHAT =====');     console.log(JSON.stringify(results.chat, null, 1))
console.log('\n===== RANGE =====');    console.log(JSON.stringify(results.range, null, 1))
console.log('\n===== SUN TOGGLE ====='); console.log(JSON.stringify(results.sunToggle, null, 1))
console.log('\n===== CHIPS =====');    console.log(JSON.stringify(results.chips, null, 1))
console.log('\n===== SKIP LINK =====');console.log(JSON.stringify(results.skipLink, null, 1))
console.log('\n===== CONSOLE =====');  console.log(JSON.stringify(results.traps, null, 1))
