/**
 * CarouselOverlay — 7 icon-shaped particle variants that replace the cube.
 *
 * Transition timeline (scroll progress p):
 *   p 0.00 → 0.35  sphere fully visible, overlay invisible
 *   p 0.35 → 0.62  sphere fades out (HeroOrb opacity), overlay fades in
 *   p 0.62 → 0.85  sphere gone, overlay building to full opacity
 *   p 0.85 → 1.00  overlay at MAX_OPACITY
 *
 * Variant crossfade on card change: ~500 ms.
 *
 * HeroOrb.jsx is NOT further modified beyond the two edits already applied.
 * Position / scale constants mirror HeroOrb exactly (ORB_X, END_X, END_SCALE).
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carouselState } from '../../utils/carouselState'
import { getGlowDotTexture } from '../../utils/iconTextures'

/* ── Mirror HeroOrb constants (never edit) ──────────────────────────────── */
const R        = 1.70
const ORB_X    = 2.45
const ORB_Y    = 0.18
const END_X    = -3.3
const END_SCALE = 0.55

const MAX_OPACITY = 0.92

/* ── Geometry helpers ────────────────────────────────────────────────────── */
/** Push particle pairs along top & bottom then left & right of a rectangle. */
function addRect(pts, cx, cy, cz, hw, hh, ns, nh, jit = 0.055) {
  for (let i = 0; i <= ns; i++) {
    const t = i / ns
    pts.push(cx - hw + t * 2 * hw, cy + hh, cz + (Math.random() - .5) * jit)
    pts.push(cx - hw + t * 2 * hw, cy - hh, cz + (Math.random() - .5) * jit)
  }
  for (let i = 0; i <= nh; i++) {
    const t = i / nh
    pts.push(cx - hw, cy - hh + t * 2 * hh, cz + (Math.random() - .5) * jit)
    pts.push(cx + hw, cy - hh + t * 2 * hh, cz + (Math.random() - .5) * jit)
  }
}

/** Push n+1 particles evenly spaced along a line segment. */
function addLine(pts, x0, y0, z0, x1, y1, z1, n, jit = 0.048) {
  for (let i = 0; i <= n; i++) {
    const t = i / n
    pts.push(
      x0 + (x1 - x0) * t + (Math.random() - .5) * jit,
      y0 + (y1 - y0) * t + (Math.random() - .5) * jit,
      z0 + (z1 - z0) * t + (Math.random() - .5) * jit,
    )
  }
}

/** Push n particles evenly around a circle. */
function addCircle(pts, cx, cy, cz, r, n) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push(
      cx + Math.cos(a) * r + (Math.random() - .5) * .042,
      cy + Math.sin(a) * r + (Math.random() - .5) * .042,
      cz + (Math.random() - .5) * .048,
    )
  }
}

/** Scatter fill inside a box. */
function addFill(pts, cx, cy, cz, hw, hh, hz, n) {
  for (let k = 0; k < n; k++)
    pts.push(
      cx + (Math.random() - .5) * hw * 2,
      cy + (Math.random() - .5) * hh * 2,
      cz + (Math.random() - .5) * hz * 2,
    )
}

/* ── Variant 0 — Websites & SEO (browser / portal wireframe) ─────────────── */
function genWebPortal() {
  const pts = []
  const W = R * .88, H = R * .84

  addRect(pts, 0, 0, 0, W, H, 46, 36)                        // outer frame
  addLine(pts, -W * .90, H * .50, 0, W * .90, H * .50, 0, 42)  // header bar
  addLine(pts, -W * .65, H * .24, 0, W * .65, H * .24, 0, 28)  // nav divider

  // Three content-block rectangles
  for (let c = 0; c < 3; c++) {
    const xc = W * (-.55 + c * .55)
    addRect(pts, xc, -H * .08, 0,  W * .28, H * .40, 14, 12)
    addFill(pts, xc, -H * .08, 0,  W * .20, H * .32, .20, 7)
  }

  // CTA / enquiry button (ellipse outline)
  addCircle(pts, W * .38, -H * .66, 0, W * .15, 16)
  addFill(pts, W * .38, -H * .66, 0, W * .10, H * .06, .10, 6)

  return new Float32Array(pts)
}

/* ── Variant 1 — Custom Software (dashboard / panel layout) ──────────────── */
function genCommandDashboard() {
  const pts = []
  const W = R * .86, H = R * .82

  addRect(pts, 0, 0, 0, W, H, 44, 34)                       // outer frame

  addRect(pts, -W * .28, 0, R * .12, W * .34, H * .88, 24, 22)  // left tall panel
  addRect(pts, W * .32, H * .28, R * .12, W * .30, H * .36, 18, 12)  // top-right
  addRect(pts, W * .32, -H * .28, R * .12, W * .30, H * .36, 18, 12) // bot-right

  addLine(pts, -W * .58, H * .22, R * .12, -W * .02, H * .22, R * .12, 18)
  addLine(pts, -W * .58, -H * .22, R * .12, -W * .02, -H * .22, R * .12, 18)

  addFill(pts, -W * .28, 0, 0, W * .26, H * .72, .28, 18)
  addFill(pts, W * .32, 0, 0, W * .22, H * .58, .28, 14)

  return new Float32Array(pts)
}

