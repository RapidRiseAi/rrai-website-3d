# Affiliate tracking + Supabase form capture

How the website links to the affiliate portal, captures referral attribution, and
submits the contact form into the Supabase/CRM backend — **without** any UI
redesign. The only visible change is one nav link.

## Architecture (why it looks like this)

This site is a **static Vite + React SPA** (no Next.js, no server runtime in the
repo) deployed on **Vercel**. The security rules in the brief ("privileged DB
calls must be server-side", "service-role key server-only") therefore can't run in
the browser bundle. The server side lives in **Vercel serverless functions**
under [`/api`](../api), which is the only server context available without
deploying code into Supabase itself.

```
Browser (static SPA, anon only)                Vercel Functions (secrets)        Supabase CRM (RRAI-Internal-Tools)
─────────────────────────────                  ──────────────────────────        ─────────────────────────────────
?ref=CODE ─► affiliate.js (capture, 90d, +session uuid)
            └► AffiliateTracker ─ POST /api/track ─► record_website_referral_click(jsonb) ─► affiliates / referral_sessions / click_events
contact form ─ POST /api/contact ──────────────► submit_website_lead(jsonb) ─────────────► leads (+ form_submissions idempotency)
                                                 (+ optional Resend notification)              └► affiliate_portal_record_tracked_referral(lead, session)
                                                                                                  → referrals + lead_attributions
```

The browser never holds a Supabase key. Each function calls **one Postgres RPC**
with a single `jsonb` payload, so the JavaScript is decoupled from CRM column
names — the mapping lives in SQL. The migration reuses every existing CRM/portal
table and the existing `record_tracked_referral` RPC; it adds only the two
website-facing functions above (no new tables).

## Files

| File | Role |
| --- | --- |
| [`src/utils/affiliate.js`](../src/utils/affiliate.js) | Capture/validate/store referral code (localStorage, 30-day window); fire click report. |
| [`src/components/AffiliateTracker.jsx`](../src/components/AffiliateTracker.jsx) | Non-visual; runs capture on every route, mounted once in `App`. |
| [`src/components/ui/Navbar.jsx`](../src/components/ui/Navbar.jsx) | Adds the "Affiliate Program" link (desktop + mobile), new tab. |
| [`src/utils/contactSubmit.js`](../src/utils/contactSubmit.js) | Attaches attribution + idempotency key; POSTs to `/api/contact`, mailto fallback. |
| [`src/pages/ContactPage.jsx`](../src/pages/ContactPage.jsx) | Generates the per-enquiry idempotency key. |
| [`api/contact.js`](../api/contact.js) | Validates + inserts the lead via `submit_website_lead`; optional email. |
| [`api/track.js`](../api/track.js) | Records a referral click via `record_website_referral_click`. |
| [`api/_lib/server.js`](../api/_lib/server.js) | Server-only helpers (env, RPC call, sanitising, Resend). |
| [`db/proposals/website_affiliate_integration.sql`](../db/proposals/website_affiliate_integration.sql) | Historical reference for the website-facing SECURITY DEFINER RPCs. **Applied** (live). Canonical copy now lives in the owner repo's migrations — see [`db/README.md`](../db/README.md). |

## Status: live

The RPCs are applied and the integration is in production. Env vars are set in
Vercel (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEBSITE_LEAD_RPC`,
`AFFILIATE_CLICK_RPC`, `AFFILIATE_INTENT_RPC`, the `VITE_*_API` paths, and the
optional `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` for rate limiting).
Server vars must **not** be prefixed `VITE_`. Without the API vars the form falls
back to the mailto draft (no behavioural change).

## Privacy

Matches the site's existing stance (self-hosted fonts, no third-party cookies) and
the CRM's own (its signatures table notes IP/UA fingerprints are intentionally not
stored): client-side we persist only the opaque affiliate code, a timestamp, the
source param, and a random session uuid. No PII, IP, or fingerprint — client or
server. The migration writes no IP/UA to `click_events` either.

## Decisions (resolved)

- **CRM access** — `lakisdthcuejvazgsbxz` = "RRAI-Internal-Tools" (the shared
  Supabase project / migration owner).
- **Attribution window** — **90 days**, canonical across client + server. The
  website localStorage TTL now matches the server referral-session window.
- **`leads.source`**, **company-name fallback**, **extra-fields → `pain_points`**
  mapping — applied as in the live RPCs (`submit_website_lead`,
  `record_website_referral_intent`).
- **Affiliate code format** — `isValidAffiliateCode` accepts the live format
  (`jakie-brakie-9c6480`); tighten only if stricter pre-filtering is wanted.
