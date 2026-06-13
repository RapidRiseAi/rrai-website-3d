import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import usePageMeta from '../hooks/usePageMeta'

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 12.5l4.6 4.6L19.5 6.5" />
  </svg>
)

const DIFFERENTIATORS = [
  {
    title: 'Ecosystems, not isolated tools',
    text: 'We do not only build single-use websites or stand-alone software. Everything we deliver is designed to connect: your website, portal, dashboard, AI agent, and automations work as one system.',
  },
  {
    title: 'Built around your operation',
    text: 'We start with how your business actually runs: your client flow, your admin, your data, your tools. The system fits you, not the other way around.',
  },
  {
    title: 'Practical outcomes first',
    text: 'Less manual admin, stronger client experience, better visibility, better follow-up, and better lead capture. If a feature does not serve an outcome, it does not ship.',
  },
  {
    title: 'Start small, scale far',
    text: 'You can start with one website, dashboard, or automation, and grow it into a connected system over time. Nothing we build is a dead end.',
  },
]

const WHAT_WE_BUILD = [
  'Websites and landing pages',
  'Client portals',
  'Smart dashboards',
  'AI communication agents',
  'Workflow automations',
  'Custom software and web apps',
  'System integrations',
  'IoT, smart home, and workplace systems',
  'SEO and marketing systems',
  'Custom business tools',
]

export default function AboutPage() {
  usePageMeta(
    'About Us | Rapid Rise AI',
    'Learn how Rapid Rise AI builds connected websites, software, dashboards, AI agents, automations, IoT systems and digital ecosystems for businesses in South Africa.',
  )

  return (
    <PageLayout>
      <div className="pg-wrap">
        {/* Hero */}
        <header className="pg-hero">
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

        {/* Story */}
        <section className="pg-section" aria-label="Our story">
          <h2 className="pg-h2">Why we exist</h2>
          <p className="pg-body">
            Most businesses do not have a technology problem. They have a
            connection problem. The website does not talk to the CRM. The CRM
            does not talk to the spreadsheet. Follow-ups live in someone&rsquo;s
            head, documents live in email threads, and reporting means chasing
            people for numbers.
          </p>
          <p className="pg-body">
            Rapid Rise AI was built from a simple belief: businesses should not
            have to operate through scattered tools, manual follow-ups,
            disconnected spreadsheets, and systems that do not speak to each
            other. We build connected digital ecosystems that fit the way a
            business actually runs.
          </p>
          <p className="pg-body">
            A client can start with a website, a portal, a dashboard, an AI
            agent, an automation, an SEO project, an IoT device, or a custom
            web app. Whatever the starting point, it is built so the next piece
            connects to it. Over time, the pieces become one system.
          </p>
        </section>

        {/* Founder note */}
        <section className="pg-section" aria-label="Founder note">
          <h2 className="pg-h2">A note from our founder</h2>
          <div className="pg-card" style={{ maxWidth: 760 }}>
            <p className="pg-card-text" style={{ fontSize: '0.98rem', lineHeight: 1.75 }}>
              &ldquo;Rapid Rise AI was created to help businesses move beyond
              scattered systems and manual work. We focus on practical
              technology that connects around the way your business actually
              operates, from your website and client communication to your
              dashboards, automations, AI agents, integrations, and smart
              systems. The goal is always the same: less admin, more clarity,
              and systems that grow with you.&rdquo;
            </p>
            <p className="pg-card-text" style={{ marginTop: 14, fontWeight: 650, color: '#dbe9fb' }}>
              Xander Blumenthal, Founder and CEO
            </p>
          </div>
        </section>

        {/* What makes us different */}
        <section className="pg-section" aria-label="What makes Rapid Rise AI different">
          <h2 className="pg-h2">What makes us different</h2>
          <div className="pg-grid pg-grid--2">
            {DIFFERENTIATORS.map((d) => (
              <div className="pg-card" key={d.title}>
                <h3 className="pg-card-title">{d.title}</h3>
                <p className="pg-card-text">{d.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ecosystem approach */}
        <section className="pg-section" aria-label="Our ecosystem approach">
          <h2 className="pg-h2">Our ecosystem approach</h2>
          <p className="pg-body">
            Every project starts with understanding, not code. We map how
            information moves through your business: where leads come from,
            where admin time goes, where data gets stuck. Then we design the
            smallest system that removes the biggest friction, and build it so
            it can grow.
          </p>
          <p className="pg-body">
            That is why our clients rarely stop at one project. A website
            becomes a website with a portal. A portal gains a dashboard. The
            dashboard gains automations and an AI agent. Each step is useful on
            its own, and more useful together.
          </p>
          <p className="pg-body">
            <Link className="sd-inline-link" to="/process">See exactly how we work →</Link>
          </p>
        </section>

        {/* What we build */}
        <section className="pg-section" aria-label="What we build">
          <h2 className="pg-h2">What we build</h2>
          <div className="sd-chip-grid">
            {WHAT_WE_BUILD.map((w) => (
              <div className="sd-chip-card" key={w}><CheckIcon />{w}</div>
            ))}
          </div>
        </section>

        {/* Long-term value */}
        <section className="pg-section" aria-label="How we think about long-term value">
          <h2 className="pg-h2">How we think about long-term value</h2>
          <p className="pg-body">
            Software is not a once-off purchase. It is infrastructure. We price
            transparently, publish our starting prices in ZAR, scope everything
            in writing, and build systems that are documented and maintainable.
            When we recommend something, it is because it serves your operation,
            not because it is the biggest project we could sell.
          </p>
        </section>

        {/* CTA */}
        <section className="pg-section" aria-label="Start your project">
          <div className="pg-cta-panel">
            <h2 className="pg-cta-title">Let&rsquo;s build around your business</h2>
            <p className="pg-cta-sub">
              Tell us what slows your business down. We will recommend the
              smallest system that fixes it, and a path to grow from there.
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
