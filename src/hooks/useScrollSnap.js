import { useEffect, useRef } from 'react'
import { tryCarouselAdvance } from '../utils/carouselControl'

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const DURATION   = 2000
const CARD_LOCK  = 1100

export default function useScrollSnap() {
  const lockRef = useRef(false)
  const rafRef  = useRef(null)

  useEffect(() => {
    const getSections = () =>
      Array.from(document.querySelectorAll('#scroll-content section'))

    const scrollTo = (target) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      const start     = window.scrollY
      const distance  = target - start
      const startTime = performance.now()

      const step = (now) => {
        const progress = Math.min((now - startTime) / DURATION, 1)
        window.scrollTo(0, start + distance * easeInOutCubic(progress))
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          lockRef.current = false
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    const snapTo = (direction) => {
      if (lockRef.current) return
      const sections = getSections()
      if (!sections.length) return

      const scrollY = window.scrollY
      const vh      = window.innerHeight

      let currentIndex = 0
      for (let i = 0; i < sections.length; i++) {
        if (scrollY >= sections[i].offsetTop - vh * 0.3) currentIndex = i
      }

      // If current section is a carousel, try advancing cards first
      const currentSection = sections[currentIndex]
      if (currentSection && currentSection.hasAttribute('data-carousel')) {
        const consumed = tryCarouselAdvance(direction)
        if (consumed) {
          lockRef.current = true
          setTimeout(() => { lockRef.current = false }, CARD_LOCK)
          return
        }
        // carousel exhausted — fall through to page snap
      }

      const targetIndex =
        direction > 0
          ? Math.min(currentIndex + 1, sections.length - 1)
          : Math.max(currentIndex - 1, 0)

      if (targetIndex === currentIndex) return

      lockRef.current = true
      scrollTo(sections[targetIndex].offsetTop)
    }

    const onWheel = (e) => {
      e.preventDefault()
      snapTo(e.deltaY)
    }

    let touchStartY = 0
    const onTouchStart = (e) => { touchStartY = e.touches[0].clientY }
    const onTouchEnd   = (e) => {
      const delta = touchStartY - e.changedTouches[0].clientY
      if (Math.abs(delta) > 40) snapTo(delta)
    }

    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); snapTo(1) }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); snapTo(-1) }
    }

    window.addEventListener('wheel',      onWheel,      { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    window.addEventListener('keydown',    onKeyDown)

    return () => {
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
      window.removeEventListener('keydown',    onKeyDown)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])
}
