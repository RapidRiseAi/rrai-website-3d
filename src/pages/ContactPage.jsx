import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import TiltCard from '../components/ui/TiltCard'
import Reveal from '../components/ui/Reveal'
import Parallax from '../components/ui/Parallax'
import usePageMeta from '../hooks/usePageMeta'
import ObjectSlot from '../components/scene/ObjectSlot'
import {
  submitContactRequest,
  CONTACT_EMAIL,
  WHATSAPP_URL,
  WHATSAPP_DISPLAY,
} from '../utils/contactSubmit'
import './ContactPage.css'

const SERVICE_OPTIONS = [
  'Website Development',
  'Client Portal',
  'Smart Dashboard',
  'AI Communication Agent',
  'Software Development',
  'Web App & App Development',
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
    ['web app', 'Web App & App Development'],
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
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
)

/* "What happens next" timeline icons */
const NextIco = {
  read: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" /></>,
  chat: <><path d="M4 5.5h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3.5V15H4a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1z" /><path d="M8 9.5h8M8 12.5h5" /></>,
  plan: <><rect x="4.5" y="3.5" width="15" height="17" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /><path d="m15.5 16.2 1.4 1.4 2.6-2.8" /></>,
}
function NextIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {NextIco[name]}
    </svg>
  )
}

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

  const METHODS = [
    {
      icon: <WhatsAppIcon />,
      title: 'WhatsApp',
      text: (
        <>The fastest way to reach us. Message {WHATSAPP_DISPLAY} and we will reply during business hours.</>
      ),
      link: { href: WHATSAPP_URL, label: 'Open WhatsApp', external: true },
    },
    {
      icon: <MailIcon />,
      title: 'Email',
      text: (
        <>Prefer writing it out? Email us directly and attach any documents, examples, or briefs.</>
      ),
      link: { href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_EMAIL, external: false },
    },
    {
      icon: <FormIcon />,
      title: 'Project request form',
      text: (
        <>The form below gives us everything we need to come back with a useful recommendation, not a generic reply.</>
      ),
      link: { href: '#project-form', label: 'Jump to the form', external: false },
    },
  ]

  const NEXT_STEPS = [
    {
      icon: 'read',
      title: 'We review your request',
      text: 'A real person reads it, usually within one business day. No automated sales sequence.',
    },
    {
      icon: 'chat',
      title: 'We ask the right questions',
      text: 'A short conversation on WhatsApp, email, or a call to understand your business and goals.',
    },
    {
      icon: 'plan',
      title: 'You receive a recommendation',
      text: 'A clear suggested starting point with scope and pricing. You decide if and when to move ahead.',
    },
  ]

  const FAQS = [
    {
      q: 'Is the consultation really free?',
      a: (
        <>Yes. The first conversation and recommendation cost nothing. You only pay if you approve a written quote and we start work.</>
      ),
    },
    {
      q: 'What if I do not know what I need?',
      a: (
        <>That is normal. Pick "Not sure yet" in the form, describe the problem in your own words, and we will suggest options.</>
      ),
    },
    {
      q: 'How is pricing handled?',
      a: (
        <>Fixed price packages are published on each service page, in ZAR. Custom work is quoted at R500/hour or as a fixed project price after discovery. You always approve the scope in writing first.</>
      ),
    },
  ]

  return (
    <PageLayout>
      <div className="pg-wrap ct2-wrap">
        {/* Hero */}
        <header className="pg-hero">
          <Parallax className="depth-orb ct2-orb ct2-orb-1" speed={-50} aria-hidden="true" />
          <Parallax className="depth-orb ct2-orb ct2-orb-2" speed={70} aria-hidden="true" />
          <ObjectSlot className="pg-hero-object" />
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
            {/* Mobile-only: jump straight to the request form (CSS hides it on desktop) */}
            <a
              className="pg-btn-ghost pg-btn--to-form"
              href="#project-form"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('project-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              Fill in the Form
            </a>
            <a className="pg-btn-ghost" href={`mailto:${CONTACT_EMAIL}`}>Email {CONTACT_EMAIL}</a>
          </div>
        </header>

        {/* Contact method cards */}
        <section className="ct2-section" aria-label="Ways to reach us">
          <Reveal className="ct2-head" variant="up">
            <span className="kicker">Reach Us</span>
            <h2 className="ct2-h2">Three ways to start the conversation</h2>
            <p className="ct2-lead">
              Pick whatever feels easiest. Every route lands with a real person,
              not a queue.
            </p>
          </Reveal>

          <div className="ct2-methods">
            {METHODS.map((m, i) => (
              <Reveal key={m.title} variant="up" delay={i * 0.07} amount={0.4}>
                <TiltCard className="ct2-card glass-card" max={8}>
                  <span className="ct2-card-ic tilt-pop-sm">{m.icon}</span>
                  <h3 className="ct2-card-title tilt-pop-sm">{m.title}</h3>
                  <p className="ct2-card-text">{m.text}</p>
                  {m.link.external ? (
                    <a className="ct2-card-link" href={m.link.href} target="_blank" rel="noreferrer">
                      {m.link.label} <ArrowIcon />
                    </a>
                  ) : (
                    <a className="ct2-card-link" href={m.link.href}>
                      {m.link.label} <ArrowIcon />
                    </a>
                  )}
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Form */}
        <section className="ct2-section" aria-label="Project request form" id="project-form">
          <Reveal className="ct2-head" variant="up">
            <span className="kicker">Project Brief</span>
            <h2 className="ct2-h2">Tell us about your project</h2>
            <p className="ct2-lead">
              Fields marked * are required. Provide at least one contact method:
              email or phone/WhatsApp.
            </p>
          </Reveal>

          <Reveal variant="scale" amount={0.15}>
            <div className="ct2-form-panel glass-card glass-card--bright">
              <form className="ct-form ct2-form" onSubmit={onSubmit} noValidate>
                <div className="ct2-fieldset">
                  <p className="ct2-group-label"><span>About you</span></p>
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
                </div>

                <div className="ct2-fieldset">
                  <p className="ct2-group-label"><span>About the project</span></p>
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
                </div>

                <p className="ct-filenote">
                  Have plans, briefs, or screenshots? Attach files later by email or
                  WhatsApp. We will reference your request.
                </p>

                <p className="ct-consent-note">
                  By sending this request you agree that we may use the details you
                  provide to respond to your enquiry, as described in our{' '}
                  <Link to="/privacy-policy" className="sd2-inline-link">Privacy Policy</Link>.
                  We never sell your information or use it for marketing without your
                  consent. You can ask us to access or delete your data at any time.
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
            </div>
          </Reveal>
        </section>

        {/* What happens next */}
        <section className="ct2-section" aria-label="What happens after you submit">
          <Reveal className="ct2-head" variant="up">
            <span className="kicker">After You Send</span>
            <h2 className="ct2-h2">What happens next</h2>
            <p className="ct2-lead">
              No black box. Here is exactly how your request moves once it
              reaches us.
            </p>
          </Reveal>

          <div className="ct2-next">
            <div className="ct2-next-rail" aria-hidden="true"><span className="ct2-next-rail-glow" /></div>
            <div className="ct2-next-grid">
              {NEXT_STEPS.map((s, i) => (
                <Reveal key={s.title} variant="up" delay={i * 0.08} amount={0.4}>
                  <TiltCard className="ct2-step glass-card" max={8}>
                    <span className="story-num ct2-step-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="ct2-step-ic tilt-pop-sm"><NextIcon name={s.icon} /></span>
                    <h3 className="ct2-step-title tilt-pop-sm">{s.title}</h3>
                    <p className="ct2-step-text">{s.text}</p>
                  </TiltCard>
                  <span className="ct2-next-node" aria-hidden="true" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="ct2-section" aria-label="Frequently asked questions">
          <Reveal className="ct2-head" variant="up">
            <span className="kicker">Quick Answers</span>
            <h2 className="ct2-h2">Questions before you start</h2>
          </Reveal>

          <div className="ct2-faqs sd-faqs">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} variant="up" delay={i * 0.06} amount={0.5}>
                <details className="ct2-faq sd-faq">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
