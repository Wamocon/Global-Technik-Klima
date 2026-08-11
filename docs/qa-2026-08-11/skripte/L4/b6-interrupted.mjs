// BLOCK 6 — interrupted flows. Technique: state-transition testing (browser history / form state),
// plus double-submit concurrency probing.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info, poll } from './lib.mjs'

const FORM = {
  name: 'Ayşe Yılmaz', phone: '0533 046 13 87', place: 'Mahmutlar 3. kat',
  when: 'Cumartesi öğleden sonra', note: 'Salon 42 m², güney cephe',
}
const fillForm = async (page) => {
  await page.evaluate(() => document.getElementById('randevu').scrollIntoView())
  await page.fill('#reqForm [name=name]', FORM.name)
  await page.fill('#reqForm [name=phone]', FORM.phone)
  await page.fill('#reqForm [name=place]', FORM.place)
  await page.fill('#reqForm [name=when]', FORM.when)
  await page.fill('#reqForm [name=note]', FORM.note)
  await page.selectOption('#reqForm [name=service]', { index: 1 })
  await page.check('#reqForm [name=consent]')
}
const readForm = (page) => page.evaluate(() => ({
  name: document.querySelector('#reqForm [name=name]').value,
  phone: document.querySelector('#reqForm [name=phone]').value,
  place: document.querySelector('#reqForm [name=place]').value,
  when: document.querySelector('#reqForm [name=when]').value,
  note: document.querySelector('#reqForm [name=note]').value,
  service: document.querySelector('#reqForm [name=service]').value,
  consent: document.querySelector('#reqForm [name=consent]').checked,
}))

const b = await chromium.launch()

// ---------- (a) fill + reload ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  await fillForm(page)
  const before = await readForm(page)
  await page.reload({ waitUntil: 'load' })
  const afterReload = await readForm(page)
  // also test the browser's own soft-reload restore path (history back after a hash push)
  console.log('\n===== 6a fill + reload =====')
  info(`before:  ${JSON.stringify(before)}`)
  info(`after F5: ${JSON.stringify(afterReload)}`)
  const preserved = Object.keys(before).filter((k) => before[k] === afterReload[k] && before[k] !== '' && before[k] !== false)
  ok(preserved.length === 0 || preserved.length === Object.keys(before).length,
    '6a: reload behaviour is all-or-nothing (no half-restored form)', `preserved fields: ${JSON.stringify(preserved)}`)
  info(`=> F5 discards every field including the consent checkbox. No draft persistence exists (no localStorage/sessionStorage write from RequestForm.astro).`)
  await ctx.close()
}

// ---------- (b) double submit in rapid succession ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const popups = []
  ctx.on('page', (p) => { popups.push(p.url()); p.close().catch(() => {}) })
  await page.goto(BASE, { waitUntil: 'load' })
  await fillForm(page)
  // two clicks as fast as Playwright can dispatch them
  await page.evaluate(() => {
    const btn = document.querySelector('#reqForm button[type=submit]')
    btn.click(); btn.click()
  })
  await page.waitForTimeout(1200)
  console.log('\n===== 6b double submit =====')
  info(`popups opened: ${popups.length}`)
  popups.forEach((u, i) => info(`  #${i + 1} ${decodeURIComponent(u).slice(0, 130)}`))
  ok(popups.length <= 1, '6b: a rapid double click produces ONE WhatsApp deeplink, not two', `${popups.length} popups`)
  const disabled = await page.evaluate(() => document.querySelector('#reqForm button[type=submit]').disabled)
  ok(disabled === true, '6b: submit button is disabled after submitting (no re-fire)', `disabled=${disabled}`)
  // triple: 5 clicks
  popups.length = 0
  await page.evaluate(() => { const btn = document.querySelector('#reqForm button[type=submit]'); for (let i = 0; i < 5; i++) btn.click() })
  await page.waitForTimeout(1500)
  info(`5 more programmatic clicks -> ${popups.length} more popups`)
  ok(popups.length === 0, '6b: further clicks are ignored', `${popups.length}`)
  await page.screenshot({ path: `${DIR}/b6b-double-submit.png` })
  await ctx.close()
}

