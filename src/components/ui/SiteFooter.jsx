import { Link } from 'react-router-dom'
import { LEGAL_NAV } from '../../data/legalContent'
import { useConsent } from '../../context/ConsentContext'

/* ── Footer link data ─────────────────────────────────────────────────────────
   Routes use real pages only (see App.jsx). Legal pages come from
   src/data/legalContent.js. LinkedIn and X are intentionally excluded until
   confirmed profile URLs exist; do not re-add guessed URLs. */

const SERVICE_LINKS = [
  { label: 'Custom Solutions',       to: '/services/software-development' },
  { label: 'AI Automations',         to: '/services/automated-workflow' },
  { label: 'System Integrations',    to: '/services/ecosystems' },
  { label: 'Dashboards & Analytics', to: '/services/smart-dashboards' },
  { label: 'Consulting',             to: '/services/ai-implementation' },
  { label: 'Website Development',    to: '/services/website-development' },
  { label: 'Client Portals',         to: '/services/client-portal' },
  { label: 'AI Communication Agents', to: '/services/ai-communication-agent' },
  { label: 'Marketing & SEO',        to: '/services/marketing-seo' },
]

const COMPANY_LINKS = [
  { label: 'About Us',     to: '/about' },
  { label: 'Our Process',  to: '/process' },
  { label: 'Case Studies', to: '/proof' },
  { label: 'Industries',   to: '/industries' },
  { label: 'Contact',      to: '/contact' },
]

const LEGAL_LINKS = LEGAL_NAV.map((d) => ({ label: d.label, to: `/${d.slug}` }))

/* ── Icons ──────────────────────────────────────────────────────────────────── */
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" stroke="none" />
  </svg>
)
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.5 2.5h-3a5 5 0 0 0-5 5v3h-3v4h3v7.5h4V14.5h3l1-4h-4v-3a1 1 0 0 1 1-1h3z" />
  </svg>
)
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21.5 7.2a2.8 2.8 0 0 0-2-2C17.8 4.8 12 4.8 12 4.8s-5.8 0-7.5.4a2.8 2.8 0 0 0-2 2A29.3 29.3 0 0 0 2.1 12a29.3 29.3 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.4 7.5.4 7.5.4s5.8 0 7.5-.4a2.8 2.8 0 0 0 2-2 29.3 29.3 0 0 0 .4-4.8 29.3 29.3 0 0 0-.4-4.8z" /><path d="m10 9.4 5 2.6-5 2.6z" fill="currentColor" stroke="none" />
  </svg>
)
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m2.5 7.5 9.5 6 9.5-6" />
  </svg>
)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3z" />
    <path d="M9 8.5c-.3 2.5 3.9 6.7 6.5 6.5l.9-1.6-2.2-1.2-.9.7c-.9-.3-2-1.4-2.3-2.3l.7-.9-1.2-2.1z" />
  </svg>
)
const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21.5s-7.5-6.1-7.5-11.4a7.5 7.5 0 0 1 15 0c0 5.3-7.5 11.4-7.5 11.4z" /><circle cx="12" cy="9.8" r="2.7" />
  </svg>
)

const SOCIALS = [
  { label: 'Rapid Rise AI on Instagram', href: 'https://www.instagram.com/rapidriseai?igsh=dXg4em5hcWN6anhr', Icon: InstagramIcon },
  { label: 'Rapid Rise AI on Facebook', href: 'https://www.facebook.com/share/1CYwJXCkGz/', Icon: FacebookIcon },
  { label: 'Rapid Rise AI on YouTube', href: 'https://youtube.com/@rapidriseai?si=6t1JV7xaCexZWF_S', Icon: YouTubeIcon },
  { label: 'Email Rapid Rise AI', href: 'mailto:team@rapidriseai.com', Icon: MailIcon },
]

function FooterLink({ link }) {
  return link.to ? (
    <Link className="ftr-link" to={link.to}>{link.label}</Link>
  ) : (
    <a className="ftr-link" href={link.href}>{link.label}</a>
  )
}

function LinkColumn({ heading, links }) {
  return (
    <nav className="ftr-col" aria-label={heading}>
      <p className="ftr-heading">{heading}</p>
      <ul className="ftr-list">
        {links.map((l) => <li key={l.label}><FooterLink link={l} /></li>)}
      </ul>
    </nav>
  )
}

export default function SiteFooter() {
  const { openPreferences } = useConsent()
  return (
    <footer className="ftr" aria-label="Site footer">
      <div className="ftr-container">
        <div className="ftr-grid">
          {/* Brand */}
          <div className="ftr-col ftr-col--brand">
            <div className="ftr-brand-head">
              <span className="ftr-logo" aria-hidden="true">RR</span>
              <p className="ftr-brand">Rapid Rise AI</p>
            </div>
            <p className="ftr-brand-desc">
              We build custom AI powered systems that automate, connect, and
              elevate how modern businesses operate.
            </p>
            <div className="ftr-socials">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  className="ftr-social"
                  href={href}
                  aria-label={label}
                  {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <LinkColumn heading="Services" links={SERVICE_LINKS} />
          <LinkColumn heading="Company" links={COMPANY_LINKS} />
          <LinkColumn heading="Legal" links={LEGAL_LINKS} />

          {/* Contact */}
          <div className="ftr-col" aria-label="Contact">
            <p className="ftr-heading">Contact</p>
            <ul className="ftr-list">
              <li>
                <a className="ftr-link ftr-link--icon" href="mailto:team@rapidriseai.com">
                  <MailIcon />
                  team@rapidriseai.com
                </a>
              </li>
              <li>
                <a
                  className="ftr-link ftr-link--icon"
                  href="https://wa.me/27649031234"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Message Rapid Rise AI on WhatsApp: 064 903 1234"
                >
                  <WhatsAppIcon />
                  064 903 1234
                </a>
              </li>
              <li>
                <span className="ftr-text ftr-text--loc">
                  <PinIcon />
                  South Africa
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom legal bar */}
        <div className="ftr-bar">
          <p className="ftr-bar-line">© 2026 Rapid Rise AI. All rights reserved.</p>
          <div className="ftr-bar-meta">
            <button type="button" className="ftr-bar-btn" onClick={openPreferences}>
              Cookie preferences
            </button>
            <span className="ftr-bar-note">Remote projects across South Africa.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
