// BLOCK 6 redo — clean isolated cases. Technique: state-transition + concurrency.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info, poll } from './lib.mjs'

const FORM = { name: 'Ayşe Yılmaz', phone: '0533 046 13 87', place: 'Mahmutlar 3. kat', when: 'Cumartesi', note: 'Salon 42 m²' }
const fillForm = async (page) => {
  await page.evaluate(() => document.getElementById('randevu').scrollIntoView())
  for (const [k, v] of Object.entries(FORM)) await page.fill(`#reqForm [name=${k}]`, v)
  await page.check('#reqForm [name=consent]')
}
const stableScroll = async (page) => {
  let last = -1
  for (let i = 0; i < 60; i++) {
    const y = await page.evaluate(() => Math.round(scrollY))
    if (y === last) return y
    last = y
    await page.waitForTimeout(120)
  }
  return last
}

const b = await chromium.launch()

// ===== 6b' double submit with REAL user clicks (dblclick + two page.click) =====
for (const [label, act] of [
  ['native dblclick', async (p) => p.dblclick('#reqForm button[type=submit]')],
  ['two sequential real clicks', async (p) => { await p.click('#reqForm button[type=submit]'); await p.click('#reqForm button[type=submit]') }],
  ['programmatic .click() x2', async (p) => p.evaluate(() => { const b2 = document.querySelector('#reqForm button[type=submit]'); b2.click(); b2.click() })],
]) {
  for (const run of [1, 2]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const urls = []
    ctx.on('page', async (p) => { urls.push(p.url()); await p.close().catch(() => {}) })
    await page.goto(BASE, { waitUntil: 'load' })
    await fillForm(page)
    await act(page)
    await page.waitForTimeout(1500)
    if (run === 1) { console.log(`\n===== 6b' ${label} =====`); info(`popups=${urls.length}`); urls.forEach((u, i) => info(`  #${i + 1} ${u.slice(0, 70)}`)) }
    ok(urls.length <= 1, `6b' ${label} (run ${run}): only ONE WhatsApp deeplink opens`, `${urls.length} popups`)
    await ctx.close()
  }
}

// ===== 6c' submit, then Escape ; submit, then navigate =====
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const urls = []
  ctx.on('page', async (p) => { urls.push(p.url()); await p.close().catch(() => {}) })
  await page.goto(BASE, { waitUntil: 'load' })
  await fillForm(page)
  const [pop] = await Promise.all([page.waitForEvent('popup', { timeout: 6000 }).catch(() => null), page.click('#reqForm button[type=submit]')])
  console.log(`\n===== 6c' submit then Escape =====`)
  info(`popup event fired = ${!!pop}; url=${pop ? pop.url().slice(0, 60) : '-'}`)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  const after = await page.evaluate(() => ({
    errHidden: document.getElementById('reqErr').hidden,
    formStillFilled: document.querySelector('#reqForm [name=name]').value,
    chatHidden: document.getElementById('chatpanel').hidden,
  }))
  info(`after Escape: ${JSON.stringify(after)}  (total popups seen: ${urls.length})`)
  ok(!!pop, `6c': the deeplink opens on a real click`, '')
  ok(after.formStillFilled === FORM.name, `6c': form data is kept after submitting (so the visitor can resend if WhatsApp failed)`, `"${after.formStillFilled}"`)
  ok(after.errHidden === true, `6c': no error shown after a successful submit`, '')
  await ctx.close()
}

// ===== 6d' form lost by clicking a legal link, and by the language switch =====
for (const [label, sel] of [['footer KVKK link', 'footer a[href*="kvkk"]'], ['language switch DE', '.lang a[hreflang=de]']]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  let dialog = false
  page.on('dialog', async (d) => { dialog = true; await d.accept() })
  await page.goto(BASE, { waitUntil: 'load' })
  await fillForm(page)
  await page.click(sel)
  await page.waitForLoadState('load')
  const afterUrl = page.url()
  await page.goBack({ waitUntil: 'load' })
  const restored = await page.evaluate(() => ({
    name: document.querySelector('#reqForm [name=name]').value,
    consent: document.querySelector('#reqForm [name=consent]').checked,
  }))
  console.log(`\n===== 6d' leave the page via ${label} =====`)
  info(`navigated to ${afterUrl}; beforeunload dialog = ${dialog}`)
  info(`after browser Back: ${JSON.stringify(restored)}`)
  ok(dialog, `6d' ${label}: visitor is warned that the filled form will be lost`, `dialog=${dialog}`)
  ok(restored.name === FORM.name && restored.consent === true, `6d' ${label}: Back restores name AND consent`, JSON.stringify(restored))
  await ctx.close()
}

