import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import TiltCard from '../components/ui/TiltCard'
import Reveal from '../components/ui/Reveal'
import Parallax from '../components/ui/Parallax'
import usePageMeta from '../hooks/usePageMeta'
import './AboutPage.css'

/* ── Icons (24×24, round caps) ─────────────────────────────────────────────── */
const Ico = {
  network: <><circle cx="12" cy="5" r="2.1" /><circle cx="5" cy="18" r="2.1" /><circle cx="19" cy="18" r="2.1" /><path d="M12 7.1v3.4M11 12.2 6.4 16M13 12.2 17.6 16" /><circle cx="12" cy="12" r="1.6" /></>,
  target: <><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="1.1" /></>,
  bolt: <><path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z" /></>,
  trend: <><path d="M3.5 16.5 9 11l3.5 3.5L20.5 6.5" /><path d="M15.5 6.5h5v5" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.6-5.3-3.6-8.5S9.6 5.8 12 3.5z" /></>,
  portal: <><rect x="4" y="4" width="16" height="16" rx="2.2" /><path d="M4 9h16M8 4v16" /></>,
  dashboard: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M7 15v-3M11 15v-5M15 15v-2M19 15v-4" /></>,
  aiSpark: <><path d="M12 4.5 13.6 10 19 11.5 13.6 13 12 18.5 10.4 13 5 11.5 10.4 10z" /></>,
  page: <><path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5z" /><path d="M14 2.5V7.5h5M8.5 12h7M8.5 16h5" /></>,
  flow: <><circle cx="6" cy="6" r="2.1" /><circle cx="18" cy="8" r="2.1" /><circle cx="9" cy="18" r="2.1" /><path d="M7.8 7.3 16 7.9M7.5 16.1 8 7.9M10.8 17l5.4-7.2" /></>,
  code: <><path d="m8.5 7.5-4.5 4.5 4.5 4.5M15.5 7.5l4.5 4.5-4.5 4.5" /></>,
  link: <><path d="M9.5 14.5 14.5 9.5" /><path d="M8 11 6 13a3 3 0 0 0 4.2 4.2L12.5 15M16 13l2-2A3 3 0 0 0 13.8 6.8L11.5 9" /></>,
  iot: <><rect x="4" y="9" width="16" height="9" rx="2" /><path d="M8 9V6.5a4 4 0 0 1 8 0V9M9 13.5h.01M15 13.5h.01" /></>,
  seo: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6M9 11h4M11 9v4" /></>,
  tool: <><path d="M14.5 6.5a3.5 3.5 0 0 1-4.6 4.6L5 16l3 3 4.9-4.9a3.5 3.5 0 0 1 4.6-4.6l-2.2 2.2-1.8-1.8z" /></>,
  arrow: <><path d="M5 12h13M13 6.5 18.5 12 13 17.5" /></>,
}
function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Ico[name] ?? Ico.aiSpark}
    </svg>
  )
}

const DIFFERENTIATORS = [
  {
    icon: 'network',
    title: 'Ecosystems, not isolated tools',
    text: 'We do not only build single use websites or stand alone software. Everything we deliver is designed to connect: your website, portal, dashboard, AI agent, and automations work as one system.',
  },
  {
    icon: 'target',
    title: 'Built around your operation',
    text: 'We start with how your business actually runs: your client flow, your admin, your data, your tools. The system fits you, not the other way around.',
  },
  {
    icon: 'bolt',
    title: 'Practical outcomes first',
    text: 'Less manual admin, stronger client experience, better visibility, better follow up, and better lead capture. If a feature does not serve an outcome, it does not ship.',
  },
  {
    icon: 'trend',
    title: 'Start small, scale far',
    text: 'You can start with one website, dashboard, or automation, and grow it into a connected system over time. Nothing we build is a dead end.',
  },
]

const ECOSYSTEM_FLOW = [
  { icon: 'globe', title: 'Website', text: 'The front door: a fast, conversion focused site that captures leads instead of losing them.' },
  { icon: 'portal', title: 'Portal', text: 'Clients log in, share information, and self serve, turning email threads into structured flow.' },
  { icon: 'dashboard', title: 'Dashboard', text: 'One place to see the numbers that matter, instead of chasing people for reports.' },
  { icon: 'aiSpark', title: 'AI growth', text: 'Agents and automations handle follow up and admin, so the system grows without more headcount.' },
]

