// Optionaler echter KI-Endpunkt (Vercel Serverless Function).
//
// MIT gesetztem ANTHROPIC_API_KEY beantwortet Claude JEDEN Freitext in der Sprache
// des Besuchers — die "vollwertige" KI. OHNE Schlüssel liefert die Funktion nichts,
// und der Client fällt auf seinen eingebauten Fachverstand zurück (src/content/kb.ts).
// Die Seite funktioniert also in jedem Fall.
//
// Produktion (KVKK): Diese Inferenz gehört auf einen türkischen Server / eine
// türkische GPU (Gemma 3 27B / Qwen 3 30B) oder Bedrock Frankfurt mit Standardvertrag.
// Für die Vercel-Demo genügt der Anthropic-Schlüssel; keine echten Kundendaten.

const WA = '+90 533 046 13 87'

const SYSTEM_PROMPT = `Du bist der Assistent von "Global Teknik Klima" (Alanya Global Teknik), autorisierter Gree-Klimaanlagen-Händler und -Servicepartner in Alanya, Antalya, Türkei.

REGELN
- Antworte IMMER in der Sprache des Nutzers (Türkisch, Russisch, Deutsch oder Englisch).
- Sei knapp (2–4 Sätze), warm, konkret und selbstsicher — aber niemals aufdringlich.
- Erfinde NIE Preise, kein Gründungsjahr, keine Garantiefristen, die nicht unten stehen.
- Bei konkretem Angebot, Termin, Reklamation oder Unsicherheit: an einen Menschen über WhatsApp übergeben (${WA}).
- Türkischer Markt: keinen Festpreis nennen, stattdessen "ücretsiz keşif". Russisch/Deutsch: Preistransparenz über die kostenlose Besichtigung erklären.

FIRMA
- Autorisierter Gree-Händler UND -Servicepartner. Adresse: Hacet Mah., Alaiye Cad. No: 17/A, Alanya/Antalya.
- Telefon +90 242 513 86 51, WhatsApp ${WA}. Öffnung Mo–Sa 08:00–20:00, Sonntag zu. WhatsApp jederzeit.
- 5,0 Sterne aus 65 Google-Bewertungen. Faturalı hizmet (offizielle Rechnung). Sprachen: TR/RU/DE/EN.

LEISTUNGEN: Montage, Wartung, Reinigung, Kältemittel nachfüllen (R32), Störung/Reparatur (Diagnose→Angebot→Reparatur, Original-Gree-Teile), Demontage/Umsetzen. Vor-Ort-Besichtigung (keşif) kostenlos.

GREE-PRODUKTE
- Wandgeräte: Aphro, Pular (WLAN), Fairy (Premium), Airy. Inverter, R32.
- Salon/Standgeräte: I-Shine, 24.000–48.000 BTU.
- Multisplit: Free Match, bis 5 Innengeräte.
- Home-Typ: Wohn-Sortiment.
- Wärmepumpen: Versati (Heizen, Kühlen, Warmwasser).
- Gewerbe & VRF: Kassette, Kanal, GMV5/GMV6. Ersatzteile: original Gree.

BTU-AUSLEGUNG (Alanya, heiß, Küste): Fläche m² × 550 + 600 je Person über 2; Süd/Dach +15 %. Auf 9.000/12.000/18.000/24.000/36.000/48.000 runden. Immer als Näherung, genaue Auslegung bei der kostenlosen Besichtigung.

GARANTIE: Gree-Herstellergarantie auf alle Teile; für Wandgeräte erweitertes Programm bei Montage durch den autorisierten Service; max. Reparaturdauer 20 Werktage. Genaue Fristen im Gespräch bestätigen.

PREISE: Keine festen Servicepreise online. Kostenlose Besichtigung, dann Angebot. Ratenzahlung (taksit) beim Gerätekauf. Für ein konkretes Angebot zu WhatsApp führen.`

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5'

// ---------------------------------------------------------------- Missbrauchsbremse
//
// Ein offener KI-Endpunkt ohne Bremse ist eine offene Rechnung. (Lücke L8)
//
// Der Kniff: Wer das Limit reißt, bekommt KEINEN Fehler, sondern `fallback: true` —
// derselbe Weg wie bei fehlendem Schlüssel. Der Client schaltet dann auf die
// eingebaute Wissensbasis um. Der Besucher merkt nichts, der Chat bleibt am Leben,
// und die Kosten sind gedeckelt. Eine 429 hätte nur ein totes Fenster ergeben.
//
// ⚠️ Grenze, ehrlich benannt: Der Zähler lebt im Speicher EINER Serverless-Instanz.
//    Vercel kann mehrere starten — dann zählt jede für sich. Das bremst Missbrauch
//    ab, es sperrt ihn nicht. Für den echten Betrieb gehört der Zähler in einen
//    gemeinsamen Speicher (Upstash/Redis) — in der Türkei gehostet (KVKK).
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 8      // ein Mensch tippt keine 8 Fragen in einer Minute
const MAX_CHARS = 800         // eine echte Kundenfrage ist kürzer
const hits = new Map()

function tooMany(ip) {
  const now = Date.now()
  const bucket = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  bucket.push(now)
  hits.set(ip, bucket)

  // Aufräumen, damit die Map nicht unbegrenzt wächst.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k)
  }
  return bucket.length > MAX_PER_WINDOW
}

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.headers['x-real-ip'] ||
  'unknown'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(200).json({ reply: null, fallback: true }) // → Client-Verstand

  if (tooMany(clientIp(req))) return res.status(200).json({ reply: null, fallback: true })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  const message = (body && body.message ? String(body.message) : '').slice(0, MAX_CHARS)
  const locale = (body && body.locale) || 'tr'
  if (!message.trim()) return res.status(200).json({ reply: null, fallback: true })

  const langName = { tr: 'Turkish', ru: 'Russian', de: 'German', en: 'English' }[locale] || 'Turkish'

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT + `\n\nAntworte auf ${langName}.`,
        messages: [{ role: 'user', content: message }],
      }),
    })
    if (!r.ok) return res.status(200).json({ reply: null, fallback: true })
    const j = await r.json()
    const reply = j && j.content && j.content[0] && j.content[0].text ? j.content[0].text : null
    return res.status(200).json({ reply })
  } catch {
    return res.status(200).json({ reply: null, fallback: true })
  }
}
