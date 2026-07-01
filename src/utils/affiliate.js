// ── Affiliate referral capture & attribution ─────────────────────────────────
//
// A visitor can arrive from an affiliate link carrying their referral code in
// the URL, e.g.  ?ref=ABC123 , ?affiliate=ABC123 , or ?utm_affiliate=ABC123 .
//
// This module is the ONE place that:
//   1. reads that code off the URL, trims + validates it;
//   2. stores it first-party (localStorage) for a 90-day attribution window;
//   3. hands it back to the contact form so submissions carry attribution.
//
// Privacy by design — this matches the site's no-third-party-cookie stance in
// consent.js: we persist ONLY the opaque code, a timestamp, and which param it
// came from. No personal data, no IP, no device fingerprint is stored here.
// The code is NEVER trusted on the client: it is validated against the live CRM
// `tracking_code` server-side (api/track.js, api/contact.js) before anything is
// recorded or attributed. An invalid code stored locally simply never matches.

export const AFFILIATE_PARAMS = ['ref', 'affiliate', 'utm_affiliate']
export const AFFILIATE_KEY = 'rr-aff'
// Canonical attribution window. Must match the server-side window used by the
// referral-session RPCs and the portal redirect cookie (90 days). Keeping the
// client TTL shorter would silently drop attributions the server still honours.
export const AFFILIATE_TTL_DAYS = 90
const TTL_MS = AFFILIATE_TTL_DAYS * 24 * 60 * 60 * 1000
const AFFILIATE_ROUTE_PREFIX = 'r'
const ROUTE_DESTINATION_PARAM_NAMES = ['to', 'dest', 'destination', 'redirect']
const PUBLIC_ROUTE_ROOTS = new Set([
  'about',
  'contact',
  'industries',
  'process',
  'proof',
  'services',
  'privacy-policy',
  'terms-of-service',
  'paia-manual',
])

