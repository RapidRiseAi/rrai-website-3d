import { useRef, useLayoutEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import TiltCard from '../components/ui/TiltCard'
import Reveal from '../components/ui/Reveal'
import ServiceHeroObject from '../components/ui/ServiceHeroObject'
import usePageMeta from '../hooks/usePageMeta'
import { ALL_SERVICES } from '../data/services'
import {
  SERVICE_CONTENT,
  SERVICE_PROCESS,
  PRICING_DISCLAIMER,
} from '../data/serviceContent'
import './ServiceDetailPage.css'

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

/* Section-heading icons (24×24, round caps) */
const SecIco = {
  problem: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.2v.2" /></>,
  build: <><path d="M3.5 7.5 12 3l8.5 4.5L12 12 3.5 7.5z" /><path d="M3.5 12 12 16.5 20.5 12M3.5 16.5 12 21l8.5-4.5" /></>,
  pricing: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.2a2.3 2.3 0 0 1 2.5-1.6c1.5 0 2.3.8 2.3 1.9 0 2.5-4.8 1.5-4.8 4 0 1.1.9 1.9 2.5 1.9 1.3 0 2.1-.6 2.4-1.5" /></>,
  custom: <><path d="M14.5 6.5a2.6 2.6 0 0 1 3.5 3.5l-1.4 1.4M9.5 17.5a2.6 2.6 0 0 1-3.5-3.5l1.4-1.4" /><path d="m8.5 15.5 7-7" /></>,
  addons: <><path d="M12 5v14M5 12h14" /></>,
  process: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></>,
  deliver: <><path d="M4.5 7.5 12 3.5l7.5 4v9L12 20.5 4.5 16.5z" /><path d="M4.5 7.5 12 11.5l7.5-4M12 11.5V20.5" /></>,
  faq: <><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16.5H9l-4 3.5V7A1.5 1.5 0 0 1 6.5 5.5" /><path d="M9.6 9.4a2.4 2.4 0 0 1 4.6.9c0 1.6-2.2 1.7-2.2 3M12 14.6v.1" /></>,
}
function SecIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {SecIco[name] ?? SecIco.build}
    </svg>
  )
}

function PackageCard({ pkg, i = 0 }) {
  const featured = !!pkg.badge
  return (
    <Reveal className="sd2-pkg-rev" variant="up" delay={i * 0.07} amount={0.25}>
      <TiltCard
        className={`sd2-pkg glass-card${featured ? ' sd2-pkg--featured glass-card--bright' : ''}`}
        max={7}
      >
        {featured && <span className="sd2-pkg-badge tilt-pop-sm">{pkg.badge}</span>}
        <h3 className="sd2-pkg-name tilt-pop-sm">{pkg.name}</h3>
        <p className="sd2-pkg-price">{pkg.price}</p>
        <p className="sd2-pkg-monthly">{pkg.monthly}</p>
        {pkg.summary && <p className="sd2-pkg-summary">{pkg.summary}</p>}
        <ul className="sd2-pkg-features">
          {pkg.features.map((f) => (
            <li key={f}><CheckIcon />{f}</li>
          ))}
        </ul>
        {pkg.limits && (
          <div className="sd2-pkg-limits">
            <p className="sd2-pkg-limits-title">Plan limits</p>
            <ul>
              {pkg.limits.map((l) => <li key={l}>{l}</li>)}
            </ul>
          </div>
        )}
        <Link className="sd2-pkg-btn" to={`/contact?service=${encodeURIComponent(pkg.name)}`}>
          Start Your Project
          <ArrowIcon />
        </Link>
      </TiltCard>
    </Reveal>
  )
}

function SectionHead({ kicker, icon, title, lead }) {
  return (
    <Reveal className="sd2-head" variant="up">
      <span className="kicker">{kicker}</span>
      <h2 className="sd2-h2">
        {icon && <span className="sd2-h2-ic" aria-hidden="true"><SecIcon name={icon} /></span>}
        {title}
      </h2>
      {lead && <p className="sd2-lead">{lead}</p>}
    </Reveal>
  )
}

