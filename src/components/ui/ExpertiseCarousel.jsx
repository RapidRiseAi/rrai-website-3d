import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { carouselState } from '../../utils/carouselState'
import { carouselSectionVH, deriveScroll, getStopsPx, isDesktopLayout } from '../../utils/scrollLayout'

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const GlobeIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const CodeIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
)
const SmartphoneIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2"/>
    <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
  </svg>
)
const ZapIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const SparklesIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>
)
const NetworkIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="20" r="2"/>
    <path d="M12 6v4M12 10l-6.5 8M12 10l6.5 8M5 20h14"/>
  </svg>
)
const TrendingUpIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
)
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
  </svg>
)

/* ── Card data ──────────────────────────────────────────────────────────────── */
const CARDS = [
  {
    number: '01', category: 'DIGITAL PRESENCE', icon: GlobeIcon,
    title: 'Websites and SEO',
    intro: 'Build trust, get found, and turn attention into qualified enquiries.',
    whatWeBuild: [
      'Premium business websites',
      'Landing pages and conversion flows',
      'Technical SEO and on page structure',
      'Quote, booking, and enquiry systems',
    ],
    businessValue: 'Turn your website into a sales asset that supports trust, search visibility, paid ads, and long term growth.',
    route: '/services/website-development',
  },
  {
    number: '02', category: 'BUSINESS SYSTEMS', icon: CodeIcon,
    title: 'Custom Software',
    intro: 'Build tools around your actual business process instead of forcing your process into generic software.',
    whatWeBuild: [
      'Internal dashboards and admin panels',
      'Client portals and staff tools',
      'Quote, booking, and approval systems',
      'Reporting, documents, and workflow control',
    ],
    businessValue: 'Centralise your operations, reduce spreadsheet dependency, and create a system your competitors cannot easily copy.',
    route: '/services/software-development',
  },
  {
    number: '03', category: 'DIGITAL PRODUCTS', icon: SmartphoneIcon,
    title: 'App Development',
    intro: 'Give customers, staff, or partners a better way to interact with your business.',
    whatWeBuild: [
      'Customer portals and profile systems',
      'Staff apps and mobile dashboards',
      'Upload flows and status tracking',
      'Booking, service, and request tools',
    ],
    businessValue: 'Improve user experience, reduce repeated communication, and turn your service into a stronger digital product.',
    route: '/services/web-app-development',
  },
  {
    number: '04', category: 'OPERATIONS', icon: ZapIcon,
    title: 'Workflow Automation',
    intro: 'Move information between people, tools, and customers without constant manual effort.',
    whatWeBuild: [
      'Lead routing and follow up automation',
      'Email, WhatsApp, and form workflows',
      'Google Workspace automation',
      'Notifications, reminders, and task triggers',
    ],
    businessValue: 'Respond faster, reduce human error, prevent missed tasks, and free your team from repetitive admin.',
    route: '/services/automated-workflow',
  },
  {
    number: '05', category: 'INTELLIGENT SYSTEMS', icon: SparklesIcon,
    title: 'AI Implementation',
    intro: 'Turn AI from a tool your team opens manually into a working layer inside your business.',
    whatWeBuild: [
      'AI chat assistants and support bots',
      'Internal staff assistants',
      'Knowledge base and document search',
      'AI reply, reporting, and content support',
    ],
    businessValue: 'Give customers faster answers, help staff work smarter, and turn business knowledge into a usable assistant.',
    route: '/services/ai-implementation',
  },
  {
    number: '06', category: 'CONNECTED INFRASTRUCTURE', icon: NetworkIcon,
    title: 'Connected Ecosystems',
    intro: 'Connect your tools, data, workflows, AI, and dashboards into one smarter operating layer.',
    whatWeBuild: [
      'API and tool integrations',
      'Shared data flows and central dashboards',
      'CRM-style workflows',
      'AI-supported operations',
    ],
    businessValue: 'Create one source of truth, break down silos, and scale without adding unnecessary complexity.',
    route: '/services/ecosystems',
  },
  {
    number: '07', category: 'GROWTH INFRASTRUCTURE', icon: TrendingUpIcon,
    title: 'Managed Marketing Services',
    intro: 'Access marketing execution through Rapid Rise AI’s managed specialist delivery team.',
    whatWeBuild: [
      'Campaign landing pages',
      'SEO content systems',
      'Social content and creative support',
      'Lead capture and follow up flows',
    ],
    businessValue: 'Get the marketing support your business needs without building a full in house team, while keeping delivery connected to your website, leads, and systems.',
    route: '/services/marketing-seo',
  },
]

/* ── Responsive card offset ─────────────────────────────────────────────────── */
function computeOffset() {
  const shadow = Math.max(55, Math.min(window.innerWidth * 0.055, 90))
  return (window.innerWidth * 0.57 - shadow - 28) / 2.05 + 14
}

