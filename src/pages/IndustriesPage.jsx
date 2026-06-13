import { Link } from 'react-router-dom'
import PageLayout from '../components/ui/PageLayout'
import usePageMeta from '../hooks/usePageMeta'

const INDUSTRIES = [
  {
    title: 'Hospitality and Accommodation',
    problem: 'Guests ask the same questions all day, bookings arrive on every channel, and upsells get missed.',
    solution: 'AI concierge and booking support, guest request handling, WhatsApp support, digital menus, upsell flows, and management dashboards.',
    ecosystem: 'Website with booking enquiries, a WhatsApp AI agent for guests, a digital menu, and a dashboard tracking requests and occupancy signals.',
  },
  {
    title: 'Professional Services',
    problem: 'Legal, accounting, and consulting firms drown in document chasing, status questions, and email admin.',
    solution: 'Document intake, client portals, automated reminders, status tracking, and AI support for common questions.',
    ecosystem: 'A client portal for documents and status, reminder automations for outstanding items, and a dashboard showing every matter at a glance.',
  },
  {
    title: 'Real Estate and Property',
    problem: 'Leads go cold while agents are on viewings, and follow-ups depend on memory.',
    solution: 'Lead qualification, viewing request flows, property dashboards, automated follow-ups, and structured client communication.',
    ecosystem: 'A website capturing qualified leads, an AI agent answering listing questions, follow-up automations, and a pipeline dashboard.',
  },
  {
    title: 'Retail and eCommerce',
    problem: 'Stock, orders, support, and marketing live in separate tools that never agree with each other.',
    solution: 'Online stores, inventory visibility, product pages, payment flows, customer support agents, and marketing tracking.',
    ecosystem: 'An online store connected to inventory, an AI support agent for order questions, and a sales dashboard with marketing attribution.',
  },
  {
    title: 'Construction, Inspections and Field Teams',
    problem: 'Jobs, photos, reports, and client updates scatter across phones, paper, and chat groups.',
    solution: 'Job tracking, inspection systems, photo and report uploads, client updates, and operations dashboards.',
    ecosystem: 'A field inspection app feeding a job dashboard, automated client updates, and report generation from site data.',
  },
  {
    title: 'Medical and Appointment-Based Practices',
    problem: 'Front desks juggle appointment requests, intake forms, and reminders while phones keep ringing.',
    solution: 'Appointment request flows, digital intake forms, reminder automations, FAQs, and internal routing. We build admin systems, not medical advice.',
    ecosystem: 'A website with appointment requests, automated reminders and intake forms, and an internal dashboard for the front desk.',
  },
  {
    title: 'Smart Homes and Smart Workplaces',
    problem: 'Devices and environments generate information that never reaches the people who need it.',
    solution: 'IoT devices, smart environments, device dashboards, alerts, and custom integrations.',
    ecosystem: 'Connected sensors and devices feeding a live dashboard, with alerts and automation triggers built around your environment.',
  },
  {
    title: 'Operations-Heavy Businesses',
    problem: 'Management cannot see what is happening without chasing people for spreadsheets.',
    solution: 'Dashboards, staff tracking, workflow automation, reporting, and internal tools.',
    ecosystem: 'Internal tools where work happens, automations that move information, and a management dashboard with the full picture.',
  },
]

export default function IndustriesPage() {
  usePageMeta(
    'Industries | Rapid Rise AI',
    'Rapid Rise AI builds custom digital systems for hospitality, professional services, retail, property, operations, smart environments and other South African businesses.',
  )

  return (
    <PageLayout>
      <div className="pg-wrap">
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

        {/* Industry cards */}
        <section className="pg-section" aria-label="Industries we build for">
          <div className="pg-grid pg-grid--2">
            {INDUSTRIES.map((ind) => (
              <article className="pg-card" key={ind.title}>
                <h2 className="pg-card-title">{ind.title}</h2>
                <p className="pg-card-text"><strong>Common problem:</strong> {ind.problem}</p>
                <p className="pg-card-text" style={{ marginTop: 10 }}><strong>What we build:</strong> {ind.solution}</p>
                <p className="pg-card-text" style={{ marginTop: 10 }}><strong>Example ecosystem:</strong> {ind.ecosystem}</p>
                <Link className="pg-card-link" to={`/contact?service=${encodeURIComponent(ind.title)}`}>
                  Discuss your {ind.title.split(' ')[0].toLowerCase()} project →
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Honest note */}
        <section className="pg-section" aria-label="A note on industry experience">
          <h2 className="pg-h2">Not on the list?</h2>
          <p className="pg-body">
            These are common patterns, not limits. The ecosystem approach
            applies to any business where information moves between people,
            tools, and clients. Tell us how your operation works and we will
            map what a connected system looks like for it.
          </p>
        </section>

        {/* CTA */}
        <section className="pg-section" aria-label="Start your project">
          <div className="pg-cta-panel">
            <h2 className="pg-cta-title">Tell us how your business runs</h2>
            <p className="pg-cta-sub">
              We will recommend the smallest system that removes your biggest
              friction, with pricing in writing before anything starts.
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
