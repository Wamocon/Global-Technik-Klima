// ADVERSARIAL VERIFICATION — job: REFUTE the claims. Default to REFUTED if uncertain.
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')

const BASE = 'http://localhost:4321'
const b = await chromium.launch()
const R = []
const rec = (claim, verdict, detail) => R.push([claim, verdict, detail])

// ─────────────────────────────────────────────────────────────────────────────
// CLAIM A (L2/D3): the chat's BTU extractor takes the FIRST 2–3 digit run,
// so a phone number or a time in the message hijacks the room size.
// Try to refute: maybe it prefers a digit-run adjacent to a unit word.
// ─────────────────────────────────────────────────────────────────────────────
{
  const cases = [
    ['0242 513 86 51 numarasından beni arayın, 80 m2 salon için klima lazım', 'phone first, 80 m2 real'],
    ['Cumartesi 12:00 uygun, 60 m2 oda için klima istiyorum', 'time first, 60 m2 real'],
    ['80 m2 salon için klima lazım', 'clean control — 80 m2 only'],
    ['1000 m2 depo için klima', '4-digit area'],
  ]
  for (const [msg, label] of cases) {
    for (const run of [1, 2]) {
      const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      // Force the local engine: make sure no API can answer.
      await page.route('**/api/chat', (r) => r.fulfill({ status: 404, body: '' }))
      await page.click('#chatfab')
      await page.waitForSelector('#chatpanel:not([hidden])')
      await page.fill('#cin', msg)
      await page.click('#cform button[type=submit]')
      await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg.bot:not(.typing)').length >= 2)
      const answer = (await page.locator('#chatpanel .msg.bot .b').last().textContent()) || ''
      const waHref = await page.locator('#chatpanel .msg.wa a').first().getAttribute('href').catch(() => null)
      const btu = (answer.match(/[\d.,]{4,}/) || [])[0] || 'NO-NUMBER'
      const areaInLink = waHref ? decodeURIComponent(waHref).match(/(\d+)\s*m²/) : null
      if (run === 1) rec(`A · chat BTU · ${label}`, 'observe', `answer BTU=${btu} · deeplink area=${areaInLink ? areaInLink[1] : 'n/a'}`)
      else rec(`A · chat BTU · ${label} (rerun)`, 'observe', `answer BTU=${btu} · deeplink area=${areaInLink ? areaInLink[1] : 'n/a'}`)
      await page.close()
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLAIM B (L2/D2): the BTU calculator clamps silently — the input keeps the
// typed value while the result is computed from the clamp, and the WhatsApp
// deeplink carries the clamped value.
// Try to refute: maybe the input IS corrected, or the result is withheld.
// ─────────────────────────────────────────────────────────────────────────────
{
  for (const typed of ['500', '0', '', '201']) {
    for (const run of [1, 2]) {
      const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      const before = await page.locator('#cbtu').textContent()
      await page.fill('#ca', typed)
      // wait for the output to settle to a value consistent with an input event
      await page.waitForFunction((b0) => document.getElementById('cbtu')?.textContent !== null, before)
      const state = await page.evaluate(() => ({
        inputShows: document.getElementById('ca').value,
        rangeOverflow: document.getElementById('ca').validity.rangeOverflow,
        result: document.getElementById('cbtu').textContent,
        cta: document.getElementById('ccta').getAttribute('href'),
      }))
      const msg = decodeURIComponent((state.cta || '').split('text=')[1] || '')
      if (run === 2) { await page.close(); continue }
      rec(`B · BTU clamp · typed "${typed}"`, 'observe',
        `input shows "${state.inputShows}" · rangeOverflow=${state.rangeOverflow} · result=${state.result} · deeplink="${msg}"`)
      await page.close()
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLAIM C (L2/D4): 'hi' in the greeting keyword list substring-matches Turkish
// "hiç", so a complaint is answered with a cheerful greeting and NO WhatsApp
// handoff. Try to refute: maybe a longer keyword outscores it.
// ─────────────────────────────────────────────────────────────────────────────
{
  const cases = [
    'Hiç memnun kalmadım, çok kötü bir deneyim yaşadım',
    'Klimam arada bir kendi kendine duruyor, ne olabilir?',
  ]
  for (const msg of cases) {
    for (const run of [1, 2]) {
      const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
      await page.goto(BASE + '/', { waitUntil: 'networkidle' })
      await page.route('**/api/chat', (r) => r.fulfill({ status: 404, body: '' }))
      await page.click('#chatfab')
      await page.waitForSelector('#chatpanel:not([hidden])')
      await page.fill('#cin', msg)
      await page.click('#cform button[type=submit]')
      await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg.bot:not(.typing)').length >= 2)
      const answer = (await page.locator('#chatpanel .msg.bot .b').last().textContent()) || ''
      const waCount = await page.locator('#chatpanel .msg.wa a').count()
      if (run === 1) rec(`C · intent misfire · "${msg.slice(0, 34)}…"`, 'observe', `answer="${answer.slice(0, 70)}…" · WhatsApp buttons=${waCount}`)
      await page.close()
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLAIM D (L2/D5): a hanging /api/chat leaves busy=true forever — the chat is
// dead for the rest of the visit and reopening does not recover it.
// Try to refute: maybe a timeout or a finally releases it.
// ─────────────────────────────────────────────────────────────────────────────
{
  for (const run of [1, 2]) {
    const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.route('**/api/chat', () => { /* never fulfil, never abort */ })
    await page.click('#chatfab')
    await page.waitForSelector('#chatpanel:not([hidden])')
    await page.fill('#cin', 'montaj yapıyor musunuz')
    await page.click('#cform button[type=submit]')
    await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg.typing').length === 1)
    // Give it 12s — far beyond any plausible internal timeout.
    const t0 = Date.now()
    let released = false
    while (Date.now() - t0 < 12000) {
      released = await page.evaluate(() => document.querySelectorAll('#chatpanel .msg.typing').length === 0)
      if (released) break
      await page.waitForTimeout(500) // polling interval, not a stabilisation sleep
    }
    // second message after the stall
    await page.fill('#cin', 'garanti kac yil')
    await page.click('#cform button[type=submit]')
    const st = await page.evaluate(() => ({
      me: document.querySelectorAll('#chatpanel .msg.me').length,
      typing: document.querySelectorAll('#chatpanel .msg.typing').length,
      inputStillHasText: document.getElementById('cin').value,
    }))
    // does closing + reopening recover?
    await page.click('#cclose')
    await page.click('#chatfab')
    await page.fill('#cin', 'adresiniz nerede')
    await page.click('#cform button[type=submit]')
    const st2 = await page.evaluate(() => document.querySelectorAll('#chatpanel .msg.me').length)
    if (run === 1) rec('D · hanging /api/chat deadlock', released ? 'REFUTED (released)' : 'observe',
      `typing bubble released within 12s: ${released} · user bubbles after 2nd msg=${st.me} · input still holds "${st.inputStillHasText}" · after close+reopen+3rd msg user bubbles=${st2}`)
    await page.close()
  }
}

await b.close()
console.log('\n===== ADVERSARIAL VERIFICATION =====')
for (const [c, v, d] of R) console.log(`\n• ${c}\n  [${v}] ${d}`)