/* ── Animation helpers ──────────────────────────────────────────────────────── */
const SLIDE_TRANS = { duration: 1.65, ease: [0.22, 1, 0.36, 1] }
const FADE        = (delay = 0) => ({ duration: 0.38, ease: 'easeOut', delay })

// Curtain ONLY between the preview and presented slots. A presented card that
// slides off to — or returns from — the hidden stack does not curtain; it stays
// as-is and just fades with the card.
//  · advancing (dir > 0): the incoming preview→presented card curtains UP into
//    view; the outgoing presented→hidden card simply fades (no curtain).
//  · going back (dir < 0): the demoted presented→preview card curtains DOWN and
//    out — the mirror of the rise — while the returning hidden→presented card
//    just fades in (comes back as-is).
const CURTAIN = {
  initial: (dir) => (dir > 0 ? { y: '105%', opacity: 1 } : { y: '0%', opacity: 0 }),
  animate: { y: '0%', opacity: 1, transition: { duration: 0.90, ease: [0.22, 1, 0.36, 1] } },
  exit:    (dir) => (dir < 0
    ? { y: '105%', opacity: 1, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } }
    : { opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } }),
}
// Preview content: quiet cross-fade, never a curtain.
const CURTAIN_PREVIEW = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, transition: { duration: 0.20, ease: 'easeOut' } },
}

function getCardAnim(pos, offset) {
  if (pos <= -1) return { x: -offset,    opacity: 0,    scale: 0.86 }
  if (pos === 0) return { x: 0,          opacity: 1,    scale: 1.00 }
  if (pos === 1) return { x: offset,     opacity: 1,    scale: 0.96 }
  if (pos === 2) return { x: offset * 2, opacity: 0.45, scale: 0.92 }
  return               { x: offset * 3, opacity: 0,    scale: 0.89 }
}

/* ── Active card content ────────────────────────────────────────────────────── */
function ActiveContent({ card }) {
  const Icon = card.icon
  return (
    <div className="ec-inner ec-inner--active">

      {/* Internal atmosphere — faint dotted tech grid + lower-right blue bloom */}
      <div className="ec-active-atmos" aria-hidden="true" />

      {/* Category — arrow and title live permanently on the card outside this layer */}
      <div className="ec-toprow">
        <motion.span className="ec-category"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE(0.28)}>
          {card.category}
        </motion.span>
      </div>

      {/* Vertical gap that reserves space for the permanent title above */}
      <div className="ec-title-gap" />

      {/* Intro */}
      <motion.p className="ec-intro"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.50, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}>
        {card.intro}
      </motion.p>

      {/* Divider sweeps from left */}
      <motion.div className="ec-divider" aria-hidden="true"
        initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
        style={{ originX: 0 }}
        transition={{ duration: 0.42, ease: 'easeOut', delay: 0.22 }} />

      {/* What We Build — fills the flexible middle so the value panel anchors the base */}
      <motion.div className="ec-cap-block"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.40, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}>
        <p className="ec-section-label">What We Build</p>
        <ul className="ec-bullets">
          {card.whatWeBuild.map((item, i) => (
            <motion.li key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut', delay: 0.32 + i * 0.05 }}>
              {item}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Business Value — nested premium inset panel anchoring the lower portion */}
      <motion.div className="ec-value-panel"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1], delay: 0.40 }}>
        <div className="ec-value-icon" aria-hidden="true"><Icon /></div>
        <div className="ec-value-body">
          <p className="ec-section-label">Business Value</p>
          <p className="ec-value-text">{card.businessValue}</p>
        </div>
      </motion.div>

    </div>
  )
}

