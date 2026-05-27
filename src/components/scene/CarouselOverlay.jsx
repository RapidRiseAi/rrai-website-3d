/**
 * CarouselOverlay — 7 premium 3D particle sculptures, one per expertise card.
 *
 * Scroll visibility (mirrors HeroOrb fade-out):
 *   p 0.35 → 0.85  overlay fades in as sphere fades out
 *
 * Card-change transition (~1 s total):
 *   Phase 1 (0 → 380 ms)  current object contracts to a glowing core  (scale 1 → 0.10)
 *   Phase 2 (380 → 1080 ms) new object expands from core to full size  (scale 0.10 → 1)
 *   Reduced-motion: simple opacity crossfade, no scale animation
 *
 * Performance notes:
 *   - All 7 geometries are static Float32Arrays generated once at module load.
 *   - Only the active (and briefly the previous) variant has visible:true.
 *   - No per-frame position updates — only group.scale and material.opacity change.
 *   - The heavy HeroOrb sphere / grid elements are already invisible at p ≥ 0.99
 *     through their own scroll-driven fade logic; nothing extra needed here.
 */

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carouselState } from '../../utils/carouselState'
import { getGlowDotTexture } from '../../utils/iconTextures'

/* ── Mirror HeroOrb constants (do not edit) ─────────────────────────────────── */
const R         = 1.70
const ORB_X     = 2.45
const ORB_Y     = 0.18
const END_X     = -3.3
const END_SCALE = 0.55

const MAX_OPACITY  = 0.92
const PT_SIZE      = 0.086

const COLLAPSE_DUR = 0.38   // seconds — contract to core
const EXPAND_DUR   = 0.70   // seconds — expand to new shape
const CORE_SCALE   = 0.10   // minimum scale during swap

/* ── Detect reduced-motion preference once ──────────────────────────────────── */
const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ══════════════════════════════════════════════════════════════════════════════
   GEOMETRY HELPERS
   All helpers push x,y,z triples directly into a `pts` array.
══════════════════════════════════════════════════════════════════════════════ */

function addLine(pts, x0, y0, z0, x1, y1, z1, n, jit = 0.04) {
  for (let i = 0; i <= n; i++) {
    const t = i / n
    pts.push(
      x0 + (x1 - x0) * t + (Math.random() - 0.5) * jit,
      y0 + (y1 - y0) * t + (Math.random() - 0.5) * jit,
      z0 + (z1 - z0) * t + (Math.random() - 0.5) * jit,
    )
  }
}

function addCircle(pts, cx, cy, cz, r, n, jit = 0.028) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push(
      cx + Math.cos(a) * r + (Math.random() - 0.5) * jit,
      cy + Math.sin(a) * r + (Math.random() - 0.5) * jit,
      cz                   + (Math.random() - 0.5) * jit,
    )
  }
}

function addRect(pts, cx, cy, cz, hw, hh, ns, nh, jit = 0.035) {
  for (let i = 0; i <= ns; i++) {
    const t = i / ns
    pts.push(cx - hw + t * 2 * hw, cy + hh, cz + (Math.random() - 0.5) * jit)
    pts.push(cx - hw + t * 2 * hw, cy - hh, cz + (Math.random() - 0.5) * jit)
  }
  for (let i = 0; i <= nh; i++) {
    const t = i / nh
    pts.push(cx - hw, cy - hh + t * 2 * hh, cz + (Math.random() - 0.5) * jit)
    pts.push(cx + hw, cy - hh + t * 2 * hh, cz + (Math.random() - 0.5) * jit)
  }
}

/** All 12 edges of a cube centred at (cx, cy, cz) with half-size s. */
function addCubeEdges(pts, cx, cy, cz, s, ns = 22, jit = 0.022) {
  const c = [
    [-s,-s,-s],[s,-s,-s],[s,s,-s],[-s,s,-s],
    [-s,-s, s],[s,-s, s],[s,s, s],[-s,s, s],
  ]
  const edges = [
    [0,1],[1,2],[2,3],[3,0],  // back face
    [4,5],[5,6],[6,7],[7,4],  // front face
    [0,4],[1,5],[2,6],[3,7],  // depth edges
  ]
  for (const [a, b] of edges) {
    addLine(
      pts,
      cx + c[a][0], cy + c[a][1], cz + c[a][2],
      cx + c[b][0], cy + c[b][1], cz + c[b][2],
      ns, jit,
    )
  }
}

