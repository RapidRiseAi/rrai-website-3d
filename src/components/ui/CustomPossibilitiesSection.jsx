import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CUSTOM_SECTION_COPY, possibilityChips } from '../../data/customSolutions'

/* ── Icons (thin line style, consistent with the rest of the site) ──────────
   Keyed by the `icon` strings used in src/data/customSolutions.js. */
const ICONS = {
  code: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8.5 7.5-4.5 4.5 4.5 4.5M15.5 7.5l4.5 4.5-4.5 4.5" />
    </svg>
  ),
  user: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.8" /><path d="M5.4 20a6.6 6.6 0 0 1 13.2 0" />
    </svg>
  ),
  bars: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20.5v-6M12 20.5v-11M19 20.5V7" />
    </svg>
  ),
  chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13.5a2.4 2.4 0 0 1-2.4 2.4H9l-4.5 3.4.02-3.4A2.4 2.4 0 0 1 4 13.5v-6A2.4 2.4 0 0 1 6.4 5.1h11.2A2.4 2.4 0 0 1 20 7.5z" />
    </svg>
  ),
  bolt: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />
    </svg>
  ),
  calc: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2.5" width="14" height="19" rx="2" /><path d="M9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" />
    </svg>
  ),
  calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  ),
  route: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" />
    </svg>
  ),
  file: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5z" /><path d="M14 2.5V7.5h5" />
    </svg>
  ),
  checklist: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 6.5 1.5 1.5L8 5.5M4 12.5l1.5 1.5L8 11.5M4 18.5l1.5 1.5L8 17.5" /><path d="M11.5 7h9M11.5 13h9M11.5 19h9" />
    </svg>
  ),
  menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  flow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><path d="M10 6.5h7.5v4M14 17.5H6.5v-4" />
    </svg>
  ),
  wrench: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 6.5a4 4 0 0 0-5.6 4.9L3 17.3V21h3.7l5.9-5.9a4 4 0 0 0 4.9-5.6L14.6 12l-2.6-2.6z" />
    </svg>
  ),
  spark: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5 13.6 10 19 11.5 13.6 13 12 18.5 10.4 13 5 11.5 10.4 10z" />
    </svg>
  ),
  chip: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" />
    </svg>
  ),
  bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 9.5a6 6 0 0 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5" /><path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </svg>
  ),
  globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18" />
    </svg>
  ),
  funnel: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5h18l-7 8.2V20l-4-2v-5.3z" />
    </svg>
  ),
  shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8 7.5 10 4.3-2 7.5-5.4 7.5-10v-6z" /><path d="m8.8 11.8 2.3 2.3 4.1-4.4" />
    </svg>
  ),
  layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2.5 9 5-9 5-9-5z" /><path d="m3 12.5 9 5 9-5M3 17.5l9 5 9-5" />
    </svg>
  ),
  search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-4.4-4.4" />
    </svg>
  ),
  book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.5c-1.6-1.6-3.9-2-6.5-2-.9 0-1.7.1-2.5.3v14.4c.8-.2 1.6-.3 2.5-.3 2.6 0 4.9.5 6.5 2 1.6-1.5 3.9-2 6.5-2 .9 0 1.7.1 2.5.3V4.8c-.8-.2-1.6-.3-2.5-.3-2.6 0-4.9.4-6.5 2z" /><path d="M12 6.5V21" />
    </svg>
  ),
  users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.6" /><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0" /><path d="M16 4.9a3.6 3.6 0 0 1 0 6.5M18.2 15.2a6.5 6.5 0 0 1 3.3 5.3" />
    </svg>
  ),
}
const iconFor = (key) => ICONS[key] ?? ICONS.spark

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7.5h11M8 3l4.5 4.5L8 12" />
  </svg>
)

/* Trust-line icons (check circle / shield / star, matching the mockup) */
const TrustCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="m8.2 12.3 2.5 2.5 5.1-5.4" />
  </svg>
)
const TrustShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8 7.5 10 4.3-2 7.5-5.4 7.5-10v-6z" /><path d="m8.8 11.8 2.3 2.3 4.1-4.4" />
  </svg>
)
const TrustStarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.9z" />
  </svg>
)

