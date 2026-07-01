import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import TiltCard from '../components/ui/TiltCard'
import Reveal from '../components/ui/Reveal'
import Parallax from '../components/ui/Parallax'
import usePageMeta from '../hooks/usePageMeta'
import SwipeHint from '../components/ui/SwipeHint'
import { CUSTOM_SERVICES } from '../data/services'
import { PRICING_DISCLAIMER } from '../data/serviceContent'
import './ServicesPage.css'

/* ── Icons (24×24, round caps) ─────────────────────────────────────────────── */
const Ico = {
  window: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M3.5 9h17M7 6.7h.01M9.5 6.7h.01" /></>,
  portal: <><rect x="4" y="3.5" width="16" height="17" rx="2" /><path d="M9 8.5h6M9 12h6M9 15.5h3.5" /><circle cx="6.4" cy="8.5" r=".6" /><circle cx="6.4" cy="12" r=".6" /><circle cx="6.4" cy="15.5" r=".6" /></>,
  dashboard: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M7 16V11M12 16V8M17 16v-3" /></>,
  agent: <><path d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-7l-4 3v-3H5A1.5 1.5 0 0 1 3.5 14V8A1.5 1.5 0 0 1 5 6.5z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" /></>,
  software: <><path d="m8.5 7.5-4.5 4.5 4.5 4.5M15.5 7.5l4.5 4.5-4.5 4.5" /></>,
  app: <><rect x="6.5" y="2.8" width="11" height="18.4" rx="2.4" /><path d="M10.4 18.3h3.2" /></>,
  workflow: <><circle cx="6" cy="6" r="2.1" /><circle cx="18" cy="18" r="2.1" /><path d="M8 6.4h6.5A3.5 3.5 0 0 1 18 9.9v6.1M6 8v8" /></>,
  ecosystem: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="4.5" r="1.7" /><circle cx="5" cy="17" r="1.7" /><circle cx="19" cy="17" r="1.7" /><path d="M12 6.2v2.8M10 13.6l-3.4 2.3M14 13.6l3.4 2.3" /></>,
  ai: <><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" /><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3" /><circle cx="12" cy="12" r="1.7" /></>,
  iot: <><circle cx="12" cy="12" r="2.4" /><path d="M8 8a5.5 5.5 0 0 0 0 8M16 8a5.5 5.5 0 0 1 0 8M5.4 5.4a9 9 0 0 0 0 13.2M18.6 5.4a9 9 0 0 1 0 13.2" /></>,
  seo: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6M9 11l1.6 1.6L13.4 9.4" /></>,
  enquiry: <><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16V7A1.5 1.5 0 0 1 5 5.5z" /><path d="m4.5 7 7.5 5 7.5-5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.3V12l3.3 2" /></>,
  insight: <><path d="M3.5 16.5 9 11l3.5 3.5L20.5 6.5" /><path d="M15.5 6.5h5v5" /></>,
  chat: <><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-8l-4 3v-3H5A1.5 1.5 0 0 1 3.5 14V7A1.5 1.5 0 0 1 5 5.5z" /></>,
  link: <><path d="M10 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L11 7.5" /><path d="M14 10.5a3.5 3.5 0 0 0-5 0L6.5 13a3.5 3.5 0 0 0 5 5L13 16.5" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.8 10.6c.5.4.8 1 .8 1.6v.3h6v-.3c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z" /></>,
  spark: <><path d="M12 4.5 13.6 10 19 11.5 13.6 13 12 18.5 10.4 13 5 11.5 10.4 10z" /></>,
}
function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Ico[name] ?? Ico.spark}
    </svg>
  )
}

/* slug → icon map (covers fixed price, custom services and guidance targets) */
const ICON_FOR = {
  'website-development': 'window',
  'client-portal': 'portal',
  'smart-dashboards': 'dashboard',
  'ai-communication-agent': 'agent',
  'software-development': 'software',
  'web-app-development': 'app',
  'automated-workflow': 'workflow',
  ecosystems: 'ecosystem',
  'ai-implementation': 'ai',
  'iot-development': 'iot',
  'marketing-seo': 'seo',
}
const iconFor = (slug) => ICON_FOR[slug] ?? 'spark'

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 12.5l4.6 4.6L19.5 6.5" />
  </svg>
)
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* Per-guidance-row decorative icon (matches the symptom, not the service slug) */
const GUIDANCE_ICONS = ['enquiry', 'clock', 'insight', 'chat', 'link', 'bulb']
const MOBILE_CAROUSEL_QUERY = '(max-width: 760px)'
const MOBILE_CAROUSEL_RESET_DELAYS = [80, 260, 520]