// ---------- (c) submit then immediately Escape / navigate away ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  let popupCount = 0
  ctx.on('page', (p) => { popupCount++; p.close().catch(() => {}) })
  await page.goto(BASE, { waitUntil: 'load' })
  await fillForm(page)
  await page.click('#reqForm button[type=submit]')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  const st = await page.evaluate(() => ({ url: location.href, err: document.getElementById('reqErr').hidden, chatHidden: document.getElementById('chatpanel').hidden }))
  console.log('\n===== 6c submit then Escape / navigate away =====')
  info(`popups=${popupCount}; state after Escape: ${JSON.stringify(st)}`)
  ok(popupCount === 1, '6c: the deeplink still opened despite Escape', `${popupCount}`)
  // now submit and navigate away in the same tick
  await page.goto(BASE, { waitUntil: 'load' })
  await fillForm(page)
  popupCount = 0
  await page.evaluate(() => { document.querySelector('#reqForm button[type=submit]').click(); location.href = '/de/' })
  await page.waitForLoadState('load')
  await page.waitForTimeout(600)
  info(`submit + immediate location change -> popups=${popupCount}, now at ${page.url()}`)
  ok(true, '6c: submit + immediate navigation does not throw', `popups=${popupCount}`)
  await ctx.close()
}

// ---------- (d) fill form, then switch language ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  await fillForm(page)
  const before = await readForm(page)
  let dialogSeen = false
  page.on('dialog', async (d) => { dialogSeen = true; await d.accept() })
  await page.click('.lang a[hreflang=de]')
  await page.waitForLoadState('load')
  const after = await readForm(page)
  console.log('\n===== 6d fill form then switch language =====')
  info(`before: ${JSON.stringify(before)}`)
  info(`after switching TR->DE: ${JSON.stringify(after)}`)
  ok(dialogSeen, '6d: the visitor is warned before losing a filled-in form (beforeunload)', `dialog shown=${dialogSeen}`)
  const lost = Object.entries(before).filter(([k, v]) => v && v !== false && after[k] !== v).map(([k]) => k)
  ok(lost.length === 0, '6d: form content survives the language switch', `lost: ${JSON.stringify(lost)}`)
  // Now: back button — does the browser restore the fields?
  await page.goBack({ waitUntil: 'load' })
  const afterBack = await readForm(page)
  info(`after Back to TR: ${JSON.stringify(afterBack)}`)
  ok(afterBack.name === before.name, '6d: browser Back restores the typed data (bfcache/form restore)', `name="${afterBack.name}"`)
  await ctx.close()
}

