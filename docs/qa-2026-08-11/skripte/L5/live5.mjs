import { chromium } from 'file:///D:/01%20Antigrafity%20Projekte/25%20Global-Technik-Klima/node_modules/playwright/index.mjs'
const DIR='C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L5'
const b=await chromium.launch(); const page=await b.newPage()
// 404
const r=await page.goto('http://localhost:4321/hic-boyle-bir-sayfa-yok')
console.log('404 status:', r.status())
console.log('404 lines:', JSON.stringify(await page.$$eval('.ways li',n=>n.map(x=>({lang:x.getAttribute('lang'), text:x.innerText.replace(/\n/g,' | ')})))))
console.log('404 html lang:', await page.getAttribute('html','lang'))
console.log('404 canonical:', await page.getAttribute('link[rel=canonical]','href'))
console.log('404 has LocalBusiness schema:', (await page.content()).includes('aggregateRating'))
// legal placeholder, tr
await page.goto('http://localhost:4321/kvkk',{waitUntil:'networkidle'})
const ph=await page.$$eval('.lb p', n=>n.map(x=>x.textContent).filter(t=>t.includes('⟨')))
console.log('\n/kvkk visible German placeholders:', ph.length)
ph.forEach(t=>console.log('   ', t.slice(0,150)))
console.log('/kvkk map claim:', (await page.$$eval('.lb p',n=>n.map(x=>x.textContent))).filter(t=>/harita/i.test(t)))
await page.locator('.lb').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(400)
await page.screenshot({path:`${DIR}/kvkk-tr-german-placeholder.png`})
// cerez tr claims
await page.goto('http://localhost:4321/cerez',{waitUntil:'networkidle'})
const cz=await page.$$eval('.lb p',n=>n.map(x=>x.textContent))
console.log('\n/cerez claims:'); cz.forEach(t=>console.log('   ·',t))
// trailing slash duplication
for(const u of ['http://localhost:4321/de','http://localhost:4321/de/']){
  const rr=await page.goto(u); 
  console.log(`\n${u} → ${rr.status()}  canonical=${await page.getAttribute('link[rel=canonical]','href')}  final=${page.url()}`)
}
await b.close()
