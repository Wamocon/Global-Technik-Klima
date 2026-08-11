/**
 * L1-B2  Technique: use-case (scenario) testing + CRUD-style state consistency on
 *        the built deeplink (every field the user typed must survive into the
 *        WhatsApp payload, labelled in the page locale).
 * Coverage criterion: happy path × 4 locales; every form field exercised at least
 *        once; deeplink number + all 6 field/value pairs asserted.
 */
import { LOCALES, goHome, newPage, browser, ok, eq, summary, DIR } from './lib.mjs'

const WA_NUMBER = '905330461387'

const LABELS = {
  tr: { name: 'Adınız', phone: 'Telefon', place: 'Semt / Mahalle', service: 'Konu', when: 'Tercih ettiğiniz gün / saat', note: 'Kısa not (isteğe bağlı)' },
  de: { name: 'Ihr Name', phone: 'Telefon', place: 'Stadtteil', service: 'Anliegen', when: 'Wunschtag / -zeit', note: 'Kurze Notiz (optional)' },
  ru: { name: 'Ваше имя', phone: 'Телефон', place: 'Район', service: 'Тема', when: 'Предпочтительный день / время', note: 'Короткое примечание (по желанию)' },
  en: { name: 'Your name', phone: 'Phone', place: 'District', service: 'Topic', when: 'Preferred day / time', note: 'Short note (optional)' },
}
const SERVICES = {
  tr: ['Klima alımı', 'Montaj', 'Bakım / Temizlik', 'Arıza / Servis', 'Proje / VRF', 'Diğer'],
  de: ['Klimakauf', 'Montage', 'Wartung / Reinigung', 'Störung / Service', 'Projekt / VRF', 'Sonstiges'],
  ru: ['Покупка кондиционера', 'Монтаж', 'Обслуживание / Чистка', 'Ремонт / Сервис', 'Проект / VRF', 'Другое'],
  en: ['Buying a unit', 'Installation', 'Maintenance / Cleaning', 'Fault / Service', 'Project / VRF', 'Other'],
}
// One distinct input set per locale so nothing can pass by accident.
const INPUT = {
  tr: { name: 'Ayşe Kılıçoğlu', phone: '+90 555 111 22 33', place: 'Mahmutlar', svcIdx: 1, when: 'Cumartesi 14:00', note: '2 oda, Gree Pular' },
  de: { name: 'Jörg Müller-Straße', phone: '+49 170 9998877', place: 'Oba', svcIdx: 2, when: 'Samstag 14 Uhr', note: '2 Räume, Gree Pular' },
  ru: { name: 'Анна Ильина', phone: '+7 916 5554433', place: 'Кестель', svcIdx: 3, when: 'суббота 14:00', note: '2 комнаты, Gree Pular' },
  en: { name: "O'Brien Smith", phone: '+44 7700 900123', place: 'Kestel', svcIdx: 5, when: 'Saturday 2pm', note: '2 rooms, Gree Pular' },
}

