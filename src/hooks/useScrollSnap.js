import { useEffect, useRef } from 'react'
import { getStopsPx, CARD_VH, N_CARDS } from '../utils/scrollLayout'

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const PER_VH_MS    = 580    // snap-animation duration scales with distance
const MIN_DUR      = 260
const MAX_DUR      = 1000
const IDLE_MS      = 150    // quiet period after a native scroll before snapping

// ── Gesture model (the important bit for trackpads) ──────────────────────────
// A laptop trackpad emits a long BURST of wheel events for a single swipe (the
// flick + its inertial momentum tail). Stepping per-event blew through several
// cards/sections at once. Instead we treat one burst as ONE gesture:
//   · a new gesture (silence gap, direction flip, or a re-acceleration spike
//     mid-momentum) fires exactly ONE step immediately → responsive + one-by-one
//   · a SUSTAINED gesture (held > LONG_MS) keeps advancing one extra CARD every
//     LONG_MS, but only while it stays inside Section-2's cards → a long scroll
//     moves 2 cards at 0.7s, more for longer, and NEVER crosses a section
//     boundary in a single gesture (so a section can't be skipped)
//   · "release & reengage": the moment the burst goes quiet (or the user clearly
//     swipes again over the momentum tail) the next gesture fires straight away,
//     so quick repeated flicks step quickly instead of feeling locked out.
const GESTURE_GAP  = 150    // ms of wheel silence that ends a gesture
const LONG_MS      = 700    // sustained-hold before each extra card step
const REACCEL      = 1.7    // delta spike vs the decaying tail = a fresh swipe
const MIN_STEP_GAP = 60     // hard floor between two fired steps (anti double-fire)
// A step that crosses a SECTION boundary (anything other than card→card) can only
// happen this often. Card stepping is never throttled (stays fully responsive); this
// purely guarantees a single fast scroll can't blow through a whole section even if
// stray timing splits one physical swipe into several detected gestures.
const SECTION_GUARD = 340

// Snap-scroll controller. Scroll position is the single source of truth (the
// scene + carousel read window.scrollY), so all this does is keep the page
// resting ON a stop and govern HOW the wheel walks between stops.
export default function useScrollSnap() {
  const rafRef     = useRef(null)
  const animating  = useRef(false)
  const idleTimer  = useRef(null)
  const lastStepAt = useRef(0)
  const lastCrossAt = useRef(-1e9)  // last time a step crossed a SECTION boundary
  const targetIdx  = useRef(null)   // stop index the current animation is heading to
  const g          = useRef({ lastT: -1e9, dir: 0, startT: 0, nextLongAt: Infinity, peak: 0, prevAd: 0, decaying: false })

  useEffect(() => {
    let stops = getStopsPx()
    const onResize = () => { stops = getStopsPx() }
    const cycleEnd = 1 + (N_CARDS - 1) * CARD_VH        // viewport units where the card plateau ends

    // Is stop index `i` one of the Section-2 carousel cards (vs a section top)?
    const isCard = (i) => {
      if (i < 0 || i >= stops.length) return false
      const v = stops[i] / (window.innerHeight || 1)
      return v >= 0.6 && v <= cycleEnd + 0.4
    }

    const clampIdx = (i) => Math.max(0, Math.min(stops.length - 1, i))

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
        window.scrollTo(0, Math.round(start + dist * easeInOutCubic(k)))
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

    // Where one step in `dir` should land — relative to the in-flight target if a
    // snap is mid-animation (so chained steps keep advancing through the stops
    // instead of re-targeting the stop we're already heading to).
    const currentIdx = () =>
      (animating.current && targetIdx.current != null) ? targetIdx.current : nearestIndex(window.scrollY)

    const resolveStep = (dir) => {
      if (animating.current && targetIdx.current != null) return clampIdx(targetIdx.current + dir)
      const y = window.scrollY, i = nearestIndex(y)
      const ti = dir > 0 ? (stops[i] > y + 4 ? i : i + 1) : (stops[i] < y - 4 ? i : i - 1)
      return clampIdx(ti)
    }

    // Fire one step in `dir`. Returns true if it actually moved.
    const fireStep = (dir) => {
      const now = performance.now()
      if (now - lastStepAt.current < MIN_STEP_GAP) return false
      stops = getStopsPx()   // section tops can shift as fonts/images load — refresh
      const cur = currentIdx()
      const ti  = resolveStep(dir)
      if (ti === cur) return false   // already at an end
      // A boundary cross is anything other than card→card. Throttle it so a single
      // fast scroll (even one split into several detected gestures by stray timing)
      // can never walk through more than one section. Card stepping is untouched.
      const crosses = !(isCard(cur) && isCard(ti))
      if (crosses && now - lastCrossAt.current < SECTION_GUARD) return false
      lastStepAt.current = now
      if (crosses) lastCrossAt.current = now
      animateTo(stops[ti], ti)
      return true
    }

    // The sustained-hold extra step: only fires when BOTH the current card and the
    // next one are carousel cards, so a long scroll advances cards but a single
    // gesture can never cross out of (or skip) a section.
    const fireCardStep = (dir) => {
      stops = getStopsPx()
      const cur = currentIdx()
      if (!isCard(cur) || !isCard(cur + dir)) return false
      return fireStep(dir)
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

    const onWheel = (e) => {
      e.preventDefault()
      const now = performance.now()
      const d = e.deltaY
      if (Math.abs(d) < 1) return
      const dir = d > 0 ? 1 : -1, ad = Math.abs(d), gap = now - g.current.lastT

      // New gesture? — a clear silence gap, a direction flip, or a delta spike
      // that re-accelerates well above the decaying momentum tail (a fresh flick
      // laid over the previous swipe's inertia).
      let isNew = false
      if (gap > GESTURE_GAP) isNew = true
      else if (dir !== g.current.dir) isNew = true
      else if (g.current.decaying && ad > g.current.prevAd * REACCEL && ad > 8) isNew = true
      g.current.lastT = now

      if (isNew) {
        g.current.dir = dir
        g.current.startT = now
        g.current.peak = ad
        g.current.prevAd = ad
        g.current.decaying = false
        // schedule the first extra card step LONG_MS into a sustained hold
        g.current.nextLongAt = now + LONG_MS
        fireStep(dir)
      } else {
        if (ad > g.current.peak) g.current.peak = ad
        if (ad < g.current.peak * 0.55) g.current.decaying = true
        // Sustained hold → advance one more CARD per LONG_MS (clamped to cards).
        if (now >= g.current.nextLongAt) {
          g.current.nextLongAt += LONG_MS
          fireCardStep(dir)
        }
        g.current.prevAd = ad
      }
    }

    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); fireStep(1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); fireStep(-1)
      } else if (e.key === 'Home') {
        e.preventDefault(); stops = getStopsPx(); animateTo(stops[0], 0)
      } else if (e.key === 'End') {
        e.preventDefault(); stops = getStopsPx(); animateTo(stops[stops.length - 1], stops.length - 1)
      }
    }

    const onScroll = () => {
      // While our own snap animation runs, every scroll event is ours — ignore.
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
