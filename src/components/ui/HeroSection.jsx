import {
  motion,
  useAnimation,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from 'framer-motion'
import { useEffect, useRef, useState, useCallback, Fragment } from 'react'

const EXPO = [0.16, 1, 0.30, 1]

const STATS = [
  { num: 50,  unit: '+',  label: 'Projects',    sub: 'Delivered' },
  { num: 100, unit: '%',  label: 'Client',       sub: 'Satisfaction' },
  { num: 24,  unit: '/7', label: 'Support',      sub: 'Available' },
]

const H1_LINES = [
  { parts: [{ text: 'Intelligent Software.', cls: 'h1-line-1' }] },
  { parts: [{ text: 'Connected Systems.',    cls: 'h1-line-2' }] },
  { parts: [{ text: 'Built for Growth.',     cls: 'h1-line-3' }] },
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
  const [counts, setCounts] = useState([0, 0, 0])

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

    const id = setTimeout(() => {
      STATS.forEach(({ num }, i) => {
        const FRAMES = 55
        let f = 0
        const tick = () => {
          f++
          const t      = f / FRAMES
          const eased  = 1 - Math.pow(1 - t, 3)
          setCounts(prev => { const n = [...prev]; n[i] = Math.round(eased * num); return n })
          if (f < FRAMES) requestAnimationFrame(tick)
        }
        setTimeout(() => requestAnimationFrame(tick), i * 90)
      })
    }, 1500)

    return () => clearTimeout(id)
  }, [loaded, controls])

  return (
    <section className="hero-section" ref={sectionRef}>

      {/* ── Left content block — exits LEFT on scroll ───────────── */}
      <motion.div className="hero-left-content" style={{ x: mainExitX }}>

        {/* Headline */}
        <div className="hero-h1-area">
          <div>
            <motion.p
              className="hero-eyebrow"
              initial={{ opacity: 0, y: 14 }}
              animate={controls}
              variants={{
                hidden:  { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0,
                  transition: { duration: 0.60, delay: 0.16, ease: EXPO } },
              }}
            >
              Custom Software&nbsp;&bull;&nbsp;AI Systems&nbsp;&bull;&nbsp;Business Automation
            </motion.p>
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
                    transition: { duration: 0.88, delay: 0.30 + i * 0.14, ease: EXPO } },
                }}
              >
                {line.parts.map((p, j) => (
                  <span key={j} className={p.cls}>{p.text}</span>
                ))}
              </motion.span>
            ))}
            </h1>
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
            We build intelligent software, automation, and connected business systems that turn manual processes into scalable digital infrastructure.
          </p>
          <MagneticButton
            className="btn-primary"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            View Our Work
            <svg className="btn-arrow" width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor"
                strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </MagneticButton>
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
                  <span className="stat-num">
                    {counts[i]}<span className="stat-unit">{s.unit}</span>
                  </span>
                  <span className="stat-label">{s.label}<br />{s.sub}</span>
                </div>
              </Fragment>
            ))}
          </motion.div>
        </div>
      </motion.div>

    </section>
  )
}
