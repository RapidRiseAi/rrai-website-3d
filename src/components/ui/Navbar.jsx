import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { FIXED_PRICE, CUSTOM_SERVICES } from '../../data/services'

function RRMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="navbar-rr-mark" aria-hidden="true">
      <rect width="30" height="30" rx="7" fill="url(#navbar-rr-g)"/>
      <text x="4" y="21" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="800" fill="white" letterSpacing="-0.5">RR</text>
      <defs>
        <linearGradient id="navbar-rr-g" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1055cc"/>
          <stop offset="1" stopColor="#0da8ec"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function ServicesDropdown() {
  return (
    <div className="nav-dropdown">
      <div className="nav-dropdown-col">
        <div className="nav-dropdown-heading">Fixed Price Products</div>
        {FIXED_PRICE.map(s => (
          <Link key={s.slug} to={`/services/${s.slug}`} className="nav-dropdown-item">
            {s.name}
          </Link>
        ))}
      </div>
      <div className="nav-dropdown-col">
        <div className="nav-dropdown-heading">Custom Services</div>
        {CUSTOM_SERVICES.map(s => (
          <Link key={s.slug} to={`/services/${s.slug}`} className="nav-dropdown-item">
            {s.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Navbar({ loaded }) {
  const navRef  = useRef()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden]     = useState(false)

  useEffect(() => {
    if (!loaded) return
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, delay: 0.1, ease: 'power3.out' }
    )
  }, [loaded])

  // Auto-hide: slide the bar away when scrolling down past the hero, bring it
  // back when scrolling up (or near the top).
  useEffect(() => {
    let lastY = window.scrollY
    const fn = () => {
      const y = window.scrollY
      setScrolled(y > 30)
      if (y < 90) setHidden(false)
      else if (y > lastY + 5) setHidden(true)   // scrolling down
      else if (y < lastY - 5) setHidden(false)  // scrolling up
      lastY = y
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav
      ref={navRef}
      className={`navbar${scrolled ? ' navbar--scrolled' : ''}${hidden ? ' navbar--hidden' : ''}`}
      style={{ opacity: 0 }}
    >
      <div className="navbar-inner">

        <Link to="/" className="navbar-brand">
          <RRMark />
          <span className="navbar-logo">Rapid Rise AI</span>
          <span style={{ fontSize: '9px', opacity: 0.4, marginLeft: 6, letterSpacing: '0.05em', color: '#fff' }}>v0.001</span>
        </Link>

        <div className="navbar-links">
          {/* Services & Pricing — CSS :hover drives the dropdown */}
          <div className="navbar-link-wrap">
            <Link to="/services" className="navbar-link navbar-link--drop">
              Services &amp; Pricing
              <svg className="nav-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <ServicesDropdown />
          </div>

          <Link to="/proof"  className="navbar-link">Proof</Link>
          <Link to="/about"  className="navbar-link">About</Link>
        </div>

        <Link className="navbar-cta-btn" to="/contact">
          Start Your Project
          <svg className="navbar-cta-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

      </div>
    </nav>
  )
}
