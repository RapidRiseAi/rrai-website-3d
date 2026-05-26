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

function ServicesDropdown({ onStartClose }) {
  return (
    <div className="nav-dropdown" onMouseLeave={onStartClose}>
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
  const navRef   = useRef()
  const closeRef = useRef()
  const [scrolled,  setScrolled]  = useState(false)
  const [showDrop,  setShowDrop]  = useState(false)

  useEffect(() => {
    if (!loaded) return
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, delay: 0.1, ease: 'power3.out' }
    )
  }, [loaded])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const openDrop   = () => { clearTimeout(closeRef.current); setShowDrop(true) }
  const startClose = () => { closeRef.current = setTimeout(() => setShowDrop(false), 160) }

  return (
    <nav ref={navRef} className={`navbar${scrolled ? ' navbar--scrolled' : ''}`} style={{ opacity: 0 }}>
      <div className="navbar-inner">

        <Link to="/" className="navbar-brand">
          <RRMark />
          <span className="navbar-logo">Rapid Rise AI</span>
        </Link>

        <div className="navbar-links">
          {/* Services & Pricing — has dropdown */}
          <div
            className="navbar-link-wrap"
            onMouseEnter={openDrop}
            onMouseLeave={startClose}
          >
            <Link to="/services" className="navbar-link navbar-link--drop" onClick={() => setShowDrop(false)}>
              Services &amp; Pricing
              <svg className={`nav-chevron${showDrop ? ' nav-chevron--open' : ''}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            {showDrop && <ServicesDropdown onStartClose={startClose} />}
          </div>

          <Link to="/proof"  className="navbar-link">Proof</Link>
          <Link to="/about"  className="navbar-link">About</Link>
        </div>

        <button className="navbar-cta-btn">
          Request a Quote
          <svg className="navbar-cta-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

      </div>
    </nav>
  )
}