function newSessionId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* fall through */
  }
  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`
}

// localStorage can throw (private mode, disabled storage) — never let that
// crash the app. A null return just means "no durable attribution this visit".
// (Same defensive pattern as consent.js.)
function safeStorage() {
  try {
    const t = '__rr_aff_probe__'
    window.localStorage.setItem(t, t)
    window.localStorage.removeItem(t)
    return window.localStorage
  } catch {
    return null
  }
}

// ── Validation rule ───────────────────────────────────────────────────────────
// Shape-check only — a cheap client-side filter so obviously-bogus values (a URL
// pasted into ?ref=, an injection attempt, an empty string) are never stored or
// sent. It deliberately does NOT decide whether a code is real; that is the live
// CRM's job server-side. Keep this in sync with the format of your CRM
// `tracking_code` column so legitimate codes are never rejected here.
const AFFILIATE_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/
const TRACKING_TOKEN_RE = /^[A-Za-z0-9_-]{4,64}$/

export function isValidAffiliateCode(raw) {
  if (typeof raw !== 'string') return false
  const code = raw.trim()
  return AFFILIATE_CODE_RE.test(code)
}

// Pull the first present affiliate param out of a query string and normalise it.
// Returns { code, source } or null. Does not touch storage.
function readCodeFromSearch(search) {
  let params
  try {
    params = new URLSearchParams(search || '')
  } catch {
    return null
  }
  for (const source of AFFILIATE_PARAMS) {
    const raw = params.get(source)
    if (raw == null) continue
    const code = raw.trim()
    if (isValidAffiliateCode(code)) return { code, source }
  }
  return null
}

function safeDecodePathSegment(segment) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function splitPath(pathname) {
  return String(pathname || '')
    .split('/')
    .filter(Boolean)
    .map(safeDecodePathSegment)
}

function readSafeDestination(search) {
  let params
  try {
    params = new URLSearchParams(search || '')
  } catch {
    return null
  }
  for (const name of ROUTE_DESTINATION_PARAM_NAMES) {
    const raw = params.get(name)
    if (!raw) continue
    const dest = raw.trim()
    if (
      dest.startsWith('/') &&
      !dest.startsWith('//') &&
      !dest.startsWith('/\\') &&
      !dest.startsWith('/r/') &&
      !/[\r\n]/.test(dest)
    ) {
      return dest
    }
  }
  return null
}

function readDestinationFromRouteSegments(segments) {
  if (!segments.length) return null
  const [root] = segments
  if (!PUBLIC_ROUTE_ROOTS.has(root)) return null
  return `/${segments.map(encodeURIComponent).join('/')}`
}

export function readAffiliateRoute(pathname, search) {
  const segments = splitPath(pathname)
  if (segments[0] !== AFFILIATE_ROUTE_PREFIX || !segments[1]) return null

  const code = segments[1].trim()
  if (!isValidAffiliateCode(code)) return null
  const token = segments[2] && TRACKING_TOKEN_RE.test(segments[2]) ? segments[2] : null
  const destinationSegments = token ? segments.slice(3) : segments.slice(2)

  return {
    code,
    trackingToken: token,
    source: 'route',
    destination:
      readSafeDestination(search) ||
      readDestinationFromRouteSegments(destinationSegments) ||
      '/',
  }
}

// Capture an affiliate code from the current URL into storage.
//
// Rules (from the brief):
//   • trim + validate before storing;
//   • a 90-day attribution window;
//   • do NOT overwrite an existing stored code unless a new VALID code is
//     explicitly present in this URL (first-touch attribution wins, but a fresh
//     affiliate link the visitor just clicked takes precedence).
//
// Returns the stored record { code, source, capturedAt } when a NEW code was
// written this call, otherwise null (nothing in the URL / already stored).
export function captureAffiliateFromUrl(search) {
  const found = readCodeFromSearch(
    search != null ? search : (typeof window !== 'undefined' ? window.location.search : ''),
  )
  if (!found) return null

  const ls = safeStorage()
  const existing = getStoredAffiliate()
  // Same code already on file (and still valid) → refresh nothing, no event.
  if (existing && existing.code === found.code) return null

  const record = {
    code: found.code,
    source: found.source,
    trackingToken: found.trackingToken || null,
    capturedAt: new Date().toISOString(),
    sessionId: newSessionId(),
  }
  if (ls) {
    try {
      ls.setItem(AFFILIATE_KEY, JSON.stringify(record))
    } catch {
      /* storage full / blocked — attribution is best-effort, never fatal */
    }
  }
  return record
}

export function captureAffiliateFromRoute(pathname, search) {
  const found = readAffiliateRoute(pathname, search)
  if (!found) return null

  const queryRecord = captureAffiliateFromUrl(`?ref=${encodeURIComponent(found.code)}`)
  const record = queryRecord || getStoredAffiliate()
  if (record && found.trackingToken && record.trackingToken !== found.trackingToken) {
    record.trackingToken = found.trackingToken
    record.source = 'route'
    try {
      safeStorage()?.setItem(AFFILIATE_KEY, JSON.stringify(record))
    } catch {
      /* best-effort campaign-token upgrade */
    }
  }
  return {
    record,
    destination: found.destination,
  }
}

// Read the stored attribution, honouring the 90-day window. Expired or
// malformed records are cleared and treated as "no attribution".
export function getStoredAffiliate() {
  const ls = safeStorage()
  if (!ls) return null
  let parsed
  try {
    parsed = JSON.parse(ls.getItem(AFFILIATE_KEY) || 'null')
  } catch {
    return null
  }
  if (!parsed || !isValidAffiliateCode(parsed.code) || !parsed.capturedAt) return null
  const age = Date.now() - new Date(parsed.capturedAt).getTime()
  if (!Number.isFinite(age) || age < 0 || age > TTL_MS) {
    clearStoredAffiliate()
    return null
  }
  if (!parsed.sessionId) {
    parsed.sessionId = newSessionId()
    try {
      ls.setItem(AFFILIATE_KEY, JSON.stringify(parsed))
    } catch {
      /* best-effort migration of older local records */
    }
  }
  if (parsed.trackingToken && !TRACKING_TOKEN_RE.test(parsed.trackingToken)) {
    parsed.trackingToken = null
  }
  return parsed
}

export function clearStoredAffiliate() {
  const ls = safeStorage()
  if (!ls) return
  try {
    ls.removeItem(AFFILIATE_KEY)
  } catch {
    /* ignore */
  }
}

// Fire-and-forget click/referral-session report to the server.
//
// The server (api/track.js) validates the code against the CRM tracking_code
// and records a referral session/click using existing tables. We send the code
// once per browser session per code (guarded via sessionStorage) so SPA
// navigation does not spam the endpoint. Any failure is swallowed — tracking
// must never affect page rendering.
//
// Default to the same-origin serverless routes so tracking works even if the
// build-time VITE_* vars were never set (they only inline at build time — a
// missing var used to silently disable all tracking). The routes themselves
// return 501/no-op when Supabase isn't configured, so this is always safe.
const TRACK_API = import.meta.env.VITE_TRACK_API || '/api/track'
const INTENT_API = import.meta.env.VITE_INTENT_API || '/api/intent'

export function reportAffiliateVisit(record) {
  if (!TRACK_API || !record || !record.code) return
  let already = false
  try {
    const k = `rr-aff-reported:${record.code}:${record.trackingToken || 'default'}`
    already = window.sessionStorage.getItem(k) === '1'
    if (!already) window.sessionStorage.setItem(k, '1')
  } catch {
    /* sessionStorage blocked — fall through and just send once */
  }
  if (already) return

  try {
    const body = JSON.stringify({
      code: record.code,
      sessionId: record.sessionId,
      trackingToken: record.trackingToken || null,
      source: record.source,
      landingPath: window.location.pathname,
      referrer: document.referrer || null,
    })
    // keepalive lets the request survive a fast navigation away from the page.
    fetch(TRACK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* never throw from tracking */
  }
}

function serviceHintFromPath(pathname) {
  const parts = splitPath(pathname)
  if (parts[0] === 'services' && parts[1]) return parts[1].replace(/-/g, ' ')
  if (parts[0] === 'contact') return 'contact'
  return null
}

// Persistent anonymous visitor session id — for EVERY visitor, not only affiliate
// arrivals — so a contact-intent click is always tied to one visitor even with no
// affiliate code present.
const VISITOR_KEY = 'rr-visitor'
export function getOrCreateVisitorSession() {
  const ls = safeStorage()
  if (!ls) return newSessionId()
  try {
    let id = ls.getItem(VISITOR_KEY)
    if (!id || !/^[0-9a-f-]{8,}$/i.test(id)) {
      id = newSessionId()
      ls.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return newSessionId()
  }
}

// Most reliable delivery for a click that hands the browser off to another app
// (WhatsApp / mail / dialer): sendBeacon queues the request in the browser so it
// completes even if the tab is frozen or closed. Falls back to a keepalive fetch.
function sendIntent(payload) {
  const body = JSON.stringify(payload)
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon(INTENT_API, blob)) return
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    fetch(INTENT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* never throw from tracking */
  }
}

// Record a WhatsApp/email/phone click for EVERY visitor. Affiliate code/token are
// included when present (attribution); anonymous visitors are still captured so no
// contact attempt is lost. Deduped per visitor+channel+day.
export function reportAffiliateIntent(channel, linkUrl) {
  if (!INTENT_API || !channel) return
  const normalized = String(channel).toLowerCase()
  const record = getStoredAffiliate()
  const sessionId = record?.sessionId || getOrCreateVisitorSession()
  try {
    const day = new Date().toISOString().slice(0, 10)
    const k = `rr-intent:${record?.code || 'anon'}:${record?.trackingToken || 'default'}:${normalized}:${day}`
    if (window.sessionStorage.getItem(k) === '1') return
    window.sessionStorage.setItem(k, '1')
  } catch {
    /* sessionStorage blocked - still report best-effort */
  }

  sendIntent({
    code: record?.code || null,
    sessionId,
    trackingToken: record?.trackingToken || null,
    channel: normalized,
    pagePath: window.location.pathname,
    pageUrl: window.location.href,
    linkUrl: linkUrl || null,
    serviceHint: serviceHintFromPath(window.location.pathname),
  })
}

// Append an affiliate reference to an outbound WhatsApp/mailto URL so the actual
// message/email a visitor sends carries attribution — the ultimate backstop if
// every client-side beacon fails. No-op for non-affiliate visitors and tel: links.
export function withAffiliateRef(url) {
  const record = getStoredAffiliate()
  if (!record?.code || !url) return url
  const ref = `— Please keep this reference so your referrer gets credited —\nRef: ${record.code}${record.trackingToken ? ` / ${record.trackingToken}` : ''}`
  try {
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(url)) {
      const u = new URL(url)
      const existing = u.searchParams.get('text') || ''
      u.searchParams.set('text', existing ? `${existing}\n\n${ref}` : `Hi Rapid Rise AI, I'd like to start a project.\n\n${ref}`)
      return u.toString()
    }
    if (/^mailto:/i.test(url)) {
      const [addr, qs = ''] = url.slice('mailto:'.length).split('?')
      const params = new URLSearchParams(qs)
      if (!params.get('subject')) params.set('subject', 'Project enquiry')
      const existingBody = params.get('body') || ''
      params.set('body', existingBody ? `${existingBody}\n\n${ref}` : `Hi Rapid Rise AI,\n\nI'd like to start a project.\n\n${ref}`)
      return `mailto:${addr}?${params.toString()}`
    }
  } catch {
    /* return original on any parse issue */
  }
  return url
}
