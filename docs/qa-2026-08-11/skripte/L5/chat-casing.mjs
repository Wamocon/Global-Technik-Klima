// L5 — the Turkish casing trap, executed live in the browser.
// Same semantic question, three casings. Which intents survive?
import { chromium } from 'file:///D:/01%20Antigrafity%20Projekte/25%20Global-Technik-Klima/node_modules/playwright/index.mjs'

const BASE = 'http://localhost:4321'
const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L5'

// Signature substrings of each expected answer (tr), so we can name what the bot chose.
const SIG = [
  ['greeting', 'Hangi konuda yardımcı olayım'],
  ['services', 'Montaj, bakım, temizlik, gaz dolumu'],
  ['montaj', 'Montajda cihazı getirir'],
  ['bakim', 'Bakımda filtre ve eşanjörü'],
  ['gaz', 'genelde gaz eksiktir'],
  ['ariza', 'Arızada önce tespit'],
  ['products', 'Gree programını taşıyoruz'],
  ['heatpump', 'Versati ısı pompası'],
  ['warranty', 'Gree üretici garantisi tüm parçaları'],
  ['contact', 'Hacet Mah., Alaiye Cad'],
  ['hours', 'Pazartesi–Cumartesi 08:00–20:00 açığız'],
  ['language', 'Türkçe, Rusça, Almanca ve İngilizce hizmet'],
  ['taksit', 'Cihaz alımında taksit imkânı var'],
  ['PRICE', 'sabit fiyat vermiyoruz'],
  ['HANDOFF', 'sizi hemen bir yetkiliye bağlıyorum'],
  ['BTU', 'BTU’luk bir cihaz uygun görünüyor'],
  ['FALLBACK', 'Bunu en iyi bir uzmanımız yanıtlar'],
]
const classify = (t) => (SIG.find(([, s]) => t.includes(s)) || ['?UNKNOWN', ''])[0]

// [label, ASCII-caps, Turkish-correct caps (İ where the lowercase has i), lowercase, expected]
const PROBES = [
  ['price',     'KLIMA FIYATI NE KADAR',       'KLİMA FİYATI NE KADAR',       'klima fiyatı ne kadar',       'PRICE'],
  ['montaj',    'MONTAJ YAPIYOR MUSUNUZ',      'MONTAJ YAPIYOR MUSUNUZ',      'montaj yapıyor musunuz',      'montaj'],
  ['bakim',     'BAKIM',                       'BAKIM',                       'bakım',                       'bakim'],
  ['ariza',     'ARIZA',                       'ARIZA',                       'arıza',                       'ariza'],
  ['heatpump',  'ISI POMPASI',                 'ISI POMPASI',                 'ısı pompası',                 'heatpump'],
  ['warranty',  'GARANTI KAC YIL',             'GARANTİ KAÇ YIL',             'garanti kaç yıl',             'warranty'],
  ['taksit',    'TAKSIT VAR MI',               'TAKSİT VAR MI',               'taksit var mı',               'taksit'],
  ['services',  'HIZMETLERINIZ NELER',         'HİZMETLERİNİZ NELER',         'hizmetleriniz neler',         'services'],
  ['contact',   'ILETISIM BILGILERINIZ',       'İLETİŞİM BİLGİLERİNİZ',       'iletişim bilgileriniz',       'contact'],
  ['hours',     'CALISMA SAATLERI',            'ÇALIŞMA SAATLERİ',            'çalışma saatleri',            'hours'],
  ['products',  'HANGI KLIMA IYI',             'HANGİ KLİMA İYİ',             'hangi klima iyi',             'products'],
  ['language',  'INGILIZCE BILIYOR MUSUNUZ',   'İNGİLİZCE BİLİYOR MUSUNUZ',   'ingilizce biliyor musunuz',   'language'],
  ['greeting',  'MERHABA',                     'MERHABA',                     'merhaba',                     'greeting'],
  ['handoff',   'BIR INSANLA GORUSMEK ISTIYORUM', 'BİR İNSANLA GÖRÜŞMEK İSTİYORUM', 'bir insanla görüşmek istiyorum', 'HANDOFF'],
  ['btu',       '30 M2 ODA ICIN NE GEREKIR',   '30 M2 ODA İÇİN NE GEREKİR',   '30 m2 oda için ne gerekir',   'BTU'],
  ['gaz',       'KLIMA SOGUTMUYOR',            'KLİMA SOĞUTMUYOR',            'klima soğutmuyor',            'gaz'],
]