/* Before/after comparison. When the "With Rapid Rise AI" column would render
   more than 1.5× taller than the "usual way" column, its checklist flows into
   two columns to keep the block balanced instead of a tall single stack. */
function ProblemSolution({ content }) {
  const gridRef = useRef(null)
  const beforeRef = useRef(null)
  const afterRef = useRef(null)
  const listRef = useRef(null)

  useLayoutEffect(() => {
    const grid = gridRef.current
    const before = beforeRef.current
    const after = afterRef.current
    const list = listRef.current
    if (!grid || !before || !after || !list) return

    const measure = () => {
      // Decide from NATURAL heights: temporarily collapse to one column and
      // unstretch the grid (it uses align-items: stretch, which would otherwise
      // force both columns to equal height and hide the real difference).
      list.classList.remove('sd2-compare-list--2col')
      const prevAlign = grid.style.alignItems
      grid.style.alignItems = 'start'
      const ratio = after.offsetHeight / Math.max(1, before.offsetHeight)
      grid.style.alignItems = prevAlign
      list.classList.toggle('sd2-compare-list--2col', ratio > 1.5)
    }

    measure()
    window.addEventListener('resize', measure)
    // Re-measure once webfonts settle, since glyph metrics shift line counts.
    if (document.fonts?.ready) document.fonts.ready.then(measure).catch(() => {})
    return () => window.removeEventListener('resize', measure)
  }, [content])

  return (
    <Reveal variant="up" amount={0.2}>
      <div className="sd2-compare" ref={gridRef}>
        <div className="sd2-compare-col sd2-compare-col--before" ref={beforeRef}>
          <span className="sd2-compare-tag sd2-compare-tag--before">The usual way</span>
          {content.problem.map((p) => (
            <p className="sd2-compare-text" key={p.slice(0, 32)}>{p}</p>
          ))}
        </div>
        <div className="sd2-compare-arrow" aria-hidden="true"><ArrowIcon /></div>
        <div className="sd2-compare-col sd2-compare-col--after glass-card glass-card--bright" ref={afterRef}>
          <span className="sd2-compare-tag sd2-compare-tag--after">With Rapid Rise AI</span>
          <ul className="sd2-compare-list" ref={listRef}>
            {content.solution.map((s) => (
              <li key={s}><span className="sd2-compare-check" aria-hidden="true"><CheckIcon /></span>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
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
          <Link to="/services" className="pg-btn-ghost">View all services</Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="sd2-wrap">
        {/* Hero — full-bleed two-column: copy anchored left, live 3D object right */}
        <div className="service-detail-hero sd-hero">
          <div className="sd-hero-copy">
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

          <div className="sd-hero-visual" aria-hidden="true">
            <ServiceHeroObject slug={slug} />
          </div>
        </div>

        {/* Problem -> solution: a before/after comparison story */}
        <section className="sd2-section" aria-label="The problem we solve">
          <SectionHead
            kicker="The Challenge"
            icon="problem"
            title="The problem we solve"
            lead="See what changes when one connected system replaces the manual workarounds."
          />
          <ProblemSolution content={content} />
        </section>

        {/* Packages */}
        {content.packages && (
          <section className="sd2-section" aria-label="Packages and pricing">
            <SectionHead kicker="Pricing" icon="pricing" title="Packages and pricing" />
            <div className="sd2-pkg-grid">
              {content.packages.map((pkg, i) => <PackageCard key={pkg.name} pkg={pkg} i={i} />)}
            </div>
          </section>
        )}

        {/* Extra package groups (e.g. eCommerce) */}
        {content.packageGroups?.map((group) => (
          <section className="sd2-section" aria-label={group.title} key={group.title}>
            <SectionHead kicker="More Options" icon="pricing" title={group.title} lead={group.intro} />
            <div className="sd2-pkg-grid">
              {group.packages.map((pkg, i) => <PackageCard key={pkg.name} pkg={pkg} i={i} />)}
            </div>
          </section>
        ))}

        {/* Custom pricing block */}
        {content.customPricing && (
          <section className="sd2-section" aria-label="Pricing">
            <SectionHead kicker="Pricing" icon="custom" title="Pricing" />
            <Reveal variant="scale" amount={0.3}>
              <TiltCard className="sd2-custom glass-card glass-card--bright" max={6}>
                <ul className="sd2-custom-list">
                  {content.customPricing.lines.map((l) => (
                    <li key={l}><span className="sd2-custom-ic" aria-hidden="true"><CheckIcon /></span>{l}</li>
                  ))}
                </ul>
                <p className="sd2-fineprint">{content.customPricing.exclusions}</p>
              </TiltCard>
            </Reveal>
          </section>
        )}

        {/* Pricing disclaimer + usage notes */}
        <section className="sd2-section sd2-section--tight" aria-label="Pricing notes">
          <Reveal variant="up" amount={0.3}>
            <div className="sd2-notes">
              <p className="sd2-fineprint">{PRICING_DISCLAIMER}</p>
              {content.notes?.map((n) => (
                <p className="sd2-fineprint" key={n.slice(0, 32)}>{n}</p>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Add ons */}
        {content.addons && (
          <section className="sd2-section" aria-label="Add ons">
            <SectionHead kicker="Extras" icon="addons" title={content.addonsTitle ?? 'Add ons'} />
            <Reveal variant="up" amount={0.25}>
              <ul className="sd2-addons glass-card">
                {content.addons.map((a) => (
                  <li key={a.label}>
                    <span className="sd2-addon-label">{a.label}</span>
                    <span className="sd2-addon-dots" aria-hidden="true" />
                    <span className="sd2-addon-price">{a.price}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>
        )}

        {/* Process */}
        <section className="sd2-section" aria-label="How it works">
          <SectionHead kicker="The Journey" icon="process" title="How it works" />
          <div className="sd2-journey">
            <div className="sd2-rail" aria-hidden="true"><span className="sd2-rail-glow" /></div>
            <ol className="sd2-steps">
              {SERVICE_PROCESS.map((s, i) => (
                <li className="sd2-step" key={s.step}>
                  <Reveal className="sd2-step-rev" variant="up" delay={i * 0.06} amount={0.5}>
                    <TiltCard className="sd2-step-card glass-card" max={7}>
                      <span className="story-num sd2-step-num">{String(i + 1).padStart(2, '0')}</span>
                      <h3 className="sd2-step-title tilt-pop-sm">{s.step}</h3>
                      <p className="sd2-step-desc">{s.desc}</p>
                    </TiltCard>
                  </Reveal>
                  <span className="sd2-step-node" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
          <Reveal variant="up" amount={0.6}>
            <p className="sd2-process-link">
              Want the full picture? <Link className="sd2-inline-link" to="/process">See our complete process</Link>.
            </p>
          </Reveal>
        </section>

        {/* Deliverables */}
        <section className="sd2-section" aria-label="What you receive">
          <SectionHead kicker="The Outcome" icon="deliver" title="What you receive" />
          <Reveal variant="scale" amount={0.25}>
            <ul className="sd2-deliverables glass-card">
              {content.deliverables.map((d, i) => (
                <li key={d} style={{ '--sd2-d': `${i * 0.05}s` }}>
                  <span className="sd2-deliver-ic" aria-hidden="true"><CheckIcon /></span>
                  {d}
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* Final CTA (FAQ is moved below this so it doesn't add friction first) */}
        <section className="sd2-section" aria-label="Start your project">
          <Reveal variant="scale" amount={0.3}>
            <div className="sd2-final-cta glass-card glass-card--bright">
              <h2 className="sd2-final-title">Ready to get started?</h2>
              <p className="sd2-final-sub">
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
          </Reveal>
        </section>

        {/* FAQs — below the CTA */}
        <section className="sd2-section" aria-label="Frequently asked questions">
          <SectionHead kicker="Questions" icon="faq" title="Frequently asked questions" />
          <div className="sd2-faqs">
            {content.faqs.map((f, i) => (
              <Reveal key={f.q} variant="up" delay={i * 0.05} amount={0.4}>
                <details className="sd2-faq glass-card">
                  <summary>
                    <span className="sd2-faq-q">{f.q}</span>
                    <span className="sd2-faq-mark" aria-hidden="true" />
                  </summary>
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
