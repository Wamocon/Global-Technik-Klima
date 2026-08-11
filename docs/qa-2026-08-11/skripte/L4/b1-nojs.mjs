// BLOCK 1 — JavaScript disabled entirely. Technique: fault injection (capability removal).
import { chromium } from './pw.mjs'
import { BASE, DIR, LOCALES, ok, info } from './lib.mjs'

const PHONE_LANDLINE = '513 86 51'
const PHONE_WA = '046 13 87'
const KONYA = '332 325 25 50'

const ctxOpts = { javaScriptEnabled: false, viewport: { width: 1440, height: 900 } }

const b = await chromium.launch()
for (const L of LOCALES) {
  const ctx = await b.newContext(ctxOpts)
  const page = await ctx.newPage()
  await page.goto(L.url, { waitUntil: 'load' })

  const r = await page.evaluate(() => {
    const vis = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return { op: cs.opacity, disp: cs.display, vis: cs.visibility, h: Math.round(rect.height), w: Math.round(rect.width) }
    }
    const reveals = [...document.querySelectorAll('[data-reveal]')]
    const hiddenReveals = reveals.filter((el) => {
      const cs = getComputedStyle(el)
      return Number(cs.opacity) < 0.9 || cs.display === 'none' || cs.visibility === 'hidden'
    })
    return {
      htmlClass: document.documentElement.className,
      dataTheme: document.documentElement.dataset.theme || '(none)',
      revealCount: reveals.length,
      hiddenRevealCount: hiddenReveals.length,
      bodyTextLen: (document.body.innerText || '').length,
      // contact block
      kontakt: vis(document.getElementById('kontakt')),
      footer: vis(document.querySelector('footer')),
      telLinks: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => ({ href: a.getAttribute('href'), txt: a.textContent.trim().slice(0, 40) })),
      waLinks: [...document.querySelectorAll('a[href*="wa.me"]')].length,
      addressText: (document.querySelector('#kontakt')?.innerText || '').replace(/\s+/g, ' ').slice(0, 400),
      legalLinks: [...document.querySelectorAll('a')].map((a) => a.getAttribute('href')).filter((h) => h && /kvkk|gizlilik|cerez/.test(h)),
      topbarH: getComputedStyle(document.documentElement).getPropertyValue('--topbar-h') || '(unset)',
      // sections present + their measured height
      sections: [...document.querySelectorAll('section[id]')].map((s) => ({ id: s.id, h: Math.round(s.getBoundingClientRect().height), op: getComputedStyle(s).opacity })),
      noscriptPresent: !!document.querySelector('noscript'),
      fullText: (document.body.innerText || '').replace(/\s+/g, ' '),
      docH: document.documentElement.scrollHeight,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
    }
  })

  console.log(`\n===== ${L.code.toUpperCase()} (JS disabled) =====`)
  ok(r.htmlClass.indexOf('motion') === -1, `html has no .motion class`, `class="${r.htmlClass}"`)
  ok(r.hiddenRevealCount === 0, `all ${r.revealCount} [data-reveal] elements visible`, `hidden=${r.hiddenRevealCount}`)
  ok(r.bodyTextLen > 2000, `body text length > 2000`, `${r.bodyTextLen}`)
  ok(!!r.kontakt && r.kontakt.h > 100 && Number(r.kontakt.op) > 0.9, `#kontakt visible with height`, JSON.stringify(r.kontakt))
  ok(!!r.footer && r.footer.h > 50, `footer visible with height`, JSON.stringify(r.footer))
  ok(r.telLinks.length > 0, `tel: links present`, JSON.stringify(r.telLinks))
  const hasLandline = r.fullText.includes(PHONE_LANDLINE)
  const hasWa = r.fullText.includes(PHONE_WA)
  ok(hasLandline, `landline ${PHONE_LANDLINE} visible in text`)
  ok(hasWa, `whatsapp ${PHONE_WA} visible in text`)
  ok(!r.fullText.includes(KONYA), `Konya number absent`)
  ok(r.waLinks > 0, `wa.me links present`, `${r.waLinks}`)
  ok(r.legalLinks.length >= 3, `legal links present`, JSON.stringify([...new Set(r.legalLinks)]))
  const zeroH = r.sections.filter((s) => s.h < 40)
  ok(zeroH.length === 0, `no section collapsed below 40px`, JSON.stringify(zeroH))
  const transp = r.sections.filter((s) => Number(s.op) < 0.9)
  ok(transp.length === 0, `no section transparent`, JSON.stringify(transp))
  ok(r.scrollW <= r.innerW + 1, `no horizontal overflow`, `scrollW=${r.scrollW} innerW=${r.innerW}`)
  info(`--topbar-h = "${r.topbarH.trim()}" (fallback 84px expected via CSS)`)
  info(`address snippet: ${r.addressText.slice(0, 200)}`)
  info(`docHeight=${r.docH}`)

  await page.screenshot({ path: `${DIR}/b1-nojs-${L.code}-top.png` })
  await page.evaluate(() => document.getElementById('kontakt')?.scrollIntoView())
  await page.screenshot({ path: `${DIR}/b1-nojs-${L.code}-kontakt.png` })
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.screenshot({ path: `${DIR}/b1-nojs-${L.code}-footer.png` })
  await ctx.close()
}

// Also: mobile no-JS — is the mobile nav reachable at all?
{
  const ctx = await b.newContext({ ...ctxOpts, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  const r = await page.evaluate(() => ({
    mobnavHidden: document.getElementById('mobnav')?.hidden,
    burgerVisible: getComputedStyle(document.getElementById('burger')).display,
    mainnavDisplay: getComputedStyle(document.querySelector('.mainnav')).display,
    mobarLinks: [...document.querySelectorAll('.mobar a')].map((a) => a.getAttribute('href')),
    wafab: !!document.querySelector('.wafab'),
    scrollW: document.documentElement.scrollWidth,
    innerW: innerWidth,
    text: (document.body.innerText || '').replace(/\s+/g, ' ').length,
  }))
  console.log('\n===== MOBILE 390px (JS disabled) =====')
  ok(r.text > 2000, 'body text present on mobile', `${r.text}`)
  info(`#mobnav hidden=${r.mobnavHidden}  burger display=${r.burgerVisible}  mainnav display=${r.mainnavDisplay}`)
  ok(r.mobarLinks.length > 0, 'sticky mobile action bar links present', JSON.stringify(r.mobarLinks))
  ok(r.scrollW <= r.innerW + 1, 'no horizontal overflow on mobile', `${r.scrollW}/${r.innerW}`)
  // The nav menu cannot be opened without JS -> is any in-page navigation left?
  ok(r.mobnavHidden === true && r.mainnavDisplay === 'none', 'CONFIRM: with JS off, mobile has NO section navigation (burger inert, mainnav hidden)', '')
  await page.screenshot({ path: `${DIR}/b1-nojs-mobile.png` })
  await ctx.close()
}

await b.close()
