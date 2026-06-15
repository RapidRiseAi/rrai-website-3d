import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageLayout from '../components/ui/PageLayout'
import Reveal from '../components/ui/Reveal'
import usePageMeta from '../hooks/usePageMeta'
import './IndustriesPage.css'

/* ── Sector icons (24×24, fill none, round caps) ──────────────────────────── */
const Ico = {
  hospitality: <><path d="M3.5 20.5h17" /><path d="M5 20.5v-7.5h11v7.5" /><path d="M5 13V9.5a3.5 3.5 0 0 1 3.5-3.5H16v7" /><path d="M16 11h2.5A1.5 1.5 0 0 1 20 12.5V20.5" /><path d="M8.5 13v-2" /></>,
  services: <><path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5z" /><path d="M14 2.5V7.5h5" /><path d="M8.5 12.5h7M8.5 16h5" /></>,
  realestate: <><path d="M4 10.5 12 4l8 6.5" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></>,
  retail: <><path d="M5.5 8h13l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></>,
  construction: <><path d="M3 11.5 12 7l9 4.5" /><path d="M12 7V3.5" /><path d="M6 13v6.5M18 13v6.5M12 9v10.5" /><path d="M4.5 20.5h15" /></>,
  medical: <><path d="M12 4.5v15M4.5 12h15" /><circle cx="12" cy="12" r="8.5" /></>,
  smarthome: <><path d="M4 11.5 12 5l8 6.5" /><path d="M6.5 10V19h11V10" /><path d="M10 14.5a2 2 0 0 1 4 0" /><path d="M12 13v-0.01" /></>,
  operations: <><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.5M12 18v2.5M3.5 12H6M18 12h2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></>,
  spark: <><path d="M12 4.5 13.6 10 19 11.5 13.6 13 12 18.5 10.4 13 5 11.5 10.4 10z" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2 5.5-5 2 2-5.5z" /></>,
}
function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Ico[name] ?? Ico.spark}
    </svg>
  )
}
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const INDUSTRIES = [
  {
    icon: 'hospitality',
    title: 'Hospitality and Accommodation',
    problem: 'Guests ask the same questions all day, bookings arrive on every channel, and upsells get missed.',
    solution: 'AI concierge and booking support, guest request handling, WhatsApp support, digital menus, upsell flows, and management dashboards.',
    ecosystem: 'Website with booking enquiries, a WhatsApp AI agent for guests, a digital menu, and a dashboard tracking requests and occupancy signals.',
  },
  {
    icon: 'services',
    title: 'Professional Services',
    problem: 'Legal, accounting, and consulting firms drown in document chasing, status questions, and email admin.',
    solution: 'Document intake, client portals, automated reminders, status tracking, and AI support for common questions.',
    ecosystem: 'A client portal for documents and status, reminder automations for outstanding items, and a dashboard showing every matter at a glance.',
  },
  {
    icon: 'realestate',
    title: 'Real Estate and Property',
    problem: 'Leads go cold while agents are on viewings, and follow ups depend on memory.',
    solution: 'Lead qualification, viewing request flows, property dashboards, automated follow ups, and structured client communication.',
    ecosystem: 'A website capturing qualified leads, an AI agent answering listing questions, follow up automations, and a pipeline dashboard.',
  },
  {
    icon: 'retail',
    title: 'Retail and eCommerce',
    problem: 'Stock, orders, support, and marketing live in separate tools that never agree with each other.',
    solution: 'Online stores, inventory visibility, product pages, payment flows, customer support agents, and marketing tracking.',
    ecosystem: 'An online store connected to inventory, an AI support agent for order questions, and a sales dashboard with marketing attribution.',
  },
  {
    icon: 'construction',
    title: 'Construction, Inspections and Field Teams',
    problem: 'Jobs, photos, reports, and client updates scatter across phones, paper, and chat groups.',
    solution: 'Job tracking, inspection systems, photo and report uploads, client updates, and operations dashboards.',
    ecosystem: 'A field inspection app feeding a job dashboard, automated client updates, and report generation from site data.',
  },
  {
    icon: 'medical',
    title: 'Medical and Appointment Based Practices',
    problem: 'Front desks juggle appointment requests, intake forms, and reminders while phones keep ringing.',
    solution: 'Appointment request flows, digital intake forms, reminder automations, FAQs, and internal routing. We build admin systems, not medical advice.',
    ecosystem: 'A website with appointment requests, automated reminders and intake forms, and an internal dashboard for the front desk.',
  },
  {
    icon: 'smarthome',
    title: 'Smart Homes and Smart Workplaces',
    problem: 'Devices and environments generate information that never reaches the people who need it.',
    solution: 'IoT devices, smart environments, device dashboards, alerts, and custom integrations.',
    ecosystem: 'Connected sensors and devices feeding a live dashboard, with alerts and automation triggers built around your environment.',
  },
  {
    icon: 'operations',
    title: 'Operations Heavy Businesses',
    problem: 'Management cannot see what is happening without chasing people for spreadsheets.',
    solution: 'Dashboards, staff tracking, workflow automation, reporting, and internal tools.',
    ecosystem: 'Internal tools where work happens, automations that move information, and a management dashboard with the full picture.',
  },
]

