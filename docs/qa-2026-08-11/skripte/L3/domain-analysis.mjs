// Exhaustive analysis of the shipped calculator model over its whole declared
// input domain (integer area 6..200 x people 1..12 x sun 0/1 = 4680 points).
// Technique: exhaustive equivalence-class + output-partition boundary analysis.
const STEP = [9000, 12000, 18000, 24000, 36000, 48000]
const snap = (v) => STEP.reduce((p, s) => (Math.abs(s - v) < Math.abs(p - v) ? s : p))
const raw = (a, p, sun) => { let b = a * 550 + Math.max(0, p - 2) * 600; if (sun) b *= 1.15; return b }

const MIDS = []
for (let i = 0; i < STEP.length - 1; i++) MIDS.push((STEP[i] + STEP[i + 1]) / 2)
console.log('device steps        :', STEP.join(', '))
console.log('exact midpoints     :', MIDS.join(', '))

const ties = []
let worstUnder = null, worstOver = null
const outCount = {}
const byOut = {}
for (let a = 6; a <= 200; a++) for (let p = 1; p <= 12; p++) for (const sun of [0, 1]) {
  const r = raw(a, p, sun)
  const v = snap(r)
  outCount[v] = (outCount[v] || 0) + 1
  ;(byOut[v] ||= []).push({ a, p, sun })
  if (MIDS.some((m) => Math.abs(r - m) < 1e-9)) ties.push({ a, p, sun, raw: r, got: v, shouldTieTo: STEP.find((s) => s > r) })
  const short = r - v
  if (short > 0 && (!worstUnder || short / r > worstUnder.pct)) worstUnder = { a, p, sun, raw: r, v, pct: short / r }
  if (short < 0 && (!worstOver || -short / r > worstOver.pct)) worstOver = { a, p, sun, raw: r, v, pct: -short / r }
}

console.log('\n--- EXACT TIES reachable from the UI (integer inputs only) ---')
ties.forEach((t) => console.log(`  area=${t.a} m², people=${t.p}, sun=${t.sun} -> raw ${t.raw} = exact midpoint; shipped shows ${t.got}, nearest-up is ${t.shouldTieTo}, deficit ${t.raw - t.got} BTU (${(((t.raw - t.got) / t.raw) * 100).toFixed(1)}%)`))
console.log(`  total exact-tie input points: ${ties.length} of 4680`)

console.log('\n--- OUTPUT DISTRIBUTION over the 4680-point domain ---')
Object.entries(outCount).sort((x, y) => Number(x[0]) - Number(y[0])).forEach(([v, n]) =>
  console.log(`  ${v} BTU : ${n} input points (${((n / 4680) * 100).toFixed(1)}%)`))

console.log('\n--- FLAT TOP: areas that all collapse to 48000 (people=2, no sun) ---')
let first48 = null
for (let a = 6; a <= 200; a++) if (snap(raw(a, 2, 0)) === 48000) { first48 = a; break }
console.log(`  first area returning 48000 at p=2,sun=0 : ${first48} m² (raw ${raw(first48, 2, 0)})`)
console.log(`  => every area from ${first48} to 200 m² (${200 - first48 + 1} of 195 values, ${(((200 - first48 + 1) / 195) * 100).toFixed(0)}%) returns the identical 48.000 BTU`)

console.log('\n--- WORST UNDER/OVER SIZING (relative) ---')
console.log(`  worst UNDER : area=${worstUnder.a} p=${worstUnder.p} sun=${worstUnder.sun} raw=${worstUnder.raw.toFixed(0)} -> ${worstUnder.v} (${(worstUnder.pct * 100).toFixed(1)}% short)`)
console.log(`  worst OVER  : area=${worstOver.a} p=${worstOver.p} sun=${worstOver.sun} raw=${worstOver.raw.toFixed(0)} -> ${worstOver.v} (${(worstOver.pct * 100).toFixed(1)}% over)`)

console.log('\n--- MONOTONICITY of the whole input->output function (area, p=2, sun=0) ---')
const f = (s) => { const a = Math.max(6, Math.min(200, Number(s) || 25)); return snap(a * 550) }
;['-1', '0', '1', '5', '5.9999', '6', '', '25'].forEach((s) => console.log(`  input ${JSON.stringify(s)} -> ${f(s)} BTU`))
const nonMono = f('0') !== f('5')
console.log(`  monotonic across 5 -> 0 -> -1 ? ${nonMono ? 'NO — f(0) > f(5) and f(0) > f(-1)' : 'yes'}`)

console.log('\n--- LOCALE RENDERING of every reachable output value ---')
for (const v of STEP) {
  const cells = ['tr', 'de', 'ru', 'en'].map((l) => `${l}="${v.toLocaleString(l)}"`).join('  ')
  console.log(`  ${v}: shipped(tr-TR)="${v.toLocaleString('tr-TR')}"   correct-per-locale: ${cells}`)
}