/* ── Preview (inactive) card content ───────────────────────────────────────── */
function PreviewContent({ card }) {
  return (
    <div className="ec-inner ec-inner--preview">
      {/* Bottom-right glow */}
      <div className="ec-preview-glow" aria-hidden="true" />

      {/* Number only — arrow lives permanently on the card outside this layer */}
      <motion.div className="ec-toprow"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE(0.05)}>
        <span className="ec-preview-num">{card.number}</span>
      </motion.div>

      {/* Category label */}
      <motion.p className="ec-preview-category"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE(0.09)}>
        {card.category}
      </motion.p>

      {/* Dot texture — masked to bottom-right */}
      <motion.div className="ec-preview-dots" aria-hidden="true"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE(0.12)} />

      {/* Title lives permanently on the card — no ec-preview-footer here */}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function ExpertiseCarousel() {
  const [activeCard, setActiveCard] = useState(0)
  const [direction, setDirection]   = useState(1)
  const [cardOffset, setCardOffset] = useState(() => computeOffset())
  const [sectionH, setSectionH]     = useState(() => carouselSectionVH() * 100)
  const activeCardRef = useRef(0)
  const navigate = useNavigate()

  /* keep ref + shared 3-D carousel state in sync */
  useEffect(() => {
    activeCardRef.current    = activeCard
    carouselState.activeCard = activeCard
  }, [activeCard])

  /* screenshot harness hook — drives the card directly (bypasses scroll) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!new URLSearchParams(window.location.search).has('shot')) return
    window.__wfSetCard = (i) => {
      const clamped = Math.max(0, Math.min(CARDS.length - 1, i))
      setDirection(clamped >= activeCardRef.current ? 1 : -1)
      setActiveCard(clamped)
    }
    return () => { delete window.__wfSetCard }
  }, [])

  useEffect(() => {
    const onResize = () => {
      setCardOffset(computeOffset())
      setSectionH(carouselSectionVH() * 100)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* Scroll-driven cards: on the desktop pinned layout the active card is a pure
     function of scroll position, so the wheel, the scrollbar and middle-click
     autoscroll all cycle the cards identically. (Disabled under ?shot so the
     capture harness can address cards directly; on mobile cards switch by tap.) */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).has('shot')) return
    if (!isDesktopLayout()) return
    const onScroll = () => {
      const { card } = deriveScroll(window.scrollY)
      if (card == null) return
      setActiveCard(prev => {
        if (card !== prev) setDirection(card > prev ? 1 : -1)
        return card
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Jump to a card. On desktop scroll to its stop so scroll stays the single
     source of truth; on mobile switch directly (tap). */
  const goToCard = (i) => {
    if (isDesktopLayout()) {
      window.scrollTo({ top: getStopsPx()[1 + i], behavior: 'smooth' })
    } else {
      setDirection(i > activeCardRef.current ? 1 : -1)
      setActiveCard(i)
    }
  }

  return (
    <section
      className="expertise-section"
      data-carousel=""
      aria-label="Our expertise"
      style={{ height: `${sectionH}vh` }}
    >
      <div className="expertise-pin">
        <div className="expertise-left" aria-hidden="true" />

        <div className="expertise-right">
        <div className="expertise-heading-block">
          <p className="expertise-eyebrow">OUR EXPERTISE</p>
          <h2 className="expertise-h2">The systems behind modern growth.</h2>
          <p className="expertise-sub">We design the digital layers that connect your website, workflows, data, AI, and operations into one smarter business stack.</p>
        </div>

        <div className="ec-carousel-wrap" role="region" aria-label="Expertise cards">
          {CARDS.map((card, i) => {
            const pos       = i - activeCard
            const isActive  = pos === 0
            const isPreview = pos === 1
            const isVisible = pos >= 0 && pos <= 2
            // Visual state by location: a card keeps the PRESENTED look for the
            // presented slot AND while disappeared to the left, so sliding off
            // (or coming back) never swaps content and never curtains. The
            // curtain only fires when crossing the preview↔presented boundary.
            const presented = pos <= 0

            return (
              <motion.div
                key={card.number}
                className={`expertise-card${presented ? ' expertise-card--active' : ''}`}
                style={{ zIndex: isActive ? 3 : isPreview ? 2 : isVisible ? 1 : 0 }}
                animate={getCardAnim(pos, cardOffset)}
                transition={SLIDE_TRANS}
                onClick={() => { if (isPreview) goToCard(i) }}
                role={isPreview ? 'button' : undefined}
                aria-label={isPreview ? `Show ${card.title}` : undefined}
                tabIndex={isVisible ? 0 : -1}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && isPreview) {
                    e.preventDefault()
                    goToCard(i)
                  }
                }}
              >
                {/* Arrow — never animated, always at top-right */}
                <button
                  className="ec-arrow-btn ec-arrow-permanent"
                  onClick={(e) => { e.stopPropagation(); navigate(card.route) }}
                  aria-label={`Explore ${card.title}`}
                >
                  <ArrowIcon />
                </button>

                {/* Title — permanent on card, Framer Motion layout animates it between
                    bottom (preview) and top (active) as one continuous element */}
                <motion.h3
                  layout
                  className={`ec-card-title ${presented
                    ? 'ec-card-title--active ec-title'
                    : 'ec-card-title--preview ec-preview-title'}`}
                  style={{ margin: 0 }}
                  transition={{ layout: { duration: 0.88, ease: [0.22, 1, 0.36, 1] } }}
                >
                  {card.title}
                </motion.h3>

                <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                  {presented ? (
                    <motion.div
                      key={`a-${card.number}`}
                      className="ec-content-layer"
                      custom={direction}
                      variants={CURTAIN}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <ActiveContent card={card} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`p-${card.number}`}
                      className="ec-content-layer"
                      custom={direction}
                      variants={CURTAIN_PREVIEW}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <PreviewContent card={card} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
        </div>
      </div>
    </section>
  )
}
