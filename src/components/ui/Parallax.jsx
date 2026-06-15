import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/* Scroll-linked parallax. As the element travels through the viewport its
   children drift vertically (and optionally fade/scale), creating layered depth.
   `speed` is the total px of travel (positive = moves up as you scroll down).
   Use on decorative / accent layers, not on body copy. Disabled for reduced
   motion. */
export default function Parallax({
  children,
  className = '',
  speed = 60,
  fade = false,
  scale = false,
  ...rest
}) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed])
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.3, 1, 1, 0.3])
  const s = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.94])

  if (reduce) {
    return (
      <div ref={ref} className={className} {...rest}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y, ...(fade ? { opacity } : {}), ...(scale ? { scale: s } : {}) }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