/** Cubic Bézier particles — pushes x,y,z triples directly into pts. */
function addBezier(pts, p0, p1, p2, p3, n, jit = 0.032) {
  for (let i = 0; i <= n; i++) {
    const t = i / n, mt = 1 - t
    pts.push(
      mt*mt*mt*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t*t*t*p3[0] + (Math.random()-0.5)*jit,
      mt*mt*mt*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t*t*t*p3[1] + (Math.random()-0.5)*jit,
      mt*mt*mt*p0[2] + 3*mt*mt*t*p1[2] + 3*mt*t*t*p2[2] + t*t*t*p3[2] + (Math.random()-0.5)*jit,
    )
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   VARIANT GENERATORS
   Each returns a Float32Array of x,y,z particle positions.
   Target visual scale occupies roughly ±R in world units before group scaling.
══════════════════════════════════════════════════════════════════════════════ */

/* ── 01 Websites & SEO — 3D extruded browser frame ──────────────────────────── */
function genBrowserFrame() {
  const pts = []
  const W = R * 0.80, H = R * 0.70, D = R * 0.30

  // Front face rect
  addRect(pts, 0, 0, D * 0.5, W, H, 46, 36, 0.025)
  // Back face rect (slightly inset to emphasise depth)
  addRect(pts, 0, 0, -D * 0.5, W * 0.90, H * 0.90, 40, 30, 0.025)
  // Four depth-edge connections
  for (const [sx, sy] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
    addLine(pts, sx*W, sy*H, D*0.5, sx*W*0.90, sy*H*0.90, -D*0.5, 10, 0.015)
  }
  // Top bar line (front face)
  addLine(pts, -W*0.92, H*0.58, D*0.5+0.02, W*0.92, H*0.58, D*0.5+0.02, 44, 0.015)
  // Three browser dots
  for (let d = 0; d < 3; d++) {
    addCircle(pts, -W*0.68 + d * W*0.125, H*0.77, D*0.5+0.02, W*0.027, 9, 0.008)
  }

  return new Float32Array(pts)
}

/* ── 02 Custom Software — cube-within-cube ───────────────────────────────────── */
function genCommandCube() {
  const pts = []
  const S = R * 0.80  // outer half-size
  const s = R * 0.34  // inner half-size

  addCubeEdges(pts, 0, 0, 0, S, 24, 0.024)
  addCubeEdges(pts, 0, 0, 0, s, 12, 0.016)

  // Corner connections (outer → inner) — subtly visible inside the outer cube
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    addLine(pts, x*S, y*S, z*S, x*s, y*s, z*s, 5, 0.016)
  }

  return new Float32Array(pts)
}

/* ── 03 App Development — stacked 3D phone panels ───────────────────────────── */
function genAppStack() {
  const pts = []
  const pw = R * 0.34, ph = R * 0.74

  // Panel 1 — front-left
  addRect(pts, -R*0.17, 0, R*0.22, pw, ph, 28, 42, 0.022)
  addCircle(pts, -R*0.17, ph*0.84,       R*0.22+0.02, R*0.034, 10, 0.008)
  addLine(pts, -R*0.17-pw*0.60, -ph*0.83, R*0.22+0.01,
               -R*0.17+pw*0.60, -ph*0.83, R*0.22+0.01, 16, 0.012)

  // Panel 2 — mid
  addRect(pts, R*0.24, -R*0.07, -R*0.06, pw*0.88, ph*0.84, 22, 36, 0.022)
  addCircle(pts, R*0.24, ph*0.84*0.84-R*0.07, -R*0.06+0.02, R*0.030, 9, 0.008)

  // Panel 3 — back-right
  addRect(pts, R*0.55, -R*0.15, -R*0.32, pw*0.74, ph*0.68, 16, 26, 0.022)

  return new Float32Array(pts)
}

/* ── 04 Workflow Automation — S-curve with 3 circular nodes ─────────────────── */
function genWorkflowPath() {
  const pts = []

  // Three nodes: lower-left, centre, upper-right (matching reference image)
  const n0 = [-R*0.55, -R*0.72, -R*0.04]
  const n1 = [ R*0.06,  R*0.02,  R*0.10]
  const n2 = [ R*0.60,  R*0.72,  R*0.04]

  for (const [nx, ny, nz] of [n0, n1, n2]) {
    addCircle(pts, nx, ny, nz, R*0.128, 24, 0.018)
    addCircle(pts, nx, ny, nz, R*0.058, 13, 0.012)
  }

  // Bézier segment 0 → 1 (curves right then up-left)
  addBezier(
    pts,
    n0,
    [n0[0]+R*0.28, n0[1]+R*0.52, n0[2]],
    [n1[0]-R*0.28, n1[1]-R*0.40, n1[2]],
    n1,
    46, 0.028,
  )

  // Bézier segment 1 → 2
  addBezier(
    pts,
    n1,
    [n1[0]+R*0.26, n1[1]+R*0.44, n1[2]],
    [n2[0]-R*0.26, n2[1]-R*0.42, n2[2]],
    n2,
    46, 0.028,
  )

  return new Float32Array(pts)
}

/* ── 05 AI Implementation — sphere core with tilted orbital ring ─────────────── */
function genIntelligenceOrbit() {
  const pts = []
  const coreR  = R * 0.34
  const orbitR = R * 0.82
  const tilt   = Math.PI / 5.5  // ~32° ring tilt

  // Central sphere (surface scatter)
  const N = 96
  for (let i = 0; i < N; i++) {
    const phi   = Math.acos(2 * Math.random() - 1)
    const theta = Math.random() * Math.PI * 2
    const r     = coreR * (0.97 + Math.random() * 0.06)
    pts.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    )
  }

  // Orbital ring (tilted ellipse)
  const ringN = 72
  for (let i = 0; i < ringN; i++) {
    const a = (i / ringN) * Math.PI * 2
    pts.push(
      Math.cos(a) * orbitR                            + (Math.random()-0.5)*0.028,
      Math.sin(a) * orbitR * Math.sin(tilt)           + (Math.random()-0.5)*0.028,
      Math.sin(a) * orbitR * Math.cos(tilt)           + (Math.random()-0.5)*0.028,
    )
  }

  // Small bright satellite cluster on the ring
  const satA = Math.PI * 0.42
  for (let k = 0; k < 10; k++) {
    const sa = satA + (Math.random()-0.5)*0.22
    const rr = orbitR * (1 + (Math.random()-0.5)*0.06)
    pts.push(
      Math.cos(sa) * rr,
      Math.sin(sa) * rr * Math.sin(tilt),
      Math.sin(sa) * rr * Math.cos(tilt),
    )
  }

  return new Float32Array(pts)
}

