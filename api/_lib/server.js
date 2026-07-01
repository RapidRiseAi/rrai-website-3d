// Shared server-only helpers for the Vercel serverless routes.
//
// Files/folders under api/ whose name starts with "_" are NOT routed by Vercel,
// so this module is import-only. NOTHING here is ever shipped to the browser:
// the service-role key, HMAC secret and Resend key live only in these functions.
//
// Design note: every DB write goes through a named Postgres RPC that receives a
// single jsonb payload. That keeps this code decoupled from the CRM column
// layout — the mapping lives in SQL (see db/proposals/...), not in JavaScript —
// and means no privileged table is touched directly from here.

import crypto from 'node:crypto'

// ── Env (server-only — none of these may ever be prefixed VITE_/NEXT_PUBLIC_) ──
export const env = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  leadRpc: process.env.WEBSITE_LEAD_RPC || 'submit_website_lead',
  clickRpc: process.env.AFFILIATE_CLICK_RPC || 'record_website_referral_click',
  // Contact intents go through submit_website_contact_intent (see contactIntentRpc).
  // Default this to the same real function so a stray reference can never resolve
  // to a non-existent RPC (the old default 'record_website_referral_intent' does
  // not exist and would silently no-op given the fire-and-forget beacon).
  intentRpc: process.env.AFFILIATE_INTENT_RPC || 'submit_website_contact_intent',
  contactIntentRpc: process.env.WEBSITE_CONTACT_INTENT_RPC || 'submit_website_contact_intent',
  hmacSecret: process.env.AFFILIATE_ATTRIBUTION_HMAC_SECRET || '',
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL || '',
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  resendKey: process.env.RESEND_API_KEY || '',
  // Accept the project-wide Resend naming used by the other apps
  // (RESEND_FROM_EMAIL / RESEND_TO_EMAIL) as well as this app's own names, so the
  // env vars already in place work without renaming. The recipient defaults to
  // the team inbox so a new-lead notification has somewhere to go out of the box.
  notifyTo:
    process.env.INTERNAL_NOTIFICATION_EMAIL ||
    process.env.RESEND_TO_EMAIL ||
    'team@rapidriseai.com',
  notifyFrom:
    process.env.RESEND_FROM_EMAIL ||
    process.env.NOTIFICATION_FROM ||
    'Rapid Rise AI <team@rapidriseai.com>',
}

export function isConfigured() {
  return Boolean(env.supabaseUrl && env.serviceRoleKey)
}

// ── Response helpers — never leak a raw DB error to the client ────────────────
export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(body))
}

export async function readJsonBody(req) {
  // Vercel usually parses JSON into req.body, but guard for the raw-stream case.
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}

// ── Input sanitising ──────────────────────────────────────────────────────────
// Strip ASCII control characters (U+0000–U+001F and U+007F), trim, cap length.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g
export function cleanString(v, max = 2000) {
  if (typeof v !== 'string') return null
  const s = v.replace(CONTROL_CHARS, '').trim()
  return s ? s.slice(0, max) : null
}

const AFFILIATE_CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/
export function cleanAffiliateCode(v) {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return AFFILIATE_CODE_RE.test(s) ? s : null
}

// ── Privacy-preserving visitor token ──────────────────────────────────────────
// We do NOT store raw IP or user-agent. If (and only if) an HMAC secret is set,
// derive an opaque, non-reversible token so the backend can de-duplicate clicks
// without ever persisting the underlying identifiers. No secret → no token.
export function visitorToken(req) {
  if (!env.hmacSecret) return null
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    ''
  const ua = req.headers['user-agent'] || ''
  if (!ip && !ua) return null
  return crypto.createHmac('sha256', env.hmacSecret).update(`${ip}|${ua}`).digest('hex')
}

// ── Best-effort IP + rate limiting (Upstash Redis REST) ───────────────────────
// FAIL-OPEN: if Upstash is not configured or unreachable, requests are allowed.
// These public endpoints are unauthenticated, so this caps abuse/cost without
// ever breaking a real visitor. Configure with UPSTASH_REDIS_REST_URL/TOKEN.
export function clientIp(req) {
  const fwd = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  return fwd || req.socket?.remoteAddress || 'unknown'
}

export async function rateLimit(key, limit, windowSeconds) {
  if (!env.upstashUrl || !env.upstashToken) return { ok: true }
  try {
    const r = await fetch(`${env.upstashUrl.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.upstashToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', `rl:${key}`],
        ['PEXPIRE', `rl:${key}`, windowSeconds * 1000, 'NX'],
      ]),
    })
    if (!r.ok) return { ok: true }
    const results = await r.json()
    const count = Number(results?.[0]?.result ?? 0)
    if (!Number.isFinite(count) || count <= 0) return { ok: true }
    return { ok: count <= limit }
  } catch {
    return { ok: true }
  }
}

// ── Call a Supabase RPC with the service role key (server-side only) ──────────
// Returns { ok, status, data } and never throws on a normal HTTP error.
export async function callRpc(name, payload) {
  const url = `${env.supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/${name}`
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: env.serviceRoleKey,
      Authorization: `Bearer ${env.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  let data = null
  try {
    data = await r.json()
  } catch {
    /* empty / non-JSON body */
  }
  return { ok: r.ok, status: r.status, data }
}

// ── Optional team notification via Resend ─────────────────────────────────────
// Best-effort: a failure here must NOT fail a submission whose lead was already
// stored. Returns a short status string for safe server-side logging only.
export async function sendTeamNotification({ subject, text }) {
  if (!env.resendKey || !env.notifyTo) return 'skipped_not_configured'
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.notifyFrom,
        to: [env.notifyTo],
        reply_to: 'team@rapidriseai.com',
        subject,
        text,
      }),
    })
    return r.ok ? 'sent' : `resend_http_${r.status}`
  } catch {
    return 'resend_network_error'
  }
}
