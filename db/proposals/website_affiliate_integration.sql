-- ============================================================================
--  Website ↔ Affiliate CRM integration — MIGRATION PROPOSAL
--  Project: RRAI-Internal-Tools (ref lakisdthcuejvazgsbxz)
--  Status:  APPLIED 2026-06-26 via Supabase MCP apply_migration
--           (migration name: website_affiliate_integration). Smoke-tested
--           end-to-end inside a rolled-back transaction (zero residue).
--           Confirmed choices: 30-day window; source='Website Contact Form';
--           company_name falls back to person's name; extra fields → pain_points.
-- ============================================================================
--
--  Built AFTER inspecting the live schema. It REUSES the existing CRM/portal
--  objects and adds nothing redundant:
--    • affiliates(tracking_code UNIQUE, status)              — existing
--    • affiliate_portal_referral_sessions(session_id UNIQUE) — existing
--    • affiliate_portal_click_events                          — existing
--    • affiliate_portal_lead_attributions / referrals         — existing
--    • affiliate_portal_record_tracked_referral(lead, session)— existing, reused
--    • leads (CRM destination)                                — existing
--    • form_submissions(submission_key UNIQUE, action)        — existing, reused
--                                                               as the idempotency ledger
--
--  It creates ONLY two website-facing functions (no new tables), mirroring the
--  portal's own conventions: SECURITY DEFINER + `SET search_path TO ''` + fully
--  qualified names. Execute is granted to service_role ONLY (the Vercel
--  serverless routes), and revoked from anon/authenticated/public — the public
--  browser never calls these directly.
--
--  Privacy: matches the portal's stance (it deliberately does not store IP /
--  user-agent fingerprints). No IP, UA, or device fingerprint is written here.
--
--  [CONFIRM] business choices, all easy to change before applying:
--    1. Attribution window = 30 days (per brief). NOTE: the one existing live
--       session has a ~90-day window — confirm which is correct.
--    2. leads.source = 'Website Contact Form' (free-text column; existing data
--       uses 'Referral'). Attribution is tracked separately, so source stays
--       descriptive of the channel.
--    3. leads.company_name falls back to the person's name when no business is
--       given (company_name is NOT NULL).
--    4. Extra brief fields (budget/timeline/website/preferred contact) are
--       folded into leads.pain_points (no dedicated columns exist).
-- ============================================================================

begin;

-- ── 1. Record a website referral click (from ?ref=<tracking_code>) ───────────
-- Looks up an ACTIVE affiliate by tracking_code, upserts the referral session
-- keyed by the website-generated session_id (uuid), and appends a click event.
-- Unknown/inactive codes return ok:false and write nothing (the visitor sees
-- nothing either way). Window/last-click are extended on repeat visits.
create or replace function public.record_website_referral_click(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_code        text := nullif(btrim(p_payload->>'code'), '');
  v_session_id  uuid;
  v_affiliate_id uuid;
  v_window      interval := interval '30 days';   -- [CONFIRM] window
begin
  begin
    v_session_id := nullif(btrim(p_payload->>'session_id'), '')::uuid;
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'bad_session');
  end;

  if v_code is null or v_session_id is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_input');
  end if;

  select id into v_affiliate_id
  from public.affiliates
  where tracking_code = v_code and status = 'ACTIVE';

  if v_affiliate_id is null then
    return jsonb_build_object('ok', false, 'reason', 'unknown_code');
  end if;

  insert into public.affiliate_portal_referral_sessions as sess
    (session_id, affiliate_id, first_click_at, last_click_at, attribution_expires_at)
  values
    (v_session_id, v_affiliate_id, now(), now(), now() + v_window)
  on conflict (session_id) do update
    set last_click_at          = now(),
        affiliate_id           = coalesce(sess.affiliate_id, excluded.affiliate_id),
        attribution_expires_at = greatest(sess.attribution_expires_at, excluded.attribution_expires_at),
        updated_at             = now();

  insert into public.affiliate_portal_click_events
    (session_id, affiliate_id, occurred_at, landing_page, referrer)
  values
    (v_session_id, v_affiliate_id, now(),
     left(nullif(btrim(p_payload->>'landing_page'), ''), 500),
     left(nullif(btrim(p_payload->>'referrer'), ''), 500));

  return jsonb_build_object('ok', true);
