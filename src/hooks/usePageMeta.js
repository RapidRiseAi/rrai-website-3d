import { useEffect } from 'react'

/* Per-page document title + meta description (+ matching Open Graph tags).
   SPA-level SEO basics; index.html carries the site-wide defaults. */
export default function usePageMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title
    const setMeta = (attr, key, value) => {
      if (!value) return
      let el = document.head.querySelector(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', value)
    }
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
  }, [title, description])
}
