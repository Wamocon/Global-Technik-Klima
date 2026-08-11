// BLOCK 2 — the motion failsafe. Technique: fault injection on the JS bundle + state transition timing.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info, poll } from './lib.mjs'

const probe = `(() => {
  const reveals = [...document.querySelectorAll('[data-reveal]')]
  const hidden = reveals.filter(el => {
    const cs = getComputedStyle(el)
    return Number(cs.opacity) < 0.5 || cs.visibility === 'hidden' || cs.display === 'none'
  })
  const kontakt = document.getElementById('kontakt')
  const kOp = kontakt ? Number(getComputedStyle(kontakt.querySelector('[data-reveal]') || kontakt).opacity) : null
  return {
    motion: document.documentElement.classList.contains('motion'),
    failsafeArmed: typeof window.__motionFailsafe !== 'undefined' && window.__motionFailsafe !== undefined,
    total: reveals.length,
    hidden: hidden.length,
    shownClass: reveals.filter(el => el.classList.contains('shown')).length,
    inlineOpacityZero: reveals.filter(el => el.style.opacity === '0').length,
    topbarH: getComputedStyle(document.documentElement).getPropertyValue('--topbar-h').trim(),
    themeTogWorks: !!document.getElementById('themetog'),
    textLen: (document.body.innerText||'').length,
  }
})()`

async function scenario(name, wire, opts = {}) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()) })
  await wire(page)
  const t0 = Date.now()
  await page.goto(BASE, { waitUntil: 'commit' })
  const samples = []
  const until = opts.watchMs ?? 9000
  while (Date.now() - t0 < until) {
    try {
      const s = await page.evaluate(probe)
      samples.push({ t: Date.now() - t0, ...s })
    } catch { /* navigation window */ }
    await new Promise((r) => setTimeout(r, 120))
  }
  console.log(`\n===== ${name} =====`)
  // Find the first moment content became readable (hidden===0) and any regression after
  const firstReadable = samples.find((s) => s.hidden === 0 && s.total > 0)
  const lastSample = samples[samples.length - 1]
  const regressed = firstReadable ? samples.filter((s) => s.t > firstReadable.t && s.hidden > 0) : []
  info(`samples=${samples.length}  total reveals=${lastSample?.total}`)
  info(`first fully readable at t=${firstReadable ? firstReadable.t + 'ms' : 'NEVER within ' + until + 'ms'}`)
  if (regressed.length) {
    info(`!! REGRESSION: content hidden again from t=${regressed[0].t}ms (hidden=${regressed[0].hidden}/${regressed[0].total}) until t=${regressed[regressed.length - 1].t}ms`)
  }
  info(`final: motion=${lastSample?.motion} hidden=${lastSample?.hidden}/${lastSample?.total} shownClass=${lastSample?.shownClass} inlineOpacity0=${lastSample?.inlineOpacityZero} --topbar-h="${lastSample?.topbarH}"`)
  info(`timeline: ` + samples.filter((s, i) => i % 3 === 0).map((s) => `${s.t}:m${s.motion ? 1 : 0}/h${s.hidden}`).join(' '))
  if (errs.length) info('errors: ' + errs.slice(0, 6).join(' | '))
  else info('errors: none')
  await page.screenshot({ path: `${DIR}/b2-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png` })
  await b.close()
  return { samples, firstReadable, regressed, lastSample, errs }
}

// --- 2a: kill the whole Base script chunk (motion.ts + theme toggle + burger) -----------
const a = await scenario('2a abort Base chunk', async (page) => {
  await page.route('**/_astro/Base.astro_*.js', (r) => r.abort('failed'))
})
ok(a.lastSample && a.lastSample.motion === false, '2a: html.motion removed by failsafe')
ok(a.lastSample && a.lastSample.hidden === 0, '2a: all [data-reveal] visible after failsafe', `hidden=${a.lastSample?.hidden}`)
ok(a.firstReadable && a.firstReadable.t >= 2400 && a.firstReadable.t <= 3200, `2a: readable at ~2500ms (failsafe)`, `t=${a.firstReadable?.t}`)

// --- 2b: kill gsap only ----------------------------------------------------------------
const bb = await scenario('2b abort gsap chunk', async (page) => {
  await page.route('**/_astro/gsap.*.js', (r) => r.abort('failed'))
})
ok(bb.lastSample && bb.lastSample.hidden === 0, '2b: all visible after gsap failure', `hidden=${bb.lastSample?.hidden}`)
ok(bb.lastSample && bb.lastSample.motion === false, '2b: html.motion removed')

// --- 2c: kill ScrollTrigger only -------------------------------------------------------
const c = await scenario('2c abort ScrollTrigger chunk', async (page) => {
  await page.route('**/_astro/ScrollTrigger.*.js', (r) => r.abort('failed'))
})
ok(c.lastSample && c.lastSample.hidden === 0, '2c: all visible after ScrollTrigger failure', `hidden=${c.lastSample?.hidden}`)

// --- 2d: gsap arrives LATE (after the failsafe already fired) --------------------------
// This is the interesting one: showAll() has run, then setupReveals() re-applies opacity:0 inline.
const d = await scenario('2d gsap delayed 6s past failsafe', async (page) => {
  await page.route('**/_astro/gsap.*.js', async (r) => {
    await new Promise((res) => setTimeout(res, 6000))
    await r.continue()
  })
}, { watchMs: 12000 })
ok(d.regressed.length === 0, '2d: content does NOT get re-hidden after the failsafe fired',
  d.regressed.length ? `re-hidden from t=${d.regressed[0].t}ms, ${d.regressed[0].hidden}/${d.regressed[0].total} elements` : '')

// --- 2e: preload-helper killed (breaks every dynamic import) --------------------------
const e = await scenario('2e abort preload-helper', async (page) => {
  await page.route('**/_astro/preload-helper.*.js', (r) => r.abort('failed'))
})
ok(e.lastSample && e.lastSample.hidden === 0, '2e: all visible when preload-helper dies', `hidden=${e.lastSample?.hidden}`)

// --- 2f: ALL _astro js killed ---------------------------------------------------------
const f = await scenario('2f abort all _astro js', async (page) => {
  await page.route('**/_astro/*.js', (r) => r.abort('failed'))
})
ok(f.lastSample && f.lastSample.hidden === 0, '2f: all visible with every JS chunk dead', `hidden=${f.lastSample?.hidden}`)
ok(f.firstReadable && f.firstReadable.t <= 3200, '2f: readable within 3.2s', `t=${f.firstReadable?.t}`)
