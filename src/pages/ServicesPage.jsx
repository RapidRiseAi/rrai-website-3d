import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import usePageMeta from '../hooks/usePageMeta'
import { FIXED_PRICE, CUSTOM_SERVICES } from '../data/services'
import { PRICING_DISCLAIMER } from '../data/serviceContent'

function ServiceCard({ service }) {
  return (
    <Link to={`/services/${service.slug}`} className="service-card">
      <div className="service-card-badge">{service.badge}</div>
      <div className="service-card-name">{service.name}</div>
      <div className="service-card-tagline">{service.tagline}</div>
    </Link>
  )
}

function PricingCard({ name, price, monthly, features, slug }) {
  return (
    <Link to={`/services/${slug}`} className="pricing-card">
      <div className="pricing-card-name">{name}</div>
      <div className="pricing-card-price">{price}</div>
      <div className="pricing-card-monthly">{monthly}</div>
      <ul className="pricing-card-features">
        {features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
      <div className="pricing-card-cta">See packages →</div>
    </Link>
  )
}

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
    features: ['Always-on answers', 'Trained on your business', 'Lead qualification', 'Human handover'],
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

export default function ServicesPage() {
  usePageMeta(
    'Services & Pricing | Rapid Rise AI',
    'Fixed-price websites, client portals, smart dashboards and AI agents, plus custom software, automations, integrations, IoT and marketing. All prices in ZAR.',
  )

  return (
    <PageLayout>
      <div className="services-hero">
        <p className="services-hero-eyebrow">What We Build</p>
        <h1 className="services-hero-h1">Services &amp;<br />Pricing</h1>
        <p className="services-hero-sub">
          Websites, portals, dashboards, AI agents, automations, integrations,
          IoT systems, and connected ecosystems. Fixed-price products for fast
          deployment, custom services for bespoke challenges.
        </p>
        <div className="pg-hero-actions">
          <Link className="pg-btn-primary" to="/contact">Start Your Project</Link>
          <Link className="pg-btn-ghost" to="/proof">View Proof</Link>
        </div>
      </div>

      <section className="services-section pricing-section" id="pricing">
        <div className="services-section-title">Fixed Price Products &amp; Pricing</div>
        <div className="pricing-grid">
          {PRICING.map(p => <PricingCard key={p.slug} {...p} />)}
        </div>
        <p className="services-pricing-note">
          All prices in ZAR. {PRICING_DISCLAIMER}
        </p>
      </section>

      <section className="services-section">
        <div className="services-section-title">Fixed Price Products</div>
        <div className="services-grid">
          {FIXED_PRICE.map(s => <ServiceCard key={s.slug} service={s} />)}
        </div>
      </section>

      <section className="services-section">
        <div className="services-section-title">Custom Services</div>
        <div className="services-grid">
          {CUSTOM_SERVICES.map(s => <ServiceCard key={s.slug} service={s} />)}
        </div>
        <p className="services-pricing-note">
          Custom development and consulting are quoted at R500/hour, or as a
          fixed project price once scope is clear. Third-party software fees,
          AI usage, WhatsApp and API usage, hardware, and hosting upgrades are
          separate unless included in a written proposal.
        </p>
      </section>

      <section className="services-section">
        <div className="services-section-title">Which service do you need first?</div>
        <div className="pg-grid" style={{ marginTop: 26 }}>
          {GUIDANCE.map((g) => (
            <div className="pg-card" key={g.title}>
              <h3 className="pg-card-title">{g.title}</h3>
              <p className="pg-card-text">{g.text}</p>
              <Link className="pg-card-link" to={g.to}>{g.label} →</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="services-section">
        <div className="pricing-custom-note">
          <span>Not sure where to start? Tell us about your business and we will recommend the right first step.</span>
          <Link className="btn-primary pricing-quote-btn" to="/contact">
            Start Your Project
            <svg className="btn-arrow" width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor"
                strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>
    </PageLayout>
  )
}
