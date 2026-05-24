import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const STATS = [
  { num: '50+',  label: ['Projects', 'Delivered'] },
  { num: '100%', label: ['Client', 'Satisfaction'] },
  { num: '24/7', label: ['Support', 'Available'] },
]

export default function HeroSection({ loaded }) {
  const eyebrowRef = useRef()
  const h1Ref      = useRef()
  const subRef     = useRef()
  const ctaRef     = useRef()
  const statsRef   = useRef()

  useEffect(() => {
    if (!loaded) return
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl
      .from(eyebrowRef.current,               { x: -24, opacity: 0, duration: 0.55 },                   0.00)
      .from(Array.from(h1Ref.current.children), { y: 90, opacity: 0, duration: 1.0, stagger: 0.14 },   0.12)
      .from(subRef.current,                   { y: 30, opacity: 0, duration: 0.75 },                    0.58)
      .from(ctaRef.current,                   { y: 20, opacity: 0, duration: 0.6  },                    0.74)
      .from(Array.from(statsRef.current.children), { y: 26, opacity: 0, duration: 0.6, stagger: 0.1 }, 0.88)
  }, [loaded])

  return (
    <section className="hero-section">

      {/* large ghost watermark behind text */}
      <div className="hero-ghost" aria-hidden="true">RAPID RISE</div>

      {/* main text block */}
      <div className="hero-text">

        <div ref={eyebrowRef} className="hero-eyebrow">
          <span className="eyebrow-line" />
          AI-Powered Infrastructure
        </div>

        <h1 ref={h1Ref} className="hero-h1">
          <span>AI &amp; Software</span>
          <span>Solutions</span>
          <span className="hero-gradient">That Scale</span>
        </h1>

        <p ref={subRef} className="hero-sub">
          We don't just build websites, software, AI chatbots, integrations, and
          automations — we specialise in connecting everything through a scalable
          infrastructure, so your entire tech stack lives and grows as one
          unified ecosystem.
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
        </div>

      </div>

      {/* bottom stats bar */}
      <div ref={statsRef} className="hero-stats">
        {STATS.map((s, i) => (
          <div key={i} className={`hero-stat${i > 0 ? ' hero-stat--ruled' : ''}`}>
            <span className="stat-num">{s.num}</span>
            <span className="stat-label">{s.label[0]}<br />{s.label[1]}</span>
          </div>
        ))}
      </div>

    </section>
  )
}
