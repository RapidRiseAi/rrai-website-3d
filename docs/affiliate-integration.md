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
?ref=CODE ─► affiliate.js (capture, 30d, +session uuid)
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
| [`db/proposals/website_affiliate_integration.sql`](../db/proposals/website_affiliate_integration.sql) | Migration: **two** SECURITY DEFINER RPCs reusing existing CRM tables. **NOT applied** — pending approval. |

## Enabling it

1. Review the migration, confirm the four `[CONFIRM]` business choices (attribution
   window, `leads.source`, company-name fallback, extra-fields mapping), then apply
   it with explicit approval (no new tables; two functions granted to `service_role`).
2. Set the env vars from [`.env.example`](../.env.example) in Vercel
   (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEBSITE_LEAD_RPC`,
   `AFFILIATE_CLICK_RPC`, and the `VITE_CONTACT_API` / `VITE_TRACK_API` paths).
   Server vars must **not** be prefixed `VITE_`.
3. Deploy. With the env vars set the form captures into the CRM; without them it
   falls back to the existing mailto draft (no behavioural change).

## Privacy

Matches the site's existing stance (self-hosted fonts, no third-party cookies) and
the CRM's own (its signatures table notes IP/UA fingerprints are intentionally not
stored): client-side we persist only the opaque affiliate code, a timestamp, the
source param, and a random session uuid. No PII, IP, or fingerprint — client or
server. The migration writes no IP/UA to `click_events` either.

## Decisions outstanding (before applying the migration)

- **CRM access** — RESOLVED. The CRM is `lakisdthcuejvazgsbxz` = "RRAI-Internal-Tools"
  (org `therandomneon@gmail.com's Org`); access granted via org invite + MCP reconnect.
- **Attribution window** — migration uses 30 days (per brief); the one existing live
  referral session has a ~90-day window. Confirm which is canonical.
- **`leads.source`** value (`'Website Contact Form'`), **company-name fallback** (person's
  name when no business given), and **extra-fields → `pain_points`** mapping — see the
  `[CONFIRM]` markers in the migration.
- **Affiliate code format** — `isValidAffiliateCode` accepts the live format
  (`jakie-brakie-9c6480`); tighten only if you want stricter pre-filtering.
