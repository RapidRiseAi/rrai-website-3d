import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import ConceptPreview from '../components/ui/ConceptPreview'
import usePageMeta from '../hooks/usePageMeta'
import { WORK_ITEMS } from '../data/workItems'

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 12.5l4.6 4.6L19.5 6.5" />
  </svg>
)

const CATEGORIES = [
  { title: 'Websites', text: 'Premium marketing sites and landing pages built to convert.' },
  { title: 'Portals', text: 'Private client areas for documents, status, and communication.' },
  { title: 'Dashboards', text: 'Live business data in one clear, decision-ready view.' },
  { title: 'AI Agents', text: 'Chat and WhatsApp assistants that answer, capture, and route.' },
  { title: 'Automations', text: 'Workflows that move information without manual steps.' },
  { title: 'Ecosystems', text: 'All of the above, connected into one scalable system.' },
]

const STANDARDS = [
  'Mobile-first layouts tested on real devices',
  'Fast loading and clean technical structure',
  'Accessible headings, labels, contrast, and focus states',
  'Honest labels: concept work is marked as concept work',
  'Written scope, transparent ZAR pricing, and documented handover',
  'Built to connect: every build has an upgrade path',
]

export default function ProofPage() {
  usePageMeta(
    'Proof of What We Can Build | Rapid Rise AI',
    'Explore Rapid Rise AI concept previews, demo builds and example systems across websites, client portals, smart dashboards, AI agents and connected business ecosystems.',
  )

  return (
    <PageLayout>
      <div className="pg-wrap">
        {/* Hero */}
        <header className="pg-hero">
          <p className="pg-eyebrow">Proof &amp; Builds</p>
          <h1 className="pg-h1">Proof of what we can build.</h1>
          <p className="pg-sub">
            Explore example systems, interface previews, and solution concepts
            that show how Rapid Rise AI connects websites, portals, dashboards,
            AI assistants, automations, and business tools into practical
            digital ecosystems.
          </p>
          <p className="pg-body" style={{ marginTop: 14, fontSize: '0.86rem', opacity: 0.8 }}>
            These are demo builds, prototypes, and concept previews. We label
            work honestly: nothing here is presented as a paid client project.
          </p>
          <div className="pg-hero-actions">
            <Link className="pg-btn-primary" to="/contact">Start Your Project</Link>
            <Link className="pg-btn-ghost" to="/services">See Services and Pricing</Link>
          </div>
        </header>

        {/* Featured concept previews */}
        <section className="pg-section" aria-label="Featured builds and concepts">
          <h2 className="pg-h2">Featured builds and concepts</h2>
          <div className="pf-grid">
            {WORK_ITEMS.map((item) => (
              <article className="pf-card" key={item.id} id={item.id}>
                <div className="pf-media">
                  <ConceptPreview kind={item.mockKind} label={item.mediaAlt} />
                  <span className="pf-status">{item.status}</span>
                </div>
                <div className="pf-body">
                  <h3 className="pf-title">{item.title}</h3>
                  <p className="pf-desc">{item.shortDescription}</p>
                  <div className="pf-tags">
                    {item.tags.slice(0, 3).map((t) => (
                      <span className="pf-tag" key={t}>{t}</span>
                    ))}
                  </div>
                  <Link className="pg-card-link" to={item.href}>
                    Explore this service →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="pg-section" aria-label="What we build">
          <h2 className="pg-h2">Work categories</h2>
          <div className="pg-grid">
            {CATEGORIES.map((c) => (
              <div className="pg-card" key={c.title}>
                <h3 className="pg-card-title">{c.title}</h3>
                <p className="pg-card-text">{c.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quality standards */}
        <section className="pg-section" aria-label="Quality standards">
          <h2 className="pg-h2">The standard every build meets</h2>
          <ul className="sd-deliverables">
            {STANDARDS.map((s) => (
              <li key={s}><CheckIcon />{s}</li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="pg-section" aria-label="Start your project">
          <div className="pg-cta-panel">
            <h2 className="pg-cta-title">Want something like this for your business?</h2>
            <p className="pg-cta-sub">
              Every system here started as one conversation about a real
              business problem. Tell us yours.
            </p>
            <div className="pg-cta-actions">
              <Link className="pg-btn-primary" to="/contact">Start Your Project</Link>
              <a className="pg-btn-ghost" href="https://wa.me/27649031234" target="_blank" rel="noreferrer">
                Message Us on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
