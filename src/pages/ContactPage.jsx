import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import usePageMeta from '../hooks/usePageMeta'
import {
  submitContactRequest,
  CONTACT_EMAIL,
  WHATSAPP_URL,
  WHATSAPP_DISPLAY,
} from '../utils/contactSubmit'

const SERVICE_OPTIONS = [
  'Website Development',
  'Client Portal',
  'Smart Dashboard',
  'AI Communication Agent',
  'Software Development',
  'Web App Development',
  'Automated Workflow',
  'Connected Ecosystem',
  'AI Implementation',
  'IoT Development',
  'Marketing & SEO',
  'Not sure yet',
]

const BUDGET_OPTIONS = [
  'Under R2,500',
  'R2,500 to R7,500',
  'R7,500 to R15,000',
  'R15,000 to R30,000',
  'R30,000 to R60,000',
  'R60,000+',
  'I need guidance',
]

const TIMELINE_OPTIONS = [
  'As soon as possible',
  'This month',
  '1 to 3 months',
  '3+ months',
  'Exploring options',
]

/* Map a ?service= hint (service or package name) onto a dropdown option */
function matchService(hint) {
  if (!hint) return ''
  const h = hint.toLowerCase()
  const exact = SERVICE_OPTIONS.find((o) => o.toLowerCase() === h)
  if (exact) return exact
  const KEYWORDS = [
    ['ecom', 'Website Development'],
    ['website', 'Website Development'],
    ['portal', 'Client Portal'],
    ['dashboard', 'Smart Dashboard'],
    ['bi system', 'Smart Dashboard'],
    ['ai agent', 'AI Communication Agent'],
    ['ai communication', 'AI Communication Agent'],
    ['software', 'Software Development'],
    ['web app', 'Web App Development'],
    ['workflow', 'Automated Workflow'],
    ['ecosystem', 'Connected Ecosystem'],
    ['ai implementation', 'AI Implementation'],
    ['iot', 'IoT Development'],
    ['marketing', 'Marketing & SEO'],
    ['seo', 'Marketing & SEO'],
  ]
  for (const [kw, option] of KEYWORDS) if (h.includes(kw)) return option
  return ''
}

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3z" />
    <path d="M9 8.5c-.3 2.5 3.9 6.7 6.5 6.5l.9-1.6-2.2-1.2-.9.7c-.9-.3-2-1.4-2.3-2.3l.7-.9-1.2-2.1z" />
  </svg>
)
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m2.5 7.5 9.5 6 9.5-6" />
  </svg>
)
const FormIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="3" width="16" height="18" rx="2.5" /><path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 12.5l4.6 4.6L19.5 6.5" />
  </svg>
)

const INITIAL = {
  name: '',
  business: '',
  email: '',
  phone: '',
  service: '',
  budget: '',
  timeline: '',
  website: '',
  preferredContact: 'Email',
  details: '',
}

