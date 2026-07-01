// POST /api/intent - record a WhatsApp/email/phone click as a CRM lead so no
// contact attempt is lost. Works for EVERY visitor (affiliate attribution is
// applied only when a valid code is present). Deduped server-side to one lead per
// visitor session + channel + day. Called via sendBeacon/keepalive so it survives
// the browser handing off to the WhatsApp/mail/dialer app.

import {
  env,
  isConfigured,
  json,
  readJsonBody,
  cleanString,
  cleanAffiliateCode,
  visitorToken,
  callRpc,
  sendTeamNotification,
  clientIp,
  rateLimit,
} from './_lib/server.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed' })
  if (!isConfigured()) return json(res, 200, { ok: false, error: 'not_configured' })

  const rl = await rateLimit(`intent:${clientIp(req)}`, 40, 300)
  if (!rl.ok) return json(res, 200, { ok: false, error: 'rate_limited' })

  const body = await readJsonBody(req)
  const code = cleanAffiliateCode(body && body.code) // optional — anonymous visitors still captured
  const sessionId = cleanString(body && body.sessionId, 64)
  const channel = cleanString(body && body.channel, 40)
  if (!sessionId || !['whatsapp', 'email', 'phone'].includes(channel || '')) {
    return json(res, 200, { ok: false, error: 'invalid_input' })
  }

  const pagePath = cleanString(body.pagePath, 300)
  const payload = {
    code,
    session_id: sessionId,
    tracking_token: cleanString(body.trackingToken, 64),
    channel,
    page_path: pagePath,
    page_url: cleanString(body.pageUrl, 500),
    link_url: cleanString(body.linkUrl, 500),
    service_hint: cleanString(body.serviceHint, 120),
    visitor_token: visitorToken(req),
  }

  let created = false
  let ok = false
  let attribution = null
  try {
    const result = await callRpc(env.contactIntentRpc, { p_payload: payload })
    ok = Boolean(result.ok && result.data && result.data.ok)
    attribution = result.data?.attribution ?? null
    created = Boolean(ok && result.data.deduped === false)
    if (!result.ok) console.warn(`intent: rpc_status_${result.status}`)
    // Observability: a click that carried an affiliate code but did NOT attribute
    // is a real miss — surface it at error level instead of failing silently.
    if (code && attribution && !['linked', 'already_linked'].includes(attribution)) {
      console.error(`intent: attribution_miss=${attribution} code=${code} reason=${result.data?.reason ?? ''}`)
    }
  } catch {
    console.warn('intent: rpc_network_error')
  }

  // Real-time heads-up to the team, but only when a NEW intent lead was created
  // (so repeated clicks in the same session/day don't spam). Best-effort.
  if (created) {
    const notify = await sendTeamNotification({
      subject: `New website ${channel} enquiry${code ? ` — affiliate ${code}` : ''}`,
      text: [
        `A visitor clicked ${channel} on the website.`,
        pagePath && `Page: ${pagePath}`,
        code && `Affiliate: ${code}`,
        'A lead was created in the CRM. Expect an inbound message; capture their details when they reach out.',
      ]
        .filter(Boolean)
        .join('\n'),
    })
    if (notify !== 'sent' && notify !== 'skipped_not_configured') console.warn(`intent: notify_${notify}`)
  }

  return json(res, 200, { ok, attribution })
}
