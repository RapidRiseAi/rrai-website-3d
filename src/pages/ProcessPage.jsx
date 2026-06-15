import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import TiltCard from '../components/ui/TiltCard'
import Reveal from '../components/ui/Reveal'
import Parallax from '../components/ui/Parallax'
import usePageMeta from '../hooks/usePageMeta'
import './ProcessPage.css'

/* ── Icons (24×24, round caps) ─────────────────────────────────────────────── */
const Ico = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" /></>,
  map: <><circle cx="6" cy="6" r="2.1" /><circle cx="18" cy="8" r="2.1" /><circle cx="9" cy="18" r="2.1" /><path d="M7.8 7.3 16 7.9M7.5 16.1 8 7.9M10.8 17l5.4-7.2" /></>,
  doc: <><path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5z" /><path d="M14 2.5V7.5h5M8.5 12h7M8.5 16h5" /></>,
  pen: <><path d="M12 19.5h8.5" /><path d="M16.7 4.3a2.1 2.1 0 0 1 3 3L8 19l-4 1 1-4z" /></>,
  code: <><path d="m8.5 7.5-4.5 4.5 4.5 4.5M15.5 7.5l4.5 4.5-4.5 4.5" /></>,
  shieldCheck: <><path d="M12 2.7 5 5.2v5.5c0 4.4 3 8.2 7 9.6 4-1.4 7-5.2 7-9.6V5.2z" /><path d="m9 11.5 2.2 2.2L15.5 9.4" /></>,
  rocket: <><path d="M5 14c-1.5 1.2-2 4.5-2 4.5s3.3-.5 4.5-2" /><path d="M14.5 4.5C9 7 7.5 12 7.5 12l4.5 4.5s5-1.5 7.5-7c1-2.2 1-4.5 1-4.5s-2.3 0-4.5 1z" /><circle cx="14.5" cy="9.5" r="1.4" /></>,
  growth: <><path d="M3.5 16.5 9 11l3.5 3.5L20.5 6.5" /><path d="M15.5 6.5h5v5" /></>,
  lifebuoy: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.4" /><path d="m6 6 3.6 3.6M14.4 14.4 18 18M18 6l-3.6 3.6M9.6 14.4 6 18" /></>,
  spark: <><path d="M12 4.5 13.6 10 19 11.5 13.6 13 12 18.5 10.4 13 5 11.5 10.4 10z" /></>,
  check: <><path d="M4.5 12.5l4.6 4.6L19.5 6.5" /></>,
  doc2: <><rect x="4.5" y="3" width="15" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  scale: <><path d="M12 3v18M7 7h10M7 7l-3 6a3 3 0 0 0 6 0zM17 7l-3 6a3 3 0 0 0 6 0z" /></>,
}
function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Ico[name] ?? Ico.spark}
    </svg>
  )
}

const STEPS = [
  { icon: 'search', title: 'Discovery', desc: 'We understand the business: problems, goals, current tools, client flow, data flow, and budget. No tech talk required from your side.' },
  { icon: 'map', title: 'System Mapping', desc: 'We map pages, workflows, automations, integrations, dashboards, user roles, and future upgrade paths, so every build fits the bigger picture.' },
  { icon: 'doc', title: 'Proposal and Scope', desc: 'You receive a written proposal defining the exact package, deliverables, support limits, timelines, pricing, exclusions, and add ons. Nothing starts before you approve it.' },
  { icon: 'pen', title: 'UX and Visual Direction', desc: 'We create the page structure, user flow, interface direction, and key conversion points, matched to your brand.' },
  { icon: 'code', title: 'Build and Integration', desc: 'We develop the website, portal, dashboard, AI agent, automation, IoT link, or custom system, and connect it to the tools you already use.' },
  { icon: 'shieldCheck', title: 'Testing and Refinement', desc: 'We test mobile, forms, links, integrations, workflows, content, speed, SEO structure, and edge cases before anything goes live.' },
  { icon: 'rocket', title: 'Launch and Handover', desc: 'We connect domains, forms, analytics, and hosting, then hand over documentation and basic training so your team is comfortable.' },
  { icon: 'lifebuoy', title: 'Support and Growth', desc: 'We maintain, improve, monitor, and expand the system through monthly support or future phases as your business grows.' },
]

const CLIENT_PROVIDES = [
  'A clear picture of how your business currently runs',
  'Brand assets such as your logo and any existing materials',
  'Content, or content direction, for pages and answers',
  'Access to relevant accounts and tools where needed',
  'Feedback and approvals at the agreed checkpoints',
]

const AFTER = [
  { icon: 'lifebuoy', title: 'Support and maintenance', text: 'Monthly plans cover hosting, backups, updates, and a support allowance, so the system stays healthy without you thinking about it.' },
  { icon: 'spark', title: 'Improvements', text: 'Real usage always teaches something. We refine flows, copy, and features based on how clients and staff actually use the system.' },
  { icon: 'growth', title: 'Growth phases', text: 'When you are ready, the next phase connects: a portal, a dashboard, an AI agent, or automations, building toward one ecosystem.' },
]

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

