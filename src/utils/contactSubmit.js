// ── Contact form submission ──────────────────────────────────────────────────
//
// The site is a static SPA with no backend yet, so by default the form opens a
// pre-filled email draft to team@rapidriseai.com (no fake "sent" confirmation).
//
// To switch to real automated submission later, paste a webhook URL below
// (Make.com, Zapier, n8n, a CRM endpoint, or a /api/contact serverless
// function). The form then POSTs JSON and shows a true success state.

const WEBHOOK_URL = ''

export const CONTACT_EMAIL = 'team@rapidriseai.com'
export const WHATSAPP_URL = 'https://wa.me/27649031234'
export const WHATSAPP_DISPLAY = '064 903 1234'

export async function submitContactRequest(data) {
  if (WEBHOOK_URL) {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, submittedFrom: window.location.href }),
    })
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`)
    return { delivered: true }
  }

  // Fallback: open a pre-filled email draft with the request content.
  const lines = [
    `Name: ${data.name}`,
    data.business && `Business: ${data.business}`,
    data.email && `Email: ${data.email}`,
    data.phone && `Phone / WhatsApp: ${data.phone}`,
    `Service needed: ${data.service}`,
    `Budget range: ${data.budget}`,
    `Timeline: ${data.timeline}`,
    data.website && `Existing website: ${data.website}`,
    `Preferred contact method: ${data.preferredContact}`,
    '',
    'Project details:',
    data.details,
  ].filter(Boolean)
  const subject = `Project request: ${data.service} (${data.name})`
  const href =
    `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(lines.join('\n'))}`
  window.location.href = href
  return { delivered: false }
}
