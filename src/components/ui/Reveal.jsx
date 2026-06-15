import { motion, useReducedMotion } from 'framer-motion'

/* Scroll entrance with real 3D depth. Elements rise and rotate in from
   perspective (rotateX/rotateY + scale), so scrolling feels like moving through
   a space rather than sliding a flat list up. Expo-out, matching the home page.
   `variant`: 'up' | 'left' | 'right' | 'scale' | 'blur' | 'depth'. Reduced
   motion renders children immediately with no transform. */

const EXPO = [0.16, 1, 0.3, 1]
const VARIANTS = {
  up:    { hidden: { opacity: 0, y: 46, rotateX: 7, scale: 0.965 }, show: { opacity: 1, y: 0, rotateX: 0, scale: 1 } },
  left:  { hidden: { opacity: 0, x: -58, rotateY: -9, scale: 0.97 }, show: { opacity: 1, x: 0, rotateY: 0, scale: 1 } },
  right: { hidden: { opacity: 0, x: 58, rotateY: 9, scale: 0.97 },   show: { opacity: 1, x: 0, rotateY: 0, scale: 1 } },
  scale: { hidden: { opacity: 0, scale: 0.85, y: 34 },               show: { opacity: 1, scale: 1, y: 0 } },
  blur:  { hidden: { opacity: 0, y: 32, filter: 'blur(14px)' },      show: { opacity: 1, y: 0, filter: 'blur(0px)' } },
  depth: { hidden: { opacity: 0, y: 80, rotateX: 18, scale: 0.84 },  show: { opacity: 1, y: 0, rotateX: 0, scale: 1 } },
}

export default function Reveal({
  children,
  className = '',
  variant = 'up',
  delay = 0,
  duration = 0.85,
  amount = 0.3,
  as = 'div',
  style,
  ...rest
}) {
  const reduce = useReducedMotion()
  if (reduce) {
    const Tag = as
    return <Tag className={className} style={style} {...rest}>{children}</Tag>
  }
  const MotionTag = motion[as] ?? motion.div
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount, margin: '-60px' }}
      variants={VARIANTS[variant] ?? VARIANTS.up}
      transition={{ duration, delay, ease: EXPO }}
      style={{ transformPerspective: 1200, ...style }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}
