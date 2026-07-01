// GET /api/health — deployment health for the tracking layer.
//
// Tracking silently no-ops if SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not
// set on the deployment (a whole-environment single point of failure that is
// invisible to visitors). This endpoint makes that state observable so it can be
// monitored/alerted: 200 {ok:true} when configured, 503 {ok:false} when not.

import { isConfigured } from './_lib/server.js'

export default function handler(req, res) {
  const configured = isConfigured()
  res.status(configured ? 200 : 503).setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify({ ok: configured, service: 'rrai-website-tracking', configured }))
}
