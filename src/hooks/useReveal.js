import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* Scroll-reveal for inner pages — mirrors the home page's framer-motion entrance
   (expo-out, fade + rise) but driven by one shared IntersectionObserver so no
   page has to wire motion per element.

   Progressive enhancement: the `reveal-on` class is what arms the hidden initial
   state in CSS. We add it in useLayoutEffect (before paint, so there's no
   flash-of-visible-then-hidden) only when motion is allowed. If JS is disabled
   or the user prefers reduced motion, `reveal-on` is never added and every
   section renders fully visible. */

const REVEAL_SELECTOR = [
  '.pg-hero', '.pg-section',
  '.services-hero', '.services-section',
  '.sd-hero', '.sd-section',
  '.legal-head', '.legal-section', '.legal-cta',
  '.placeholder-page',
].join(',')

export default function useReveal() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const root = document.documentElement
    root.classList.add('reveal-on')

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            obs.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -7% 0px' },
    )

    document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [pathname])
}
