import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

/* ── Responsive card offset ─────────────────────────────────────────────────── */
// Card width CSS = calc((51.5vw - 28px) / 2.05)  [right col 57vw − shadow 5.5vw = 51.5vw]
// CARD_OFFSET = cardWidth + 14px gap
// This guarantees exactly 5% of card-3 visible after the shadow margin.
function computeOffset() {
  const shadow = Math.max(55, Math.min(window.innerWidth * 0.055, 90))
  return (window.innerWidth * 0.57 - shadow - 28) / 2.05 + 14
}

/* ── Animation ──────────────────────────────────────────────────────────────── */
const SLIDE_TRANS = { duration: 1.65, ease: [0.22, 1, 0.36, 1] }
const RISE        = (delay = 0) => ({ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay })
const FADE        = (delay = 0) => ({ duration: 0.40, ease: 'easeOut', delay })

function getCardAnim(pos, offset) {
  // Exiting cards shrink + fade — "swallowed by left shadow"
  if (pos <= -1) return { x: -offset,       opacity: 0,    scale: 0.86 }
  if (pos === 0) return { x: 0,             opacity: 1,    scale: 1.00 }
  if (pos === 1) return { x: offset,        opacity: 1,    scale: 0.97 }
  if (pos === 2) return { x: offset * 2,    opacity: 0.55, scale: 0.94 }
  return               { x: offset * 3,    opacity: 0,    scale: 0.91 }
}

/* ── Active card ────────────────────────────────────────────────────────────── */
function ActiveContent({ card, onNavigate }) {
  const Icon = card.icon
  return (
    <div className="ec-inner ec-inner--active">
      <motion.div className="ec-toprow"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={FADE(0.22)}>
        <div className="ec-meta">
          <span className="ec-number">{card.number}</span>
          <span className="ec-category">{card.category}</span>
        </div>
        <button className="ec-arrow-btn" onClick={onNavigate} aria-label={`Explore ${card.title}`}>
          <ArrowIcon />
        </button>
      </motion.div>

      <motion.div className="ec-icon-box" aria-hidden="true"
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={FADE(0.26)}>
        <Icon />
      </motion.div>

      {/* Title rises from the bottom (where it lived as preview-title) */}
      <motion.h3 className="ec-title"
        initial={{ opacity: 0, y: 90 }} animate={{ opacity: 1, y: 0 }} transition={RISE(0.06)}>
        {card.title}
      </motion.h3>

      {/* Intro pulled up behind the rising title */}
      <motion.p className="ec-intro"
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={RISE(0.16)}>
        {card.intro}
      </motion.p>

      {/* Divider sweeps in from left */}
      <motion.div className="ec-divider" aria-hidden="true"
        initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
        style={{ originX: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.28 }} />

      {/* Capabilities stagger in */}
      <motion.div className="ec-cap-block"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={RISE(0.32)}>
        <p className="ec-cap-label">Capabilities</p>
        <ul className="ec-bullets">
          {card.capabilities.map((item, i) => (
            <motion.li key={i}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.38, ease: 'easeOut', delay: 0.36 + i * 0.055 }}>
              {item}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}

/* ── Preview card ───────────────────────────────────────────────────────────── */
function PreviewContent({ card, onNavigate }) {
  return (
    <div className="ec-inner ec-inner--preview">
      {/* Electric blue orb glow — bottom-right corner */}
      <div className="ec-preview-glow" aria-hidden="true" />

      <motion.div className="ec-toprow"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE(0.05)}>
        <span className="ec-preview-num">{card.number}</span>
        <button className="ec-arrow-btn"
          onClick={(e) => { e.stopPropagation(); onNavigate() }}
          aria-label={`Explore ${card.title}`}>
          <ArrowIcon />
        </button>
      </motion.div>

      {/* Dot texture — masked to bottom-right corner */}
      <motion.div className="ec-preview-dots" aria-hidden="true"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE(0.10)} />

      {/* Title rises from below */}
      <motion.div className="ec-preview-footer"
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={RISE(0.08)}>
        <h3 className="ec-preview-title">{card.title}</h3>
      </motion.div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function ExpertiseCarousel() {
  const [activeCard, setActiveCard] = useState(0)
  const [cardOffset, setCardOffset] = useState(() => computeOffset())
  const activeCardRef = useRef(0)
  const sectionRef    = useRef(null)
  const navigate = useNavigate()

  /* keep ref in sync */
  useEffect(() => { activeCardRef.current = activeCard }, [activeCard])

  /* update offset on resize */
  useEffect(() => {
    const onResize = () => setCardOffset(computeOffset())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    registerCarousel({
      onAdvance: (dir) =>
        setActiveCard(prev => Math.max(0, Math.min(CARDS.length - 1, prev + dir))),
      activeRef: activeCardRef,
      total: CARDS.length,
    })
  }, [])

  /* Shadow fade-in: activate once section enters view so the shadow never
     overlaps the cube mid-animation. Class triggers a CSS animation with
     a 1.8s delay (giving the cube time to reach its final position). */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('expertise-section--active')
          obs.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="expertise-section" data-carousel="" aria-label="Our expertise">
      <div className="expertise-left" aria-hidden="true" />

      <div className="expertise-right">
        <div className="expertise-heading-block">
          <p className="expertise-eyebrow">OUR EXPERTISE</p>
          <h2 className="expertise-h2">Solutions that scale with your vision.</h2>
        </div>

        <div className="ec-carousel-wrap" role="region" aria-label="Expertise cards">

          {CARDS.map((card, i) => {
            const pos       = i - activeCard
            const isActive  = pos === 0
            const isPreview = pos === 1
            const isVisible = pos >= 0 && pos <= 2

            return (
              <motion.div
                key={card.number}
                className={`expertise-card${isActive ? ' expertise-card--active' : ''}`}
                style={{ zIndex: isActive ? 3 : isPreview ? 2 : isVisible ? 1 : 0 }}
                animate={getCardAnim(pos, cardOffset)}
                transition={SLIDE_TRANS}
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
                <AnimatePresence mode="wait" initial={false}>
                  {isActive ? (
                    <motion.div key={`a-${card.number}`} className="ec-content-layer"
                      exit={{ opacity: 0, transition: { duration: 0.18 } }}>
                      <ActiveContent card={card} onNavigate={() => navigate(card.route)} />
                    </motion.div>
                  ) : (
                    <motion.div key={`p-${card.number}`} className="ec-content-layer"
                      exit={{ opacity: 0, transition: { duration: 0.14 } }}>
                      <PreviewContent card={card} onNavigate={() => navigate(card.route)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
