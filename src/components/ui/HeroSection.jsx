import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const STATS = [
  { num: '50',  unit: '+',   label: 'Projects Delivered' },
  { num: '100', unit: '%',   label: 'Client Satisfaction' },
  { num: '24',  unit: '/7',  label: 'Support Available' },
]

export default function HeroSection({ loaded }) {
  const statusRef = useRef()
  const h1Ref     = useRef()
  const subRef    = useRef()
  const ctaRef    = useRef()
  const statsRef  = useRef()

  useEffect(() => {
    if (!loaded) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl
      .from(statusRef.current,                       { x: -20, opacity: 0, duration: 0.55 },                       0.00)
      .from(Array.from(h1Ref.current.children),      { y: 90,  opacity: 0, duration: 1.0,  stagger: 0.13 },        0.10)
      .from(subRef.current,                          { y: 30,  opacity: 0, duration: 0.75 },                       0.58)
      .from(Array.from(ctaRef.current.children),     { y: 20,  opacity: 0, duration: 0.55, stagger: 0.08 },        0.72)
      .from(Array.from(statsRef.current.children),   { y: 28,  opacity: 0, duration: 0.65, stagger: 0.1  },        0.86)
  }, [loaded])

  return (
    <section className="hero-section">

      {/* large ghost watermark */}
      <div className="hero-ghost" aria-hidden="true">RAPID&nbsp;RISE</div>

      {/* film grain overlay */}
      <div className="hero-grain" aria-hidden="true" />

      {/* main text */}
      <div className="hero-text">

        <div ref={statusRef} className="hero-status">
          <span className="status-pulse">
            <span className="status-dot-core" />
            <span className="status-dot-ring" />
          </span>
          Accepting Projects · Q1 2026
        </div>

        <h1 ref={h1Ref} className="hero-h1">
          <span className="h1-line h1-bold">AI &amp; Software</span>
          <span className="h1-line h1-italic">Solutions</span>
          <span className="h1-line h1-accent">That Scale</span>
        </h1>

        <p ref={subRef} className="hero-sub">
          We don't just build websites, software, AI chatbots, integrations, and
          automations — we specialise in <em>connecting&nbsp;everything</em> through
          scalable infrastructure, so your entire tech stack lives and grows as
          one unified ecosystem.
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
            <span className="btn-ghost-dot" />
            Watch Demo
          </button>
        </div>

      </div>

      {/* stats */}
      <div ref={statsRef} className="hero-stats">
        {STATS.map((s, i) => (
          <div key={i} className="stat">
            <span className="stat-num">
              {s.num}<span className="stat-unit">{s.unit}</span>
            </span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

    </section>
  )
}