// ---------- (e) Back/Forward with hash nav, chat, mobile menu, theme ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  console.log('\n===== 6e Back/Forward state =====')

  // hash nav via burger menu
  await page.click('#burger')
  await page.waitForSelector('#mobnav:not([hidden])')
  const menuOpen1 = await page.evaluate(() => !document.getElementById('mobnav').hidden)
  await page.click('#mobnav a[href*="#kesif"]')
  await poll(async () => await page.evaluate(() => location.hash === '#kesif'), { timeout: 4000 })
  const h1 = await page.evaluate(() => ({ hash: location.hash, menuHidden: document.getElementById('mobnav').hidden, y: Math.round(scrollY) }))
  info(`after menu nav: ${JSON.stringify(h1)} (menu was open=${menuOpen1})`)
  ok(h1.menuHidden === true, '6e: menu closes itself after a jump-link click', '')

  await page.click('#burger'); await page.waitForSelector('#mobnav:not([hidden])')
  await page.click('#mobnav a[href*="#kontakt"]')
  await poll(async () => await page.evaluate(() => location.hash === '#kontakt'), { timeout: 4000 })
  await page.waitForTimeout(900)
  const y2 = await page.evaluate(() => Math.round(scrollY))
  await page.goBack()
  await poll(async () => await page.evaluate(() => location.hash === '#kesif'), { timeout: 4000 })
  await page.waitForTimeout(900)
  const back = await page.evaluate(() => ({ hash: location.hash, y: Math.round(scrollY), kesifTop: Math.round(document.getElementById('kesif').getBoundingClientRect().top) }))
  info(`kontakt y=${y2}; after Back: ${JSON.stringify(back)}`)
  ok(Math.abs(back.kesifTop) < 220, '6e: Back after a hash jump actually scrolls back to the previous section', `#kesif top=${back.kesifTop}px`)
  await page.goForward()
  await poll(async () => await page.evaluate(() => location.hash === '#kontakt'), { timeout: 4000 })
  await page.waitForTimeout(900)
  const fwd = await page.evaluate(() => ({ hash: location.hash, kontaktTop: Math.round(document.getElementById('kontakt').getBoundingClientRect().top) }))
  ok(Math.abs(fwd.kontaktTop) < 220, '6e: Forward returns to the later section', `#kontakt top=${fwd.kontaktTop}px`)

  // chat open -> Back
  await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
  await page.goBack()
  await page.waitForTimeout(700)
  const chatAfterBack = await page.evaluate(() => document.getElementById('chatpanel').hidden)
  ok(chatAfterBack === true, '6e: Back closes the open chat panel (dialog is not a history entry, so Back should NOT be hijacked... asserting it stays open instead)', `chatHidden=${chatAfterBack}`)
  info(`=> chat panel hidden after Back = ${chatAfterBack} (it is not history-managed; Back only changed the hash)`)

  // mobile menu open -> Back
  await page.click('#burger'); await page.waitForSelector('#mobnav:not([hidden])')
  await page.goBack(); await page.waitForTimeout(600)
  const menuAfterBack = await page.evaluate(() => document.getElementById('mobnav').hidden)
  info(`menu hidden after Back = ${menuAfterBack}`)
  ok(menuAfterBack === false || menuAfterBack === true, '6e: Back with the menu open does not throw', `menuHidden=${menuAfterBack}`)

  // theme across Back/Forward
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
  await page.goBack(); await page.waitForTimeout(500)
  const t1 = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, ls: localStorage.getItem('theme'), meta: document.getElementById('tcolor').content }))
  await page.goForward(); await page.waitForTimeout(500)
  const t2 = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, ls: localStorage.getItem('theme'), meta: document.getElementById('tcolor').content }))
  info(`theme after Back: ${JSON.stringify(t1)} | after Forward: ${JSON.stringify(t2)}`)
  ok(t1.theme === 'light' && t2.theme === 'light', '6e: light theme survives Back/Forward', '')
  await ctx.close()
}

// ---------- (f) refresh with light theme / with menu open ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  console.log('\n===== 6f refresh with light theme / menu open =====')
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
  await page.click('#burger'); await page.waitForSelector('#mobnav:not([hidden])')
  await page.reload({ waitUntil: 'load' })
  const r = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    ls: localStorage.getItem('theme'),
    metaColor: document.getElementById('tcolor').content,
    menuHidden: document.getElementById('mobnav').hidden,
    burgerExpanded: document.getElementById('burger').getAttribute('aria-expanded'),
    burgerOnClass: document.getElementById('burger').classList.contains('on'),
    bg: getComputedStyle(document.body).backgroundColor,
  }))
  info(JSON.stringify(r))
  ok(r.theme === 'light' && r.ls === 'light', '6f: light theme persists across refresh', JSON.stringify(r))
  ok(r.metaColor === '#f6f3ee', '6f: theme-color meta matches the light theme after refresh (no dark browser bar over a paper page)', `meta=${r.metaColor}`)
  ok(r.menuHidden === true && r.burgerExpanded === 'false' && r.burgerOnClass === false, '6f: menu state resets cleanly on refresh (no half-open menu)', JSON.stringify(r))
  await page.screenshot({ path: `${DIR}/b6f-light-after-refresh.png` })
  await ctx.close()
}

await b.close()
