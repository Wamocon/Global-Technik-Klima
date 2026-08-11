/** Names, roles, values, structure: headings, landmarks, images, forms, live regions. */
import { launch, openPage, revealAll, saveJSON, PAGES } from './lib.mjs'

const browser = await launch()
const out = {}

for (const p of [{ id: 'tr', url: '/' }, { id: 'de', url: '/de/' }, { id: 'ru', url: '/ru/' }, { id: 'en', url: '/en/' }, { id: 'kvkk', url: '/kvkk' }, { id: '404', url: '/nope-xyz' }]) {
  const { page, ctx } = await openPage(browser, { url: p.url, theme: 'dark', viewport: 'desktop' })
  await revealAll(page)
  const data = await page.evaluate(() => {
    const txt = (e) => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({ lvl: Number(h.tagName[1]), text: txt(h), inHeader: !!h.closest('header'), inFooter: !!h.closest('footer') }))
    const landmarks = [...document.querySelectorAll('header,nav,main,footer,aside,section[aria-label],section[aria-labelledby],[role]')].map((e) => ({
      tag: e.tagName.toLowerCase(), role: e.getAttribute('role'), label: e.getAttribute('aria-label'), labelledby: e.getAttribute('aria-labelledby'),
      isTopLevelHeader: e.tagName === 'HEADER' && !e.closest('article,aside,main,nav,section'),
      cls: (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter((c) => c && !c.startsWith('astro-')).join('.'),
    }))
    const imgs = [...document.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), hasAlt: i.hasAttribute('alt'), w: i.width, h: i.height, decorative: i.getAttribute('alt') === '' }))
    const iframes = [...document.querySelectorAll('iframe')].map((f) => ({ title: f.getAttribute('title'), src: (f.getAttribute('src') || '').slice(0, 60), ariaHidden: f.getAttribute('aria-hidden') }))
    const svgs = [...document.querySelectorAll('svg')].map((s) => ({ ariaHidden: s.getAttribute('aria-hidden'), role: s.getAttribute('role'), hasTitle: !!s.querySelector('title'), parent: s.parentElement?.tagName + '.' + ((typeof s.parentElement?.className === 'string' ? s.parentElement.className : '').split(/\s+/)[0] || '') }))
    const sectionsWithoutHeading = [...document.querySelectorAll('section[id]')].map((s) => ({ id: s.id, hasHeading: !!s.querySelector('h1,h2,h3,h4,h5,h6'), eyebrow: s.querySelector('.eyebrow,.kicker')?.textContent?.trim().slice(0, 40) || null, eyebrowTag: s.querySelector('.eyebrow,.kicker')?.tagName || null }))
    // form
    const form = document.getElementById('reqForm')
    const fields = form ? [...form.querySelectorAll('input,select,textarea')].map((f) => ({
      name: f.name, type: f.type, required: f.required, ariaRequired: f.getAttribute('aria-required'),
      ariaInvalid: f.getAttribute('aria-invalid'), ariaDescribedby: f.getAttribute('aria-describedby'),
      id: f.id || null, labelledByFor: f.labels ? [...f.labels].map((l) => l.textContent.trim().replace(/\s+/g, ' ').slice(0, 50)) : [],
      autocomplete: f.getAttribute('autocomplete'), inputmode: f.getAttribute('inputmode'), maxlength: f.getAttribute('maxlength'),
      placeholder: f.getAttribute('placeholder'), tabIndex: f.tabIndex,
      rect: (() => { const r = f.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) } })(),
    })) : null
    const err = document.getElementById('reqErr')
    // stars / rating
    const stars = [...document.querySelectorAll('.stars')].map((s) => ({ text: s.textContent.trim(), ariaHidden: s.getAttribute('aria-hidden'), parentLabel: s.closest('[aria-label]')?.getAttribute('aria-label') || null }))
    const rating = document.querySelector('[data-rating]')
    const revEx = [...document.querySelectorAll('.rev .ex')].map((e) => ({ text: e.textContent, color: getComputedStyle(e).color, fontSize: getComputedStyle(e).fontSize, warnVar: getComputedStyle(document.documentElement).getPropertyValue('--warn') }))
    const cdisc = document.querySelector('.cdisc')
    return {
      lang: document.documentElement.lang, title: document.title,
      headings, landmarks, imgs, iframes,
      svgTotal: svgs.length, svgNotHidden: svgs.filter((s) => s.ariaHidden !== 'true' && !s.hasTitle),
      sectionsWithoutHeading, fields,
      err: err ? { role: err.getAttribute('role'), ariaLive: err.getAttribute('aria-live'), hidden: err.hidden, id: err.id } : null,
      stars, revEx,
      rating: rating ? { tag: rating.tagName, ariaLabel: rating.getAttribute('aria-label'), text: rating.textContent.trim().replace(/\s+/g, ' ') } : null,
      cbody: (() => { const b = document.getElementById('cbody'); return b ? { ariaLive: b.getAttribute('aria-live'), role: b.getAttribute('role'), ariaAtomic: b.getAttribute('aria-atomic') } : null })(),
      cdisc: cdisc ? { text: cdisc.textContent.trim().slice(0, 90), bg: getComputedStyle(cdisc).backgroundColor, fontSize: getComputedStyle(cdisc).fontSize } : null,
      langAttrs: [...document.querySelectorAll('[lang]')].map((e) => ({ tag: e.tagName, lang: e.getAttribute('lang'), text: (e.textContent || '').trim().slice(0, 24) })).slice(0, 12),
      hardcodedEnglishAria: [...document.querySelectorAll('[aria-label]')].map((e) => ({ tag: e.tagName, cls: (typeof e.className === 'string' ? e.className : '').split(/\s+/).filter((c) => c && !c.startsWith('astro-')).join('.'), label: e.getAttribute('aria-label') })),
    }
  })
  // error state association
  let errState = null
  if (await page.$('#reqForm')) {
    await page.evaluate(() => document.getElementById('reqForm').scrollIntoView({ block: 'center', behavior: 'instant' }))
    await page.click('#reqForm .rf-submit')
    await page.waitForFunction(() => !document.getElementById('reqErr').hidden)
    errState = await page.evaluate(() => {
      const f = document.getElementById('reqForm')
      const err = document.getElementById('reqErr')
      return {
        errText: err.textContent.trim(), errHidden: err.hidden, errRole: err.getAttribute('role'),
        focusMovedTo: document.activeElement?.getAttribute('name') || document.activeElement?.tagName,
        fields: [...f.querySelectorAll('input,select,textarea')].map((x) => ({ name: x.name, ariaInvalid: x.getAttribute('aria-invalid'), ariaDescribedby: x.getAttribute('aria-describedby'), userInvalid: x.matches(':user-invalid'), borderColor: getComputedStyle(x).borderTopColor })),
      }
    })
  }
  out[p.id] = { ...data, errState }
  await ctx.close()
}
await browser.close()
saveJSON('structure-raw.json', out)

