import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import usePageMeta from '../hooks/usePageMeta'

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 12.5l4.6 4.6L19.5 6.5" />
  </svg>
)

const STEPS = [
  {
    title: 'Discovery',
    desc: 'We understand the business: problems, goals, current tools, client flow, data flow, and budget. No tech talk required from your side.',
  },
  {
    title: 'System Mapping',
    desc: 'We map pages, workflows, automations, integrations, dashboards, user roles, and future upgrade paths, so every build fits the bigger picture.',
  },
  {
    title: 'Proposal and Scope',
    desc: 'You receive a written proposal defining the exact package, deliverables, support limits, timelines, pricing, exclusions, and add-ons. Nothing starts before you approve it.',
  },
  {
    title: 'UX and Visual Direction',
    desc: 'We create the page structure, user flow, interface direction, and key conversion points, matched to your brand.',
  },
  {
    title: 'Build and Integration',
    desc: 'We develop the website, portal, dashboard, AI agent, automation, IoT link, or custom system, and connect it to the tools you already use.',
  },
  {
    title: 'Testing and Refinement',
    desc: 'We test mobile, forms, links, integrations, workflows, content, speed, SEO structure, and edge cases before anything goes live.',
  },
  {
    title: 'Launch and Handover',
    desc: 'We connect domains, forms, analytics, and hosting, then hand over documentation and basic training so your team is comfortable.',
  },
  {
    title: 'Support and Growth',
    desc: 'We maintain, improve, monitor, and expand the system through monthly support or future phases as your business grows.',
  },
]

const CLIENT_PROVIDES = [
  'A clear picture of how your business currently runs',
  'Brand assets such as your logo and any existing materials',
  'Content, or content direction, for pages and answers',
  'Access to relevant accounts and tools where needed',
  'Feedback and approvals at the agreed checkpoints',
]

export default function ProcessPage() {
  usePageMeta(
    'Our Process | Rapid Rise AI',
    'See the Rapid Rise AI process for planning, designing, building, testing and launching custom websites, portals, dashboards, AI agents and business systems.',
  )

  return (
    <PageLayout>
      <div className="pg-wrap">
        {/* Hero */}
        <header className="pg-hero">
          <p className="pg-eyebrow">Our Process</p>
          <h1 className="pg-h1">A clear process for building systems that actually fit your business.</h1>
          <p className="pg-sub">
            No vague development phases and no surprises. Every project follows
            the same professional path from first conversation to long-term
            support.
          </p>
          <div className="pg-hero-actions">
            <Link className="pg-btn-primary" to="/contact">Start Your Project</Link>
            <Link className="pg-btn-ghost" to="/services">See Services and Pricing</Link>
          </div>
        </header>

        {/* Overview */}
        <section className="pg-section" aria-label="Process overview">
          <h2 className="pg-h2">How a project moves</h2>
          <p className="pg-body">
            Every engagement runs through eight steps. Small projects move
            through them in days, larger systems in phases, but the order never
            changes: understand first, map second, agree scope in writing,
            then build, test, launch, and support.
          </p>

          <ol className="tl">
            {STEPS.map((s, i) => (
              <li className="tl-step" key={s.title}>
                <span className="tl-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div className="tl-body">
                  <h3 className="tl-title">{s.title}</h3>
                  <p className="tl-desc">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* What clients provide */}
        <section className="pg-section" aria-label="What clients need to provide">
          <h2 className="pg-h2">What we need from you</h2>
          <p className="pg-body">
            You do not need technical knowledge. You need to know your business,
            and we handle the rest. Along the way we will ask for:
          </p>
          <ul className="sd-deliverables">
            {CLIENT_PROVIDES.map((c) => (
              <li key={c}><CheckIcon />{c}</li>
            ))}
          </ul>
        </section>

        {/* Scope and pricing */}
        <section className="pg-section" aria-label="How scope and pricing are handled">
          <h2 className="pg-h2">How scope and pricing are handled</h2>
          <p className="pg-body">
            Fixed-price packages have published starting prices in ZAR on every
            service page. Custom development and consulting are quoted at
            R500/hour, or as a fixed project price once scope is clear.
          </p>
          <p className="pg-body">
            Every project is confirmed in a written proposal that states the
            deliverables, timeline, pricing, support limits, and exclusions.
            Third-party costs such as software fees, AI usage, WhatsApp and API
            usage, payment provider fees, ads spend, hardware, and hosting
            upgrades are separate unless the proposal includes them in writing.
            If scope changes mid-project, we re-quote before doing the work,
            never after.
          </p>
        </section>

        {/* After launch */}
        <section className="pg-section" aria-label="What happens after launch">
          <h2 className="pg-h2">After launch</h2>
          <div className="pg-grid">
            <div className="pg-card">
              <h3 className="pg-card-title">Support and maintenance</h3>
              <p className="pg-card-text">
                Monthly plans cover hosting, backups, updates, and a support
                allowance, so the system stays healthy without you thinking
                about it.
              </p>
            </div>
            <div className="pg-card">
              <h3 className="pg-card-title">Improvements</h3>
              <p className="pg-card-text">
                Real usage always teaches something. We refine flows, copy, and
                features based on how clients and staff actually use the system.
              </p>
            </div>
            <div className="pg-card">
              <h3 className="pg-card-title">Growth phases</h3>
              <p className="pg-card-text">
                When you are ready, the next phase connects: a portal, a
                dashboard, an AI agent, or automations, building toward one
                ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pg-section" aria-label="Start your project">
          <div className="pg-cta-panel">
            <h2 className="pg-cta-title">Ready for step one?</h2>
            <p className="pg-cta-sub">
              Discovery is a conversation, not a commitment. Tell us about your
              business and we will map the best starting point.
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
