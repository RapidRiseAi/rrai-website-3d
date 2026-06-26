import { useState, useRef, useLayoutEffect, useEffect } from 'react'

/* A compact "Starter tier" chip with an (i) button that pops the disclaimer text
   on click — replaces the big inline disclaimer block on the work cards.

   The popover is position:fixed (placed from the button's screen rect) so it can
   never be clipped by a card's overflow:hidden, and it works the same on any
   screen size. It closes on outside click, Escape, scroll, or resize. */

const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11.2v5M12 7.6h.01" />
  </svg>
)

export default function InfoTip({ tagLabel = 'Starter tier', label = 'What this tier means', children }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const popRef = useRef(null)

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const W = Math.min(280, window.innerWidth - 24)
    const left = Math.max(12, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 12))
    // Prefer above the chip; flip below if there isn't room near the top.
    const below = r.top < 190
    setPos({ left, width: W, y: below ? r.bottom + 8 : r.top - 8, below })
  }

  useLayoutEffect(() => {
    if (open) place()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !popRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    const close = () => setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <span className="infotip">
      <button
        ref={btnRef}
        type="button"
        className={`infotip-btn${open ? ' is-open' : ''}`}
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o) }}
      >
        <span className="infotip-tag">{tagLabel}</span>
        <InfoIcon />
      </button>
      {open && pos && (
        <span
          ref={popRef}
          className="infotip-pop"
          role="tooltip"
          style={{
            left: pos.left,
            top: pos.y,
            width: pos.width,
            transform: pos.below ? 'none' : 'translateY(-100%)',
          }}
        >
          {children}
        </span>
      )}
    </span>
  )
}
