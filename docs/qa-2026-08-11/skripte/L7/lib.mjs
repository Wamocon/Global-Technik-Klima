// Shared helpers for L7 performance lens.
export const BASE = 'http://localhost:4321'
export const LOCALES = [
  { key: 'tr', url: BASE + '/' },
  { key: 'de', url: BASE + '/de/' },
  { key: 'ru', url: BASE + '/ru/' },
  { key: 'en', url: BASE + '/en/' },
]

export const median = (a) => {
  const s = [...a].sort((x, y) => x - y)
  if (!s.length) return NaN
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
export const round = (n, d = 1) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : n)
export const kb = (b) => round(b / 1024, 1)
export const rng = (a) => (a.length ? `${round(Math.min(...a))}–${round(Math.max(...a))}` : 'n/a')

/** Classify a URL/mime into a payload bucket. */
export function bucket(url, mime = '') {
  const u = url.split('?')[0].toLowerCase()
  if (/\.woff2?$|\.ttf$|\.otf$/.test(u) || /font/.test(mime)) return 'font'
  if (/\.css$/.test(u) || /text\/css/.test(mime)) return 'css'
  if (/\.m?js$/.test(u) || /javascript/.test(mime)) return 'js'
  if (/\.(png|jpe?g|webp|avif|gif|svg|ico)$/.test(u) || /^image\//.test(mime)) return 'image'
  if (/\.html?$|\/$|\/(de|ru|en)$/.test(u) || /text\/html/.test(mime)) return 'html'
  return 'other'
}

/** Attach a CDP network recorder to a page. Returns {events, snapshot()}. */
export async function recorder(page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  const byId = new Map()
  cdp.on('Network.requestWillBeSent', (e) => {
    byId.set(e.requestId, {
      id: e.requestId,
      url: e.request.url,
      type: e.type,
      start: e.timestamp,
      enc: 0,
      dec: 0,
      mime: '',
      status: 0,
      fromCache: false,
      protocol: '',
      finished: false,
      headers: {},
    })
  })
  cdp.on('Network.responseReceived', (e) => {
    const r = byId.get(e.requestId)
    if (!r) return
    r.mime = e.response.mimeType
    r.status = e.response.status
    r.fromCache = !!e.response.fromDiskCache || !!e.response.fromPrefetchCache
    r.protocol = e.response.protocol
    r.type = e.type || r.type
    r.headers = e.response.headers || {}
    r.respEnc = e.response.encodedDataLength || 0
  })
  cdp.on('Network.requestServedFromCache', (e) => {
    const r = byId.get(e.requestId)
    if (r) r.servedFromMemCache = true
  })
  cdp.on('Network.loadingFinished', (e) => {
    const r = byId.get(e.requestId)
    if (!r) return
    r.enc = e.encodedDataLength || r.respEnc || 0
    r.finished = true
    r.end = e.timestamp
  })
  cdp.on('Network.loadingFailed', (e) => {
    const r = byId.get(e.requestId)
    if (r) { r.failed = true; r.errorText = e.errorText }
  })
  return {
    cdp,
    all: () => [...byId.values()],
    snapshot: () => [...byId.values()].map((r) => ({ ...r })),
  }
}

/** Decoded body sizes via performance entries (transferSize/decodedBodySize). */
export async function perfResources(page) {
  return page.evaluate(() =>
    performance.getEntriesByType('resource').map((r) => ({
      url: r.name,
      init: r.initiatorType,
      transfer: r.transferSize,
      enc: r.encodedBodySize,
      dec: r.decodedBodySize,
      dur: r.duration,
      start: r.startTime,
      resp: r.responseEnd,
    }))
  )
}

export const NAV_TIMING = () =>
  (() => {
    const n = performance.getEntriesByType('navigation')[0]
    return n
      ? {
          dcl: n.domContentLoadedEventEnd,
          load: n.loadEventEnd,
          respStart: n.responseStart,
          respEnd: n.responseEnd,
          transfer: n.transferSize,
          dec: n.decodedBodySize,
        }
      : null
  })()
