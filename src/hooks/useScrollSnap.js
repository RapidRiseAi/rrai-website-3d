import { useEffect, useRef } from 'react'
import { getStopsPx } from '../utils/scrollLayout'

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const STEP_COOLDOWN = 110   // min ms between discrete wheel/key steps
const IDLE_MS       = 150   // quiet period after a native scroll before snapping
const PER_VH_MS     = 650   // animation duration scales with distance
const MIN_DUR       = 300
const MAX_DUR       = 1100

// Snap-scroll controller. Scroll position is the single source of truth (the
// scene + carousel read window.scrollY), so all this does is keep the page
// resting ON a stop:
//   · wheel / arrow keys → step exactly one stop (one card or one section)
//   · scrollbar drag / middle-click autoscroll / touch → free native scroll
//     (which live-scrubs the cards), then snap to the nearest stop when it
//     goes idle. This kills the "stuck halfway / premature scroll" glitches.
export default function useScrollSnap() {
  const rafRef     = useRef(null)
  const animating  = useRef(false)
  const idleTimer  = useRef(null)
  const lastStepAt = useRef(0)
  const targetIdx  = useRef(null)   // stop index the current animation is heading to

  useEffect(() => {
    let stops = getStopsPx()
    const onResize = () => { stops = getStopsPx() }

    const cancelAnim = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      animating.current = false
    }

    const animateTo = (target, idx = null) => {
      cancelAnim()
      targetIdx.current = idx
      const start = window.scrollY
      const dist  = target - start
      if (Math.abs(dist) < 2) return
      const vh  = window.innerHeight || 1
      const dur = Math.min(MAX_DUR, Math.max(MIN_DUR, (Math.abs(dist) / vh) * PER_VH_MS))
      const t0  = performance.now()
      animating.current = true
      const step = (now) => {
        const k = Math.min((now - t0) / dur, 1)
        const y = Math.round(start + dist * easeInOutCubic(k))
        window.scrollTo(0, y)
        if (k < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          rafRef.current = null
          animating.current = false
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    const nearestIndex = (y) => {
      let bi = 0, bd = Infinity
      for (let i = 0; i < stops.length; i++) {
        const d = Math.abs(stops[i] - y)
        if (d < bd) { bd = d; bi = i }
      }
      return bi
    }

    const stepBy = (dir) => {
      const now = performance.now()
      if (now - lastStepAt.current < STEP_COOLDOWN) return
      lastStepAt.current = now
      const wasAnimating = animating.current
      const inFlight = targetIdx.current
      cancelAnim()
      // Stops anchor to real section tops, which can shift as images/fonts
      // load after mount — refresh so a step never targets a stale position.
      stops = getStopsPx()
      let ti
      if (wasAnimating && inFlight != null) {
        // Step RELATIVE to the in-flight target: successive wheel ticks keep
        // advancing through the stops instead of re-targeting the stop the
        // animation was already heading to (which read as "scrolling does
        // nothing" while a snap was in progress).
        ti = inFlight + dir
      } else {
        const y = window.scrollY
        const i = nearestIndex(y)
        if (dir > 0) ti = stops[i] > y + 4 ? i : i + 1
        else         ti = stops[i] < y - 4 ? i : i - 1
      }
      ti = Math.max(0, Math.min(stops.length - 1, ti))
      animateTo(stops[ti], ti)
    }

    const scheduleIdleSnap = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => {
        idleTimer.current = null
        if (animating.current) return
        stops = getStopsPx()
        const i = nearestIndex(window.scrollY)
        if (Math.abs(stops[i] - window.scrollY) > 2) animateTo(stops[i], i)
      }, IDLE_MS)
    }

    const onWheel = (e) => { e.preventDefault(); stepBy(e.deltaY > 0 ? 1 : -1) }

    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); stepBy(1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); stepBy(-1)
      } else if (e.key === 'Home') {
        e.preventDefault(); cancelAnim(); animateTo(stops[0], 0)
      } else if (e.key === 'End') {
        e.preventDefault(); cancelAnim(); animateTo(stops[stops.length - 1], stops.length - 1)
      }
    }

    const onScroll = () => {
      // While our own snap animation runs, every scroll event is ours — ignore
      // them (diffing positions is unreliable: scroll events fire async, so a
      // one-frame lag would look like the user scrolling and abort the snap).
      // The wheel/key handlers cancel the animation directly if the user acts.
      if (animating.current) return
      // A genuine native scroll (scrollbar / middle-click / touch / momentum):
      // let it scrub freely, then snap to the nearest stop once it goes idle.
      scheduleIdleSnap()
    }

    window.addEventListener('wheel',  onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll',  onScroll, { passive: true })
    window.addEventListener('resize',  onResize)

    return () => {
      window.removeEventListener('wheel',  onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll',  onScroll)
      window.removeEventListener('resize',  onResize)
      cancelAnim()
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])
}
