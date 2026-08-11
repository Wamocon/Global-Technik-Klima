// BLOCK 2c — user-visible impact of the late-gsap regression on the LEAD PATH (#kontakt).
// Technique: use-case / scenario testing on top of the injected timing fault.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info } from './lib.mjs'

const probe = `(() => {
  const k = document.querySelector('#kontakt [data-reveal]')
  const f = document.querySelector('footer [data-reveal]') || document.querySelector('footer')
  const tel = document.querySelector('#kontakt a[href^="tel:"]')
  const rect = tel ? tel.getBoundingClientRect() : null
  const opOf = (el) => el ? Number(getComputedStyle(el).opacity) : null
  return {
    motion: document.documentElement.classList.contains('motion'),
    kOp: opOf(k),
    kInline: k ? k.style.opacity : null,
    fOp: opOf(f),
    telVisible: !!rect && rect.height > 0 && opOf(tel.closest('[data-reveal]') || tel) > 0.5,
    telText: tel ? tel.textContent.replace(/\\s+/g,' ').trim() : null,
    scrollY: Math.round(scrollY),
  }
})()`

async function run(label, gsapDelay) {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.route('**/_astro/{gsap,ScrollTrigger}.*.js', async (r) => {
    await new Promise((res) => setTimeout(res, gsapDelay)); await r.continue()
  })
  const t0 = Date.now()
  await page.goto(BASE, { waitUntil: 'commit' })
  // Visitor jumps straight to the contact section (the mobile action bar / nav does exactly this)
  await page.waitForSelector('#kontakt', { state: 'attached' })
  await page.evaluate(() => document.getElementById('kontakt').scrollIntoView({ block: 'start' }))
  const log = []
  while (Date.now() - t0 < gsapDelay + 5000) {
    try { log.push({ t: Date.now() - t0, ...(await page.evaluate(probe)) }) } catch {}
    await new Promise((r) => setTimeout(r, 120))
  }
  console.log(`\n===== ${label} (gsap +${gsapDelay}ms) =====`)
  info('t:motion/kOpacity  ' + log.filter((_, i) => i % 3 === 0).map((s) => `${s.t}:m${s.motion ? 1 : 0}/k${s.kOp}`).join(' '))
  const becameVisible = log.find((s) => s.kOp >= 0.9)
  const afterVisible = becameVisible ? log.filter((s) => s.t > becameVisible.t) : []
  const wentBlank = afterVisible.find((s) => s.kOp < 0.5)
  info(`#kontakt first visible at t=${becameVisible?.t}ms; blanked again at t=${wentBlank?.t ?? 'never'}ms`)
  const last = log[log.length - 1]
  info(`final: kOpacity=${last.kOp} inlineOpacity="${last.kInline}" telText="${last.telText}" telVisible=${last.telVisible} scrollY=${last.scrollY}`)

  if (wentBlank) await page.screenshot({ path: `${DIR}/b2c-kontakt-blank-after-${gsapDelay}.png` })

  // Recovery attempt 1: scroll down then back up to #kontakt
  await page.mouse.wheel(0, 900); await page.waitForTimeout(400)
  await page.mouse.wheel(0, -900); await page.waitForTimeout(900)
  const rec1 = await page.evaluate(probe)
  info(`after scroll down 900 + up 900: kOpacity=${rec1.kOp}`)
  // Recovery attempt 2: full reload
  await page.reload({ waitUntil: 'load' })
  await page.evaluate(() => document.getElementById('kontakt').scrollIntoView())
  await page.waitForTimeout(1500)
  const rec2 = await page.evaluate(probe)
  info(`after reload (gsap still delayed, now warm cache): kOpacity=${rec2.kOp}`)
  await b.close()
  return { becameVisible, wentBlank, last, rec1, rec2 }
}

const r1 = await run('run 1', 6000)
const r2 = await run('run 2', 6000)
for (const [i, r] of [r1, r2].entries()) {
  ok(!r.wentBlank, `run${i + 1}: #kontakt stays readable once shown`, r.wentBlank ? `blanked at t=${r.wentBlank.t}ms, inline opacity="${r.last.kInline}"` : '')
  ok(r.rec1.kOp >= 0.9, `run${i + 1}: scrolling away and back restores #kontakt`, `kOpacity=${r.rec1.kOp}`)
}
