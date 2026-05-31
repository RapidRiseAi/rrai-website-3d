import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const MonitorCodeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
    <path d="M9.5 8 7.5 10l2 2M14.5 8l2 2-2 2" />
  </svg>
)
const UserPortalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </svg>
)
const DashboardIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V10M9.3 20V4M14.6 20v-7M20 20V8" />
  </svg>
)
const ChatAgentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 15.5a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
    <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
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
    startAt: 'R1000',
    monthly: 'R200 p/m',
    monthlyNote: 'Hosting & Maintenance',
    route: '/services/website-development',
  },
  {
    title: 'Client Portals',
    icon: UserPortalIcon,
    startAt: 'R2000',
    monthly: 'R300 p/m',
    monthlyNote: null,
    route: '/services/client-portal',
  },
  {
    title: 'Smart Dashboards',
    icon: DashboardIcon,
    startAt: 'R3000',
    monthly: 'R300 p/m',
    monthlyNote: null,
    route: '/services/smart-dashboards',
  },
  {
    title: 'AI Communication / Support Agents',
    icon: ChatAgentIcon,
    startAt: 'R1000',
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
