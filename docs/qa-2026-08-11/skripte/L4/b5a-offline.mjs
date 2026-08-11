// BLOCK 5a — offline mid-session. Technique: fault injection (link down) + recovery testing.
import { chromium } from './pw.mjs'
import { BASE, DIR, ok, info, poll } from './lib.mjs'

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()) })
await page.goto(BASE, { waitUntil: 'load' })
await page.waitForSelector('#chatfab')

console.log('\n===== 5a offline mid-session =====')
await ctx.setOffline(true)
info('context is now OFFLINE')

// --- chat while offline
await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
await page.fill('#cin', '40 m2 salon icin hangi klima'); await page.press('#cin', 'Enter')
const chatOk = await poll(async () => await page.evaluate(() => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length >= 2 && document.querySelectorAll('#cbody .msg.typing').length === 0), { timeout: 8000 })
const chatState = await page.evaluate(() => ({
  bots: document.querySelectorAll('#cbody .msg.bot:not(.typing)').length,
  typing: document.querySelectorAll('#cbody .msg.typing').length,
  last: [...document.querySelectorAll('#cbody .msg')].pop()?.textContent?.trim().slice(0, 70),
}))
ok(chatOk.ok, '5a chat: offline still answers via the local intent engine', `${chatOk.ms}ms  ${JSON.stringify(chatState)}`)

// --- hash nav while offline
await page.click('#cclose')
const navOk = await (async () => {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.click('.mainnav a[href*="#kesif"]')
  return await poll(async () => await page.evaluate(() => {
    const r = document.getElementById('kesif')?.getBoundingClientRect()
    return !!r && Math.abs(r.top) < 200
  }), { timeout: 4000 })
})()
ok(navOk.ok, '5a nav: in-page anchor navigation works offline', `${navOk.ms}ms, hash=${await page.evaluate(() => location.hash)}`)

// --- Randevu form while offline (window.open to wa.me)
await page.evaluate(() => document.getElementById('randevu').scrollIntoView())
await page.fill('#reqForm [name=name]', 'Offline Test')
await page.fill('#reqForm [name=phone]', '05001112233')
await page.check('#reqForm [name=consent]')
let popupUrl = null
page.on('popup', async (p) => { popupUrl = p.url(); await p.close().catch(() => {}) })
const [popup] = await Promise.all([
  page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
  page.click('#reqForm button[type=submit]'),
])
const errShown = await page.evaluate(() => ({ hidden: document.getElementById('reqErr').hidden, txt: document.getElementById('reqErr').textContent }))
ok(!!popup, '5a form: submit still builds and opens the wa.me deeplink while offline', popup ? `url=${(popupUrl || popup.url()).slice(0, 120)}` : 'no popup')
ok(errShown.hidden === true, '5a form: no bogus error shown offline', JSON.stringify(errShown))
if (popup) await popup.close().catch(() => {})

// --- real navigation while offline (language switch)
const navResult = await page.click('.lang a[hreflang=de]').then(() => page.waitForLoadState('load', { timeout: 8000 })).then(() => 'loaded').catch((e) => 'failed: ' + e.message.slice(0, 60))
const afterNav = await page.evaluate(() => ({ url: location.href, title: document.title, hasHeader: !!document.querySelector('.topbar'), bodyLen: (document.body.innerText || '').length }))
info(`5a real navigation offline -> ${navResult}; ${JSON.stringify(afterNav)}`)
ok(!afterNav.hasHeader, '5a: an offline full-page navigation lands on the browser error page (expected, no offline fallback exists)', JSON.stringify(afterNav).slice(0, 160))
await page.screenshot({ path: `${DIR}/b5a-offline-navigation.png` })

// --- back online: does the site recover WITHOUT a manual reload?
await ctx.setOffline(false)
info('context is now ONLINE again')
const recovered = await poll(async () => await page.evaluate(() => !!document.querySelector('.topbar')), { timeout: 4000 })
ok(recovered.ok, '5a: page recovers by itself once the connection returns', recovered.ok ? `${recovered.ms}ms` : 'still on the error page — user must reload/press back')
// go back to the site and confirm everything works again
await page.goBack({ waitUntil: 'load' }).catch(() => {})
if (!(await page.evaluate(() => !!document.querySelector('.topbar')))) await page.goto(BASE, { waitUntil: 'load' })
await page.click('#chatfab'); await page.waitForSelector('#chatpanel:not([hidden])')
await page.fill('#cin', 'tekrar merhaba'); await page.press('#cin', 'Enter')
const back = await poll(async () => await page.evaluate(() => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length >= 2), { timeout: 6000 })
ok(back.ok, '5a: chat works again after coming back online', `${back.ms}ms`)

// --- flaky: offline exactly during the chat fetch, then online
await ctx.setOffline(true)
await page.fill('#cin', 'offline sirasinda'); await page.press('#cin', 'Enter')
await ctx.setOffline(false)
const flaky = await poll(async () => await page.evaluate(() => document.querySelectorAll('#cbody .msg.typing').length === 0 && document.querySelectorAll('#cbody .msg.me').length >= 3), { timeout: 8000 })
ok(flaky.ok, '5a: chat message sent at the exact moment of a connection drop still gets answered', `${flaky.ms}ms`)

info(errs.length ? 'errors: ' + [...new Set(errs)].slice(0, 8).join(' | ') : 'errors: none')
await b.close()
