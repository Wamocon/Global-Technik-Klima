// Test-QUALITY review: prove that specific assertions in scripts/acceptance.mjs
// cannot fail, i.e. they are false negatives.
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
const { chromium } = require('playwright')

const BASE = 'http://localhost:4321'
const b = await chromium.launch()
const out = []

// ---- Claim 1: the chat assertion `bot >= 2` passes for ANY input, including
//      nonsense — so a wrong or missing answer would still be reported green.
{
  const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')
  await page.fill('#cin', 'zzzqqq vvvv 8888 !!!!')       // deliberate nonsense
  await page.click('#cform button[type=submit]')
  await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg.bot:not(.typing)').length >= 2)
  const bots = await page.locator('#chatpanel .msg.bot').count()
  const texts = await page.locator('#chatpanel .msg.bot .b').allTextContents()
  out.push(['acceptance.mjs:127 `bot < 2` — nonsense input', `bot bubbles=${bots} → existing assertion PASSES`, JSON.stringify(texts)])
  await page.close()
}

// ---- Claim 2: the same assertion passes even if the answer is the generic
//      fallback, i.e. the bot understood nothing.
{
  const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')
  // The acceptance test's own input, but with the number removed → no BTU possible
  await page.fill('#cin', 'oda için klima')
  await page.click('#cform button[type=submit]')
  await page.waitForFunction(() => document.querySelectorAll('#chatpanel .msg.bot:not(.typing)').length >= 2)
  const texts = await page.locator('#chatpanel .msg.bot .b').allTextContents()
  const hasNumber = /\d/.test(texts.join(' '))
  out.push(['acceptance.mjs:124-128 — "Chat versteht Freitext"', `answer contains a BTU number: ${hasNumber}`, JSON.stringify(texts.at(-1))])
  await page.close()
}

// ---- Claim 3: acceptance.mjs never exercises the theme toggle nor the Randevu
//      form. Prove both exist and carry behaviour that the suite never touches.
{
  const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const has = await page.evaluate(() => ({
    themetog: !!document.getElementById('themetog'),
    reqForm: !!document.getElementById('reqForm'),
    reqFields: [...document.querySelectorAll('#reqForm [name]')].map((e) => e.getAttribute('name')),
    projeler: !!document.getElementById('projeler'),
    campaign: !!document.querySelector('.camp'),
    warrantyTiers: document.querySelectorAll('.wtiers li').length,
    navLinks: document.querySelectorAll('#mobnav a').length,
  }))
  out.push(['untested features present in the build', JSON.stringify(has), ''])
  await page.close()
}

// ---- Claim 4: acceptance.mjs runs colorScheme:'dark' only and never sets the
//      light theme, so the light theme has zero automated coverage. Prove the
//      light theme changes the rendering materially.
{
  const page = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  await page.click('#themetog')
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light')
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  out.push(['light theme coverage', `body bg dark=${dark} light=${light} (differs: ${dark !== light})`, ''])
  await page.close()
}

await b.close()
console.log('\n===== TEST-QUALITY REVIEW OF scripts/acceptance.mjs =====')
for (const [what, result, detail] of out) console.log(`\n• ${what}\n  → ${result}${detail ? '\n  ' + detail : ''}`)
