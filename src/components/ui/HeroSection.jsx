import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const STATS = [
  { icon: 'projects',     num: '50',  unit: '+', label: 'Projects Delivered',  sub: 'Web, AI & integrations' },
  { icon: 'satisfaction', num: '100', unit: '%', label: 'Client Satisfaction',  sub: 'Across all engagements' },
  { icon: 'support',      num: '24',  unit: '/7', label: 'Support Available',   sub: 'Round-the-clock assistance' },
]

function StatIcon({ type }) {
  if (type === 'projects') return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2 7.5l3.5 3.5 7.5-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (type === 'satisfaction') return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1.5l1.5 4.5H14l-3.8 2.8 1.5 4.5-3.7-2.7-3.7 2.7 1.5-4.5L2 6h5L7.5 1.5z" fill="currentColor"/>
    </svg>
  )
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7.5 4.5v3.2l2 1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function HeroSection({ loaded }) {
  const panelRef   = useRef()
  const eyebrowRef = useRef()
  const h1Ref      = useRef()
  const subRef     = useRef()
  const ctaRef     = useRef()
  const statsRef   = useRef()
  const linesRef   = useRef()

  useEffect(() => {
    if (!loaded) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl
      .from(panelRef.current,                        { opacity: 0, y: 24, scale: 0.985, duration: 0.90 }, 0.00)
      .from(eyebrowRef.current,                      { y: 14, opacity: 0, duration: 0.55 },               0.22)
      .from(Array.from(h1Ref.current.children),      { y: 68, opacity: 0, duration: 0.88, stagger: 0.12}, 0.32)
      .from(subRef.current,                          { y: 20, opacity: 0, duration: 0.66 },               0.68)
      .from(Array.from(ctaRef.current.children),     { y: 15, opacity: 0, duration: 0.50, stagger: 0.09}, 0.82)
      .from(statsRef.current,                        { y: 14, opacity: 0, duration: 0.52 },               0.96)
      .from(linesRef.current,                        { opacity: 0, duration: 0.80 },                      0.80)
  }, [loaded])

  return (
    <section className="hero-section">

      <div className="hero-ghost" aria-hidden="true">RR</div>

      {/* animated circuit connection lines — panel right edge → orb */}
      <svg ref={linesRef} className="hero-connect" viewBox="0 0 1440 900"
        preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="cg-h" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2080ff" stopOpacity="0.82"/>
            <stop offset="100%" stopColor="#2080ff" stopOpacity="0"/>
          </linearGradient>
          <filter id="cg-glow" x="-10%" y="-600%" width="120%" height="1300%">
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* upper circuit line */}
        <path d="M 790 245 H 845 L 890 215 H 985"
          stroke="url(#cg-h)" strokeWidth="1" fill="none"
          filter="url(#cg-glow)" className="conn-path"/>
        {/* mid-upper line */}
        <path d="M 790 335 H 875 L 915 310 H 1020"
          stroke="url(#cg-h)" strokeWidth="1" fill="none"
          filter="url(#cg-glow)" className="conn-path conn-path--d1"/>
        {/* straight horizontal mid */}
        <path d="M 790 395 H 1000"
          stroke="url(#cg-h)" strokeWidth="0.8" fill="none"
          opacity="0.45" className="conn-path conn-path--d2"/>
        {/* lower circuit line */}
        <path d="M 790 458 H 840 L 885 484 H 975"
          stroke="url(#cg-h)" strokeWidth="1" fill="none"
          filter="url(#cg-glow)" className="conn-path conn-path--d3"/>

        {/* node dots — exit points on panel edge */}
        <circle cx="790" cy="245" r="3"   fill="#2a8aff" className="conn-dot"/>
        <circle cx="790" cy="335" r="3"   fill="#2a8aff" className="conn-dot conn-dot--d1"/>
        <circle cx="790" cy="395" r="2.2" fill="#2a8aff" className="conn-dot conn-dot--d2"/>
        <circle cx="790" cy="458" r="3"   fill="#2a8aff" className="conn-dot conn-dot--d3"/>
      </svg>

      {/* large glass command panel */}
      <div ref={panelRef} className="hero-panel">

        <div ref={eyebrowRef} className="hero-eyebrow">
          Connected Intelligence. Real Business Impact.
        </div>

        <h1 ref={h1Ref} className="hero-h1">
          <span className="h1-line h1-bold">AI, Software, and</span>
          <span className="h1-line h1-bold">Connected Systems</span>
          <span className="h1-line h1-accent">Built for Growth</span>
        </h1>

        <p ref={subRef} className="hero-sub">
          We build intelligent software, AI systems, and seamless integrations
          that help modern businesses move faster, operate smarter,
          and scale without limits.
        </p>

        <div ref={ctaRef} className="hero-cta">
          <button
            className="btn-primary"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            View Our Work
            <svg className="btn-arrow" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 7.5h11M8 3l4.5 4.5L8 12" stroke="currentColor"
                strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="btn-ghost">
            <span className="btn-play-icon">
              <svg width="9" height="11" viewBox="0 0 9 11" fill="none">
                <path d="M1.5 1.5l6.5 4-6.5 4V1.5z" fill="currentColor" stroke="currentColor" strokeWidth="0.6" strokeLinejoin="round"/>
              </svg>
            </span>
            Watch Demo
          </button>
        </div>

        {/* stats strip — flush inside panel bottom */}
        <div ref={statsRef} className="hero-stats">
          {STATS.map((s, i) => (
            <div key={i} className="stat">
              {i > 0 && <div className="stat-divider" aria-hidden="true" />}
              <div className="stat-icon-wrap"><StatIcon type={s.icon} /></div>
              <div className="stat-content">
                <span className="stat-num">{s.num}<span className="stat-unit">{s.unit}</span></span>
                <span className="stat-label">{s.label}</span>
                <span className="stat-sub">{s.sub}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </section>
  )
}