async function ask(page, text) {
  const before = await page.locator('#cbody .msg.bot:not(.typing)').count()
  await page.fill('#cin', text)
  await page.press('#cin', 'Enter')
  await page.waitForFunction(
    (n) => document.querySelectorAll('#cbody .msg.bot:not(.typing)').length > n,
    before, { timeout: 8000 }
  )
  const bubbles = page.locator('#cbody .msg.bot:not(.typing) .b')
  return (await bubbles.nth((await bubbles.count()) - 1).innerText()).trim()
}

const run = async (pass) => {
  const b = await chromium.launch()
  const ctx = await b.newContext()
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  const apiStatuses = []
  page.on('response', (r) => { if (r.url().includes('/api/chat')) apiStatuses.push(r.status()) })

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.click('#chatfab')
  await page.waitForSelector('#chatpanel:not([hidden])')

  const rows = []
  for (const [label, capsAscii, capsTr, lower, expected] of PROBES) {
    const aCaps = await ask(page, capsAscii)
    const aCapsTr = await ask(page, capsTr)
    const aLower = await ask(page, lower)
    rows.push({
      label, expected,
      capsAscii, gotCaps: classify(aCaps),
      capsTr, gotCapsTr: classify(aCapsTr),
      lower, gotLower: classify(aLower),
      answerCaps: aCaps.slice(0, 90),
    })
  }
  await page.screenshot({ path: `${DIR}/chat-caps-pass${pass}.png`, fullPage: false })
  await b.close()
  return { rows, errs, apiStatuses }
}

const p1 = await run(1)
const p2 = await run(2)

console.log(`/api/chat responses observed: pass1=[${p1.apiStatuses}] pass2=[${p2.apiStatuses}]`)
console.log(`console errors: pass1=${p1.errs.length} pass2=${p2.errs.length}`, p1.errs.slice(0, 3))

let capsFail = 0, capsTrFail = 0, lowFail = 0, stable = true
console.log('\nlabel      expected   | ASCII-CAPS      | TR-CAPS(İ)      | lowercase')
console.log('-'.repeat(90))
for (let i = 0; i < p1.rows.length; i++) {
  const r = p1.rows[i], q = p2.rows[i]
  if (r.gotCaps !== q.gotCaps || r.gotLower !== q.gotLower || r.gotCapsTr !== q.gotCapsTr) { stable = false; console.log(`  !! UNSTABLE ${r.label}`) }
  const mk = (got) => (got === r.expected ? 'OK  ' : 'FAIL') + ' ' + got
  if (r.gotCaps !== r.expected) capsFail++
  if (r.gotCapsTr !== r.expected) capsTrFail++
  if (r.gotLower !== r.expected) lowFail++
  console.log(`${r.label.padEnd(10)} ${r.expected.padEnd(10)} | ${mk(r.gotCaps).padEnd(15)} | ${mk(r.gotCapsTr).padEnd(15)} | ${mk(r.gotLower)}`)
}
console.log('-'.repeat(90))
console.log(`ASCII-CAPS failures: ${capsFail}/${p1.rows.length}`)
console.log(`TR-CAPS(İ) failures: ${capsTrFail}/${p1.rows.length}`)
console.log(`lowercase  failures: ${lowFail}/${p1.rows.length}`)
console.log(`both passes identical: ${stable}`)
console.log('\n--- exact ASCII-CAPS answers that fell through ---')
for (const r of p1.rows) if (r.gotCaps !== r.expected) console.log(`  IN : "${r.capsAscii}"\n  OUT: ${r.gotCaps} → "${r.answerCaps}…"`)
