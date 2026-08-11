// L5 — DEFINITIVE: what a visitor who only scrolls sends to Google, per locale, no consent.
import { chromium } from 'file:///D:/01%20Antigrafity%20Projekte/25%20Global-Technik-Klima/node_modules/playwright/index.mjs'
const BASE='http://localhost:4321'
const DIR='C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L5'
const PATHS={tr:'/',ru:'/ru',de:'/de',en:'/en'}
const b=await chromium.launch()
for(const pass of [1,2]){
 console.log(`\n===== PASS ${pass} =====`)
 for(const [loc,p] of Object.entries(PATHS)){
  const ctx=await b.newContext(); const page=await ctx.newPage()
  const hosts=[]
  page.on('request',r=>{const h=new URL(r.url()).host; if(!/^localhost/.test(h)) hosts.push(h)})
  await page.goto(BASE+p,{waitUntil:'networkidle'})
  const before=[...new Set(hosts)]
  await page.evaluate(()=>document.querySelector('#kontakt').scrollIntoView())
  await page.waitForFunction(()=>performance.getEntriesByType('resource').length>0 &&
    [...document.querySelectorAll('iframe')].length>0, null, {timeout:5000}).catch(()=>{})
  // wait on a CONDITION: at least one google request observed, else 10s cap
  const t0=Date.now()
  while(Date.now()-t0<10000 && !hosts.some(h=>/google/.test(h))) await page.waitForTimeout(200)
  await page.waitForTimeout(2500) // settle: tile requests keep arriving; counted after
  const after=[...new Set(hosts)]
  const ck=await ctx.cookies()
  const gh=hosts.filter(h=>/google/.test(h))
  console.log(`  /${loc}: before=[${before.join(',')||'none'}]`)
  console.log(`         after =[${after.join(', ')||'none'}]`)
  console.log(`         google requests=${gh.length}  fonts.googleapis=${hosts.filter(h=>h==='fonts.googleapis.com').length}  fonts.gstatic=${hosts.filter(h=>h==='fonts.gstatic.com').length}`)
  console.log(`         cookies=${ck.length?ck.map(c=>c.name+'@'+c.domain).join(', '):'(none)'}`)
  if(pass===1&&loc==='de'){await page.screenshot({path:`${DIR}/map-loaded-no-consent-de.png`})}
  await ctx.close()
 }
}
await b.close()
