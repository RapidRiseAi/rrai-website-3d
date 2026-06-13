import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const MonitorCodeIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14.5" rx="2.2" />
    <path d="M8 21h8" />
    <path d="M12 17.5v3.5" />
    <path d="M9.7 7.9 6.9 10.25l2.8 2.45" />
    <path d="M14.3 7.9l2.8 2.35-2.8 2.45" />
    <path d="M13.1 7.3 10.9 13.2" />
  </svg>
)
const UserPortalIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.9" />
    <path d="M5.2 20.2a6.8 6.8 0 0 1 13.6 0" />
  </svg>
)
const DashboardIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21V14M12 21V10M19 21V12" />
    <circle cx="5" cy="11" r="1.55" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7" r="1.55" fill="currentColor" stroke="none" />
    <circle cx="19" cy="9" r="1.55" fill="currentColor" stroke="none" />
  </svg>
)
const ChatAgentIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13.5a2.4 2.4 0 0 1-2.4 2.4H9l-4.5 3.4.02-3.4A2.4 2.4 0 0 1 4 13.5v-6A2.4 2.4 0 0 1 6.4 5.1h11.2A2.4 2.4 0 0 1 20 7.5z" />
    <path d="M8.6 10.5h.01M12 10.5h.01M15.4 10.5h.01" />
  </svg>
)
const ArrowIcon = () => (
  <svg className="fp-btn-arrow" width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" opacity="0.55" />
    <path d="M8 12.2l2.6 2.6L16 9.5" />
  </svg>
)
const WandIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19 16 8M14.5 5.5 18 9" />
    <path d="M19 13l.5 1.6L21 15l-1.5.5L19 17l-.5-1.5L17 15l1.5-.4zM7.5 3l.4 1.3L9 4.7l-1.1.4L7.5 6l-.4-1L6 4.7l1.1-.4z" fill="currentColor" stroke="none" />
  </svg>
)

/* ── Product data ───────────────────────────────────────────────────────────
   Routes map to the existing /services/:slug pages (see src/data/services.js). */
const PRODUCTS = [
  {
    title: 'Website Development',
    icon: MonitorCodeIcon,
    startAt: 'R2,000',
    monthly: 'R200 p/m',
    monthlyNote: 'Hosting & Maintenance',
    route: '/services/website-development',
  },
  {
    title: 'Client Portals',
    icon: UserPortalIcon,
    startAt: 'R3,000',
    monthly: 'R500 p/m',
    monthlyNote: null,
    route: '/services/client-portal',
  },
  {
    title: 'Smart Dashboards',
    icon: DashboardIcon,
    startAt: 'R3,000',
    monthly: 'R400 p/m',
    monthlyNote: null,
    route: '/services/smart-dashboards',
  },
  {
    title: 'AI Communication / Support Agents',
    icon: ChatAgentIcon,
    startAt: 'R1,000',
    monthly: 'R200 p/m',
    monthlyNote: null,
    route: '/services/ai-communication-agent',
  },
]

const EASE = [0.16, 1, 0.3, 1]
const inView = { once: true, amount: 0.25, margin: '-60px' }

function ProductCard({ product, index }) {
  const Icon = product.icon
  return (
    <motion.article
      className="fp-card"
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={inView}
      transition={{ duration: 0.55, delay: 0.06 + index * 0.08, ease: EASE }}
      whileHover={{ y: -6 }}
    >
      <span className="fp-card-shine" aria-hidden="true" />

      <div className="fp-card-icon" aria-hidden="true"><Icon /></div>

      <h3 className="fp-card-title">{product.title}</h3>

      <div className="fp-card-divider" />

      <p className="fp-card-startlabel">Starting at</p>
      <p className="fp-card-price">{product.startAt}</p>

      <div className="fp-card-divider" />

      <div className="fp-card-monthly-row">
        <span className="fp-card-monthly">{product.monthly}</span>
        {product.monthlyNote && (
          <span className="fp-card-monthly-note">{product.monthlyNote}</span>
        )}
      </div>

      <div className="fp-card-badge">
        <CheckIcon />
        Payment plans available
      </div>

      <Link className="fp-card-btn" to={product.route} aria-label={`View ${product.title} product`}>
        View Product
        <ArrowIcon />
      </Link>
    </motion.article>
  )
}

export default function FixedPricingSection() {
  return (
    <section className="fp-section" aria-label="Fixed pricing services">
      {/* The Section-3 wave is the shared HeroOrb particles (the funnel's orbs
          rearranged) rendered on the scene canvas — not a separate element. */}
      <div className="fp-container">
        {/* Heading block */}
        <motion.header
          className="fp-head"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="fp-eyebrow">Pricing &amp; Packages</p>
          <h2 className="fp-title">
            Fixed Pricing Services<span className="fp-dot">.</span>
          </h2>
          <p className="fp-sub">
            Clear, upfront pricing for high-impact solutions. Get started fast with
            our packaged services.
          </p>
          <div className="fp-payment-pill">
            <CalendarIcon />
            Payment plans available on all services.
          </div>
        </motion.header>

        {/* Product cards */}
        <div className="fp-grid">
          {PRODUCTS.map((product, i) => (
            <ProductCard key={product.title} product={product} index={i} />
          ))}
        </div>

        {/* Custom-build CTA */}
        <motion.div
          className="fp-custom"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0, margin: '0px 0px 35% 0px' }}
          transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
        >
          <div className="fp-custom-icon" aria-hidden="true"><WandIcon /></div>
          <div className="fp-custom-text">
            <h3>Need something custom built?</h3>
            <p>We build tailored solutions for unique business needs.</p>
          </div>
          <Link className="fp-custom-btn" to="/services">
            Request a custom solution
            <ArrowIcon />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
