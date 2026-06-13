import { useParams, Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import usePageMeta from '../hooks/usePageMeta'
import { ALL_SERVICES, FIXED_PRICE } from '../data/services'
import {
  SERVICE_CONTENT,
  SERVICE_PROCESS,
  PRICING_DISCLAIMER,
} from '../data/serviceContent'

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 7.5h11M8 3l4.5 4.5L8 12" />
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 12.5l4.6 4.6L19.5 6.5" />
  </svg>
)

function PackageCard({ pkg }) {
  return (
    <article className={`sd-pkg${pkg.badge ? ' sd-pkg--featured' : ''}`}>
      {pkg.badge && <span className="sd-pkg-badge">{pkg.badge}</span>}
      <h3 className="sd-pkg-name">{pkg.name}</h3>
      <p className="sd-pkg-price">{pkg.price}</p>
      <p className="sd-pkg-monthly">{pkg.monthly}</p>
      {pkg.summary && <p className="sd-pkg-summary">{pkg.summary}</p>}
      <ul className="sd-pkg-features">
        {pkg.features.map((f) => (
          <li key={f}><CheckIcon />{f}</li>
        ))}
      </ul>
      {pkg.limits && (
        <div className="sd-pkg-limits">
          <p className="sd-pkg-limits-title">Plan limits</p>
          <ul>
            {pkg.limits.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>
      )}
      <Link className="sd-pkg-btn" to={`/contact?service=${encodeURIComponent(pkg.name)}`}>
        Start Your Project
        <ArrowIcon />
      </Link>
    </article>
  )
}

export default function ServiceDetailPage() {
  const { slug } = useParams()
  const service = ALL_SERVICES.find((s) => s.slug === slug)
  const content = SERVICE_CONTENT[slug]

  usePageMeta(
    service ? `${service.name} | Rapid Rise AI` : 'Service Not Found | Rapid Rise AI',
    service
      ? `${service.tagline} ${service.description}`
      : 'The service you are looking for does not exist.',
  )

  if (!service || !content) {
    return (
      <PageLayout>
        <div className="placeholder-page">
          <h1>Service Not Found</h1>
          <p>The service you are looking for does not exist.</p>
          <Link to="/services" className="service-detail-back">← Back to Services</Link>
        </div>
      </PageLayout>
    )
  }

  const isFixed = FIXED_PRICE.some((s) => s.slug === slug)

  return (
    <PageLayout>
      {/* Hero */}
      <div className="service-detail-hero sd-hero">
        <Link to="/services" className="service-detail-back">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All Services
        </Link>

        <div className="service-detail-badge">
          {isFixed ? 'Fixed Price Product' : 'Custom Service'}
        </div>

        <h1 className="service-detail-h1">{service.name}</h1>
        <p className="service-detail-tagline">{content.positioning}</p>
        <p className="service-detail-desc">{service.description}</p>

        <div className="sd-hero-actions">
          <Link className="sd-btn-primary" to={`/contact?service=${encodeURIComponent(service.name)}`}>
            Start Your Project
            <ArrowIcon />
          </Link>
          <Link className="sd-btn-ghost" to="/proof">View Proof</Link>
        </div>
      </div>

      {/* Problem */}
      <section className="sd-section" aria-label="The problem">
        <h2 className="sd-h2">The problem we solve</h2>
        {content.problem.map((p) => (
          <p className="sd-body" key={p.slice(0, 32)}>{p}</p>
        ))}
      </section>

      {/* What we build */}
      <section className="sd-section" aria-label="What we build">
        <h2 className="sd-h2">What we build</h2>
        <div className="sd-chip-grid">
          {content.solution.map((s) => (
            <div className="sd-chip-card" key={s}><CheckIcon />{s}</div>
          ))}
        </div>
      </section>

      {/* Packages */}
      {content.packages && (
        <section className="sd-section" aria-label="Packages and pricing">
          <h2 className="sd-h2">Packages and pricing</h2>
          <p className="sd-pricenote">All prices in ZAR.</p>
          <div className="sd-pkg-grid">
            {content.packages.map((pkg) => <PackageCard key={pkg.name} pkg={pkg} />)}
          </div>
        </section>
      )}

      {/* Extra package groups (e.g. eCommerce) */}
      {content.packageGroups?.map((group) => (
        <section className="sd-section" aria-label={group.title} key={group.title}>
          <h2 className="sd-h2">{group.title}</h2>
          {group.intro && <p className="sd-body">{group.intro}</p>}
          <div className="sd-pkg-grid">
            {group.packages.map((pkg) => <PackageCard key={pkg.name} pkg={pkg} />)}
          </div>
        </section>
      ))}

      {/* Custom pricing block */}
      {content.customPricing && (
        <section className="sd-section" aria-label="Pricing">
          <h2 className="sd-h2">Pricing</h2>
          <div className="sd-custom-pricing">
            <ul>
              {content.customPricing.lines.map((l) => (
                <li key={l}><CheckIcon />{l}</li>
              ))}
            </ul>
            <p className="sd-fineprint">{content.customPricing.exclusions}</p>
          </div>
        </section>
      )}

      {/* Pricing disclaimer + usage notes */}
      <section className="sd-section sd-section--tight" aria-label="Pricing notes">
        <p className="sd-fineprint">{PRICING_DISCLAIMER}</p>
        {content.notes?.map((n) => (
          <p className="sd-fineprint" key={n.slice(0, 32)}>{n}</p>
        ))}
      </section>

      {/* Add-ons */}
      {content.addons && (
        <section className="sd-section" aria-label="Add-ons">
          <h2 className="sd-h2">{content.addonsTitle ?? 'Add-ons'}</h2>
          <ul className="sd-addons">
            {content.addons.map((a) => (
              <li key={a.label}>
                <span className="sd-addon-label">{a.label}</span>
                <span className="sd-addon-dots" aria-hidden="true" />
                <span className="sd-addon-price">{a.price}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Process */}
      <section className="sd-section" aria-label="How it works">
        <h2 className="sd-h2">How it works</h2>
        <ol className="sd-steps">
          {SERVICE_PROCESS.map((s, i) => (
            <li className="sd-step" key={s.step}>
              <span className="sd-step-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="sd-step-title">{s.step}</h3>
                <p className="sd-step-desc">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="sd-body">
          Want the full picture? <Link className="sd-inline-link" to="/process">See our complete process</Link>.
        </p>
      </section>

      {/* Deliverables */}
      <section className="sd-section" aria-label="What you receive">
        <h2 className="sd-h2">What you receive</h2>
        <ul className="sd-deliverables">
          {content.deliverables.map((d) => (
            <li key={d}><CheckIcon />{d}</li>
          ))}
        </ul>
      </section>

      {/* FAQs */}
      <section className="sd-section" aria-label="Frequently asked questions">
        <h2 className="sd-h2">Frequently asked questions</h2>
        <div className="sd-faqs">
          {content.faqs.map((f) => (
            <details className="sd-faq" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="sd-section" aria-label="Start your project">
        <div className="sd-final-cta">
          <h2 className="sd-final-title">Ready to get started?</h2>
          <p className="sd-final-sub">
            Tell us what you want to build, improve, automate, or connect.
            We will recommend the best next step for your business.
          </p>
          <div className="sd-hero-actions">
            <Link className="sd-btn-primary" to={`/contact?service=${encodeURIComponent(service.name)}`}>
              Start Your Project
              <ArrowIcon />
            </Link>
            <a className="sd-btn-ghost" href="https://wa.me/27649031234" target="_blank" rel="noreferrer">
              Message Us on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
