import { useEffect, useRef, useState } from 'react'
import { getStoredAffiliate, reportAffiliateIntent } from '../../utils/affiliate'

/**
 * Reliable "Email us" action. A bare mailto: link does nothing on machines with
 * no OS mail handler (common on desktop). This opens a small menu so every
 * visitor has a route that actually works — Gmail / Outlook web compose (open in
 * a new tab, guaranteed), the default mail app (mailto:), or copy the address.
 *
 * Every option fires the email contact-intent (so the lead + affiliate reference
 * are captured server-side) and pre-fills the message body with the affiliate
 * reference so the email itself carries attribution.
 */
const EMAIL = 'team@rapidriseai.com'

function composeParts() {
  const rec = getStoredAffiliate()
  const ref = rec?.code
    ? `— Please keep this reference so your referrer gets credited —\nRef: ${rec.code}${rec.trackingToken ? ` / ${rec.trackingToken}` : ''}`
    : ''
  const subject = 'Project enquiry'
  const body =
    `Hi Rapid Rise AI,\n\nI'd like to start a project. Here's what I have in mind:\n\n` +
    (ref ? `\n\n${ref}` : '')
  return { subject, body }
}

export default function EmailComposeButton({ className, children }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('click', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const go = (kind) => {
    const { subject, body } = composeParts()
    // Always record the intent (creates the CRM lead + affiliate attribution),
    // independent of whether a mail app actually opens.
    reportAffiliateIntent('email', `mailto:${EMAIL}`)
    const to = encodeURIComponent(EMAIL)
    const su = encodeURIComponent(subject)
    const bo = encodeURIComponent(body)
    if (kind === 'gmail') {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bo}`, '_blank', 'noopener')
      setOpen(false)
    } else if (kind === 'outlook') {
      window.open(`https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${su}&body=${bo}`, '_blank', 'noopener')
      setOpen(false)
    } else if (kind === 'mailto') {
      window.location.href = `mailto:${EMAIL}?subject=${su}&body=${bo}`
      setOpen(false)
    } else if (kind === 'copy') {
      try { navigator.clipboard?.writeText(EMAIL) } catch { /* ignore */ }
      setCopied(true)
      window.setTimeout(() => { setCopied(false); setOpen(false) }, 1200)
    }
  }

  const menuStyle = {
    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 60,
    display: 'flex', flexDirection: 'column', minWidth: '220px',
    background: '#07101d', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px', padding: '6px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  }
  const itemStyle = {
    textAlign: 'left', padding: '10px 12px', borderRadius: '10px',
    background: 'transparent', border: 0, color: '#e7eef8', font: 'inherit',
    cursor: 'pointer', width: '100%',
  }

  return (
    <span ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {children}
      </button>
      {open && (
        <div style={menuStyle} role="menu" aria-label="Choose how to email us">
          <button type="button" role="menuitem" style={itemStyle} onClick={() => go('gmail')}>Open in Gmail</button>
          <button type="button" role="menuitem" style={itemStyle} onClick={() => go('outlook')}>Open in Outlook</button>
          <button type="button" role="menuitem" style={itemStyle} onClick={() => go('mailto')}>Default mail app</button>
          <button type="button" role="menuitem" style={itemStyle} onClick={() => go('copy')}>
            {copied ? 'Copied ✓' : `Copy ${EMAIL}`}
          </button>
        </div>
      )}
    </span>
  )
}
