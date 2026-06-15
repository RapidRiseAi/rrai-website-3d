import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* On every route change, jump to the top of the page — so navigating to a new
   page (including from footer links while scrolled to the bottom) always starts
   at the top, never mid-page. useLayoutEffect runs before paint to avoid a flash
   of the old scroll position. */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])
  return null
}
