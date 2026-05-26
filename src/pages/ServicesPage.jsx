import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import { FIXED_PRICE, CUSTOM_SERVICES } from '../data/services'

function ServiceCard({ service }) {
  return (
    <Link to={`/services/${service.slug}`} className="service-card">
      <div className="service-card-badge">{service.badge}</div>
      <div className="service-card-name">{service.name}</div>
      <div className="service-card-tagline">{service.tagline}</div>
    </Link>
  )
}

function PricingCard({ name, price, features, slug }) {
  return (
    <Link to={`/services/${slug}`} className="pricing-card">
      <div className="pricing-card-name">{name}</div>
      <div className="pricing-card-price">{price}</div>
      <ul className="pricing-card-features">
        {features.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
      <div className="pricing-card-cta">Learn more →</div>
    </Link>
  )
}

const PRICING = [
  {
    slug: 'website-development',
    name: 'Website Development',
    price: 'Fixed Price',
    features: ['Custom design', 'Mobile responsive', 'SEO ready', 'CMS integration'],
  },
  {
    slug: 'client-portal',
    name: 'Client Portal',
    price: 'Fixed Price',
    features: ['Branded portal', 'Document sharing', 'Project tracking', 'Client messaging'],
  },
  {
    slug: 'smart-dashboards',
    name: 'Smart Dashboards',
    price: 'Fixed Price',
    features: ['Real-time data', 'Custom metrics', 'Multi-source', 'Role-based access'],
  },
  {
    slug: 'ai-communication-agent',
    name: 'AI Support Agent',
    price: 'Fixed Price',
    features: ['24/7 availability', 'Trained on your data', 'Lead qualification', 'Handoff to human'],
  },
]

export default function ServicesPage() {
  return (
    <PageLayout>
      <div className="services-hero">
        <p className="services-hero-eyebrow">What We Build</p>
        <h1 className="services-hero-h1">Services &amp;<br />Pricing</h1>
        <p className="services-hero-sub">
          Fixed-price products for fast deployment. Custom services for complex, bespoke challenges. Every engagement is built to last.
        </p>
      </div>

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
      </section>

      <section className="services-section pricing-section">
        <div className="services-section-title">Fixed Price Products — Pricing</div>
        <div className="pricing-grid">
          {PRICING.map(p => <PricingCard key={p.slug} {...p} />)}
        </div>
        <div className="pricing-custom-note">
          <span>Custom services are scoped and priced per project.</span>
          <button className="btn-primary pricing-quote-btn">
            Request a Quote
            <svg className="btn-arrow" width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor"
                strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </section>
    </PageLayout>
  )
}