end;
$function$;

-- ── 2. Submit a website lead (idempotent) + attach affiliate attribution ─────
-- Inserts the contact-form lead into the CRM `leads` table. Idempotency uses the
-- existing form_submissions ledger (UNIQUE submission_key): a repeat submission_id
-- returns deduped=true and creates no second lead. If a valid referral session id
-- is supplied, the lead is linked via the EXISTING tracked-referral RPC; any
-- attribution failure (expired/invalid session, lead already referred) is
-- swallowed so the lead is still captured.
create or replace function public.submit_website_lead(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_lead     jsonb := coalesce(p_payload->'lead', '{}'::jsonb);
  v_sub      text  := nullif(btrim(p_payload->>'submission_id'), '');
  v_name     text  := nullif(btrim(v_lead->>'name'), '');
  v_business text  := nullif(btrim(v_lead->>'business'), '');
  v_service  text  := nullif(btrim(v_lead->>'service'), '');
  v_guard_id uuid;
  v_lead_id  uuid;
  v_session_id uuid;
begin
  if v_name is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_name');
  end if;

  -- Idempotency guard (atomic with the lead insert: a later failure rolls both
  -- back, so a retry can still succeed).
  if v_sub is not null then
    insert into public.form_submissions (submission_key, action)
    values (v_sub, 'website:lead')
    on conflict (submission_key) do nothing
    returning id into v_guard_id;

    if v_guard_id is null then
      return jsonb_build_object('ok', true, 'deduped', true);
    end if;
  end if;

  insert into public.leads
    (company_name, contact_name, email, phone, source, service_interest, stage, pain_points)
  values
    (coalesce(v_business, v_name),                                   -- [CONFIRM] company fallback
     v_name,
     nullif(btrim(v_lead->>'email'), ''),
     nullif(btrim(v_lead->>'phone'), ''),
     'Website Contact Form',                                         -- [CONFIRM] source
     coalesce(v_service, 'Not specified'),
     'NEW_LEAD',
     concat_ws(E'\n',
       nullif(btrim(v_lead->>'details'), ''),
       case when nullif(btrim(v_lead->>'budget'), '') is not null
            then 'Budget: ' || btrim(v_lead->>'budget') end,
       case when nullif(btrim(v_lead->>'timeline'), '') is not null
            then 'Timeline: ' || btrim(v_lead->>'timeline') end,
       case when nullif(btrim(v_lead->>'website'), '') is not null
            then 'Existing website: ' || btrim(v_lead->>'website') end,
       case when nullif(btrim(v_lead->>'preferred_contact'), '') is not null
            then 'Preferred contact: ' || btrim(v_lead->>'preferred_contact') end
     ))
  returning id into v_lead_id;

  -- Best-effort attribution — never fails the captured lead.
  begin
    v_session_id := nullif(p_payload #>> '{affiliate,session_id}', '')::uuid;
  exception when others then
    v_session_id := null;
  end;

  if v_session_id is not null then
    begin
      perform public.affiliate_portal_record_tracked_referral(v_lead_id, v_session_id);
    exception when others then
      null;  -- expired/invalid/duplicate session → lead stays, just un-attributed
    end;
  end if;

  return jsonb_build_object('ok', true, 'lead_id', v_lead_id, 'deduped', false);
end;
$function$;

-- ── 3. Grants: server-side (service_role) ONLY ──────────────────────────────
revoke all on function public.record_website_referral_click(jsonb) from public, anon, authenticated;
revoke all on function public.submit_website_lead(jsonb)          from public, anon, authenticated;
grant execute on function public.record_website_referral_click(jsonb) to service_role;
grant execute on function public.submit_website_lead(jsonb)          to service_role;

commit;

-- ============================================================================
--  After applying, set the Vercel env vars from .env.example:
--    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
--    WEBSITE_LEAD_RPC=submit_website_lead,
--    AFFILIATE_CLICK_RPC=record_website_referral_click,
--    VITE_CONTACT_API=/api/contact, VITE_TRACK_API=/api/track
--  Smoke test (safe, no schema change), then remove the test rows:
--    select public.record_website_referral_click(
--      jsonb_build_object('code','jakie-brakie-9c6480',
--        'session_id', gen_random_uuid()::text, 'landing_page','/','referrer',null));
-- ============================================================================