export default function ContactPage() {
  usePageMeta(
    'Start Your Project | Rapid Rise AI',
    'Start your project with Rapid Rise AI. Request a website, client portal, smart dashboard, AI agent, automation, software system, IoT solution or marketing support.',
  )

  const [params] = useSearchParams()
  const hinted = useMemo(() => matchService(params.get('service')), [params])
  const hintRaw = params.get('service')

  const [form, setForm] = useState(() => ({
    ...INITIAL,
    service: hinted,
    details: hintRaw && hintRaw !== hinted ? `Interested in: ${hintRaw}\n` : '',
  }))
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | drafted | sent | error

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined, contact: undefined }))
  }

  const validate = () => {
    const er = {}
    if (!form.name.trim()) er.name = 'Please add your name.'
    if (!form.email.trim() && !form.phone.trim())
      er.contact = 'Please add an email address or a phone/WhatsApp number so we can reply.'
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      er.email = 'That email address does not look right.'
    if (!form.service) er.service = 'Please choose the closest service, or pick "Not sure yet".'
    if (!form.budget) er.budget = 'Please choose a budget range, or pick "I need guidance".'
    if (!form.details.trim()) er.details = 'Tell us a little about what you want to build or improve.'
    return er
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length) return
    setStatus('submitting')
    try {
      const { delivered } = await submitContactRequest(form)
      setStatus(delivered ? 'sent' : 'drafted')
    } catch {
      setStatus('error')
    }
  }

  return (
    <PageLayout>
      <div className="pg-wrap">
        {/* Hero */}
        <header className="pg-hero">
          <p className="pg-eyebrow">Contact</p>
          <h1 className="pg-h1">Start Your Project</h1>
          <p className="pg-sub">
            Tell us what you want to build, improve, automate, or connect.
            We will review your request and recommend the best next step for
            your business.
          </p>
          <ul className="ct-trust" aria-label="What to expect">
            <li><CheckIcon />Free consultation</li>
            <li><CheckIcon />No pressure</li>
            <li><CheckIcon />Tailored recommendation</li>
          </ul>
          <div className="pg-hero-actions">
            <a className="pg-btn-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              <WhatsAppIcon />
              Message Us on WhatsApp
            </a>
            <a className="pg-btn-ghost" href={`mailto:${CONTACT_EMAIL}`}>Email {CONTACT_EMAIL}</a>
          </div>
        </header>

        {/* Contact method cards */}
        <section className="pg-section" aria-label="Ways to reach us">
          <div className="pg-grid">
            <div className="pg-card">
              <span className="pg-card-icon"><WhatsAppIcon /></span>
              <h2 className="pg-card-title">WhatsApp</h2>
              <p className="pg-card-text">
                The fastest way to reach us. Message {WHATSAPP_DISPLAY} and we
                will reply during business hours.
              </p>
              <a className="pg-card-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                Open WhatsApp →
              </a>
            </div>
            <div className="pg-card">
              <span className="pg-card-icon"><MailIcon /></span>
              <h2 className="pg-card-title">Email</h2>
              <p className="pg-card-text">
                Prefer writing it out? Email us directly and attach any
                documents, examples, or briefs.
              </p>
              <a className="pg-card-link" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL} →
              </a>
            </div>
            <div className="pg-card">
              <span className="pg-card-icon"><FormIcon /></span>
              <h2 className="pg-card-title">Project request form</h2>
              <p className="pg-card-text">
                The form below gives us everything we need to come back with a
                useful recommendation, not a generic reply.
              </p>
              <a className="pg-card-link" href="#project-form">Jump to the form →</a>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="pg-section" aria-label="Project request form" id="project-form">
          <h2 className="pg-h2">Tell us about your project</h2>
          <p className="pg-body">
            Fields marked * are required. Provide at least one contact method:
            email or phone/WhatsApp.
          </p>

          <form className="ct-form" onSubmit={onSubmit} noValidate>
            <div className="ct-row">
              <div className="ct-field">
                <label htmlFor="ct-name">Your name *</label>
                <input id="ct-name" type="text" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
                {errors.name && <p className="ct-error" role="alert">{errors.name}</p>}
              </div>
              <div className="ct-field">
                <label htmlFor="ct-business">Business name (optional)</label>
                <input id="ct-business" type="text" autoComplete="organization" value={form.business} onChange={set('business')} />
              </div>
            </div>

            <div className="ct-row">
              <div className="ct-field">
                <label htmlFor="ct-email">Email</label>
                <input id="ct-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={!!errors.email || !!errors.contact} />
                {errors.email && <p className="ct-error" role="alert">{errors.email}</p>}
              </div>
              <div className="ct-field">
                <label htmlFor="ct-phone">Phone / WhatsApp</label>
                <input id="ct-phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} aria-invalid={!!errors.contact} />
              </div>
            </div>
            {errors.contact && <p className="ct-error" role="alert">{errors.contact}</p>}

            <div className="ct-row">
              <div className="ct-field">
                <label htmlFor="ct-service">Service needed *</label>
                <select id="ct-service" value={form.service} onChange={set('service')} aria-invalid={!!errors.service}>
                  <option value="">Choose a service…</option>
                  {SERVICE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.service && <p className="ct-error" role="alert">{errors.service}</p>}
              </div>
              <div className="ct-field">
                <label htmlFor="ct-budget">Budget range *</label>
                <select id="ct-budget" value={form.budget} onChange={set('budget')} aria-invalid={!!errors.budget}>
                  <option value="">Choose a range…</option>
                  {BUDGET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.budget && <p className="ct-error" role="alert">{errors.budget}</p>}
              </div>
            </div>

            <div className="ct-row">
              <div className="ct-field">
                <label htmlFor="ct-timeline">Timeline</label>
                <select id="ct-timeline" value={form.timeline} onChange={set('timeline')}>
                  <option value="">Choose a timeline…</option>
                  {TIMELINE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="ct-field">
                <label htmlFor="ct-website">Existing website (optional)</label>
                <input id="ct-website" type="url" placeholder="https://" value={form.website} onChange={set('website')} />
              </div>
            </div>

            <div className="ct-field">
              <label htmlFor="ct-details">Project details *</label>
              <textarea
                id="ct-details"
                rows={6}
                placeholder="What do you want to build, improve, automate, or connect? What is slowing your business down today?"
                value={form.details}
                onChange={set('details')}
                aria-invalid={!!errors.details}
              />
              {errors.details && <p className="ct-error" role="alert">{errors.details}</p>}
            </div>

            <fieldset className="ct-field ct-radios">
              <legend>Preferred contact method</legend>
              {['Email', 'WhatsApp', 'Phone call'].map((m) => (
                <label key={m} className="ct-radio">
                  <input
                    type="radio"
                    name="preferredContact"
                    value={m}
                    checked={form.preferredContact === m}
                    onChange={set('preferredContact')}
                  />
                  {m}
                </label>
              ))}
            </fieldset>

            <p className="ct-filenote">
              Have plans, briefs, or screenshots? Attach files later by email or
              WhatsApp. We will reference your request.
            </p>

            <button className="pg-btn-primary ct-submit" type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Preparing…' : 'Send Project Request'}
            </button>

            <div aria-live="polite">
              {status === 'sent' && (
                <p className="ct-status ct-status--ok">
                  Request sent. We will get back to you within one business day.
                </p>
              )}
              {status === 'drafted' && (
                <p className="ct-status ct-status--ok">
                  We opened an email draft with your request. Press send in your
                  email app to deliver it. If the draft did not open, email{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or{' '}
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">message us on WhatsApp</a>.
                </p>
              )}
              {status === 'error' && (
                <p className="ct-status ct-status--err">
                  Something went wrong sending your request. Please email{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or{' '}
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">message us on WhatsApp</a>.
                </p>
              )}
            </div>
          </form>
        </section>

        {/* What happens next */}
        <section className="pg-section" aria-label="What happens after you submit">
          <h2 className="pg-h2">What happens next</h2>
          <div className="pg-grid">
            <div className="pg-card">
              <h3 className="pg-card-title">1. We review your request</h3>
              <p className="pg-card-text">
                A real person reads it, usually within one business day. No
                automated sales sequence.
              </p>
            </div>
            <div className="pg-card">
              <h3 className="pg-card-title">2. We ask the right questions</h3>
              <p className="pg-card-text">
                A short conversation on WhatsApp, email, or a call to understand
                your business and goals.
              </p>
            </div>
            <div className="pg-card">
              <h3 className="pg-card-title">3. You receive a recommendation</h3>
              <p className="pg-card-text">
                A clear suggested starting point with scope and pricing. You
                decide if and when to move ahead.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pg-section" aria-label="Frequently asked questions">
          <h2 className="pg-h2">Quick answers</h2>
          <div className="sd-faqs">
            <details className="sd-faq">
              <summary>Is the consultation really free?</summary>
              <p>
                Yes. The first conversation and recommendation cost nothing.
                You only pay if you approve a written quote and we start work.
              </p>
            </details>
            <details className="sd-faq">
              <summary>What if I do not know what I need?</summary>
              <p>
                That is normal. Pick "Not sure yet" in the form, describe the
                problem in your own words, and we will suggest options.
              </p>
            </details>
            <details className="sd-faq">
              <summary>How is pricing handled?</summary>
              <p>
                Fixed-price packages are published on each service page, in ZAR.
                Custom work is quoted at R500/hour or as a fixed project price
                after discovery. You always approve the scope in writing first.
              </p>
            </details>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