export default function ProcessPage() {
  usePageMeta(
    'Our Process | Rapid Rise AI',
    'See the Rapid Rise AI process for planning, designing, building, testing and launching custom websites, portals, dashboards, AI agents and business systems.',
  )

  return (
    <PageLayout>
      <div className="pg-wrap proc-wrap">
        {/* Hero */}
        <header className="pg-hero">
          <Parallax className="depth-orb proc-orb proc-orb-1" speed={-50} aria-hidden="true" />
          <Parallax className="depth-orb proc-orb proc-orb-2" speed={70} aria-hidden="true" />
          <p className="pg-eyebrow">Our Process</p>
          <h1 className="pg-h1">A clear path from first conversation to long term growth.</h1>
          <p className="pg-sub">
            No vague development phases and no surprises. Every project follows
            the same professional journey, and you always know which step you are on.
          </p>
          <div className="pg-hero-actions">
            <Link className="pg-btn-primary" to="/contact">Start Your Project</Link>
            <Link className="pg-btn-ghost" to="/services">See Services and Pricing</Link>
          </div>
        </header>

        {/* The journey */}
        <section className="proc-section">
          <Reveal className="proc-head" variant="up">
            <span className="kicker">The Journey</span>
            <h2 className="proc-h2">How a project moves</h2>
            <p className="proc-lead">
              Eight steps, always in the same order: understand first, map second,
              agree scope in writing, then build, test, launch, and support.
            </p>
          </Reveal>

          <div className="proc-journey">
            <div className="proc-rail" aria-hidden="true"><span className="proc-rail-glow" /></div>
            <ol className="proc-steps">
              {STEPS.map((s, i) => (
                <li className={`proc-step ${i % 2 ? 'proc-step--right' : 'proc-step--left'}`} key={s.title}>
                  <Reveal className="proc-step-rev" variant={i % 2 ? 'right' : 'left'} amount={0.4}>
                    <TiltCard className="proc-card glass-card" max={7}>
                      <span className="story-num proc-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="proc-ic tilt-pop-sm"><Icon name={s.icon} /></span>
                      <h3 className="proc-title tilt-pop-sm">{s.title}</h3>
                      <p className="proc-desc">{s.desc}</p>
                    </TiltCard>
                  </Reveal>
                  <span className="proc-node" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* What we need from you */}
        <section className="proc-section">
          <Reveal className="proc-head" variant="up">
            <span className="kicker">Your Part</span>
            <h2 className="proc-h2">What we need from you</h2>
            <p className="proc-lead">
              You do not need technical knowledge. You know your business, we handle
              the rest. Along the way we will ask for:
            </p>
          </Reveal>
          <div className="proc-need-grid">
            {CLIENT_PROVIDES.map((c, i) => (
              <Reveal key={c} variant="up" delay={i * 0.06} amount={0.5}>
                <div className="proc-need glass-card"><CheckIcon />{c}</div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Scope & pricing */}
        <section className="proc-section">
          <Reveal variant="scale">
            <div className="proc-panel glass-card glass-card--bright">
              <div className="proc-panel-head">
                <span className="kicker">No Surprises</span>
                <h2 className="proc-h2">Scope and pricing, always in writing</h2>
              </div>
              <div className="proc-panel-grid">
                <div>
                  <p className="proc-feature-label"><Icon name="doc2" />Transparent pricing</p>
                  <p className="proc-feature-text">
                    Fixed price packages have published starting prices in ZAR on
                    every service page. Custom development and consulting are quoted
                    at R500/hour, or as a fixed project price once scope is clear.
                  </p>
                </div>
                <div>
                  <p className="proc-feature-label"><Icon name="scale" />Confirmed before we start</p>
                  <p className="proc-feature-text">
                    Every project is confirmed in a written proposal stating
                    deliverables, timeline, pricing, support limits, and exclusions.
                    Third party costs are separate unless included in writing. If
                    scope changes, we requote before doing the work, never after.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* After launch */}
        <section className="proc-section">
          <Reveal className="proc-head" variant="up">
            <span className="kicker">After Launch</span>
            <h2 className="proc-h2">We do not disappear at launch</h2>
          </Reveal>
          <div className="proc-after-grid">
            {AFTER.map((a, i) => (
              <Reveal key={a.title} variant="up" delay={i * 0.08} amount={0.4}>
                <TiltCard className="proc-after glass-card" max={8}>
                  <span className="proc-after-ic tilt-pop-sm"><Icon name={a.icon} /></span>
                  <h3 className="tilt-pop-sm">{a.title}</h3>
                  <p>{a.text}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="proc-section">
          <Reveal variant="scale">
            <div className="proc-cta glass-card glass-card--bright">
              <h2>Ready for step one?</h2>
              <p>
                Discovery is a conversation, not a commitment. Tell us about your
                business and we will map the best starting point.
              </p>
              <div className="proc-cta-actions">
                <Link className="pg-btn-primary" to="/contact">Start Your Project <ArrowIcon /></Link>
                <a className="pg-btn-ghost" href="https://wa.me/27649031234" target="_blank" rel="noreferrer">
                  Message Us on WhatsApp
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </PageLayout>
  )
}