/* How many chips from the possibilityChips library ride the horizon arc. */
const HORIZON_CHIP_COUNT = 12
/* Reduced-motion fallback shows the same set as static rows (6 per row). */
const STATIC_CHIP_COUNT = 12

const EASE = [0.16, 1, 0.3, 1]
const inView = { once: true, amount: 0.2, margin: '-60px' }

/* ── Horizon orbit ───────────────────────────────────────────────────────────
   Chips live on a virtual loop longer than the visible stage. One rAF loop
   advances a phase per lane and maps every chip to: x along the stage,
   y/tilt/scale from the arc curve, opacity from the edge-fade window.
   Transforms + opacity only — no layout writes, no React re-renders. */
const LANE_SPECS = [
  { dir: -1, speed: 26, tilt: 8, scaleEdge: 0.09, fadeEdge: 0.12, baseScale: 1, baseFade: 1 },
  { dir: 1, speed: 19, tilt: 6, scaleEdge: 0.08, fadeEdge: 0.14, baseScale: 0.95, baseFade: 0.94 },
]

const MIN_CHIP_GAP = 18 /* px between chips on the loop */
const EDGE_FADE_ZONE = 0.14 /* outer fraction of the half-stage where chips fade */
const HOVER_SPEED_MULT = 0.35 /* lane speed while the pointer rests on the band */

/* Compact laptop heights shrink the chip lanes via CSS media queries (940px /
   800px breakpoints) — the arc drop must shrink in step or edge chips overflow
   their lane and collide with the row below. Keep in sync with index.css. */
const heightScale = () => {
  const h = typeof window === 'undefined' ? 1000 : window.innerHeight
  /* <= matches the inclusive CSS max-height media queries exactly */
  return h <= 800 ? 0.62 : h <= 940 ? 0.8 : 1
}

/* Arc depth per lane, flattened as the stage narrows or the viewport shortens */
const arcDrop = (width, lane) => {
  const base = (width < 640 ? [16, 12] : width < 1100 ? [42, 30] : [72, 52])[lane]
  return width < 1100 ? base : base * heightScale()
}

const smooth01 = (v) => {
  const t = Math.min(Math.max(v, 0), 1)
  return t * t * (3 - 2 * t)
}

