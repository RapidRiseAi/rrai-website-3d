// POST /api/contact — server-side capture of the website contact form.
//
// Flow:
//   1. validate + sanitise the submission (mirrors the client-side rules);
//   2. hand a single jsonb payload to the `submit_website_lead` RPC, which (with
//      the service-role key) inserts the lead into the CRM `leads` table, links
//      affiliate attribution via the referral session id (reusing the existing
//      affiliate_portal_record_tracked_referral RPC), and de-duplicates on
//      submissionId via the form_submissions ledger — all in one SQL transaction;
//   3. best-effort team notification (never fails the request);
//   4. return a clean { ok } result. No raw DB error ever reaches the client; on
//      any failure the browser falls back to the existing mailto draft.
//
// Until SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set this returns 501 and the
// site behaves exactly as before.

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
} from './_lib/server.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'method_not_allowed' })
  if (!isConfigured()) return json(res, 501, { ok: false, error: 'not_configured' })

  const body = await readJsonBody(req)
  if (!body || typeof body !== 'object') return json(res, 400, { ok: false, error: 'bad_request' })

  // Validate the same minimums the form enforces client-side.
  const name = cleanString(body.name, 200)
  const email = cleanString(body.email, 320)
  const phone = cleanString(body.phone, 60)
  const service = cleanString(body.service, 120)
  const budget = cleanString(body.budget, 120)
  const details = cleanString(body.details, 5000)
  if (!name || (!email && !phone) || !service || !budget || !details) {
    return json(res, 422, { ok: false, error: 'validation_failed' })
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return json(res, 422, { ok: false, error: 'validation_failed' })
  }

  // Single jsonb contract — the CRM column mapping lives in SQL, not here.
  const payload = {
    submission_id: cleanString(body.submissionId, 80),
    lead: {
      name,
      business: cleanString(body.business, 200),
      email,
      phone,
      service,
      budget,
      timeline: cleanString(body.timeline, 120),
      website: cleanString(body.website, 300),
      preferred_contact: cleanString(body.preferredContact, 40),
      details,
    },
    affiliate: {
      code: cleanAffiliateCode(body.affiliateCode),
      session_id: cleanString(body.affiliateSessionId, 64),
      source: cleanString(body.affiliateSource, 40),
      captured_at: cleanString(body.affiliateCapturedAt, 40),
    },
    context: {
      page_path: cleanString(body.pagePath, 300),
      submitted_from: cleanString(body.submittedFrom, 500),
      visitor_token: visitorToken(req),
    },
  }

  let result
  try {
    result = await callRpc(env.leadRpc, { p_payload: payload })
  } catch {
    console.error('contact: rpc_network_error')
    return json(res, 502, { ok: false, error: 'capture_failed' })
  }

  if (!result.ok || !result.data || result.data.ok === false) {
    // Log a safe code only — never the raw PostgREST/DB error body.
    console.error(`contact: rpc_failed status=${result.status}`)
    return json(res, 502, { ok: false, error: 'capture_failed' })
  }

  // Best-effort notification; its failure must not undo the stored lead.
  const notifyStatus = await sendTeamNotification({
    subject: `New website enquiry: ${service} — ${name}`,
    text: [
      `Name: ${name}`,
      email && `Email: ${email}`,
      phone && `Phone: ${phone}`,
      `Service: ${service}`,
      `Budget: ${budget}`,
      payload.affiliate.code && `Affiliate: ${payload.affiliate.code}`,
      '',
      details,
    ]
      .filter(Boolean)
      .join('\n'),
  })
  if (notifyStatus !== 'sent' && notifyStatus !== 'skipped_not_configured') {
    console.warn(`contact: notify_${notifyStatus}`)
  }

  return json(res, 200, { ok: true, deduped: Boolean(result.data.deduped) })
}
