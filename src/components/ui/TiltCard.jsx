import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from 'framer-motion'

/* Interactive 3D tilt surface. Tracks the pointer over the element and rotates it
   in perspective with a spring, plus a soft specular glare that follows the
   cursor — the depth cue that makes cards feel physical / premium. Children can
   add `.tilt-pop` to float forward in 3D (translateZ).

   Respects prefers-reduced-motion (renders a static surface) and is safe on
   touch (no pointer = no tilt). Pass `as`-style props through; `glare={false}`
   to disable the highlight. */
// Touch devices (coarse pointer): no tilt. The 3D rotate was getting nudged by
// synthesized pointer events during a vertical swipe, stretching + clipping the
// card and making the page feel stuck. Static surface there — desktop untouched.
const IS_TOUCH = typeof window !== 'undefined'
  && window.matchMedia && window.matchMedia('(pointer: coarse)').matches

export default function TiltCard({
  children,
  className = '',
  max = 9,
  glare = true,
  ...rest
}) {
  const reduce = useReducedMotion()
  const ref = useRef(null)

  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const sx = useSpring(px, { stiffness: 220, damping: 22, mass: 0.4 })
  const sy = useSpring(py, { stiffness: 220, damping: 22, mass: 0.4 })

  const rotateX = useTransform(sy, [0, 1], [max, -max])
  const rotateY = useTransform(sx, [0, 1], [-max, max])
  const glareX = useTransform(sx, [0, 1], ['0%', '100%'])
  const glareY = useTransform(sy, [0, 1], ['0%', '100%'])
  // Colour + spread are CSS vars so pages can recolour/soften the glare (e.g.
  // inner pages use a deeper, dimmer, more diffuse blue). Defaults keep the
  // original light-blue highlight.
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, var(--glare-color, rgba(160,214,255,0.18)), transparent var(--glare-spread, 46%))`

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => {
    px.set(0.5)
    py.set(0.5)
  }

  if (reduce || IS_TOUCH) {
    return (
      <div className={`tilt-card ${className}`} {...rest}>
        <div className="tilt-card-inner">{children}</div>
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={`tilt-card ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      {...rest}
    >
      <div className="tilt-card-inner">{children}</div>
      {glare && <motion.span className="tilt-glare" aria-hidden="true" style={{ background: glareBg }} />}
    </motion.div>
  )
}