/* Live subscription — framer's useReducedMotion reads the preference once at
   mount, so a mid-session OS toggle would never swap the orbit out. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function HorizonOrbit({ rows }) {
  const wrapRef = useRef(null)
  const chipEls = useRef(rows.map(() => []))

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined

    const lanes = LANE_SPECS.map((spec, li) => ({
      spec,
      els: chipEls.current[li].filter(Boolean),
      offsets: [],
      loop: 1,
      drop: 0,
      speed: spec.speed,
      phase: 0,
    }))
    let stageHalf = 0
    let speedMult = 1
    let targetMult = 1
    let raf = 0
    let last = 0
    let disposed = false

    /* Distribute chips around the loop with equal gaps based on real widths,
       so they never overlap; the loop always exceeds the stage so the mod
       wrap happens off-screen — the cycle restarts without a visible jump. */
    const measure = () => {
      const width = wrap.clientWidth
      stageHalf = width / 2
      lanes.forEach((lane, li) => {
        const widths = lane.els.map((el) => el.offsetWidth)
        const total = widths.reduce((sum, w) => sum + w, 0)
        lane.loop = Math.max(width * 1.15, total + widths.length * MIN_CHIP_GAP)
        const gap = (lane.loop - total) / (widths.length || 1)
        let cursor = 0
        lane.offsets = widths.map((w) => {
          const center = cursor + w / 2
          cursor += w + gap
          return center
        })
        lane.drop = arcDrop(width, li)
        lane.speed = lane.spec.speed * (width < 640 ? 0.75 : 1)
      })
    }

    const render = () => {
      lanes.forEach((lane) => {
        const { spec } = lane
        lane.els.forEach((el, i) => {
          let p = (lane.offsets[i] + lane.phase) % lane.loop
          if (p < 0) p += lane.loop
          const x = p - lane.loop / 2
          const u = stageHalf > 0 ? x / stageHalf : 0
          const au = Math.abs(u)
          if (au > 1.05) {
            el.style.visibility = 'hidden'
            return
          }
          const cu = Math.min(au, 1)
          const edge = smooth01((1 - cu) / EDGE_FADE_ZONE)
          const y = lane.drop * cu * cu
          const tilt = spec.tilt * Math.max(-1, Math.min(1, u))
          const scale = spec.baseScale * (1 - spec.scaleEdge * cu)
          el.style.visibility = 'visible'
          el.style.opacity = (spec.baseFade * (1 - spec.fadeEdge * cu) * edge).toFixed(3)
          el.style.transform =
            `translate(calc(${x.toFixed(1)}px - 50%), ${y.toFixed(1)}px) ` +
            `rotate(${tilt.toFixed(2)}deg) scale(${scale.toFixed(3)})`
        })
      })
    }

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.064) /* tame tab-restore jumps */
      last = now
      speedMult += (targetMult - speedMult) * Math.min(1, dt * 4)
      lanes.forEach((lane) => {
        lane.phase = (lane.phase + dt * lane.speed * speedMult * lane.spec.dir) % lane.loop
      })
      render()
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    measure()
    render()

    /* Only animate while the band is on screen */
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start()
      else stop()
    })
    io.observe(wrap)

    const ro = new ResizeObserver(() => {
      measure()
      render()
    })
    ro.observe(wrap)
    /* RO above only fires on wrap WIDTH changes; the arc drop also depends on
       window HEIGHT (compact-laptop scale), so re-measure on window resize. */
    const onWinResize = () => {
      measure()
      render()
    }
    window.addEventListener('resize', onWinResize)
    document.fonts?.ready?.then(() => {
      if (disposed) return
      measure()
      render()
    })

    const slow = () => { targetMult = HOVER_SPEED_MULT }
    const restore = () => { targetMult = 1 }
    wrap.addEventListener('pointerenter', slow)
    wrap.addEventListener('pointerleave', restore)

    return () => {
      disposed = true
      stop()
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('resize', onWinResize)
      wrap.removeEventListener('pointerenter', slow)
      wrap.removeEventListener('pointerleave', restore)
    }
  }, [])

  return (
    <motion.div
      ref={wrapRef}
      className="cp-lanes"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={inView}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {rows.map((row, li) => (
        <div key={li} className={`cp-lane cp-lane--${li === 0 ? 'a' : 'b'}`}>
          {row.map((chip, i) => {
            const Icon = iconFor(chip.icon)
            return (
              <span
                key={chip.label}
                ref={(el) => { chipEls.current[li][i] = el }}
                className="cp-chip cp-chip--orbit"
                style={{ visibility: 'hidden' }}
                title={chip.category}
              >
                <span className="cp-chip-inner">
                  <Icon />
                  {chip.label}
                </span>
              </span>
            )
          })}
        </div>
      ))}
    </motion.div>
  )
}

/* Planet-horizon arc placement for the static reduced-motion fallback
   (flattened by the ≤1100px media query). */
function arcStyle(i, n, { drop, tilt, scaleEdge, fadeEdge, baseScale = 1, baseFade = 1 }) {
  const t = n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0
  return {
    '--cp-drop': `${(drop * t * t).toFixed(1)}px`,
    '--cp-tilt': `${(tilt * t).toFixed(2)}deg`,
    '--cp-scale': (baseScale * (1 - scaleEdge * Math.abs(t))).toFixed(3),
    '--cp-fade': (baseFade * (1 - fadeEdge * Math.abs(t))).toFixed(3),
  }
}