for (const k of Object.keys(out)) {
  const d = out[k]
  console.log(`\n########## ${k}  lang="${d.lang}" ##########`)
  console.log(`HEADING OUTLINE (${d.headings.length} headings):`)
  let prev = 0, skips = []
  d.headings.forEach((h, i) => {
    const skip = prev && h.lvl > prev + 1
    if (skip) skips.push(`h${prev} -> h${h.lvl} at "${h.text}"`)
    console.log(`   ${'  '.repeat(h.lvl - 1)}h${h.lvl}  "${h.text}"${skip ? '   <<< LEVEL SKIP' : ''}${h.inHeader ? ' [inside <header> banner]' : ''}`)
    prev = h.lvl
  })
  console.log(`   h1 count: ${d.headings.filter((h) => h.lvl === 1).length} | level skips: ${skips.length ? skips.join('; ') : 'none'}`)
  console.log(`LANDMARKS: main=${d.landmarks.some((l) => l.tag === 'main' || l.role === 'main')} | top-level <header>: ${d.landmarks.filter((l) => l.isTopLevelHeader).map((l) => l.cls).join(', ')}`)
  d.landmarks.filter((l) => ['header', 'nav', 'footer', 'main', 'aside'].includes(l.tag) || l.role).forEach((l) => console.log(`   <${l.tag}${l.cls ? '.' + l.cls : ''}> role=${l.role} label=${JSON.stringify(l.label)}`))
  console.log(`SECTIONS WITHOUT A REAL HEADING:`)
  d.sectionsWithoutHeading.forEach((s) => console.log(`   #${s.id}: heading=${s.hasHeading}  de-facto title: <${s.eyebrowTag}> ${JSON.stringify(s.eyebrow)}`))
  console.log(`IMAGES (${d.imgs.length}):`)
  d.imgs.forEach((i) => console.log(`   alt=${JSON.stringify(i.alt)} ${i.src}`))
  console.log(`IFRAMES: ${JSON.stringify(d.iframes)}`)
  console.log(`SVGs total ${d.svgTotal}, without aria-hidden and without <title>: ${d.svgNotHidden.length} -> ${JSON.stringify(d.svgNotHidden.slice(0, 6))}`)
  console.log(`STARS: ${JSON.stringify(d.stars)}`)
  console.log(`RATING: ${JSON.stringify(d.rating)}`)
  console.log(`.rev .ex: ${JSON.stringify(d.revEx)}`)
  console.log(`.cdisc: ${JSON.stringify(d.cdisc)}`)
  console.log(`#cbody live region: ${JSON.stringify(d.cbody)}`)
  console.log(`aria-labels on page: ${JSON.stringify(d.hardcodedEnglishAria)}`)
  if (d.fields) {
    console.log(`FORM FIELDS:`)
    d.fields.forEach((f) => console.log(`   ${String(f.name).padEnd(9)} type=${String(f.type).padEnd(9)} req=${f.required} aria-required=${f.ariaRequired} aria-invalid=${f.ariaInvalid} aria-describedby=${f.ariaDescribedby} label=${JSON.stringify(f.labelledByFor)} ac=${f.autocomplete} ${f.rect.w}x${f.rect.h}`))
    console.log(`#reqErr: ${JSON.stringify(d.err)}`)
    console.log(`AFTER EMPTY SUBMIT: ${JSON.stringify(d.errState, null, 1)}`)
  }
}