const PRICING = [
  {
    slug: 'website-development',
    name: 'Website Development',
    price: 'From R2,000',
    monthly: '+ R200/month',
    features: ['Custom design', 'Mobile responsive', 'SEO ready', 'Lead capture'],
  },
  {
    slug: 'client-portal',
    name: 'Client Portals',
    price: 'From R3,000',
    monthly: '+ R500/month',
    features: ['Branded portal', 'Document collection', 'Status tracking', 'Admin dashboard'],
  },
  {
    slug: 'smart-dashboards',
    name: 'Smart Dashboards',
    price: 'From R3,000',
    monthly: '+ R400/month',
    features: ['Live business data', 'Custom metrics', 'Automated sync', 'Alerts and reports'],
  },
  {
    slug: 'ai-communication-agent',
    name: 'AI Communication Agents',
    price: 'From R1,000',
    monthly: '+ R200/month',
    features: ['Always on answers', 'Trained on your business', 'Lead qualification', 'Human handover'],
  },
]

const GUIDANCE = [
  {
    title: 'You need more enquiries',
    text: 'Start with a website or landing pages, then add SEO and tracking so the leads compound.',
    to: '/services/website-development',
    label: 'Website Development',
  },
  {
    title: 'Client admin is eating your time',
    text: 'Start with a client portal for documents and status, then automate the reminders.',
    to: '/services/client-portal',
    label: 'Client Portals',
  },
  {
    title: 'You cannot see your numbers',
    text: 'Start with a smart dashboard that pulls your scattered data into one live view.',
    to: '/services/smart-dashboards',
    label: 'Smart Dashboards',
  },
  {
    title: 'You answer the same questions all day',
    text: 'Start with an AI communication agent on your website or WhatsApp.',
    to: '/services/ai-communication-agent',
    label: 'AI Communication Agents',
  },
  {
    title: 'Your tools do not talk to each other',
    text: 'Start with automated workflows or a connected ecosystem plan.',
    to: '/services/ecosystems',
    label: 'Connected Ecosystems',
  },
  {
    title: 'You need something that does not exist yet',
    text: 'Custom software and web apps, scoped after a discovery conversation.',
    to: '/services/software-development',
    label: 'Software Development',
  },
]

/* ── Cards ─────────────────────────────────────────────────────────────────── */
function PricingCard({ name, price, monthly, features, slug }) {
  return (
    <Link to={`/services/${slug}`} className="svc-price-link" aria-label={`${name} packages`}>
      <TiltCard className="svc-price-card glass-card" max={8}>
        <span className="svc-price-ic tilt-pop-sm"><Icon name={iconFor(slug)} /></span>
        <h3 className="svc-price-name tilt-pop-sm">{name}</h3>
        <div className="svc-price-amount">
          <span className="svc-price-value">{price}</span>
          <span className="svc-price-monthly">{monthly}</span>
        </div>
        <ul className="svc-price-features">
          {features.map((f, i) => (
            <li key={i}><CheckIcon />{f}</li>
          ))}
        </ul>
        <span className="svc-price-cta">See packages <ArrowIcon /></span>
      </TiltCard>
    </Link>
  )
}

function ServiceCard({ service }) {
  return (
    <Link to={`/services/${service.slug}`} className="svc-service-link" aria-label={service.name}>
      <TiltCard className="svc-service-card glass-card" max={8}>
        <div className="svc-service-top">
          <span className="svc-service-ic tilt-pop-sm"><Icon name={iconFor(service.slug)} /></span>
          <span className="svc-service-badge">{service.badge}</span>
        </div>
        <h3 className="svc-service-name tilt-pop-sm">{service.name}</h3>
        <p className="svc-service-tagline">{service.tagline}</p>
        <span className="svc-service-cta">Explore <ArrowIcon /></span>
      </TiltCard>
    </Link>
  )
}

function useResetMobileCarousels() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(MOBILE_CAROUSEL_QUERY)
    const timers = new Set()
    let frame = 0

    const reset = () => {
      if (!media.matches) return
      document
        .querySelectorAll('.svc-price-grid, .svc-grid, .svc-guide-grid')
        .forEach((row) => {
          row.scrollLeft = 0
        })
    }

    const scheduleReset = () => {
      cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
      frame = requestAnimationFrame(reset)
      MOBILE_CAROUSEL_RESET_DELAYS.forEach((delay) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer)
          reset()
        }, delay)
        timers.add(timer)
      })
    }

    scheduleReset()
    window.addEventListener('pageshow', scheduleReset)
    window.addEventListener('resize', scheduleReset)
    if (media.addEventListener) media.addEventListener('change', scheduleReset)
    else media.addListener(scheduleReset)

    return () => {
      cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener('pageshow', scheduleReset)
      window.removeEventListener('resize', scheduleReset)
      if (media.removeEventListener) media.removeEventListener('change', scheduleReset)
      else media.removeListener(scheduleReset)
    }
  }, [])
}