/* ── 06 Connected Ecosystems — central cube + 4 surrounding cubes ────────────── */
function genConnectedCubes() {
  const pts = []
  const cs   = R * 0.25   // central half-size
  const ss   = R * 0.17   // satellite half-size
  const dist = R * 0.78   // offset from centre

  // Central cube
  addCubeEdges(pts, 0, 0, 0, cs, 14, 0.018)

  // 4 satellites: top, bottom, left, right (with slight z-offset for 3-D feel)
  const sats = [
    [ 0,     dist,  R*0.08],
    [ 0,    -dist, -R*0.08],
    [-dist,  0,     R*0.10],
    [ dist,  0,    -R*0.10],
  ]
  for (const [sx, sy, sz] of sats) {
    addCubeEdges(pts, sx, sy, sz, ss, 9, 0.014)
    // Connector from central-cube surface toward satellite
    const len = Math.sqrt(sx*sx + sy*sy + sz*sz)
    const nx = sx/len * cs, ny = sy/len * cs, nz = sz/len * cs
    const fx = sx - sx/len * ss, fy = sy - sy/len * ss, fz = sz - sz/len * ss
    addLine(pts, nx, ny, nz, fx, fy, fz, 10, 0.020)
  }

  return new Float32Array(pts)
}

/* ── 07 Managed Marketing Services — 3D particle funnel ─────────────────────── */
function genFunnel() {
  const pts = []
  const topW = R * 0.82, botW = R * 0.12
  const topY = R * 0.70, botY = -R * 0.68
  const H    = topY - botY
  const D    = R * 0.28  // depth (front/back offset)

  // Front slant edges
  addLine(pts, -topW, topY, D*0.5, -botW, botY,  0, 38, 0.038)
  addLine(pts,  topW, topY, D*0.5,  botW, botY,  0, 38, 0.038)
  // Front top opening
  addLine(pts, -topW, topY, D*0.5, topW, topY, D*0.5, 52, 0.038)
  // Bottom exit
  addLine(pts, -botW, botY, 0, botW, botY, 0, 12, 0.025)

  // Back slant edges (slightly narrower to show depth)
  addLine(pts, -topW*0.88, topY*0.96, -D*0.5, -botW*0.88, botY*0.96, 0, 28, 0.038)
  addLine(pts,  topW*0.88, topY*0.96, -D*0.5,  botW*0.88, botY*0.96, 0, 28, 0.038)
  addLine(pts, -topW*0.88, topY*0.96, -D*0.5,  topW*0.88, topY*0.96, -D*0.5, 40, 0.038)

  // Two interior level-dividers
  for (let lv = 1; lv <= 2; lv++) {
    const t  = lv / 3
    const y  = topY - H * t
    const wl = (topW + (botW - topW) * t) * 0.80
    const zl = D * 0.5 * (1 - t)
    addLine(pts, -wl, y, zl, wl, y, zl, Math.ceil(wl * 11), 0.030)
  }

  // Converging fill particles
  for (let k = 0; k < 38; k++) {
    const t  = Math.random()
    const y  = topY - H * t
    const wl = (topW + (botW - topW) * t) * 0.68
    const zl = D * 0.5 * (1 - t)
    pts.push(
      (Math.random()-0.5) * wl * 2,
      y,
      (Math.random()-0.5) * zl * 2 + zl * 0.5,
    )
  }

  return new Float32Array(pts)
}

