// BLOCK 3 — third-party / asset failure. Technique: fault injection per resource class.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const geom = `(() => {
  const m = document.querySelector('.cmap')
  const ifr = document.querySelector('.cmap iframe')
  const r = m ? m.getBoundingClientRect() : null
  const ir = ifr ? ifr.getBoundingClientRect() : null
  const imgs = [...document.querySelectorAll('img')]
  return {
    mapH: r ? Math.round(r.height) : null, mapW: r ? Math.round(r.width) : null,
    ifrH: ir ? Math.round(ir.height) : null, ifrW: ir ? Math.round(ir.width) : null,
    kontaktH: Math.round(document.getElementById('kontakt').getBoundingClientRect().height),
    docH: document.documentElement.scrollHeight,
    scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
    imgTotal: imgs.length,
    imgBroken: imgs.filter(i => i.complete && i.naturalWidth === 0).length,
    imgZeroBox: imgs.filter(i => { const b = i.getBoundingClientRect(); return b.width < 2 || b.height < 2 }).map(i => (i.getAttribute('src')||'').split('/').pop()),
    imgNoAlt: imgs.filter(i => !i.hasAttribute('alt')).map(i => (i.getAttribute('src')||'').split('/').pop()),
    imgAltEmpty: imgs.filter(i => i.getAttribute('alt') === '').length,
    fonts: [...document.fonts].map(f => f.family + ':' + f.status).slice(0, 8),
    h1Font: getComputedStyle(document.querySelector('h1') || document.body).fontFamily,
    heroH: Math.round((document.querySelector('.hero')||document.body).getBoundingClientRect().height),
    prodCardHeights: [...document.querySelectorAll('.prod')].map(p => Math.round(p.getBoundingClientRect().height)),
  }
})()`

async function scenario(name, routes, extra) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = [], blocked = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()) })
  for (const pat of routes) {
    await page.route(pat, (r) => { blocked.push(r.request().url().slice(0, 90)); r.abort('failed') })
  }
  await page.goto(BASE, { waitUntil: 'load' })
  // Reveal everything so we measure real geometry, not the pre-scroll state
  await page.evaluate(() => { document.documentElement.classList.remove('motion'); document.querySelectorAll('[data-reveal]').forEach(e => { e.classList.add('shown'); e.style.opacity = '1'; e.style.transform = 'none' }) })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForFunction(() => true)
  const g = await page.evaluate(geom)
  console.log(`\n===== ${name} =====`)
  info(`blocked ${blocked.length} requests, e.g. ${[...new Set(blocked)].slice(0, 4).join(' | ')}`)
  info(JSON.stringify(g, null, 0))
  if (extra) await extra(page, g, errs)
  info(errs.length ? 'errors: ' + [...new Set(errs)].slice(0, 6).join(' | ') : 'errors: none (excluding blocked-resource network errors)')
  await page.evaluate(() => document.getElementById('kontakt').scrollIntoView())
  await page.screenshot({ path: `${DIR}/b3-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-kontakt.png` })
  await page.evaluate(() => document.getElementById('urunler')?.scrollIntoView())
  await page.screenshot({ path: `${DIR}/b3-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-urunler.png` })
  await b.close()
  return { g, errs, blocked }
}

// baseline for comparison
const base = await scenario('0 baseline', [])

// 3a Google blocked
const g1 = await scenario('3a google blocked', ['**google.com/**', '**gstatic.com/**', '**googleapis.com/**'])
ok(g1.g.mapH === base.g.mapH, '3a: map container keeps its height when Google is unreachable', `${g1.g.mapH} vs baseline ${base.g.mapH}`)
ok(g1.g.ifrH === base.g.ifrH && g1.g.ifrW === base.g.ifrW, '3a: iframe box unchanged', `${g1.g.ifrW}x${g1.g.ifrH} vs ${base.g.ifrW}x${base.g.ifrH}`)
ok(g1.g.kontaktH === base.g.kontaktH, '3a: #kontakt height unchanged', `${g1.g.kontaktH} vs ${base.g.kontaktH}`)
ok(g1.g.scrollW <= g1.g.innerW + 1, '3a: no horizontal overflow')
ok(!g1.errs.some((e) => /pageerror/.test(e)), '3a: no uncaught page error', g1.errs.filter((e) => /pageerror/.test(e)).join(' | '))

// 3b images blocked
const g2 = await scenario('3b images blocked', ['**/images/**'])
ok(g2.g.imgZeroBox.length === 0, '3b: no image collapses to a zero box', JSON.stringify(g2.g.imgZeroBox))
ok(g2.g.imgNoAlt.length === 0, '3b: every img has an alt attribute', JSON.stringify(g2.g.imgNoAlt))
ok(g2.g.heroH >= base.g.heroH * 0.9, '3b: hero keeps its height', `${g2.g.heroH} vs ${base.g.heroH}`)
ok(JSON.stringify(g2.g.prodCardHeights) === JSON.stringify(base.g.prodCardHeights), '3b: product card heights unchanged', `${JSON.stringify(g2.g.prodCardHeights)} vs ${JSON.stringify(base.g.prodCardHeights)}`)
ok(g2.g.scrollW <= g2.g.innerW + 1, '3b: no horizontal overflow')
ok(Math.abs(g2.g.docH - base.g.docH) < base.g.docH * 0.03, '3b: page height within 3% of baseline', `${g2.g.docH} vs ${base.g.docH}`)

// 3c fonts blocked
const g3 = await scenario('3c fonts blocked', ['**/fonts/*.woff2'])
ok(g3.g.scrollW <= g3.g.innerW + 1, '3c: no horizontal overflow with fallback fonts', `${g3.g.scrollW}/${g3.g.innerW}`)
info(`3c: h1 computed font-family = ${g3.g.h1Font}`)
info(`3c: docHeight ${g3.g.docH} vs baseline ${base.g.docH} (delta ${g3.g.docH - base.g.docH}px)`)
// text must not overflow its container
const of = await (async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const p = await ctx.newPage(); await p.route('**/fonts/*.woff2', (r) => r.abort('failed'))
  await p.goto(BASE, { waitUntil: 'load' })
  await p.evaluate(() => { document.documentElement.classList.remove('motion'); document.querySelectorAll('[data-reveal]').forEach(e => { e.style.opacity = '1'; e.style.transform = 'none' }) })
  const r = await p.evaluate(() => {
    const bad = []
    for (const el of document.querySelectorAll('h1,h2,h3,p,a,button,li,span,label')) {
      const b = el.getBoundingClientRect()
      if (b.width === 0) continue
      if (b.right > innerWidth + 1 || b.left < -1) bad.push({ tag: el.tagName, cls: el.className.toString().slice(0, 30), l: Math.round(b.left), r: Math.round(b.right), t: (el.textContent || '').trim().slice(0, 28) })
      if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'visible' && el.children.length === 0) bad.push({ tag: el.tagName, cls: 'SELF-OVERFLOW ' + el.className.toString().slice(0, 24), sw: el.scrollWidth, cw: el.clientWidth, t: (el.textContent || '').trim().slice(0, 28) })
    }
    return { bad: bad.slice(0, 12), scrollW: document.documentElement.scrollWidth, innerW: innerWidth }
  })
  await p.screenshot({ path: `${DIR}/b3-fonts-blocked-mobile.png`, fullPage: false })
  await b.close(); return r
})()
ok(of.bad.length === 0 && of.scrollW <= of.innerW + 1, '3c mobile 390px: no text overflows with fallback fonts', JSON.stringify(of).slice(0, 500))

// 3d everything third-party + own images + fonts, all at once
const g4 = await scenario('3d google+images+fonts blocked', ['**google.com/**', '**gstatic.com/**', '**/images/**', '**/fonts/*.woff2'])
ok(g4.g.scrollW <= g4.g.innerW + 1, '3d: no horizontal overflow under combined failure')
ok(!g4.errs.some((e) => /pageerror/.test(e)), '3d: no uncaught page error', g4.errs.filter((e) => /pageerror/.test(e)).join(' | '))
ok(g4.g.kontaktH > 300, '3d: #kontakt still has real height', `${g4.g.kontaktH}`)