// ===== 6e' Back / Forward across hash jumps, with scroll stabilisation, 2 runs =====
for (const run of [1, 2]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  await page.click('.mainnav a[href*="#kesif"]')
  await poll(async () => (await page.evaluate(() => location.hash)) === '#kesif', { timeout: 4000 })
  const yKesif = await stableScroll(page)
  await page.click('.mainnav a[href*="#kontakt"]')
  await poll(async () => (await page.evaluate(() => location.hash)) === '#kontakt', { timeout: 4000 })
  const yKontakt = await stableScroll(page)
  await page.goBack()
  await poll(async () => (await page.evaluate(() => location.hash)) === '#kesif', { timeout: 4000 })
  const yBack = await stableScroll(page)
  await page.goForward()
  await poll(async () => (await page.evaluate(() => location.hash)) === '#kontakt', { timeout: 4000 })
  const yFwd = await stableScroll(page)
  const tops = await page.evaluate(() => ({ kontakt: Math.round(document.getElementById('kontakt').getBoundingClientRect().top), kesif: Math.round(document.getElementById('kesif').getBoundingClientRect().top) }))
  if (run === 1) {
    console.log(`\n===== 6e' hash Back/Forward (scroll stabilised) =====`)
    info(`y(#kesif)=${yKesif}  y(#kontakt)=${yKontakt}  y after Back=${yBack}  y after Forward=${yFwd}`)
    info(`section tops after Forward: ${JSON.stringify(tops)}`)
  }
  ok(Math.abs(yBack - yKesif) < 120, `6e' run ${run}: Back returns to the #kesif scroll position`, `${yBack} vs ${yKesif} (delta ${yBack - yKesif})`)
  ok(Math.abs(yFwd - yKontakt) < 120, `6e' run ${run}: Forward returns to the #kontakt scroll position`, `${yFwd} vs ${yKontakt} (delta ${yFwd - yKontakt})`)
  if (run === 1 && Math.abs(yFwd - yKontakt) >= 120) await page.screenshot({ path: `${DIR}/b6e-forward-wrong-position.png` })
  await ctx.close()
}

// ===== 6e'' theme across Back/Forward, isolated =====
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
  await page.click('.lang a[hreflang=ru]'); await page.waitForLoadState('load')
  const onRu = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, meta: document.getElementById('tcolor').content, ls: localStorage.getItem('theme') }))
  await page.goBack({ waitUntil: 'load' })
  const backTr = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, meta: document.getElementById('tcolor').content, ls: localStorage.getItem('theme'), bodyBg: getComputedStyle(document.body).backgroundColor }))
  await page.goForward({ waitUntil: 'load' })
  const fwdRu = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, meta: document.getElementById('tcolor').content }))
  console.log(`\n===== 6e'' light theme across a real navigation + Back/Forward =====`)
  info(`on /ru/: ${JSON.stringify(onRu)}`)
  info(`Back to /: ${JSON.stringify(backTr)}`)
  info(`Forward to /ru/: ${JSON.stringify(fwdRu)}`)
  ok(onRu.theme === 'light', `6e'': light theme carries to another locale`, '')
  ok(backTr.theme === 'light', `6e'': light theme survives Back`, '')
  ok(fwdRu.theme === 'light', `6e'': light theme survives Forward`, '')
  ok(backTr.meta === '#f6f3ee' && onRu.meta === '#f6f3ee', `6e'': theme-color meta matches the light theme on every entry`, `back=${backTr.meta} ru=${onRu.meta}`)
  await page.screenshot({ path: `${DIR}/b6e-theme-nav.png` })
  await ctx.close()
}

await b.close()
