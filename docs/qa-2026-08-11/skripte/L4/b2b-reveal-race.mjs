// BLOCK 2 follow-up — root-cause the "content re-hidden" regression.
// Technique: state-transition testing with timing fault injection; equivalence classes
//   E1 gsap resolves BEFORE window.load
//   E2 gsap resolves AFTER window.load but BEFORE the 2500ms failsafe
//   E3 gsap resolves AFTER the 2500ms failsafe
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const CSS_READY = `getComputedStyle(document.querySelector('.topbar')).position === 'sticky'`

const probe = `(() => {
  const cssReady = ${CSS_READY}
  const reveals = [...document.querySelectorAll('[data-reveal]')]
  const inView = reveals.filter(el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 })
  const invis = (el) => { const cs = getComputedStyle(el); return Number(cs.opacity) < 0.5 }
  return {
    cssReady,
    motion: document.documentElement.classList.contains('motion'),
    total: reveals.length,
    hidden: reveals.filter(invis).length,
    inView: inView.length,
    inViewHidden: inView.filter(invis).length,
    inlineOp0: reveals.filter(el => el.style.opacity === '0').length,
    marks: window.__marks || [],
  }
})()`

// Instrument: record when window.load fires and when gsap module actually resolves.
const initScript = () => {
  window.__marks = []
  const t0 = performance.now()
  addEventListener('load', () => window.__marks.push(['load', Math.round(performance.now() - t0)]))
  // patch: notice when the failsafe fires
  const iv = setInterval(() => {
    if (!document.documentElement.classList.contains('motion') && !window.__nm) {
      window.__nm = 1
      window.__marks.push(['motion-off', Math.round(performance.now() - t0)])
    }
  }, 30)
  setTimeout(() => clearInterval(iv), 20000)
}

async function run(name, { gsapDelay = 0, watchMs = 9000, scrollAfter = null } = {}) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.addInitScript(initScript)
  const netMarks = []
  if (gsapDelay) {
    await page.route('**/_astro/{gsap,ScrollTrigger}.*.js', async (r) => {
      await new Promise((res) => setTimeout(res, gsapDelay))
      await r.continue()
    })
  }
  page.on('response', (r) => { if (/_astro\/(gsap|ScrollTrigger)\./.test(r.url())) netMarks.push(r.url().split('/').pop()) })
  const t0 = Date.now()
  await page.goto(BASE, { waitUntil: 'commit' })
  const samples = []
  let scrolled = false
  while (Date.now() - t0 < watchMs) {
    try { const s = await page.evaluate(probe); samples.push({ t: Date.now() - t0, ...s }) } catch {}
    if (scrollAfter && !scrolled && Date.now() - t0 > scrollAfter) {
      scrolled = true
      await page.mouse.wheel(0, 400)
      await page.mouse.wheel(0, -400)
      samples.push({ t: Date.now() - t0, MARK: 'scrolled 400px down+up' })
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  const usable = samples.filter((s) => s.cssReady)
  console.log(`\n===== ${name} =====`)
  const last = usable[usable.length - 1]
  info(`marks: ${JSON.stringify(last?.marks)}   gsap responses: ${netMarks.join(',')}`)
  info(`in-viewport reveals=${last?.inView}  hidden-in-viewport=${last?.inViewHidden}  total hidden=${last?.hidden}/${last?.total}  inlineOpacity0=${last?.inlineOp0}`)
  info('timeline (cssReady only): ' + usable.filter((s, i) => i % 2 === 0).map((s) => `${s.t}:m${s.motion ? 1 : 0}/vh${s.inViewHidden}/h${s.hidden}`).join(' '))
  const marked = samples.filter((s) => s.MARK)
  marked.forEach((m) => info(`   >>> t=${m.t}ms ${m.MARK}`))
  await page.screenshot({ path: `${DIR}/b2b-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png` })
  await b.close()
  return { usable, last, samples }
}

// E1 — baseline, nothing injected
const e1 = await run('E1 baseline (no fault)')
ok(e1.last && e1.last.inViewHidden === 0, 'E1 baseline: above-the-fold reveals visible without scrolling', `hiddenInView=${e1.last?.inViewHidden}`)

// E3 — gsap after the failsafe (run twice for reproducibility)
const e3a = await run('E3 gsap +6000ms (run 1)', { gsapDelay: 6000, watchMs: 11000 })
const e3b = await run('E3 gsap +6000ms (run 2)', { gsapDelay: 6000, watchMs: 11000 })
for (const [i, r] of [e3a, e3b].entries()) {
  ok(r.last && r.last.hidden === 0, `E3 run${i + 1}: page still readable after late gsap`, `hidden=${r.last?.hidden}/${r.last?.total} inlineOp0=${r.last?.inlineOp0}`)
}

// E3 + recovery attempt: does a small scroll bring it back?
const e3c = await run('E3 gsap +6000ms then scroll at 8s', { gsapDelay: 6000, watchMs: 12000, scrollAfter: 8000 })
ok(e3c.last && e3c.last.inViewHidden === 0, 'E3 recovery: a 400px scroll restores above-the-fold content', `hiddenInView=${e3c.last?.inViewHidden} totalHidden=${e3c.last?.hidden}`)

// E2 — gsap after load but before the failsafe (~1800ms)
const e2 = await run('E2 gsap +1800ms (after load, before failsafe)', { gsapDelay: 1800, watchMs: 9000 })
ok(e2.last && e2.last.inViewHidden === 0, 'E2: above-the-fold reveals visible', `hiddenInView=${e2.last?.inViewHidden}`)