/* ── Generator registry & per-variant accent colours ─────────────────────────── */
const GENERATORS = [
  genBrowserFrame,       // 00 Websites & SEO
  genCommandCube,        // 01 Custom Software
  genAppStack,           // 02 App Development
  genWorkflowPath,       // 03 Workflow Automation
  genIntelligenceOrbit,  // 04 AI Implementation
  genConnectedCubes,     // 05 Connected Ecosystems
  genFunnel,             // 06 Managed Marketing Services
]

const COLORS = [
  '#62c8ff',  // browser   — lighter ice blue
  '#4ab8ff',  // cube      — mid blue
  '#78d4ff',  // app stack — bright cyan-blue
  '#58b8ff',  // workflow  — clean blue
  '#8ae0ff',  // orbit     — bright sky
  '#52b8ff',  // cubes     — steady blue
  '#4aaaff',  // funnel    — deep blue
]

/* ── Ease functions ─────────────────────────────────────────────────────────── */
function easeOut3(t) { return 1 - (1 - t) * (1 - t) * (1 - t) }
function easeIn2(t)  { return t * t }

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function CarouselOverlay() {
  const groupRef  = useRef()
  const matRefs   = useRef([])
  const scrollRef = useRef(0)

  // Transition state refs (mutated inside useFrame — no re-renders)
  const activeRef   = useRef(0)
  const prevRef     = useRef(-1)
  const phaseRef    = useRef('idle')     // 'idle' | 'collapsing' | 'expanding'
  const phaseTimRef = useRef(0)          // seconds elapsed in current phase
  const scaleRef    = useRef(1.0)        // current transition scale multiplier
  const crossRef    = useRef(1.0)        // 0→1 crossfade (reduced-motion only)

  // Scroll listener
  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Pre-generate all 7 geometry arrays once at mount
  const variants = useMemo(() => GENERATORS.map(g => g()), [])

  const tex = useMemo(() => getGlowDotTexture(), [])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    /* ── 1. Mirror HeroOrb scroll-driven position & scale ─────────────────── */
    const p       = scrollRef.current
    const lerp    = Math.min(1, delta * 8)
    const g       = groupRef.current

    g.position.x += (ORB_X + (END_X - ORB_X) * p - g.position.x) * lerp
    g.position.y += (ORB_Y * (1 - p)              - g.position.y) * lerp
    const baseS    = 1.0 + (END_SCALE - 1.0) * p
    g.scale.setScalar((g.scale.x + (baseS - g.scale.x) * lerp) * scaleRef.current)

    // Scroll-driven visibility window
    const scrollVis = Math.max(0, Math.min(1, (p - 0.35) / 0.50))

    /* ── 2. Detect card change, start collapse ────────────────────────────── */
    const wanted = carouselState.activeCard
    if (wanted !== activeRef.current && phaseRef.current === 'idle') {
      prevRef.current   = activeRef.current
      phaseRef.current  = REDUCED_MOTION ? 'crossfade' : 'collapsing'
      phaseTimRef.current = 0
      crossRef.current  = 0
    }

    /* ── 3. Advance transition phase ──────────────────────────────────────── */
    phaseTimRef.current += delta

    if (phaseRef.current === 'collapsing') {
      const t = Math.min(1, phaseTimRef.current / COLLAPSE_DUR)
      scaleRef.current = CORE_SCALE + (1 - CORE_SCALE) * easeIn2(1 - t)

      if (t >= 1) {
        // Swap to new card at the collapsed peak
        activeRef.current   = wanted
        phaseRef.current    = 'expanding'
        phaseTimRef.current = 0
        scaleRef.current    = CORE_SCALE
      }
    } else if (phaseRef.current === 'expanding') {
      const t = Math.min(1, phaseTimRef.current / EXPAND_DUR)
      scaleRef.current = CORE_SCALE + (1 - CORE_SCALE) * easeOut3(t)
      if (t >= 1) {
        scaleRef.current  = 1.0
        prevRef.current   = -1
        phaseRef.current  = 'idle'
      }
    } else if (phaseRef.current === 'crossfade') {
      // Reduced-motion path: 400 ms crossfade, no scale change
      crossRef.current = Math.min(1, phaseTimRef.current / 0.40)
      if (crossRef.current >= 1) {
        activeRef.current   = wanted
        prevRef.current     = -1
        phaseRef.current    = 'idle'
        crossRef.current    = 1.0
      }
    }

    /* ── 4. Apply per-variant opacity ─────────────────────────────────────── */
    const active = activeRef.current
    const prev   = prevRef.current

    for (let i = 0; i < GENERATORS.length; i++) {
      const mat = matRefs.current[i]
      if (!mat) continue

      let op = 0

      if (REDUCED_MOTION) {
        if (i === active) {
          op = (prev === -1 ? 1 : crossRef.current) * scrollVis * MAX_OPACITY
        } else if (i === prev) {
          op = (1 - crossRef.current) * scrollVis * MAX_OPACITY
        }
      } else {
        // Scale-based transition: active variant always at full opacity once expanding
        if (i === active) {
          const fadeIn = phaseRef.current === 'expanding'
            ? Math.min(1, phaseTimRef.current / EXPAND_DUR)
            : (phaseRef.current === 'idle' ? 1 : 0)
          op = fadeIn * scrollVis * MAX_OPACITY
        } else if (i === prev && phaseRef.current === 'collapsing') {
          const fadeOut = 1 - Math.min(1, phaseTimRef.current / COLLAPSE_DUR)
          op = fadeOut * scrollVis * MAX_OPACITY
        }
      }

      mat.opacity = op
      mat.visible = op > 0.004
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