/* ── Variant 2 — App Development (phone frame + second device) ──────────── */
function genAppScreens() {
  const pts = []
  const pw = R * .40, ph = R * .82

  // Primary phone frame
  addRect(pts, -R * .14, 0, 0, pw, ph, 32, 46)
  addLine(pts, -R * .14 - pw * .80, ph * .74, .08, -R * .14 + pw * .80, ph * .74, .08, 22)
  addLine(pts, -R * .14 - pw * .80, -ph * .76, .08, -R * .14 + pw * .80, -ph * .76, .08, 22)
  addCircle(pts, -R * .14, -ph * .85, .08, pw * .10, 9)  // home button
  addFill(pts, -R * .14, R * .04, 0, pw * .68, ph * .58, .22, 20)

  // Secondary device (tablet, offset right + behind)
  const tw = R * .48, th = R * .52
  addRect(pts, R * .46, -R * .14, -R * .26, tw, th, 26, 20)
  addLine(pts, R * .46 - tw * .80, th * .70, -R * .26 + .1, R * .46 + tw * .80, th * .70, -R * .26 + .1, 18)
  addFill(pts, R * .46, -R * .14, -R * .26, tw * .58, th * .46, .20, 10)

  return new Float32Array(pts)
}

/* ── Variant 3 — Workflow Automation (flow pipeline with nodes) ──────────── */
function genFlowTunnel() {
  const pts = []
  const W = R * .86, H = R * .66

  addRect(pts, 0, 0, 0, W * .92, H * .88, 34, 20)  // outer frame

  const laneYs = [-H * .50, 0, H * .50]
  for (const y of laneYs) {
    addLine(pts, -W, y, 0, W, y, 0, 50, .055)
    addCircle(pts, -W * .78, y, R * .12, R * .10, 10)
    addCircle(pts, W * .78, y, R * .12, R * .10, 10)
    addFill(pts, -W * .78, y, R * .12, R * .06, R * .06, .08, 4)
    addFill(pts, W * .78, y, R * .12, R * .06, R * .06, .08, 4)
  }

  // Central collection node
  addCircle(pts, 0, 0, R * .08, R * .18, 18)
  addFill(pts, 0, 0, R * .08, R * .12, R * .12, .12, 7)

  // Vertical connectors between lanes
  addLine(pts, -W * .78, -H * .50, R * .12, -W * .78, H * .50, R * .12, 14)
  addLine(pts, W * .78, -H * .50, R * .12, W * .78, H * .50, R * .12, 14)

  return new Float32Array(pts)
}

/* ── Variant 4 — AI Implementation (neural radial core) ─────────────────── */
function genNeuralCore() {
  const pts = []

  // Central core rings
  addCircle(pts, 0, 0, 0, R * .28, 24)
  addCircle(pts, 0, 0, 0, R * .12, 14)
  addFill(pts, 0, 0, 0, R * .18, R * .18, R * .18, 18)

  // 8 radial branches with terminal nodes
  for (let deg = 0; deg < 360; deg += 45) {
    const a = deg * Math.PI / 180
    const ex = Math.cos(a) * R * .84
    const ey = Math.sin(a) * R * .84
    const ez = (Math.random() - .5) * R * .28
    addLine(pts, 0, 0, 0, ex, ey, ez, 14, .055)
    addCircle(pts, ex, ey, ez, R * .10, 11)
    addFill(pts, ex, ey, ez, R * .06, R * .06, .10, 4)
  }

  // Outer containment ring
  addCircle(pts, 0, 0, 0, R * .90, 36)

  return new Float32Array(pts)
}

/* ── Variant 5 — Connected Ecosystems (hub + 6 satellites) ──────────────── */
function genConnectedNodes() {
  const pts = []

  // Central hub
  addRect(pts, 0, 0, 0, R * .20, R * .20, 12, 12)
  addFill(pts, 0, 0, 0, R * .14, R * .14, R * .14, 10)

  // 6 satellite nodes in a ring
  const satR = R * .72
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const sx = Math.cos(a) * satR
    const sy = Math.sin(a) * satR
    const sz = (i % 2 === 0 ? .18 : -.18) * R
    addCircle(pts, sx, sy, sz, R * .12, 12)
    addFill(pts, sx, sy, sz, R * .07, R * .07, .10, 4)
    addLine(pts, 0, 0, 0, sx, sy, sz, 12, .040)
    // Ring link to next satellite
    const na = ((i + 1) / 6) * Math.PI * 2
    const nx = Math.cos(na) * satR
    const ny = Math.sin(na) * satR
    const nz = ((i + 1) % 2 === 0 ? .18 : -.18) * R
    addLine(pts, sx, sy, sz, nx, ny, nz, 8, .040)
  }

  addCircle(pts, 0, 0, 0, R * .88, 32)  // outer ring

  return new Float32Array(pts)
}