const WHAT_WE_BUILD = [
  { icon: 'page', label: 'Websites and landing pages' },
  { icon: 'portal', label: 'Client portals' },
  { icon: 'dashboard', label: 'Smart dashboards' },
  { icon: 'aiSpark', label: 'AI communication agents' },
  { icon: 'flow', label: 'Workflow automations' },
  { icon: 'code', label: 'Custom software and web apps' },
  { icon: 'link', label: 'System integrations' },
  { icon: 'iot', label: 'IoT, smart home, and workplace systems' },
  { icon: 'seo', label: 'SEO and marketing systems' },
  { icon: 'tool', label: 'Custom business tools' },
]

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function AboutPage() {
  usePageMeta(
    'About Us | Rapid Rise AI',
    'Learn how Rapid Rise AI builds connected websites, software, dashboards, AI agents, automations, IoT systems and digital ecosystems for businesses in South Africa.',
  )

  return (
    <PageLayout>
      <div className="pg-wrap abt-wrap">
        {/* Hero */}
        <header className="pg-hero">
          <Parallax className="depth-orb abt-orb abt-orb-1" speed={-50} aria-hidden="true" />
          <Parallax className="depth-orb abt-orb abt-orb-2" speed={70} aria-hidden="true" />
          <p className="pg-eyebrow">About Rapid Rise AI</p>
          <h1 className="pg-h1">We build digital ecosystems, not disconnected tools.</h1>
          <p className="pg-sub">
            Rapid Rise AI exists to help businesses move beyond scattered
            systems and manual work, with connected technology built around the
            way each business actually operates.
          </p>
          <div className="pg-hero-actions">
            <Link className="pg-btn-primary" to="/contact">Start Your Project</Link>
            <Link className="pg-btn-ghost" to="/proof">View Proof</Link>
          </div>
        </header>

        {/* Story — origin narrative on a connecting rail */}
        <section className="abt-section" aria-label="Our story">
          <Reveal className="abt-head" variant="up">
            <span className="kicker">Our Story</span>
            <h2 className="abt-h2">Why we exist</h2>
            <p className="abt-lead">
              Most businesses do not have a technology problem. They have a
              connection problem.
            </p>
          </Reveal>

          <div className="abt-story">
            <div className="abt-story-rail story-rail" aria-hidden="true" />
            <div className="abt-story-steps">
              <Reveal className="abt-story-step" variant="left" amount={0.4}>
                <span className="story-num abt-story-num">01</span>
                <span className="abt-story-dot" aria-hidden="true" />
                <p className="abt-body">
                  Most businesses do not have a technology problem. They have a
                  connection problem. The website does not talk to the CRM. The CRM
                  does not talk to the spreadsheet. Follow ups live in someone&rsquo;s
                  head, documents live in email threads, and reporting means chasing
                  people for numbers.
                </p>
              </Reveal>
              <Reveal className="abt-story-step" variant="left" amount={0.4} delay={0.07}>
                <span className="story-num abt-story-num">02</span>
                <span className="abt-story-dot" aria-hidden="true" />
                <p className="abt-body">
                  Rapid Rise AI was built from a simple belief: businesses should not
                  have to operate through scattered tools, manual follow ups,
                  disconnected spreadsheets, and systems that do not speak to each
                  other. We build connected digital ecosystems that fit the way a
                  business actually runs.
                </p>
              </Reveal>
              <Reveal className="abt-story-step" variant="left" amount={0.4} delay={0.14}>
                <span className="story-num abt-story-num">03</span>
                <span className="abt-story-dot" aria-hidden="true" />
                <p className="abt-body">
                  A client can start with a website, a portal, a dashboard, an AI
                  agent, an automation, an SEO project, an IoT device, or a custom
                  web app. Whatever the starting point, it is built so the next piece
                  connects to it. Over time, the pieces become one system.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Founder note — premium glass quote card */}
        <section className="abt-section" aria-label="Founder note">
          <Reveal className="abt-head" variant="up">
            <span className="kicker">From the Founder</span>
            <h2 className="abt-h2">A note from our founder</h2>
          </Reveal>
          <Reveal variant="scale" amount={0.4}>
            <TiltCard className="abt-quote glass-card glass-card--bright" max={6}>
              <span className="abt-quote-mark tilt-pop-sm" aria-hidden="true">&ldquo;</span>
              <blockquote className="abt-quote-text">
                Rapid Rise AI was created to help businesses move beyond
                scattered systems and manual work. We focus on practical
                technology that connects around the way your business actually
                operates, from your website and client communication to your
                dashboards, automations, AI agents, integrations, and smart
                systems. The goal is always the same: less admin, more clarity,
                and systems that grow with you.
              </blockquote>
              <div className="abt-quote-attr tilt-pop-sm">
                <span className="abt-quote-avatar" aria-hidden="true">XB</span>
                <span>
                  <span className="abt-quote-name">Xander Blumenthal</span>
                  <span className="abt-quote-role">Founder and CEO</span>
                </span>
              </div>
            </TiltCard>
          </Reveal>
        </section>

        {/* What makes us different */}
        <section className="abt-section" aria-label="What makes Rapid Rise AI different">
          <Reveal className="abt-head" variant="up">
            <span className="kicker">Our Difference</span>
            <h2 className="abt-h2">What makes us different</h2>
            <p className="abt-lead">
              Four principles shape every system we build, from the first
              conversation to long term growth.
            </p>
          </Reveal>
          <div className="abt-diff-grid">
            {DIFFERENTIATORS.map((d, i) => (
              <Reveal key={d.title} variant="up" delay={i * 0.07} amount={0.4}>
                <TiltCard className="abt-diff glass-card" max={8}>
                  <span className="story-num abt-diff-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="abt-diff-ic tilt-pop-sm"><Icon name={d.icon} /></span>
                  <h3 className="abt-diff-title tilt-pop-sm">{d.title}</h3>
                  <p className="abt-diff-text">{d.text}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Ecosystem approach — connected flow visual */}
        <section className="abt-section" aria-label="Our ecosystem approach">
          <Reveal className="abt-head" variant="up">
            <span className="kicker">The Ecosystem</span>
            <h2 className="abt-h2">Our ecosystem approach</h2>
            <p className="abt-lead">
              Every project starts with understanding, not code. We map how
              information moves through your business: where leads come from,
              where admin time goes, where data gets stuck. Then we design the
              smallest system that removes the biggest friction, and build it so
              it can grow.
            </p>
          </Reveal>

          <div className="abt-flow">
            {ECOSYSTEM_FLOW.map((node, i) => (
              <div className="abt-flow-item" key={node.title}>
                <Reveal variant="up" delay={i * 0.08} amount={0.5}>
                  <TiltCard className="abt-flow-node glass-card" max={9}>
                    <span className="abt-flow-step" aria-hidden="true">{`0${i + 1}`}</span>
                    <span className="abt-flow-ic tilt-pop-sm"><Icon name={node.icon} /></span>
                    <h3 className="abt-flow-title tilt-pop-sm">{node.title}</h3>
                    <p className="abt-flow-text">{node.text}</p>
                  </TiltCard>
                </Reveal>
                {i < ECOSYSTEM_FLOW.length - 1 && (
                  <span className="abt-flow-arrow" aria-hidden="true"><Icon name="arrow" /></span>
                )}
              </div>
            ))}
          </div>

          <Reveal variant="up" amount={0.6}>
            <p className="abt-flow-foot">
              That is why our clients rarely stop at one project. A website
              becomes a website with a portal. A portal gains a dashboard. The
              dashboard gains automations and an AI agent. Each step is useful on
              its own, and more useful together.
            </p>
            <p className="abt-flow-link">
              <Link className="sd-inline-link" to="/process">See exactly how we work →</Link>
            </p>
          </Reveal>
        </section>

        {/* What we build — glass chip / mini-tilt grid */}
        <section className="abt-section" aria-label="What we build">
          <Reveal className="abt-head" variant="up">
            <span className="kicker">Capabilities</span>
            <h2 className="abt-h2">What we build</h2>
            <p className="abt-lead">
              Each of these can stand alone, or connect into the wider ecosystem
              as your business grows.
            </p>
          </Reveal>
          <div className="abt-chip-grid">
            {WHAT_WE_BUILD.map((w, i) => (
              <Reveal key={w.label} variant="scale" delay={i * 0.04} amount={0.6}>
                <TiltCard className="abt-chip glass-card" max={10}>
                  <span className="abt-chip-ic tilt-pop-sm"><Icon name={w.icon} /></span>
                  <span className="abt-chip-label">{w.label}</span>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Long term value */}
        <section className="abt-section" aria-label="How we think about long term value">
          <Reveal className="abt-head" variant="up">
            <span className="kicker">Long Term Value</span>
            <h2 className="abt-h2">How we think about long term value</h2>
          </Reveal>
          <Reveal variant="scale" amount={0.4}>
            <TiltCard className="abt-value glass-card glass-card--bright" max={5}>
              <p className="abt-value-text">
                Software is not a once off purchase. It is infrastructure. We price
                transparently, publish our starting prices in ZAR, scope everything
                in writing, and build systems that are documented and maintainable.
                When we recommend something, it is because it serves your operation,
                not because it is the biggest project we could sell.
              </p>
            </TiltCard>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="abt-section" aria-label="Start your project">
          <Reveal variant="scale">
            <div className="abt-cta glass-card glass-card--bright">
              <h2 className="abt-cta-title">Let&rsquo;s build around your business</h2>
              <p className="abt-cta-sub">
                Tell us what slows your business down. We will recommend the
                smallest system that fixes it, and a path to grow from there.
              </p>
              <div className="abt-cta-actions">
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
