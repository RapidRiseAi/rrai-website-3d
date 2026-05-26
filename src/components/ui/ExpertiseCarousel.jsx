import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { registerCarousel } from '../../utils/carouselControl'

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
)
const SmartphoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>
)
const NetworkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="20" r="2"/>
    <path d="M12 6v4M12 10l-6.5 8M12 10l6.5 8M5 20h14"/>
  </svg>
)
const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
)

/* Arrow up-right */
const ArrowIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
  </svg>
)

/* ── Card data ──────────────────────────────────────────────────────────────── */
const CARDS = [
  {
    number: '01', category: 'DIGITAL PRESENCE', icon: GlobeIcon,
    title: 'Websites and SEO',
    intro: 'High-performance websites and SEO systems designed to attract, engage, and convert.',
    capabilities: ['Custom websites and landing pages', 'Technical SEO and on-page optimization', 'Content structure and keyword targeting', 'Quote, booking, and enquiry flows'],
    route: '/services/website-development',
  },
  {
    number: '02', category: 'BUSINESS SYSTEMS', icon: CodeIcon,
    title: 'Custom Software',
    intro: 'Purpose-built software designed around the way your business actually works.',
    capabilities: ['Internal dashboards and admin panels', 'Client portals and staff tools', 'Quote, booking, and workflow systems', 'Document, reporting, and approval flows'],
    route: '/services/software-development',
  },
  {
    number: '03', category: 'DIGITAL PRODUCTS', icon: SmartphoneIcon,
    title: 'App Development',
    intro: 'Mobile-ready tools that give customers, staff, or partners a better way to interact.',
    capabilities: ['Customer portals and profile systems', 'Staff apps and mobile dashboards', 'Status tracking and upload flows', 'Booking, service, and request systems'],
    route: '/services/web-app-development',
  },
  {
    number: '04', category: 'OPERATIONS', icon: ZapIcon,
    title: 'Workflow Automation',
    intro: 'Smart automations that move information between people, tools, and customers.',
    capabilities: ['Lead routing and follow-up automation', 'Email, WhatsApp, and form workflows', 'Google Workspace automation', 'Notifications, reminders, and task triggers'],
    route: '/services/automated-workflow',
  },
  {
    number: '05', category: 'INTELLIGENT SYSTEMS', icon: SparklesIcon,
    title: 'AI Implementation',
    intro: 'AI assistants and agents that help your business answer, create, and act faster.',
    capabilities: ['AI chat assistants and support bots', 'Internal staff assistants', 'Knowledge base and document search', 'AI reply, reporting, and content support'],
    route: '/services/ai-implementation',
  },
  {
    number: '06', category: 'CONNECTED INFRASTRUCTURE', icon: NetworkIcon,
    title: 'Connected Ecosystems',
    intro: 'A unified operating layer where your tools, data, and workflows work together.',
    capabilities: ['API and tool integrations', 'Shared data flows and central dashboards', 'CRM-style workflows', 'AI-supported operations'],
    route: '/services/ecosystems',
  },
  {
    number: '07', category: 'GROWTH INFRASTRUCTURE', icon: TrendingUpIcon,
    title: 'Marketing Infrastructure',
    intro: 'Systems that help your business attract, capture, track, and manage demand.',
    capabilities: ['Campaign landing pages', 'Lead capture funnels', 'SEO content systems', 'Marketing dashboards and follow-up flows'],
    route: '/services/marketing-seo',
  },
]

/* ── Animation ──────────────────────────────────────────────────────────────── */
// CARD_OFFSET = card CSS width (356px) + gap (10px) = 366px
const CARD_OFFSET = 366
const TRANSITION  = { duration: 0.60, ease: [0.16, 1, 0.3, 1] }

function getCardAnim(pos) {
  if (pos < 0)   return { x: -CARD_OFFSET,      opacity: 0 }
  if (pos === 0) return { x: 0,                  opacity: 1 }
  if (pos === 1) return { x: CARD_OFFSET,        opacity: 1 }
  if (pos === 2) return { x: CARD_OFFSET * 2,    opacity: 0.7 }
  return               { x: CARD_OFFSET * 3,    opacity: 0 }
}