/* ── Variant 6 — Managed Marketing Services (funnel + trend line) ────────── */
function genGrowthFunnel() {
  const pts = []
  const topW = R * .86, botW = R * .22
  const topY = R * .74, botY = -R * .62
  const H = topY - botY

  addLine(pts, -topW, topY, 0, -botW, botY, 0, 36, .05)  // left slant
  addLine(pts, topW, topY, 0, botW, botY, 0, 36, .05)   // right slant
  addLine(pts, -topW, topY, 0, topW, topY, 0, 52, .05)  // top opening
  addLine(pts, -botW, botY, 0, botW, botY, 0, 18, .05)  // bottom exit

  // Internal level dividers
  for (let lv = 1; lv <= 3; lv++) {
    const t = lv / 4
    const y = topY - H * t
    const wl = (topW + (botW - topW) * t) * .82
    addLine(pts, -wl, y, .06, wl, y, .06, Math.ceil(wl * 14), .038)
  }

  // Converging fill particles
  for (let k = 0; k < 32; k++) {
    const t = Math.random()
    const y = topY - H * t
    const wl = (topW + (botW - topW) * t) * .72
    pts.push((Math.random() - .5) * wl * 2, y, (Math.random() - .5) * .28)
  }

  // Rising trend line (right side)
  addLine(pts, R * .70, -R * .54, R * .14, R * .90, R * .66, R * .14, 26, .038)
  // Arrow head at top of trend
  pts.push(R * .96, R * .60, R * .14, R * .84, R * .74, R * .14, R * .90, R * .66, R * .14)

  return new Float32Array(pts)
}

/* ── Registry ────────────────────────────────────────────────────────────── */
const GENERATORS = [
  genWebPortal,
  genCommandDashboard,
  genAppScreens,
  genFlowTunnel,
  genNeuralCore,
  genConnectedNodes,
  genGrowthFunnel,
]

const COLORS = [
  '#62c8ff', // 0 web-portal
  '#4ab8ff', // 1 dashboard
  '#78d4ff', // 2 app-screens
  '#42b0ff', // 3 flow
  '#8ae0ff', // 4 neural
  '#56bcff', // 5 ecosystems
  '#4aaaff', // 6 funnel
]

const PT_SIZE = 0.088   // uniform size — slightly larger than old overlay

/* ── Component ──────────────────────────────────────────────────────────────── */
export default function CarouselOverlay() {
  const groupRef   = useRef()
  const matRefs    = useRef([])
  const scrollRef  = useRef(0)
  const activeRef  = useRef(0)
  const prevRef    = useRef(0)
  const transRef   = useRef(1.0)   // 0 = mid-transition, 1 = settled

  // Own scroll listener — mirrors HeroOrb math without touching that file
  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Pre-generate all 7 variant position arrays once at mount
  const variants = useMemo(() => GENERATORS.map(g => g()), [])

  const tex = useMemo(() => getGlowDotTexture(), [])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // ── Mirror HeroOrb position / scale ─────────────────────────────────────
    const p       = scrollRef.current
    const lerpAmt = Math.min(1, delta * 8)
    const g       = groupRef.current

    g.position.x += (ORB_X + (END_X - ORB_X) * p  - g.position.x) * lerpAmt
    g.position.y += (ORB_Y * (1 - p)               - g.position.y) * lerpAmt
    const targetS = 1.0 + (END_SCALE - 1.0) * p
    g.scale.setScalar(g.scale.x + (targetS - g.scale.x) * lerpAmt)

    // Fade in from p=0.35, fully visible at p=0.85 (overlaps sphere dissolve)
    const scrollVis = Math.max(0, Math.min(1, (p - 0.35) / 0.50))

    // ── Card-change transition (crossfade ~500 ms) ───────────────────────────
    const current = carouselState.activeCard
    if (activeRef.current !== current) {
      prevRef.current   = activeRef.current
      activeRef.current = current
      transRef.current  = 0
    }
    transRef.current = Math.min(1, transRef.current + delta * 2.0)

    const tr = transRef.current
    for (let i = 0; i < GENERATORS.length; i++) {
      const mat = matRefs.current[i]
      if (!mat) continue
      let op = 0
      if (i === activeRef.current)
        op = scrollVis * tr * MAX_OPACITY
      else if (i === prevRef.current && activeRef.current !== prevRef.current)
        op = scrollVis * (1 - tr) * MAX_OPACITY
      mat.opacity = op
      mat.visible  = op > 0.004
    }
  })

  return (
    <group ref={groupRef} position={[ORB_X, ORB_Y, 0]}>
      {variants.map((positions, i) => (
        <points key={i} renderOrder={12}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            ref={el => { matRefs.current[i] = el }}
            size={PT_SIZE}
            map={tex}
            color={COLORS[i]}
            sizeAttenuation
            transparent
            opacity={0}
            visible={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            alphaTest={0.01}
          />
        </points>
      ))}
    </group>
  )
}