const b = await browser()
for (const loc of LOCALES) {
  console.log(`\n--- randevu happy path, locale ${loc} ---`)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await newPage(ctx)
  // Intercept window.open BEFORE any script runs.
  await page.addInitScript(() => {
    window.__opened = []
    window.open = (url, target, feat) => { window.__opened.push({ url: String(url), target, feat }); return null }
  })
  await goHome(page, loc)

  const form = page.locator('#reqForm')
  await form.scrollIntoViewIfNeeded()

  // -- select options must equal the locale service list, in order --
  const opts = await page.locator('#reqForm select[name=service] option').allInnerTexts()
  eq(`[${loc}] service select options match locale list`, opts.map((s) => s.trim()), SERVICES[loc])

  // -- visible labels must be the locale labels --
  const seen = await page.$$eval('#reqForm .rf', (els) =>
    els.map((el) => ({
      name: el.querySelector('[name]')?.getAttribute('name'),
      label: (el.querySelector('span')?.textContent || '').replace('*', '').trim(),
    })))
  for (const k of ['name', 'phone', 'place', 'service', 'when', 'note']) {
    const got = seen.find((s) => s.name === k)?.label
    eq(`[${loc}] label(${k})`, got, LABELS[loc][k])
  }

  // -- fill every field --
  const i = INPUT[loc]
  await form.locator('[name=name]').fill(i.name)
  await form.locator('[name=phone]').fill(i.phone)
  await form.locator('[name=place]').fill(i.place)
  await form.locator('select[name=service]').selectOption({ index: i.svcIdx })
  await form.locator('[name=when]').fill(i.when)
  await form.locator('[name=note]').fill(i.note)
  await form.locator('[name=consent]').check()
  ok(`[${loc}] consent is checked before submit`, await form.locator('[name=consent]').isChecked())
  const chosenService = SERVICES[loc][i.svcIdx]

  // -- submit --
  await form.locator('button[type=submit]').click()
  await page.waitForFunction(() => window.__opened.length > 0, null, { timeout: 5000 })
    .catch(() => {})
  const opened = await page.evaluate(() => window.__opened)
  if (!ok(`[${loc}] submit triggered exactly one window.open`, opened.length === 1, `opened=${JSON.stringify(opened)}`)) {
    await page.screenshot({ path: `${DIR}/form-${loc}-noopen.png` })
    await ctx.close(); continue
  }
  const url = opened[0].url
  eq(`[${loc}] window.open target/features`, [opened[0].target, opened[0].feat], ['_blank', 'noopener'])
  ok(`[${loc}] deeplink host+number = wa.me/${WA_NUMBER}`, url.startsWith(`https://wa.me/${WA_NUMBER}?text=`), `url=${url.slice(0, 90)}`)
  ok(`[${loc}] no Konya number in deeplink`, !url.includes('3323252550') && !decodeURIComponent(url).includes('332 325 25 50'))

  const text = decodeURIComponent(url.split('?text=')[1] || '')
  console.log(`      payload:\n${text.split('\n').map((l) => '        | ' + l).join('\n')}`)

  // -- every value survived, each with its locale label --
  const L = LABELS[loc]
  eq(`[${loc}] payload name line`, text.includes(`${L.name}: ${i.name}`), true)
  eq(`[${loc}] payload phone line`, text.includes(`${L.phone}: ${i.phone}`), true)
  eq(`[${loc}] payload place line`, text.includes(`${L.place}: ${i.place}`), true)
  eq(`[${loc}] payload service line`, text.includes(`${L.service}: ${chosenService}`), true)
  eq(`[${loc}] payload when line`, text.includes(`${L.when}: ${i.when}`), true)
  eq(`[${loc}] payload note line`, text.includes(`${L.note}: ${i.note}`), true)
  eq(`[${loc}] payload has 6 field lines + origin + blank`, text.split('\n').length, 8)
  ok(`[${loc}] payload first line names the origin`, /Web sitesi/.test(text.split('\n')[0]), `line0="${text.split('\n')[0]}"`)
  ok(`[${loc}] error node stayed hidden`, await page.locator('#reqErr').isHidden())

  // -- optional-field variant: leave place/when/note empty, they must be omitted --
  await page.evaluate(() => { window.__opened = [] })
  for (const f of ['place', 'when', 'note']) await form.locator(`[name=${f}]`).fill('')
  await form.locator('button[type=submit]').click()
  await page.waitForFunction(() => window.__opened.length > 0, null, { timeout: 5000 }).catch(() => {})
  const t2 = decodeURIComponent(((await page.evaluate(() => window.__opened))[0]?.url || '').split('?text=')[1] || '')
  ok(`[${loc}] optional empties omitted (no place/when/note labels)`,
    t2.length > 0 && !t2.includes(L.place) && !t2.includes(L.when) && !t2.includes(L.note),
    `t2=${JSON.stringify(t2)}`)
  ok(`[${loc}] required + service still present in minimal payload`,
    t2.includes(`${L.name}: ${i.name}`) && t2.includes(`${L.phone}: ${i.phone}`) && t2.includes(`${L.service}: ${chosenService}`))

  ok(`[${loc}] no console/page errors during form flow`, page.__errors.length === 0, page.__errors.join(' | '))
  await ctx.close()
}
await b.close()
summary('t2-form')
