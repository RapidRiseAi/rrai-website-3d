import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function HeroSection() {
  const headingRef = useRef()
  const subRef = useRef()
  const ctaRef = useRef()

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from(headingRef.current, { y: 60, opacity: 0, duration: 1, delay: 0.3 })
      .from(subRef.current, { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
      .from(ctaRef.current, { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
  }, [])

  return (
    <section className="section" style={{ minHeight: '100vh' }}>
      <div className="section__inner">
        <h1 ref={headingRef} style={{ marginBottom: '1.5rem' }}>
          Your 3D<br />
          <span style={{ color: '#6366f1' }}>Interactive</span><br />
          Experience
        </h1>
        <p ref={subRef} style={{ marginBottom: '2.5rem' }}>
          Scroll down to explore. Hover and click the objects above to interact with them.
        </p>
        <div ref={ctaRef}>
          <button
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            style={{
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              padding: '0.9rem 2.2rem',
              borderRadius: '999px',
              fontSize: '1rem',
              cursor: 'pointer',
              pointerEvents: 'auto',
              transition: 'transform 0.2s, background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = '#818cf8'}
            onMouseLeave={e => e.target.style.background = '#6366f1'}
          >
            Scroll to explore
          </button>
        </div>
      </div>
    </section>
  )
}
