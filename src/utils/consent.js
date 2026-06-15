// ── Cookie / tracker consent (POPIA + GDPR aligned) ──────────────────────────
//
// The site currently sets NO cookies and loads NO third-party trackers, so
// "essential" is the only active category. This module future-proofs that:
// any analytics or marketing script you add later MUST be gated behind
// hasConsent(...) and loaded only from applyConsent(), so consent is enforced
// in exactly one place rather than scattered across components.

export const CONSENT_KEY = 'rr-consent'

// Bump this when the categories or their meaning change — older stored consent
// is then treated as "not decided" and the banner re-appears for a fresh choice.
export const CONSENT_VERSION = 1

// Categories shown in the preferences panel. 'essential' is always on (it runs
// the site and remembers this very choice) and cannot be switched off.
export const CONSENT_CATEGORIES = [
  {
    id: 'essential',
    label: 'Essential',
    required: true,
    desc: 'Needed for the site to work and to remember your privacy choice. Never used to track you.',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    required: false,
    desc: 'Anonymous usage statistics that help us improve the site. Nothing is loaded unless you allow this.',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    required: false,
    desc: 'Lets us measure campaigns and show relevant ads. Nothing is loaded unless you allow this.',
  },
]

export const DEFAULT_PREFS = { essential: true, analytics: false, marketing: false }
export const ACCEPT_ALL_PREFS = { essential: true, analytics: true, marketing: true }

// localStorage can throw (private mode, disabled storage) — never let that crash
// the app. A null return just means "remember the choice for this session only".
function safeStorage() {
  try {
    const t = '__rr_probe__'
    window.localStorage.setItem(t, t)
    window.localStorage.removeItem(t)
    return window.localStorage
  } catch {
    return null
  }
}

// Returns { prefs, decidedAt } when a valid, current-version choice exists,
// otherwise null (meaning: ask the visitor).
export function readConsent() {
  const ls = safeStorage()
  if (!ls) return null
  try {
    const parsed = JSON.parse(ls.getItem(CONSENT_KEY) || 'null')
    if (!parsed || parsed.version !== CONSENT_VERSION) return null
    return {
      prefs: { ...DEFAULT_PREFS, ...parsed.prefs, essential: true },
      decidedAt: parsed.decidedAt,
    }
  } catch {
    return null
  }
}

// Persist a choice, then apply it. essential is forced true regardless of input.
export function writeConsent(prefs) {
  const clean = { ...DEFAULT_PREFS, ...prefs, essential: true }
  const record = {
    version: CONSENT_VERSION,
    prefs: clean,
    decidedAt: new Date().toISOString(),
  }
  const ls = safeStorage()
  if (ls) {
    try { ls.setItem(CONSENT_KEY, JSON.stringify(record)) } catch { /* session-only choice */ }
  }
  applyConsent(clean)
  return record
}

// Cheap, synchronous check for use right before loading a gated script.
export function hasConsent(category) {
  if (category === 'essential') return true
  const c = readConsent()
  return !!(c && c.prefs[category])
}

// The ONE place trackers are switched on. No-op today (nothing to load). When
// you add Google Analytics / a pixel later, load it HERE — only when the
// matching category is true — never directly inside a component.
export function applyConsent(prefs) {
  // if (prefs.analytics) loadAnalytics()
  // if (prefs.marketing) loadMarketingPixels()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rr-consent-change', { detail: prefs }))
  }
}
