/** L7-02 — exact resource list at `load` per locale, fonts + images detail. */
import { readFileSync } from 'node:fs'
import { LOCALES, bucket, kb } from './lib.mjs'
const J = JSON.parse(readFileSync(new URL('./01-payload.json', import.meta.url), 'utf8'))

for (const loc of LOCALES) {
  const runs = J[loc.key].runs
  console.log(`\n===== ${loc.key.toUpperCase()} =====`)
  for (let i = 0; i < runs.length; i++) {
    const urls = runs[i].atLoad.map((x) => `${bucket(x.url, x.mime)}:${x.url.replace('http://localhost:4321', '')}=${kb(x.enc)}`)
    console.log(` run${i} (${urls.length} req):`)
    for (const u of urls.sort()) console.log('   ', u)
  }
}