const EASE = [0.16, 1, 0.3, 1]

/* Interactive sector explorer: a vertical rail selects the active sector; the
   stage on the right morphs in 3D to reveal that sector's playbook. */
function SectorExplorer() {
  const [active, setActive] = useState(0)
  const s = INDUSTRIES[active]
  const select = (i) => setActive(i)

  return (
    <div className="ind-explorer">
      <ul className="ind-rail" role="tablist" aria-label="Industries">
        {INDUSTRIES.map((ind, i) => (
          <li key={ind.title} role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`ind-rail-btn${i === active ? ' is-active' : ''}`}
              onMouseEnter={() => select(i)}
              onFocus={() => select(i)}
              onClick={() => select(i)}
            >
              <span className="ind-rail-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="ind-rail-ic"><Icon name={ind.icon} /></span>
              <span className="ind-rail-title">{ind.title}</span>
              <span className="ind-rail-arrow" aria-hidden="true"><ArrowIcon /></span>
            </button>
          </li>
        ))}
      </ul>

      <div className="ind-stage glass-card glass-card--bright">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="ind-stage-inner"
            initial={{ opacity: 0, x: 44, rotateY: 7 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -28, rotateY: -6 }}
            transition={{ duration: 0.42, ease: EASE }}
            style={{ transformPerspective: 1100 }}
          >
            <div className="ind-stage-head">
              <span className="ind-stage-ic"><Icon name={s.icon} /></span>
              <span className="ind-stage-count">{String(active + 1).padStart(2, '0')} / {String(INDUSTRIES.length).padStart(2, '0')}</span>
            </div>
            <h3 className="ind-stage-title">{s.title}</h3>
            <div className="ind-stage-facets">
              <div className="ind-stage-facet">
                <span className="ind-facet-label">Common problem</span>
                <p className="ind-facet-text">{s.problem}</p>
              </div>
              <div className="ind-stage-facet">
                <span className="ind-facet-label ind-facet-label--build">What we build</span>
                <p className="ind-facet-text">{s.solution}</p>
              </div>
              <div className="ind-stage-facet">
                <span className="ind-facet-label ind-facet-label--eco">Example ecosystem</span>
                <p className="ind-facet-text">{s.ecosystem}</p>
              </div>
            </div>
            <Link className="ind-stage-link" to={`/contact?service=${encodeURIComponent(s.title)}`}>
              Discuss your {s.title.split(' ')[0].toLowerCase()} project <ArrowIcon />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function IndustriesPage() {
  usePageMeta(
    'Industries | Rapid Rise AI',
    'Rapid Rise AI builds custom digital systems for hospitality, professional services, retail, property, operations, smart environments and other South African businesses.',
  )

  return (
    <PageLayout>
      <div className="pg-wrap ind-wrap">
        {/* Hero */}
        <header className="pg-hero">
          <p className="pg-eyebrow">Industries</p>
          <h1 className="pg-h1">Systems built around the way your industry operates.</h1>
          <p className="pg-sub">
            The tools differ, but the pattern is the same: connect the website,
            communication, admin, and data into one system that fits how the
            work actually happens.
          </p>
          <div className="pg-hero-actions">
            <Link className="pg-btn-primary" to="/contact">Start Your Project</Link>
            <Link className="pg-btn-ghost" to="/process">See Our Process</Link>
          </div>
        </header>

        {/* Interactive sector explorer */}
        <section className="ind-section" aria-label="Industries we build for">
          <Reveal className="ind-head" variant="up">
            <h2 className="ind-h2">Where the ecosystem fits in</h2>
            <p className="ind-lead">
              Pick the world closest to yours. Each one starts with the same
              friction, and ends with the same connected system, shaped to fit.
            </p>
          </Reveal>
          <Reveal variant="up" amount={0.15}>
            <SectorExplorer />
          </Reveal>
        </section>

        {/* Honest note */}
        <section className="ind-section" aria-label="A note on industry experience">
          <Reveal variant="scale">
            <div className="ind-note glass-card glass-card--bright">
              <span className="ind-note-ic"><Icon name="compass" /></span>
              <div className="ind-note-body">
                <h2 className="ind-h2 ind-note-h2">Not on the list?</h2>
                <p className="ind-note-text">
                  These are common patterns, not limits. The ecosystem approach
                  applies to any business where information moves between people,
                  tools, and clients. Tell us how your operation works and we will
                  map what a connected system looks like for it.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* CTA */}
        <section className="ind-section" aria-label="Start your project">
          <Reveal variant="scale">
            <div className="ind-cta glass-card glass-card--bright">
              <h2 className="ind-cta-title">Tell us how your business runs</h2>
              <p className="ind-cta-sub">
                We will recommend the smallest system that removes your biggest
                friction, with pricing in writing before anything starts.
              </p>
              <div className="ind-cta-actions">
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