/* Static chip — shown only when the user prefers reduced motion. The entrance
   fade lives on the inner span so the outer keeps its CSS arc fade
   (framer leaves a persistent inline opacity that would override it). */
function PossibilityChip({ chip, style, index }) {
  const Icon = iconFor(chip.icon)
  return (
    <span className="cp-chip" style={style} title={chip.category}>
      <motion.span
        className="cp-chip-inner"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={inView}
        transition={{ duration: 0.45, delay: 0.05 + index * 0.03, ease: EASE }}
      >
        <Icon />
        {chip.label}
      </motion.span>
    </span>
  )
}

export default function CustomPossibilitiesSection() {
  const reducedMotion = usePrefersReducedMotion()
  const horizonChips = possibilityChips.slice(
    0,
    reducedMotion ? STATIC_CHIP_COUNT : HORIZON_CHIP_COUNT,
  )
  const rowA = horizonChips.slice(0, Math.ceil(horizonChips.length / 2))
  const rowB = horizonChips.slice(Math.ceil(horizonChips.length / 2))

  return (
    <section className="cp-section" aria-label="Custom solutions we can build">
      <div className="cp-container">
        <motion.header
          className="cp-head"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={inView}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="cp-eyebrow">{CUSTOM_SECTION_COPY.eyebrow}</p>
          <h2 className="cp-title">
            {CUSTOM_SECTION_COPY.title.replace(/\?$/, '')}<span className="cp-dot">?</span>
          </h2>
          <p className="cp-sub">{CUSTOM_SECTION_COPY.sub}</p>
        </motion.header>

        {/* Possibility horizon — chips orbit the curved band, fading at the edges */}
        <div className="cp-stage">
          {reducedMotion ? (
            <>
              <div className="cp-row cp-row--a">
                {rowA.map((chip, i) => (
                  <PossibilityChip
                    key={chip.label}
                    chip={chip}
                    index={i}
                    style={arcStyle(i, rowA.length, { drop: 72, tilt: 8, scaleEdge: 0.09, fadeEdge: 0.12 })}
                  />
                ))}
              </div>
              <div className="cp-row cp-row--b">
                {rowB.map((chip, i) => (
                  <PossibilityChip
                    key={chip.label}
                    chip={chip}
                    index={i + rowA.length}
                    style={arcStyle(i, rowB.length, { drop: 52, tilt: 6, scaleEdge: 0.08, fadeEdge: 0.14, baseScale: 0.95, baseFade: 0.94 })}
                  />
                ))}
              </div>
            </>
          ) : (
            <HorizonOrbit rows={[rowA, rowB]} />
          )}
          <div className="cp-horizon" aria-hidden="true" />
        </div>

        {/* CTA card: the visual destination of the section, inside the arc */}
        <motion.div
          className="cp-cta"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0, margin: '0px 0px 30% 0px' }}
          transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
        >
          <span className="cp-cta-badge" aria-hidden="true">
            {ICONS.users()}
          </span>
          <h3 className="cp-cta-title">Need a system built around your workflow?</h3>
          <p className="cp-cta-sub">
            Tell us what you need to improve. Whether it&rsquo;s client
            communication, admin, reporting, bookings, or operations,
            we&rsquo;ll help shape the right custom solution.
          </p>
          <div className="cp-cta-actions">
            <Link className="cp-btn-primary" to="/contact">
              Tell Us What You Need
              <ArrowIcon />
            </Link>
            <button
              className="cp-btn-ghost"
              type="button"
              onClick={() => {
                document.querySelector('.fp-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              See Pricing
            </button>
          </div>
          <p className="cp-cta-trust">
            <span className="cp-cta-trust-item">
              <TrustCheckIcon />
              Free consultation
            </span>
            <span className="cp-cta-trust-dot" aria-hidden="true">•</span>
            <span className="cp-cta-trust-item">
              <TrustShieldIcon />
              No pressure
            </span>
            <span className="cp-cta-trust-dot" aria-hidden="true">•</span>
            <span className="cp-cta-trust-item">
              <TrustStarIcon />
              Tailored recommendation
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