/* ── Active card ────────────────────────────────────────────────────────────── */
function ActiveContent({ card, onNavigate }) {
  const Icon = card.icon
  return (
    <div className="ec-inner ec-inner--active">
      <div className="ec-toprow">
        <div className="ec-meta">
          <span className="ec-number">{card.number}</span>
          <span className="ec-category">{card.category}</span>
        </div>
        <button className="ec-arrow-btn" onClick={onNavigate} aria-label={`Explore ${card.title}`}>
          <ArrowIcon />
        </button>
      </div>

      <div className="ec-icon-box" aria-hidden="true"><Icon /></div>
      <h3 className="ec-title">{card.title}</h3>
      <p className="ec-intro">{card.intro}</p>
      <div className="ec-divider" aria-hidden="true" />

      <div className="ec-cap-block">
        <p className="ec-cap-label">Capabilities</p>
        <ul className="ec-bullets">
          {card.capabilities.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
    </div>
  )
}

/* ── Preview card ───────────────────────────────────────────────────────────── */
function PreviewContent({ card, onNavigate }) {
  return (
    <div className="ec-inner ec-inner--preview">
      <div className="ec-toprow">
        <span className="ec-preview-num">{card.number}</span>
        <button
          className="ec-arrow-btn"
          onClick={(e) => { e.stopPropagation(); onNavigate() }}
          aria-label={`Explore ${card.title}`}
        >
          <ArrowIcon />
        </button>
      </div>
      <div className="ec-preview-dots" aria-hidden="true" />
      <div className="ec-preview-footer">
        <h3 className="ec-preview-title">{card.title}</h3>
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function ExpertiseCarousel() {
  const [activeCard, setActiveCard] = useState(0)
  const activeCardRef = useRef(0)
  const navigate = useNavigate()

  useEffect(() => { activeCardRef.current = activeCard }, [activeCard])

  useEffect(() => {
    registerCarousel({
      onAdvance: (dir) =>
        setActiveCard(prev => Math.max(0, Math.min(CARDS.length - 1, prev + dir))),
      activeRef: activeCardRef,
      total: CARDS.length,
    })
  }, [])

  return (
    <section className="expertise-section" data-carousel="" aria-label="Our expertise">
      <div className="expertise-left" aria-hidden="true" />

      <div className="expertise-right">
        <div className="expertise-heading-block">
          <p className="expertise-eyebrow">OUR EXPERTISE</p>
          <h2 className="expertise-h2">Solutions that scale with your vision.</h2>
        </div>

        <div className="ec-carousel-wrap" role="region" aria-label="Expertise cards">
          {CARDS.map((card, i) => {
            const pos = i - activeCard
            const isActive  = pos === 0
            const isPreview = pos === 1
            const isVisible = pos >= 0 && pos <= 2

            return (
              <motion.div
                key={card.number}
                className={`expertise-card${isActive ? ' expertise-card--active' : ''}`}
                style={{ zIndex: isActive ? 3 : isPreview ? 2 : isVisible ? 1 : 0 }}
                animate={getCardAnim(pos)}
                transition={TRANSITION}
                onClick={() => isPreview && setActiveCard(i)}
                role={isPreview ? 'button' : undefined}
                aria-label={isPreview ? `Show ${card.title}` : undefined}
                tabIndex={isVisible ? 0 : -1}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && isPreview) {
                    e.preventDefault(); setActiveCard(i)
                  }
                }}
              >
                {isActive
                  ? <ActiveContent card={card} onNavigate={() => navigate(card.route)} />
                  : <PreviewContent card={card} onNavigate={() => navigate(card.route)} />
                }
              </motion.div>
            )
          })}
        </div>

        <div className="ec-progress" aria-hidden="true">
          {CARDS.map((_, i) => (
            <button
              key={i}
              className={`ec-progress-dot${i === activeCard ? ' ec-progress-dot--active' : ''}`}
              onClick={() => setActiveCard(i)}
              tabIndex={-1}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
