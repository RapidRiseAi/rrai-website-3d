import { useEffect } from 'react'

/* Cursor-following edge glow. One delegated pointer listener tracks the cursor
   inside whichever card is under it and writes its relative position to CSS vars
   (--mx, --my) plus a --spot flag. The card's masked border gradient (in
   index.css) then lights a bright spot at that point, so the edge glows where the
   cursor is and fades as it leaves. Independent of the 3D tilt — both read the
   pointer, neither touches the other. Pointer-fine only (no touch). */

const SEL = '.glass-card, .sd2-pkg, .ct2-form-panel'

export default function EdgeSpotlight() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let current = null
    let raf = 0
    let evt = null

    const clear = () => {
      if (current) {
        current.style.setProperty('--spot', '0')
        current = null
      }
    }

    const apply = () => {
      raf = 0
      const e = evt
      if (!e) return
      const card = e.target?.closest?.(SEL) || null
      if (current && current !== card) clear()
      if (card) {
        const r = card.getBoundingClientRect()
        const x = ((e.clientX - r.left) / r.width) * 100
        const y = ((e.clientY - r.top) / r.height) * 100
        card.style.setProperty('--mx', `${x.toFixed(1)}%`)
        card.style.setProperty('--my', `${y.toFixed(1)}%`)
        card.style.setProperty('--spot', '1')
        current = card
      }
    }

    const onMove = (e) => {
      evt = e
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const onOut = (e) => { if (!e.relatedTarget) clear() }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onOut)
      cancelAnimationFrame(raf)
      clear()
    }
  }, [])

  return null
}
