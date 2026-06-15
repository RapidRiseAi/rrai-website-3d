import { useEffect, useRef } from 'react'

/* Brand cursor effect — a soft electric-blue comet that follows the pointer with
   easing, leaving a tapering glow trail, and periodically emitting small "nodes"
   that stay tethered to the core by a thin filament before fading. The node +
   filament motif is a deliberate nod to Rapid Rise AI's mission: connected
   systems, intelligence in motion.

   Gated to fine pointers (desktop mice) and disabled under prefers-reduced-motion
   so it never affects touch users or anyone who opts out of motion. The canvas is
   pointer-events:none, so it never intercepts clicks. */
export default function CursorTrail() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0
    let H = 0

    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const mouse = { x: W / 2, y: H / 2 }
    const core = { x: W / 2, y: H / 2 }
    const trail = []          // recent core positions → tapering streak
    const nodes = []          // emitted "connection" particles
    let moved = false
    let lastEmit = 0
    let frame = 0

    const onMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      moved = true
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    let raf
    const loop = () => {
      frame++
      ctx.clearRect(0, 0, W, H)

      // Ease the glowing core toward the real pointer
      core.x += (mouse.x - core.x) * 0.2
      core.y += (mouse.y - core.y) * 0.2
      const vx = mouse.x - core.x
      const vy = mouse.y - core.y
      const speed = Math.hypot(vx, vy)

      trail.push({ x: core.x, y: core.y })
      if (trail.length > 20) trail.shift()

      ctx.globalCompositeOperation = 'lighter'

      // Tapering glow streak through the trail history
      for (let i = 1; i < trail.length; i++) {
        const p0 = trail[i - 1]
        const p1 = trail[i]
        const t = i / trail.length
        ctx.strokeStyle = `rgba(74, 168, 255, ${t * 0.5})`
        ctx.lineWidth = t * 6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()
      }

      // Emit connection nodes while moving (throttled)
      if (moved && speed > 1.5 && frame - lastEmit > 4) {
        lastEmit = frame
        const ang = Math.atan2(vy, vx) + (Math.random() - 0.5) * 2.4
        const sp = 0.4 + Math.random() * 1.1
        nodes.push({
          x: core.x + (Math.random() - 0.5) * 6,
          y: core.y + (Math.random() - 0.5) * 6,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          life: 1,
          r: 1.1 + Math.random() * 1.6,
        })
        if (nodes.length > 26) nodes.shift()
      }

      // Draw nodes + their filament back to the core (the "connection")
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        n.x += n.vx
        n.y += n.vy
        n.vx *= 0.96
        n.vy *= 0.96
        n.life -= 0.022
        if (n.life <= 0) { nodes.splice(i, 1); continue }

        const d = Math.hypot(n.x - core.x, n.y - core.y)
        if (d < 130) {
          ctx.strokeStyle = `rgba(86, 178, 255, ${n.life * (1 - d / 130) * 0.5})`
          ctx.lineWidth = 0.7
          ctx.beginPath()
          ctx.moveTo(core.x, core.y)
          ctx.lineTo(n.x, n.y)
          ctx.stroke()
        }
        ctx.fillStyle = `rgba(150, 210, 255, ${n.life * 0.85})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Glowing core
      const g = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, 22)
      g.addColorStop(0, 'rgba(196, 230, 255, 0.72)')
      g.addColorStop(0.35, 'rgba(58, 152, 255, 0.42)')
      g.addColorStop(1, 'rgba(46, 140, 255, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(core.x, core.y, 22, 0, Math.PI * 2)
      ctx.fill()

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="cursor-trail" aria-hidden="true" />
}