export default function ServicesPage() {
  useResetMobileCarousels()
  usePageMeta(
    'Services & Pricing | Rapid Rise AI',
    'Fixed price websites, client portals, smart dashboards and AI agents, plus custom software, automations, integrations, IoT and marketing. All prices in ZAR.',
  )

  return (
    <PageLayout>
      <div className="pg-wrap svc-wrap">
        {/* Hero */}
        <header className="pg-hero">
          <Parallax className="depth-orb svc-orb svc-orb-1" speed={-50} aria-hidden="true" />
          <Parallax className="depth-orb svc-orb svc-orb-2" speed={70} aria-hidden="true" />
          <p className="pg-eyebrow">What We Build</p>
          <h1 className="pg-h1">Services &amp; Pricing</h1>
          <p className="pg-sub">
            Websites, portals, dashboards, AI agents, automations, integrations,
            IoT systems, and connected ecosystems. Fixed price products for fast
            deployment, custom services for bespoke challenges.
          </p>
          <div className="pg-hero-actions">
            <Link className="pg-btn-primary" to="/contact">Start Your Project</Link>
            <Link className="pg-btn-ghost" to="/proof">View Proof</Link>
          </div>
        </header>

        {/* Fixed price pricing */}
        <section className="svc-section" id="pricing">
          <Reveal className="svc-head" variant="up">
            <p className="svc-eyebrow">Fixed Price Products</p>
            <h2 className="svc-h2">Published prices, ready to deploy</h2>
            <p className="svc-lead">
              Four core products with starting prices in ZAR and a clear monthly,
              so you know what to budget before we even talk.
            </p>
          </Reveal>

          <div className="svc-price-grid">
            {PRICING.map((p, i) => (
              <Reveal key={p.slug} variant="up" delay={i * 0.07} amount={0.35} instantOnMobile>
                <PricingCard {...p} />
              </Reveal>
            ))}
          </div>
          <SwipeHint />

          <Reveal variant="up" amount={0.6}>
            <p className="svc-note">{PRICING_DISCLAIMER}</p>
          </Reveal>
        </section>

        {/* Custom services */}
        <section className="svc-section">
          <Reveal className="svc-head" variant="up">
            <p className="svc-eyebrow">Bespoke Builds</p>
            <h2 className="svc-h2">Custom Services</h2>
            <p className="svc-lead">
              When the problem is bigger than a template. Scoped after a discovery
              conversation, then quoted in writing.
            </p>
          </Reveal>
          <div className="svc-grid">
            {CUSTOM_SERVICES.map((s, i) => (
              <Reveal key={s.slug} variant="up" delay={i * 0.06} amount={0.3} instantOnMobile>
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </div>
          <SwipeHint />
          <Reveal variant="up" amount={0.6}>
            <p className="svc-note">
              Custom development and consulting are quoted at R500/hour, or as a
              fixed project price once scope is clear. Third party software fees,
              AI usage, WhatsApp and API usage, hardware, and hosting upgrades are
              separate unless included in a written proposal.
            </p>
          </Reveal>
        </section>

        {/* Guidance */}
        <section className="svc-section">
          <Reveal className="svc-head" variant="up">
            <p className="svc-eyebrow">Start Here</p>
            <h2 className="svc-h2">Which service do you need first?</h2>
            <p className="svc-lead">
              Match the bottleneck you feel today to the right first step, then
              grow from there.
            </p>
          </Reveal>
          <div className="svc-guide-grid">
            {GUIDANCE.map((g, i) => (
              <Reveal key={g.title} variant="up" delay={i * 0.06} amount={0.3} instantOnMobile>
                <TiltCard className="svc-guide-card glass-card" max={7}>
                  <span className="svc-guide-ic tilt-pop-sm"><Icon name={GUIDANCE_ICONS[i % GUIDANCE_ICONS.length]} /></span>
                  <h3 className="svc-guide-title tilt-pop-sm">{g.title}</h3>
                  <p className="svc-guide-text">{g.text}</p>
                  <Link className="svc-guide-link" to={g.to}>{g.label} <ArrowIcon /></Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>
          <SwipeHint />
        </section>

        {/* CTA */}
        <section className="svc-section">
          <Reveal variant="scale">
            <div className="svc-cta glass-card glass-card--bright">
              <div className="svc-cta-text">
                <p className="svc-eyebrow">Not Sure Yet?</p>
                <h2>Tell us about your business</h2>
                <p>
                  Not sure where to start? Tell us about your business and we
                  will recommend the right first step.
                </p>
              </div>
              <div className="svc-cta-actions">
                <Link className="pg-btn-primary" to="/contact">Start Your Project <ArrowIcon /></Link>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </PageLayout>
  )
}
