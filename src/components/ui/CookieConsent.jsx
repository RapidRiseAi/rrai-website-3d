import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useConsent } from '../../context/ConsentContext'
import { CONSENT_CATEGORIES } from '../../utils/consent'
import './CookieConsent.css'

/* First-visit consent banner + a reusable preferences panel. The banner shows
   until a choice is made; the panel can be reopened any time from the footer's
   "Cookie preferences" link (which calls openPreferences()). */
export default function CookieConsent() {
  const {
    bannerOpen,
    prefsOpen,
    prefs,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    closePreferences,
  } = useConsent()

  if (!bannerOpen && !prefsOpen) return null

  return (
    <>
      {bannerOpen && !prefsOpen && (
        <CookieBanner
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onManage={openPreferences}
        />
      )}
      {prefsOpen && (
        <CookiePreferences
          initial={prefs}
          onSave={savePreferences}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCancel={closePreferences}
        />
      )}
    </>
  )
}

function CookieBanner({ onAcceptAll, onRejectAll, onManage }) {
  return (
    <div className="cc-banner" role="region" aria-label="Privacy and cookies">
      <div className="cc-banner-inner glass-card glass-card--bright">
        <div className="cc-banner-text">
          <p className="cc-banner-title">Your privacy</p>
          <p className="cc-banner-desc">
            We don’t use tracking cookies. We only store what’s essential to run
            this site and to remember this choice. You can optionally allow
            analytics or marketing to help us improve. Read our{' '}
            <Link to="/cookie-notice" className="cc-link">Cookie Notice</Link> and{' '}
            <Link to="/privacy-policy" className="cc-link">Privacy Policy</Link>.
          </p>
        </div>
        <div className="cc-banner-actions">
          <button type="button" className="cc-btn cc-btn--ghost" onClick={onRejectAll}>
            Reject all
          </button>
          <button type="button" className="cc-btn cc-btn--ghost" onClick={onManage}>
            Manage
          </button>
          <button type="button" className="cc-btn cc-btn--primary" onClick={onAcceptAll}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}

function CookiePreferences({ initial, onSave, onAcceptAll, onRejectAll, onCancel }) {
  const [local, setLocal] = useState(() => ({ ...initial }))

  // Close on Escape, like any modal dialog.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const toggle = (id) => setLocal((l) => ({ ...l, [id]: !l[id] }))

  return (
    <div className="cc-overlay" role="presentation" onClick={onCancel}>
      <div
        className="cc-modal glass-card glass-card--bright"
        role="dialog"
        aria-modal="true"
        aria-label="Privacy preferences"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="cc-modal-title">Privacy preferences</h2>
        <p className="cc-modal-intro">
          Choose what we’re allowed to load. Essential is always on because the
          site can’t run without it. Nothing optional loads unless you switch it on.
        </p>

        <ul className="cc-cat-list">
          {CONSENT_CATEGORIES.map((cat) => (
            <li key={cat.id} className="cc-cat">
              <div className="cc-cat-head">
                <span className="cc-cat-label">{cat.label}</span>
                <label className={`cc-switch ${cat.required ? 'cc-switch--locked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={cat.required ? true : !!local[cat.id]}
                    disabled={cat.required}
                    onChange={() => toggle(cat.id)}
                    aria-label={`${cat.label}${cat.required ? ' (always on)' : ''}`}
                  />
                  <span className="cc-switch-track" aria-hidden="true"><span className="cc-switch-thumb" /></span>
                </label>
              </div>
              <p className="cc-cat-desc">{cat.desc}</p>
            </li>
          ))}
        </ul>

        <div className="cc-modal-actions">
          <button type="button" className="cc-btn cc-btn--ghost" onClick={onRejectAll}>
            Reject all
          </button>
          <button type="button" className="cc-btn cc-btn--ghost" onClick={onAcceptAll}>
            Accept all
          </button>
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => onSave(local)}>
            Save preferences
          </button>
        </div>
      </div>
    </div>
  )
}
