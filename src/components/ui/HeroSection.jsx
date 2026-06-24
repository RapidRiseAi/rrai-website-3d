import {
  motion,
  useAnimation,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from 'framer-motion'
import { useEffect, useRef, useCallback, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'

const EXPO = [0.16, 1, 0.30, 1]

// Outcome-led trust badges — a punchy lead word + a short descriptor.
const STATS = [
  { value: '24/7',  label: 'engagement' },
  { value: 'More',  label: 'work delivered' },
  { value: 'Built', label: 'to scale' },
]

// Headline is now the (formerly eyebrow) positioning line, split across 2 lines.
const H1_LINES = [
  { parts: [{ text: 'Digital infrastructure', cls: 'h1-line-1' }] },
  { parts: [{ text: 'for modern businesses',  cls: 'h1-line-3' }] },
]

function MagneticButton({ children, className, onClick }) {
  const ref = useRef()
  const x   = useMotionValue(0)
  const y   = useMotionValue(0)
  const sx  = useSpring(x, { stiffness: 280, damping: 26 })
  const sy  = useSpring(y, { stiffness: 280, damping: 26 })

  const onMove  = useCallback((e) => {
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width  / 2)) * 0.32)
    y.set((e.clientY - (r.top  + r.height / 2)) * 0.32)
  }, [x, y])
  const onLeave = useCallback(() => { x.set(0); y.set(0) }, [x, y])

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.055 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      {children}
    </motion.button>
  )
}

export default function HeroSection({ loaded }) {
  const controls   = useAnimation()
  const sectionRef = useRef()
  const navigate   = useNavigate()

  /* Scroll-driven exit */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const mainExitX  = useTransform(scrollYProgress, [0, 1], ['0vw', '-115vw'])
  const statsExitX = useTransform(scrollYProgress, [0, 1], ['0vw',  '115vw'])

  useEffect(() => {
    if (!loaded) return
    controls.start('visible')
  }, [loaded, controls])

  return (
    <section className="hero-section" ref={sectionRef}>
      <div className="corner-glow" aria-hidden="true" />

      {/* ── Left content block — exits LEFT on scroll ───────────── */}
      <motion.div className="hero-left-content" style={{ x: mainExitX }}>

        {/* Headline + supporting subheading */}
        <div className="hero-h1-area">
          <div>
            <h1 className="hero-h1">
            {H1_LINES.map((line, i) => (
              <motion.span
                key={i}
                className="h1-row"
                initial={{ opacity: 0, y: 55 }}
                animate={controls}
                variants={{
                  hidden:  { opacity: 0, y: 55 },
                  visible: { opacity: 1, y: 0,
                    transition: { duration: 0.88, delay: 0.20 + i * 0.14, ease: EXPO } },
                }}
              >
                {line.parts.map((p, j) => (
                  <span key={j} className={p.cls}>{p.text}</span>
                ))}
              </motion.span>
            ))}
            </h1>
            <motion.p
              className="hero-subhead"
              initial={{ opacity: 0, y: 18 }}
              animate={controls}
              variants={{
                hidden:  { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0,
                  transition: { duration: 0.70, delay: 0.58, ease: EXPO } },
              }}
            >
              More leads. Faster delivery. Smarter operations.
            </motion.p>
          </div>
        </div>

        {/* Sub copy + CTA */}
        <motion.div
          className="hero-bottom-left"
          initial={{ opacity: 0, y: 28 }}
          animate={controls}
          variants={{
            hidden:  { opacity: 0, y: 28 },
            visible: { opacity: 1, y: 0,
              transition: { duration: 0.75, delay: 0.88, ease: EXPO } },
          }}
        >
          <p className="hero-sub">
            Connected software and AI systems built to help businesses capture opportunities, automate workflows, and scale with control.
          </p>
          <p className="hero-tagline">
            Custom software&nbsp;&bull;&nbsp;AI systems&nbsp;&bull;&nbsp;Business automation
          </p>
          <div className="hero-cta-row">
            <MagneticButton
              className="btn-primary"
              onClick={() => navigate('/contact')}
            >
              Start Your Project
              <svg className="btn-arrow" width="14" height="14" viewBox="0 0 15 15" fill="none">
                <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor"
                  strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </MagneticButton>
            <MagneticButton
              className="btn-ghost-hero"
              onClick={() => navigate('/proof')}
            >
              View Our Work
            </MagneticButton>
          </div>
        </motion.div>

      </motion.div>

      {/* ── Right column — stat group centered under orb ────────── */}
      <motion.div className="hero-right" style={{ x: statsExitX }}>
        <div className="hero-stats-wrap">
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 24 }}
            animate={controls}
            variants={{
              hidden:  { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0,
                transition: { duration: 0.70, delay: 1.06, ease: EXPO } },
            }}
          >
            {STATS.map((s, i) => (
              <Fragment key={i}>
                {i > 0 && <div className="stat-sep" aria-hidden="true" />}
                <div className="stat">
                  <span className="stat-num">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              </Fragment>
            ))}
          </motion.div>
        </div>
      </motion.div>

    </section>
  )
}
