import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildSoccerBall, greatCircleArc, circleOnSphere,
} from '../../utils/soccerBall'
import { createIconTexture, getGlowDotTexture } from '../../utils/iconTextures'
import { carouselState } from '../../utils/carouselState'
import { deriveScroll } from '../../utils/scrollLayout'
import { transitionState } from '../transition/transitionState'
import { worldState } from './worldState'

const R = 1.70
const ORB_X = 2.45
const ORB_Y = 0.18
const END_X = -3.3
const END_Y = -0.42       // card-mode group centre — projects to ~60% viewport height,
                          // the measured vertical centre of the carousel card column
const END_SCALE = 0.715   // carousel/card-mode group scale (+30% — Section-2 object size)
const HOME_VIS_R = 1.80   // representative bounding radius (local units) of the home
                          // object — tuned to the hero globe (≈R) the page lands on,
                          // used only to publish a handoff anchor for the page
                          // transition (× the live group scale).

const scrollState = { progress: 0, sec3: 0 }
let shotRotY = null   // ?shot harness: force a card-object rotation for capture
let waveBufDirty = false  // wave wrote posTarget; one repair pass owed when it exits
// Bounding radius (local units) of each normalized card shape, computed once from
// the live card buffers. The service-mode dock uses it to scale the object to fit
// the slot. Module-scoped so the top-level useFrame can read it.
let cardBoundingRadii = null

const { vertices, edges, hexCenters } = buildSoccerBall()

const ICON_CENTERS = (() => {
  const pts = []
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      for (const z of [-1, 1])
        pts.push(new THREE.Vector3(x, y, z).normalize())
  return pts
})()

const ICON_NEAR_VERTS = ICON_CENTERS.map(ic =>
  vertices
    .map((v, i) => ({ i, d: ic.distanceTo(v) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 6)
    .map(x => x.i)
)

function sampleArc(arcPts, spacing) {
  if (arcPts.length < 2) return arcPts
  const result = [arcPts[0]]
  let acc = 0
  for (let i = 1; i < arcPts.length; i++) {
    const p = arcPts[i], q = arcPts[i - 1]
    acc += Math.sqrt((p[0]-q[0])**2 + (p[1]-q[1])**2 + (p[2]-q[2])**2)
    if (acc >= spacing) { result.push(p); acc = 0 }
  }
  return result
}

const ICON_HALO_INNER = 0.150

const FLOW_ARCS = []
const SOCCER_EDGE_POSITIONS = (() => {
  const pts = []
  edges.forEach(([i, j]) => {
    const arc = greatCircleArc(vertices[i], vertices[j], R * 1.001, 28)
    FLOW_ARCS.push(arc)
    sampleArc(arc, 0.038).forEach(p => pts.push(p[0], p[1], p[2]))
  })
  return new Float32Array(pts)
})()
const SOCCER_EDGE_GLOW = (() => {
  const pts = []
  edges.forEach(([i, j]) => {
    const arc = greatCircleArc(vertices[i], vertices[j], R * 1.004, 16)
    sampleArc(arc, 0.10).forEach(p => pts.push(p[0], p[1], p[2]))
  })
  return new Float32Array(pts)
})()

const CARDINAL_SPOKE_POSITIONS = (() => {
  const pts = []
  ICON_CENTERS.forEach((c, idx) => {
    const norm = c.clone().normalize()
    const nearVerts = ICON_NEAR_VERTS[idx].map(vi => vertices[vi])
    nearVerts.forEach(v => {
      const tangent = v.clone().sub(norm.clone().multiplyScalar(v.dot(norm)))
      if (tangent.length() < 1e-6) return
      tangent.normalize()
      const startPt = norm.clone()
        .multiplyScalar(Math.cos(ICON_HALO_INNER))
        .addScaledVector(tangent, Math.sin(ICON_HALO_INNER))
        .normalize()
      const arc = greatCircleArc(startPt, v, R * 1.002, 16)
      FLOW_ARCS.push(arc)
      sampleArc(arc, 0.022).forEach(p => pts.push(p[0], p[1], p[2]))
    })
  })
  return new Float32Array(pts)
})()

const JUNCTION_VERTEX_POSITIONS = (() => {
  const arr = new Float32Array(vertices.length * 3)
  vertices.forEach((v, i) => { arr[i*3]=v.x*R; arr[i*3+1]=v.y*R; arr[i*3+2]=v.z*R })
  return arr
})()
const JUNCTION_HEX_POSITIONS = (() => {
  const arr = new Float32Array(hexCenters.length * 3)
  hexCenters.forEach((h, i) => { arr[i*3]=h.x*R*1.001; arr[i*3+1]=h.y*R*1.001; arr[i*3+2]=h.z*R*1.001 })
  return arr
})()
const JUNCTION_PENT_POSITIONS = (() => {
  const arr = new Float32Array(ICON_CENTERS.length * 3)
  ICON_CENTERS.forEach((p, i) => { arr[i*3]=p.x*R*1.002; arr[i*3+1]=p.y*R*1.002; arr[i*3+2]=p.z*R*1.002 })
  return arr
})()

/* ── Collapse timing ────────────────────────────────────────────────────────────
   Grid/glow/dots/rings: smoothstep p 0 → 0.76, transparent by p ≈ 0.59,
                         fully at centre by p 0.76, then unmounted at p 0.80.
   Surface orbs:         sqrt ease-out p 0 → 0.40 (visible immediately on scroll),
                         max 50% collapse — never fades/disappears.
                         Card morph: smoothstep p 0.38 → 1.0, same orbs rearrange
                         into card shape. Always fully opaque throughout.
 ────────────────────────────────────────────────────────────────────────────── */
function smoothstep(t)     { const c = Math.max(0, Math.min(1, t)); return c * c * (3 - 2 * c) }
// Grid/spokes/dots: sqrt ease-out (immediately visible), peaks at p=0.45, gone by p≈0.37
// Faster than surface orbs (which peak at p=0.40 but never disappear)
function gridCollapseT(p)  { return Math.min(1, Math.sqrt(p / 0.45)) }
function collapseFade(t)   { return Math.max(0, 1.0 - t * 1.1) }

/* ── Card shape system ──────────────────────────────────────────────────────────
   N_ORB surface orbs are reused as the section-2 card particles.
   Animation: sphere → 50% collapse (p 0→0.40) → card shape (p 0.38→1.0).
   No opacity fade — orbs are always visible throughout the entire transform.
   Card changes at p≥0.90 animate uMorphCard 1→0→1 while swapping the buffer.
 ────────────────────────────────────────────────────────────────────────────── */
const N_ORB          = 13824   // 48×48×6 surface orbs
const CARD_COLLAPSE_DUR = 0.60  // 2× slower card-change collapse
const CARD_EXPAND_DUR   = 1.20  // 2× slower card-change bloom
const MAX_CARD_OP       = 0.92

export const CARD_COLORS = [
  '#68ccff', '#4ab8ff', '#78d4ff', '#5ab8ff',
  '#8ae0ff', '#54bbff', '#4caaff',
  // new service-page objects: portal, dashboard, chat, web-app, IoT
  '#6cceff', '#62d6ff', '#74d0ff', '#5cc2ff', '#7ad8ff',
  // new brand/trust objects: proof, about, process, contact, our-work
  '#8ae0ff', '#66ccff', '#5cc6ff', '#72d4ff', '#80dcff',
]

function _addLine(pts, x0,y0,z0, x1,y1,z1, n, jit=0.04) {
  for (let i=0; i<=n; i++) {
    const t=i/n
    pts.push(x0+(x1-x0)*t+(Math.random()-.5)*jit, y0+(y1-y0)*t+(Math.random()-.5)*jit, z0+(z1-z0)*t+(Math.random()-.5)*jit)
  }
}
function _addCircle(pts, cx,cy,cz, r, n, jit=0.028) {
  for (let i=0; i<n; i++) {
    const a=(i/n)*Math.PI*2
    pts.push(cx+Math.cos(a)*r+(Math.random()-.5)*jit, cy+Math.sin(a)*r+(Math.random()-.5)*jit, cz+(Math.random()-.5)*jit)
  }
}
function _addRect(pts, cx,cy,cz, hw,hh, ns,nh, jit=0.03) {
  for (let i=0; i<=ns; i++) {
    const t=i/ns
    pts.push(cx-hw+t*2*hw,cy+hh,cz+(Math.random()-.5)*jit)
    pts.push(cx-hw+t*2*hw,cy-hh,cz+(Math.random()-.5)*jit)
  }
  for (let i=0; i<=nh; i++) {
    const t=i/nh
    pts.push(cx-hw,cy-hh+t*2*hh,cz+(Math.random()-.5)*jit)
    pts.push(cx+hw,cy-hh+t*2*hh,cz+(Math.random()-.5)*jit)
  }
}
function _addCubeEdges(pts, cx,cy,cz, s, ns=18, jit=0.022) {
  const c=[[-s,-s,-s],[s,-s,-s],[s,s,-s],[-s,s,-s],[-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s]]
  const e=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
  for (const [a,b] of e) _addLine(pts, cx+c[a][0],cy+c[a][1],cz+c[a][2], cx+c[b][0],cy+c[b][1],cz+c[b][2], ns, jit)
}
function _addBezier(pts, p0,p1,p2,p3, n, jit=0.030) {
  for (let i=0; i<=n; i++) {
    const t=i/n, mt=1-t
    pts.push(
      mt*mt*mt*p0[0]+3*mt*mt*t*p1[0]+3*mt*t*t*p2[0]+t*t*t*p3[0]+(Math.random()-.5)*jit,
      mt*mt*mt*p0[1]+3*mt*mt*t*p1[1]+3*mt*t*t*p2[1]+t*t*t*p3[1]+(Math.random()-.5)*jit,
      mt*mt*mt*p0[2]+3*mt*mt*t*p1[2]+3*mt*t*t*p2[2]+t*t*t*p3[2]+(Math.random()-.5)*jit,
    )
  }
}
// Cubic-Bezier approximation of a rounded-rectangle outline (4 edges + 4 quarter-circle arcs)
function _addRoundedRect(pts, cx, cy, cz, hw, hh, cr, nW, nH, nC, jit=0.022) {
  const k = 0.5523 * cr
  _addLine(pts, cx-hw+cr, cy+hh, cz, cx+hw-cr, cy+hh, cz, nW, jit)
  _addLine(pts, cx+hw-cr, cy-hh, cz, cx-hw+cr, cy-hh, cz, nW, jit)
  _addLine(pts, cx-hw, cy-hh+cr, cz, cx-hw, cy+hh-cr, cz, nH, jit)
  _addLine(pts, cx+hw, cy+hh-cr, cz, cx+hw, cy-hh+cr, cz, nH, jit)
  _addBezier(pts,[cx+hw-cr,cy+hh,cz],[cx+hw-cr+k,cy+hh,cz],[cx+hw,cy+hh-cr+k,cz],[cx+hw,cy+hh-cr,cz],nC,jit)
  _addBezier(pts,[cx+hw,cy-hh+cr,cz],[cx+hw,cy-hh+cr-k,cz],[cx+hw-cr+k,cy-hh,cz],[cx+hw-cr,cy-hh,cz],nC,jit)
  _addBezier(pts,[cx-hw+cr,cy-hh,cz],[cx-hw+cr-k,cy-hh,cz],[cx-hw,cy-hh+cr-k,cz],[cx-hw,cy-hh+cr,cz],nC,jit)
  _addBezier(pts,[cx-hw,cy+hh-cr,cz],[cx-hw,cy+hh-cr+k,cz],[cx-hw+cr-k,cy+hh,cz],[cx-hw+cr,cy+hh,cz],nC,jit)
}

// Tiles a small anchor set of positions up to N_ORB with slight jitter
function _padToBig(pts, targetN) {
  const base = Math.floor(pts.length / 3)
  if (base === 0) return new Float32Array(targetN * 3)
  const arr = new Float32Array(targetN * 3)
  for (let i = 0; i < targetN; i++) {
    const src = i % base
    arr[i*3]   = pts[src*3]   + (Math.random()-.5)*0.05
    arr[i*3+1] = pts[src*3+1] + (Math.random()-.5)*0.05
    arr[i*3+2] = pts[src*3+2] + (Math.random()-.5)*0.05
  }
  return arr
}

// Like _padToBig but tiles a parallel per-point tag array with the SAME
// src = i % base mapping, so positions and tags stay aligned after padding.
// tag 0 = bright/large edge orb, tag 1 = normal surface orb.
function _padToBigTagged(pts, tags, targetN, tileJit = 0.05) {
  const base = Math.floor(pts.length / 3)
  const pos = new Float32Array(targetN * 3)
  const tag = new Float32Array(targetN)
  if (base === 0) return { pos, tags: tag }
  for (let i = 0; i < targetN; i++) {
    const src = i % base
    pos[i*3]   = pts[src*3]   + (Math.random()-.5)*tileJit
    pos[i*3+1] = pts[src*3+1] + (Math.random()-.5)*tileJit
    pos[i*3+2] = pts[src*3+2] + (Math.random()-.5)*tileJit
    tag[i]     = tags[src]
  }
  return { pos, tags: tag }
}

// ── Uniform-density hollow SHELL builder ──────────────────────────────────────
// Resample a closed contour to ~`step` arc-length spacing so SIDE WALLS get the
// same density regardless of how the path was originally authored.
function _resample(path, step) {
  const out = []
  let carry = 0
  const n = path.length
  for (let i = 0; i < n; i++) {
    const a = path[i], b = path[(i + 1) % n]
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy)
    if (L < 1e-6) continue
    let d = carry
    while (d < L) { const t = d / L; out.push([a[0] + dx * t, a[1] + dy * t]); d += step }
    carry = d - L
  }
  return out
}

// Build a genuinely 3-D HOLLOW shell from orbs at UNIFORM surface density:
//   • FRONT face + BACK face — the silhouette grid-filled at z=FZ and z=BZ
//   • SIDE WALLS — every contour in `paths` swept through the full depth
// NO interior volume → no stacked middle layers and no messy core (the user's
// complaint), yet it's closed front AND back so the rear is never open. Every
// surface is sampled at the same world-space STEP (grid step on the faces, arc
// step along the walls) → identical density everywhere. Depth is baked into the
// tag (front bright → back dim) so the shader reads it as a solid object.
// `addPt(x,y,z,jit,tag)`; `inShape(x,y)`→inside silhouette; `bbox=[x0,x1,y0,y1]`.
function _shell(addPt, inShape, bbox, paths, FZ, BZ, STEP, o = {}) {
  const frontTag = o.frontTag ?? 0.16, backTag = o.backTag ?? 0.66
  const wallFront = o.wallFront ?? 0.12, wallBack = o.wallBack ?? 0.6, edgeTag = o.edgeTag ?? 0.03
  const fj = o.faceJit ?? 0.004, wj = o.wallJit ?? 0.003
  const faceStep = o.faceStep ?? STEP
  const stagger = o.stagger ?? false                 // offset alternate rows ½-step → breaks the square screen-door lattice
  const frontTagFn = o.frontTagFn                     // optional (x,y)→tag for a rim-bright / centre-dim gradient
  // FRONT + BACK faces — grid inside the silhouette, mirrored in z. Staggered rows +
  // an optional brightness gradient defeat the "screen-door" look of a flat lattice.
  let row = 0
  for (let y = bbox[2]; y <= bbox[3] + 1e-6; y += faceStep) {
    const xoff = stagger && (row & 1) ? faceStep * 0.5 : 0
    for (let x = bbox[0] + xoff; x <= bbox[1] + 1e-6; x += faceStep) {
      if (!inShape(x, y)) continue
      addPt(x, y, FZ, fj, frontTagFn ? frontTagFn(x, y) : frontTag)
      addPt(x, y, BZ, fj, backTag)
    }
    row++
  }
  // SIDE WALLS — sweep each contour through z at the SAME spacing (uniform skin).
  const DEPTH = FZ - BZ
  for (const raw of paths) {
    const path = _resample(raw, STEP)
    for (const [x, y] of path) {
      for (let z = BZ; z <= FZ + 1e-6; z += STEP) {
        const fz = (z - BZ) / DEPTH
        addPt(x, y, z, wj, wallBack - fz * (wallBack - wallFront))
      }
      addPt(x, y, FZ, wj, edgeTag)   // crisp front silhouette edge
    }
  }
}

// Closed-contour helpers used to feed `_shell` side walls.
function _circleContour(cx, cy, r, n = 96) { const P = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]) } return P }
function _rrContour(cx, cy, hw, hh, cr) {
  const P = [], nS = 40, nA = 10, ap = (x, y) => P.push([x, y])
  for (let i = 0; i < nS; i++) { const t = i / nS; ap(-hw + cr + t * (2 * hw - 2 * cr), hh) }
  for (let i = 0; i <= nA; i++) { const a = Math.PI / 2 * (1 - i / nA); ap(hw - cr + Math.cos(a) * cr, hh - cr + Math.sin(a) * cr) }
  for (let i = 1; i < nS; i++) { const t = i / nS; ap(hw, hh - cr - t * (2 * hh - 2 * cr)) }
  for (let i = 0; i <= nA; i++) { const a = -Math.PI / 2 * i / nA; ap(hw - cr + Math.cos(a) * cr, -(hh - cr) + Math.sin(a) * cr) }
  for (let i = 1; i < nS; i++) { const t = i / nS; ap(hw - cr - t * (2 * hw - 2 * cr), -hh) }
  for (let i = 0; i <= nA; i++) { const a = -Math.PI / 2 - Math.PI / 2 * i / nA; ap(-(hw - cr) + Math.cos(a) * cr, -(hh - cr) + Math.sin(a) * cr) }
  for (let i = 1; i < nS; i++) { const t = i / nS; ap(-hw, -(hh - cr) + t * (2 * hh - 2 * cr)) }
  for (let i = 0; i <= nA; i++) { const a = Math.PI - Math.PI / 2 * i / nA; ap(-(hw - cr) + Math.cos(a) * cr, (hh - cr) + Math.sin(a) * cr) }
  return P
}

// Clean filled disk — concentric rings at uniform `step` spacing (NO random
// scatter, so small dots/heads read crisp instead of as a blobby cluster).
function _diskFill(add, cx, cy, z, rad, tag, step, jit = 0.002) {
  add(cx, cy, z, jit, tag)
  for (let r = step; r <= rad + 1e-6; r += step) {
    const n = Math.max(6, Math.round(2 * Math.PI * r / step))
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; add(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z, jit, tag) }
  }
}
// Clean person silhouette (filled head disk + shoulders dome) on uniform rows —
// the caller draws the surrounding circle ring. Replaces the old scatter avatars
// that read as messy blobs / frowny faces.
function _personIcon(add, cx, cy, z, rr, tag, step) {
  const hr = rr * 0.30, hy = cy + rr * 0.34
  _diskFill(add, cx, hy, z, hr, tag, step)                                   // head
  const bw = rr * 0.76, bh = rr * 0.54, byc = cy - rr * 0.50
  for (let y = byc; y <= byc + bh + 1e-6; y += step) {
    const tt = (y - byc) / bh, halfW = bw * Math.sqrt(Math.max(0, 1 - tt * tt))
    for (let x = -halfW; x <= halfW + 1e-6; x += step) if (x * x + (y - cy) ** 2 < (rr * 0.84) ** 2) add(cx + x, y, z, 0.002, tag)
  }
}

// Inflated 3-D "pillow" bubble: a rounded-rect SIGNED-DISTANCE puff with an even
// jittered surface (front bright, back dim, rim hot). A genuinely rounded volumetric
// form (NOT a flat extruded outline) — the jitter reads as a fine dotted fill head-on
// and the ±z surface reads as a rounded shell when it sways/turns. Returns `zb(x,y)`
// so the caller can sit details (dots, tail) on the FRONT of the puff.
function _inflatedBubble(add, bx, by, bhw, bhh, bcr, DEPTH, frontTag = 0.36, step = R * 0.018) {
  const sdf = (x, y) => { const qx = Math.abs(x - bx) - (bhw - bcr), qy = Math.abs(y - by) - (bhh - bcr), ox = Math.max(qx, 0), oy = Math.max(qy, 0); return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - bcr }
  const zb = (x, y) => { const d = -sdf(x, y); if (d <= 0) return 0; const t = Math.min(1, d / bhh); return DEPTH * Math.sqrt(t * (2 - t)) }
  { const P = _resample(_rrContour(bx, by, bhw, bhh, bcr), R * 0.011); for (const [x, y] of P) { add(x, y, 0, 0.002, 0.0); add(x, y, 0, 0.005, 0.05) } }   // bright silhouette rim
  // Dense surface authored CLOSE to the orb budget so padding barely duplicates →
  // an EVEN fine fill (not the clumpy 3-4× duplicated look). Modest jitter breaks the
  // lattice without clumping.
  for (let gy = by - bhh; gy <= by + bhh + 1e-6; gy += step) for (let gx = bx - bhw; gx <= bx + bhw + 1e-6; gx += step) {
    const x = gx + (Math.random() - 0.5) * step * 0.62, y = gy + (Math.random() - 0.5) * step * 0.62, s = sdf(x, y)
    if (s > -R * 0.004) continue
    const z = zb(x, y), edge = -s < R * 0.045
    add(x, y, z, 0.003, edge ? 0.06 : frontTag)                                                          // front face — even, hot near rim
    if ((Math.round((gx - bx) / step) + Math.round((gy - by) / step)) % 2 === 0) add(x, y, -z, 0.003, 0.8)   // back face — half-density, dim
  }
  return zb
}

// Object 01 — GLOBE (Services Overview). A clean lat/long wireframe sphere with
// two tilted ORBITAL RINGS arcing around it, a sparse dim surface fill, and a
// small base glow. Bright/large orbs on the grid + rings (tag 0); small dim orbs
// for the surface scatter (tag 1).
function _genBrowserFrame() {
  const pts = [], tags = []
  const GR = R * 1.30

  // 3/4 tilt so the parallels open into ellipses (orbs spread evenly in screen
  // space → smooth) and the grid + rings read dimensional, not flat-on.
  const TY = Math.PI * 0.05, TX = Math.PI * 0.11
  const cY = Math.cos(TY), sY = Math.sin(TY)
  const cX = Math.cos(TX), sX = Math.sin(TX)
  const tilt = (x, y, z) => { const x1 = x * cY + z * sY, z1 = -x * sY + z * cY; return [x1, y * cX - z1 * sX, y * sX + z1 * cX] }
  const add = (x, y, z, jit, tag) => {
    const [tx, ty, tz] = tilt(x, y, z)
    pts.push(tx + (Math.random() - .5) * jit, ty + (Math.random() - .5) * jit, tz + (Math.random() - .5) * jit)
    tags.push(tag)
  }

  // GRID — lat/long wireframe with DEPTH-BAKED tags: front orbs (toward camera)
  // are bright + big (low tag), back orbs fade to small + dim + transparent (high
  // tag). This makes the sphere read as a solid 3-D object — bright front face,
  // softly filled back — instead of a flat doubled wireframe.
  const gridTag = (tz) => { const nf = (tz / GR) * 0.5 + 0.5; return 0.17 + (1 - Math.max(0, Math.min(1, nf))) * 0.52 }
  const gridAdd = (x, y, z) => { const [, , tz] = tilt(x, y, z); add(x, y, z, 0.003, gridTag(tz)) }
  const N_MER = 12
  for (let m = 0; m < N_MER; m++) {
    const phi = (m / N_MER) * Math.PI, cp = Math.cos(phi), sp = Math.sin(phi)
    const N = 230
    for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2, s = Math.sin(a); gridAdd(GR * s * cp, GR * Math.cos(a), GR * s * sp) }
  }
  const LATS = [0, 0.24, -0.24, 0.47, -0.47, 0.68, -0.68, 0.85, -0.85]
  for (const ly of LATS) {
    const yy = GR * ly, rr = GR * Math.sqrt(Math.max(0, 1 - ly * ly))
    const N = Math.max(64, Math.round(260 * rr / GR))
    for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; gridAdd(rr * Math.cos(a), yy, rr * Math.sin(a)) }
  }

  // SURFACE FILL — faint dots giving the sphere solid volume (high tag → small +
  // dim + transparent via the shader, darkest in back → never a solid blob).
  const N_SURF = 2200, golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < N_SURF; i++) {
    const fy = 1 - (i / (N_SURF - 1)) * 2, fr = Math.sqrt(1 - fy * fy), fa = golden * i
    const [, , tz] = tilt(Math.cos(fa) * fr * GR, fy * GR, Math.sin(fa) * fr * GR)
    add(Math.cos(fa) * fr * GR * 0.985, fy * GR * 0.985, Math.sin(fa) * fr * GR * 0.985, 0.008, tz > 0 ? 0.8 : 0.95)
  }

  // RINGS — close-hugging tilted-equatorial orbital bands. Each orb's tag ramps by
  // DEPTH (front bright/big, back faded) AND thickness scales with brightness, so
  // the front arc is a BOLD thick streak crossing the globe that tapers to thin
  // faded dots at the ends — the ref's "thick in the middle, fades out at the ends".
  const depthTag = (tz, floor, ceil) => { const f = (tz / (GR * 1.1)) * 0.5 + 0.5; const t = Math.pow(1 - Math.max(0, Math.min(1, f)), 1.5); return floor + (ceil - floor) * t }
  // Great circle centred on the sphere → crosses the CENTRE (not looping below).
  // rollDeg = diagonal angle of the band in screen; edgeDeg = how edge-on (90 =
  // pure line, lower = more open ellipse). The front half (tz>0) is the bright
  // streak; the back half fades via depthTag.
  const greatCircle = (RR, rollDeg, edgeDeg, floor, ceil, maxThick) => {
    const roll = rollDeg * Math.PI / 180, edge = edgeDeg * Math.PI / 180
    const ux = Math.cos(roll), uy = Math.sin(roll)
    const vx = -Math.sin(roll) * Math.cos(edge), vy = Math.cos(roll) * Math.cos(edge), vz = Math.sin(edge)
    const N = 560
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a)
      const px = RR * (c * ux + s * vx), py = RR * (c * uy + s * vy), pz = RR * (s * vz)
      const [, , tz] = tilt(px, py, pz)
      const tag = depthTag(tz, floor, ceil)
      const thick = 1 + Math.round((1 - tag) * (maxThick - 1))   // thin faded ends … thick bright middle
      for (let k = 0; k < thick; k++) add(px, py, pz, k === 0 ? 0.002 : 0.011, tag)
    }
  }
  greatCircle(GR * 1.02, 26, 62, 0.0, 1.0, 6)   // bold bright streak, lower-left → upper-right
  greatCircle(GR * 1.06, -8, 74, 0.10, 1.0, 3)  // subtler second band, shallower

  // BASE BEAM — a narrow bright vertical column of orbs at the bottom shining up
  // (orbs only). Brightest + densest at the base, tapering + fading upward.
  const beamBase = -GR * 1.04, beamH = GR * 1.25
  for (let i = 0; i < 420; i++) {
    const t = Math.pow(Math.random(), 1.5)            // bias toward the base
    const y = beamBase + t * beamH
    const spread = (0.008 + t * 0.04) * GR
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * spread
    add(Math.cos(a) * rr, y, Math.sin(a) * rr, 0.004, t * 0.62)
  }
  for (let i = 0; i < 110; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * GR * 0.13; add(Math.cos(a) * rr, beamBase + GR * 0.02, Math.sin(a) * rr, 0.006, 0.0) }

  return _padToBigTagged(pts, tags, N_ORB, 0.008)
}
// Object 03 — GEAR (Software Development). A SOLID, dimensional gear built from a
// dense field of orbs: bright filled front face, dim filled back face, side walls
// giving real thickness, crisp tooth + hole edges, a hub ring, and a base glow.
function _genCommandCube() {
  const pts = [], tags = []
  const GR = R * 1.16
  const N_TEETH = 8
  const R_TOOTH = GR, R_BODY = GR * 0.78, R_HOLE = GR * 0.34
  const DEPTH = R * 0.42, FZ = DEPTH / 2, BZ = -DEPTH / 2   // real thickness (visible 3-D)
  const period = Math.PI * 2 / N_TEETH, halfTooth = period * 0.44 / 2

  const TY = Math.PI * 0.07, TX = Math.PI * 0.04
  const cY = Math.cos(TY), sY = Math.sin(TY), cX = Math.cos(TX), sX = Math.sin(TX)
  const tilt = (x, y, z) => { const x1 = x * cY + z * sY, z1 = -x * sY + z * cY; return [x1, y * cX - z1 * sX, y * sX + z1 * cX] }
  const addPt = (x, y, z, jit, tag) => { const [tx, ty, tz] = tilt(x, y, z); pts.push(tx + (Math.random() - .5) * jit, ty + (Math.random() - .5) * jit, tz + (Math.random() - .5) * jit); tags.push(tag) }
  const ring = (rr, z, jit, tag, passes = 1) => { const c = Math.max(44, Math.round(rr * 150)); for (let p = 0; p < passes; p++) for (let i = 0; i < c; i++) { const a = i / c * Math.PI * 2; addPt(rr * Math.cos(a), rr * Math.sin(a), z, jit, tag) } }
  const gearR = (θ) => { const t = ((θ % period) + period) % period, m = Math.min(t, period - t); return m <= halfTooth ? R_TOOTH : R_BODY }
  const inGear = (x, y) => { const r = Math.hypot(x, y); return r >= R_HOLE && r <= gearR(Math.atan2(y, x)) }

  // ── Gear tooth outline (2D profile) ──
  const outline = [], NV = 9, NW = 6, NT = 13
  for (let i = 0; i < N_TEETH; i++) {
    const θc = i * period, θv = θc - (period - halfTooth), θr = θc - halfTooth, θf = θc + halfTooth
    for (let j = 0; j < NV; j++) { const θ = θv + (θr - θv) * j / NV; outline.push([R_BODY * Math.cos(θ), R_BODY * Math.sin(θ)]) }
    for (let j = 0; j <= NW; j++) { const r = R_BODY + (R_TOOTH - R_BODY) * j / NW; outline.push([r * Math.cos(θr), r * Math.sin(θr)]) }
    for (let j = 0; j <= NT; j++) { const θ = θr + (θf - θr) * j / NT; outline.push([R_TOOTH * Math.cos(θ), R_TOOTH * Math.sin(θ)]) }
    for (let j = 1; j <= NW; j++) { const r = R_TOOTH + (R_BODY - R_TOOTH) * j / NW; outline.push([r * Math.cos(θf), r * Math.sin(θf)]) }
  }
  const holePath = []; { const c = Math.max(48, Math.round(R_HOLE * 150)); for (let i = 0; i < c; i++) { const a = i / c * Math.PI * 2; holePath.push([R_HOLE * Math.cos(a), R_HOLE * Math.sin(a)]) } }
  // ── HOLLOW SHELL — bright front gear face + dim back face + clean tooth & hole
  //    side-wall surfaces, all at one uniform density (no messy interior cloud). ──
  _shell(addPt, inGear, [-R_TOOTH, R_TOOTH, -R_TOOTH, R_TOOTH], [outline, holePath], FZ, BZ, R * 0.032,
    { frontTag: 0.13, backTag: 0.66, wallFront: 0.10, wallBack: 0.56 })
  // Tooth-root circle — a crisp bright ring just inside the teeth (defines the body).
  ring(R_BODY, FZ, 0.003, 0.14, 2)
  ring(R_HOLE, FZ, 0.003, 0.04, 3)   // crisp front hole rim
  // ── Hub ring + inner body ring (front detail) ──
  ring(R_HOLE * 1.5, FZ, 0.004, 0.16, 2)
  ring(R_BODY * 0.9, FZ, 0.004, 0.28, 1)
  // ── Radial ticks between hub and body (mechanical detail) ──
  const NSPOKE = 16
  for (let i = 0; i < NSPOKE; i++) { const a = i / NSPOKE * Math.PI * 2, r0 = R_HOLE * 1.58, r1 = R_BODY * 0.86, n = 6; for (let k = 0; k <= n; k++) { const r = r0 + (r1 - r0) * k / n; addPt(r * Math.cos(a), r * Math.sin(a), FZ, 0.004, 0.4) } }
  // ── Base glow ──
  for (let i = 0; i < 130; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * GR * 0.5; addPt(Math.cos(a) * rr, -GR * 1.04, Math.sin(a) * rr * 0.4, 0.02, 0.06) }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.012)
  out.normal = tilt(0, 0, 1)
  return out
}
// Object 02 — CODE PANEL (Website Development). A FRONT-FACING rounded-rect panel
// built from orbs, with a bright raised </> in the centre and dotted "code line"
// rows flanking it. Thin depth + back-dimming (shader) keeps the outline a clean
// single edge, not the old doubled extrusion.
function _genCodeBlock() {
  const pts = [], tags = []
  const HW = R * 1.08, HH = R * 0.84, CR = R * 0.22
  const DEPTH = R * 0.34, FZ = DEPTH / 2, BZ = -DEPTH / 2   // real thickness (visible 3-D)
  const BW = R * 0.13                                       // glowing border band width
  const LIFT = R * 0.05, SFZ = FZ + LIFT

  const TY = Math.PI * 0.065, TX = Math.PI * 0.03
  const cY = Math.cos(TY), sY = Math.sin(TY), cX = Math.cos(TX), sX = Math.sin(TX)
  const tilt = (x, y, z) => { const x1 = x * cY + z * sY, z1 = -x * sY + z * cY; return [x1, y * cX - z1 * sX, y * sX + z1 * cX] }
  const addPt = (x, y, z, jit, tag) => { const [tx, ty, tz] = tilt(x, y, z); pts.push(tx + (Math.random() - .5) * jit, ty + (Math.random() - .5) * jit, tz + (Math.random() - .5) * jit); tags.push(tag) }
  const inRR = (x, y, hw, hh, cr) => { const ax = Math.abs(x), ay = Math.abs(y); if (ax > hw || ay > hh) return false; if (ax <= hw - cr || ay <= hh - cr) return true; return (ax - (hw - cr)) ** 2 + (ay - (hh - cr)) ** 2 <= cr * cr }
  const inBand = (x, y) => inRR(x, y, HW, HH, CR) && !inRR(x, y, HW - BW, HH - BW, Math.max(R * 0.04, CR - BW))

  // ── BORDER-BAND HOLLOW SHELL — bright front bezel + dim back bezel + clean outer
  //    & inner side-wall surfaces, all at one uniform density. Screen interior stays
  //    hollow/dark; the rear is closed (no open back); no interior cloud. ──
  const innerCR = Math.max(R * 0.05, CR - BW)
  _shell(addPt, inBand, [-HW, HW, -HH, HH], [_rrContour(0, 0, HW, HH, CR), _rrContour(0, 0, HW - BW, HH - BW, innerCR)],
    FZ, BZ, R * 0.032, { frontTag: 0.13, backTag: 0.66, wallFront: 0.10, wallBack: 0.56 })

  // </> glyph — centred, raised, bright.
  const ix = R * 0.20, cw = R * 0.40, ch = R * 0.46, sltX = R * 0.12, slY = R * 0.50
  const glyph = [[[-ix, ch], [-ix - cw, 0], [-ix, -ch]], [[ix, ch], [ix + cw, 0], [ix, -ch]], [[-sltX, -slY], [sltX, slY]]]
  for (const path of glyph) for (let s = 0; s < path.length - 1; s++) {
    const [ax, ay] = path[s], [bx, by] = path[s + 1]
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), n = Math.max(8, Math.round(L / (R * 0.015)))
    for (let pass = 0; pass < 6; pass++) for (let k = 0; k <= n; k++) { const t = k / n; addPt(ax + dx * t, ay + dy * t, SFZ, 0.004, 0.02) }
  }

  // CODE LINES — rows of short bright "character" dots filling the inner face like
  // lines of code (denser than dashes; reads as text). Skips the central glyph zone.
  const innerHW = HW - BW - R * 0.06, innerTop = HH - BW - R * 0.10
  const rowH = R * 0.20
  for (let ry = innerTop; ry > -innerTop + rowH * 0.5; ry -= rowH) {
    let x = -innerHW
    const inGlyphRow = Math.abs(ry) < ch * 0.92
    while (x < innerHW) {
      const seg = (1 + Math.floor(Math.random() * 4)) * R * 0.05    // a "word" of n chars
      const inGlyphX = inGlyphRow && x > -R * 0.66 && x < R * 0.66
      if (!inGlyphX) for (let cx = x; cx < x + seg && cx < innerHW; cx += R * 0.05) addPt(cx, ry, FZ, 0.004, 0.22)
      x += seg + R * 0.06
    }
  }
  // Faint panel face fill (very dim) for body solidity.
  for (let i = 0; i < 600; i++) { const x = (Math.random() * 2 - 1) * (HW - BW), y = (Math.random() * 2 - 1) * (HH - BW); if (inRR(x, y, HW - BW, HH - BW, Math.max(R * 0.04, CR - BW))) addPt(x, y, FZ - R * 0.02, 0.012, 0.9) }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.012)
  out.normal = tilt(0, 0, 1)
  return out
}
// Object 04 — CLOCK (Automated Workflow). Front-facing clock face: bright outer
// rim + inner bezel, 12 hour ticks (long at 12/3/6/9) + minute dots, two tapered
// hands at 10:10, a center hub, and a sparse face fill. Gentle tilt for depth.
function _genWorkflowPath() {
  const pts = [], tags = []
  const CR = R * 1.14            // outer rim radius
  const DEPTH = R * 0.20, FZ = DEPTH / 2, BZ = -DEPTH / 2   // modest thickness (flat clock face → crisp front)
  const TY = Math.PI * 0.06, TX = Math.PI * 0.03
  const cY = Math.cos(TY), sY = Math.sin(TY), cX = Math.cos(TX), sX = Math.sin(TX)
  const tilt = (x, y, z) => { const x1 = x * cY + z * sY, z1 = -x * sY + z * cY; return [x1, y * cX - z1 * sX, y * sX + z1 * cX] }
  const addPt = (x, y, z, jit, tag) => { const [tx, ty, tz] = tilt(x, y, z); pts.push(tx + (Math.random() - .5) * jit, ty + (Math.random() - .5) * jit, tz + (Math.random() - .5) * jit); tags.push(tag) }
  const ring = (rr, z, jit, tag, passes = 1) => { const c = Math.max(60, Math.round(rr * 200)); for (let p = 0; p < passes; p++) for (let i = 0; i < c; i++) { const a = i / c * Math.PI * 2; addPt(rr * Math.cos(a), rr * Math.sin(a), z, jit, tag) } }

  // ── OUTER RIM — clean thick glowing band: crisp bright outer + inner edge rings
  //    with a dense fill between, a dim back copy, and a side wall → 3-D thickness. ──
  const rimW = R * 0.13, rimInner = CR - rimW
  // ── RIM HOLLOW SHELL — bright front rim face + dim back rim face + clean outer &
  //    inner side walls at one uniform density (real 3-D ring, closed back, no
  //    interior cloud). The clock face itself stays hollow/dark like the reference. ──
  const inRim = (x, y) => { const r = Math.hypot(x, y); return r >= rimInner && r <= CR }
  _shell(addPt, inRim, [-CR, CR, -CR, CR], [_circleContour(0, 0, CR, 140), _circleContour(0, 0, rimInner, 130)],
    FZ, BZ, R * 0.026, { frontTag: 0.11, backTag: 0.64, wallFront: 0.09, wallBack: 0.56 })

  // ── MINUTE TRACK — dense ring of dots (bigger/bright at the 5-min marks) ──
  for (let pass = 0; pass < 4; pass++) for (let m = 0; m < 60; m++) { const ang = Math.PI / 2 - m * (Math.PI / 30), big = (m % 5 === 0); addPt(CR * 0.82 * Math.cos(ang), CR * 0.82 * Math.sin(ang), FZ, 0.003, big ? 0.02 : 0.14) }
  // ── HOUR MARKERS — 12 bright radial tick bars just inside the minute track ──
  for (let h = 0; h < 12; h++) {
    const ang = Math.PI / 2 - h * (Math.PI / 6), r0 = CR * 0.64, r1 = CR * 0.74, n = 6
    for (let pass = 0; pass < 3; pass++) for (let k = 0; k <= n; k++) { const r = r0 + (r1 - r0) * k / n; addPt(r * Math.cos(ang), r * Math.sin(ang), FZ, 0.006, 0.02) }
  }

  // (Clock face stays hollow/dark like the reference — only the rim, track, markers,
  //  hands and hub carry orbs, so there are no flat translucent discs in the centre.)

  // ── HANDS at 10:10 — clean tapered bright bars, raised off the face. ──
  const hand = (ang, len, wid, zLift) => {
    const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx, n = Math.max(20, Math.round(len / 0.015))
    for (let k = 0; k <= n; k++) { const t = k / n, w = wid * (1 - t * 0.6); for (let c = -2; c <= 2; c++) { const off = (c / 2) * w; addPt(dx * len * t + px * off, dy * len * t + py * off, zLift, 0.003, 0.03) } }
  }
  hand(Math.PI * 5 / 6, CR * 0.48, R * 0.032, FZ + R * 0.04)   // hour → 10
  hand(Math.PI / 6, CR * 0.66, R * 0.026, FZ + R * 0.06)       // minute → 2
  // ── Center hub ──
  for (let i = 0; i < 90; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * R * 0.08; addPt(Math.cos(a) * rr, Math.sin(a) * rr, FZ + R * 0.07, 0.004, 0.03) }
  // ── Base glow ──
  for (let i = 0; i < 130; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * CR * 0.5; addPt(Math.cos(a) * rr, -CR * 1.03, Math.sin(a) * rr * 0.4, 0.02, 0.06) }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.008)
  out.normal = tilt(0, 0, 1)
  return out
}
function _genIntelligenceOrbit() {
  // Premium sparkle cluster: three 4-pointed sparkles (large / medium / small).
  // Silhouette = 3D-puffed astroid  x = Rs·sin³t, y = Rs·cos³t.
  const pts = [], tags = []

  // Near front-on — symmetric 4-point silhouette; the astroid puff (d) + depth
  // dimming still give a rounded 3D read without skewing the star.
  const ax = 0.13, ay = 0.11
  const cax=Math.cos(ax), sax=Math.sin(ax), cay=Math.cos(ay), say=Math.sin(ay)
  const addPt = (x, y, z, jit, tag) => {
    x+=(Math.random()-.5)*jit; y+=(Math.random()-.5)*jit; z+=(Math.random()-.5)*jit
    const x1=x*cay+z*say, z1=-x*say+z*cay
    pts.push(x1, y*cax-z1*sax, y*sax+z1*cax); tags.push(tag)
  }

  // One smooth, CLOSED surface per star (a shell, NOT a solid — a solid makes
  // bigger stars project denser).  A puffed astroid swept by a polar angle φ:
  // front pole (φ=0) → equator/rim (φ=π/2) → back pole (φ=π) is ONE continuous
  // skin, so the two faces join in a single ROUNDED edge — no gap and no sharp
  // seam where they meet.  Steps are sized to a fixed world-space spacing so
  // every star carries the same surface density regardless of size.
  const TWO_PI = Math.PI * 2
  // SURFACE-ONLY puffed-astroid SHELL (no interior fill — a solid fill makes bigger
  // stars project denser). Swept by polar angle φ: front pole (φ=0, toward camera)
  // → rim/silhouette (φ=π/2) → back pole (φ=π). Steps sized to a fixed world-space
  // spacing so EVERY star carries the same surface density. Front skin bright, back
  // skin dim, the rim edge crisp/hot → a clean dimensional 3-D star.
  const drawSparkle = (cx, cy, cz, Rs, d) => {
    const STEP = R * 0.019
    for (let phi = 0; phi <= Math.PI + 1e-4;) {
      const s = Math.sin(phi), z = d * Math.cos(phi), front = z >= 0
      if (s < 2e-3) { addPt(cx, cy, cz + z, 0.004, front ? 0.05 : 0.6) }   // pole
      else {
        const ringR = Rs * s, nT = Math.max(6, Math.round(6 * ringR / STEP)), t0 = Math.random() * TWO_PI
        const tag = s > 0.9 ? 0.05 : (front ? 0.16 + (1 - s) * 0.14 : 0.52)   // rim hot · front bright · back dim
        for (let i = 0; i < nT; i++) { const t = t0 + (i / nT) * TWO_PI, st = Math.sin(t), ct = Math.cos(t); addPt(cx + ringR * st * st * st, cy + ringR * ct * ct * ct, cz + z, 0.004, tag) }
      }
      const c = Math.cos(phi), ds = Math.sqrt(Rs * Rs * c * c + d * d * s * s); phi += STEP / Math.max(ds, 1e-3)
    }
    // Crisp bright silhouette edge (astroid at the rim, z=0).
    const nOut = Math.max(60, Math.round(6 * Rs / STEP))
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < nOut; i++) { const t = (i / nOut) * TWO_PI, st = Math.sin(t), ct = Math.cos(t); addPt(cx + Rs * st * st * st, cy + Rs * ct * ct * ct, cz, 0.003, 0.03) }
  }

  drawSparkle(-R * 0.20, R * 0.02, 0, R * 0.58, R * 0.24)   // large — centre-left
  drawSparkle(R * 0.52, R * 0.52, 0, R * 0.30, R * 0.13)    // medium — upper-right
  drawSparkle(R * 0.46, -R * 0.44, 0, R * 0.22, R * 0.10)   // small  — lower-right
  // Base glow under the large star.
  for (let i = 0; i < 110; i++) { const a = Math.random() * TWO_PI, rr = Math.sqrt(Math.random()) * R * 0.4; addPt(-R * 0.20 + Math.cos(a) * rr, -R * 0.86 + Math.sin(a) * rr * 0.35, 0, 0.02, 0.5) }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.01)
  out.normal = [0, 0, 1]
  return out
}
function _genConnectedCubes() {
  // Three CLEAN interlocking circular rings in a triangular cluster (Ecosystems).
  // Each ring is a thin bright torus sitting on its own z-plane so the overlaps
  // read as connected systems — no sin(2θ) weave (that made it a tangled knot).
  const pts = [], tags = []

  // Gentle 3/4 tilt so the cluster reads dimensional but the rings stay circular.
  const ax = 0.17, ay = 0.10
  const cax=Math.cos(ax), sax=Math.sin(ax), cay=Math.cos(ay), say=Math.sin(ay)
  const addPt = (x, y, z, jit, tag) => {
    x+=(Math.random()-.5)*jit; y+=(Math.random()-.5)*jit; z+=(Math.random()-.5)*jit
    const x1=x*cay+z*say, z1=-x*say+z*cay
    pts.push(x1, y*cax-z1*sax, y*sax+z1*cax); tags.push(tag)
  }

  const Rmaj = R*0.58    // ring major radius
  const tube = R*0.10    // THICK glowing tube (volumetric torus, not a wire circle)
  const sep  = R*0.42    // each ring centre's distance from the shared centroid

  // Volumetric torus: the tube cross-section disk is FILLED with orbs so each ring
  // reads as a thick glowing tube. Tube centre bright, edges softer; the back half
  // of the tube (away from camera) dims for 3-D volume. Crisp bright rim contours.
  const addRing = (cx, cy, zPlane) => {
    const Nmaj = 300, Nmin = 14
    for (let i = 0; i < Nmaj; i++) {
      const th = (i / Nmaj) * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th)
      for (let j = 0; j < Nmin; j++) {
        const ph = (j / Nmin) * Math.PI * 2 + Math.random() * 0.2, cp = Math.cos(ph), sp = Math.sin(ph)
        const ringR = Rmaj + cp * tube, dz = sp * tube
        // outer/inner rim (|cp|→1) crisp + bright; tube front (dz>0) bright, back dim
        const rim = Math.abs(cp) > 0.6
        const tag = rim ? 0.06 : (dz < 0 ? 0.62 : 0.3)
        addPt(cx + ct * ringR, cy + st * ringR, zPlane + dz, 0.004, tag)
      }
    }
    // extra crisp bright rim contours
    for (let i = 0; i < Nmaj; i++) {
      const th = (i / Nmaj) * Math.PI * 2, ct = Math.cos(th), st = Math.sin(th)
      addPt(cx + ct * (Rmaj + tube), cy + st * (Rmaj + tube), zPlane, 0.003, 0.04)
      addPt(cx + ct * (Rmaj - tube), cy + st * (Rmaj - tube), zPlane, 0.003, 0.04)
    }
  }

  // Triangular cluster: top, lower-left, lower-right — each on a distinct z-plane
  // so overlaps interlock (top front, left mid, right back).
  addRing(0,            sep,       R*0.10)   // top  — front
  addRing(-sep*0.866,  -sep*0.5,   0)        // lower-left — mid
  addRing( sep*0.866,  -sep*0.5,  -R*0.10)   // lower-right — back
  // Base glow under the cluster.
  for (let i = 0; i < 130; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * R * 0.55; addPt(Math.cos(a) * rr, -sep * 0.5 - Rmaj - R * 0.06, Math.sin(a) * rr * 0.4, 0.02, 0.06) }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.012)
  out.normal = [0, 0, 1]
  return out
}
function _genFunnel() {
  // Premium 3D marketing funnel built from orbs — wide elliptical top rim,
  // tapered cone-of-revolution body, cylindrical output neck, and a short
  // decreasing vertical stream of leads dropping out the bottom.
  const pts = [], tags = []

  // Slightly elevated front view: tilt forward about X so the top opening
  // reads as an ellipse and the inner surface is visible.
  const ax = 0.42, ay = 0.0
  const cax=Math.cos(ax), sax=Math.sin(ax), cay=Math.cos(ay), say=Math.sin(ay)
  const addPt = (x, y, z, jit, tag) => {
    x+=(Math.random()-.5)*jit; y+=(Math.random()-.5)*jit; z+=(Math.random()-.5)*jit
    const x1=x*cay+z*say, z1=-x*say+z*cay
    pts.push(x1, y*cax-z1*sax, y*sax+z1*cax); tags.push(tag)
  }

  const topR = R*0.99   // wide top opening radius
  const neckR= R*0.15   // output neck radius
  const topY = R*0.85   // top rim height
  const coneB= -R*0.41  // where the cone meets the neck
  const neckB= -R*0.76  // bottom of the neck

  // A horizontal ring of orbs at height y, radius rad. brightRim → all tag-0.
  const ring = (y, rad, n, jit, brightRim) => {
    for (let i=0; i<n; i++) {
      const a=(i/n)*Math.PI*2
      // front-facing arc (toward camera, sin a < 0 after tilt) reads as silhouette edge
      const tag = brightRim ? 0 : 1
      addPt(Math.cos(a)*rad, y, Math.sin(a)*rad, jit, tag)
    }
  }

  // ── Top rim — dense, bright, crisp (triple pass for a solid luminous lip) ──
  ring(topY, topR, 240, 0.004, true)
  ring(topY, topR*0.992, 240, 0.004, true)
  ring(topY, topR*0.984, 240, 0.004, true)

  // ── Cone body — DENSELY stacked rings tapering top→neck so it reads as a solid
  //    cone. The near (front, sin a > 0) surface is bright, the far surface dims,
  //    and the left/right silhouette edges are crisp → 3-D volume. ──
  const coneRows = 52
  for (let r=0; r<=coneRows; r++) {
    const t = r/coneRows
    const y = topY + (coneB-topY)*t
    const rad = topR + (neckR-topR)*t
    const n = Math.max(Math.round(rad*200), 44)
    for (let i=0; i<n; i++) {
      const a=(i/n)*Math.PI*2, sa=Math.sin(a), ca=Math.cos(a)
      const edge = Math.abs(ca) > 0.84
      const tag = edge ? 0.05 : (sa > 0 ? 0.3 : 0.6)   // edges crisp; near bright; far dim
      addPt(Math.cos(a)*rad, y, sa*rad, 0.005, tag)
    }
  }

  // ── Output neck — short cylinder, dense enough to read as a clean channel ──
  const neckRows = 8
  for (let r=0; r<=neckRows; r++) {
    const t=r/neckRows
    const y=coneB+(neckB-coneB)*t
    ring(y, neckR, 50, 0.005, true)  // neck channel — keep bright/visible
  }

  // ── Output stream — larger glowing orbs decreasing as they fall, centered ──
  const drops = [
    [neckB - R*0.18, R*0.070],
    [neckB - R*0.38, R*0.054],
    [neckB - R*0.56, R*0.039],
    [neckB - R*0.70, R*0.026],
  ]
  const gold = Math.PI*(3-Math.sqrt(5))
  for (const [dy, dr] of drops) {
    const N=64
    for (let i=0;i<N;i++){
      const fy=1-(i/(N-1))*2, fr=Math.sqrt(1-fy*fy), fa=gold*i
      const rr=dr*(0.9+Math.random()*0.1)
      addPt(Math.cos(fa)*fr*rr, dy+fy*rr, Math.sin(fa)*fr*rr, 0.004, 0)
    }
  }

  // ── Input scatter — glowing orbs above & around the mouth (incoming traffic) ──
  // Each entry: [x_fraction_of_topR, y, z_fraction_of_topR, sphere_radius]
  const inSpheres = [
    [-0.66, topY + R*0.28,  0.30, R*0.050],
    [ 0.60, topY + R*0.32, -0.40, R*0.042],
    [ 0.86, topY + R*0.22,  0.20, R*0.034],
    [-0.30, topY + R*0.56,  0.40, R*0.030],
    [ 0.20, topY + R*0.60, -0.20, R*0.026],
  ]
  for (const [xf, iy, zf, ir] of inSpheres) {
    const N=48, ix=xf*topR, iz=zf*topR
    for (let i=0;i<N;i++){
      const fy=1-(i/(N-1))*2, fr=Math.sqrt(1-fy*fy), fa=gold*i
      const rr=ir*(0.9+Math.random()*0.1)
      addPt(ix+Math.cos(fa)*fr*rr, iy+fy*rr, iz+Math.sin(fa)*fr*rr, 0.006, 0)
    }
  }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.024)
  out.normal = [0, 0, 1]
  return out
}

/* ── Shared builder for the NEW front-facing orb objects ───────────────────────
   Returns helpers that push into pts/tags with a small 3/4 tilt (so flat icons
   still read dimensional + pick up the shader's depth/halo treatment). `line`
   emits a fused glowing TUBE (several tight orbs per sample → smooth glowing
   curve, not a dotted path). Low tag = bright structural orb, high tag = dim
   fill. fn(t∈0..1) returns [x,y,z]. */
function _faceBuilder(pts, tags, TY = Math.PI * 0.045, TX = Math.PI * 0.02) {
  const cY = Math.cos(TY), sY = Math.sin(TY), cX = Math.cos(TX), sX = Math.sin(TX)
  const add = (x, y, z, jit, tag) => {
    const x1 = x * cY + z * sY, z1 = -x * sY + z * cY
    pts.push(x1 + (Math.random() - .5) * jit, (y * cX - z1 * sX) + (Math.random() - .5) * jit, (y * sX + z1 * cX) + (Math.random() - .5) * jit)
    tags.push(tag)
  }
  const line = (fn, n, tag, thick = 3, jit = 0.006) => {
    for (let i = 0; i <= n; i++) { const p = fn(i / n); for (let k = 0; k < thick; k++) add(p[0], p[1], p[2] || 0, k === 0 ? 0.002 : jit, tag) }
  }
  const seg = (x0, y0, x1, y1, z, tag, thick = 3) => line(t => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z], Math.max(8, Math.round(Math.hypot(x1 - x0, y1 - y0) / (R * 0.018))), tag, thick)
  const arc = (cx, cy, z, rad, a0, a1, tag, thick = 3) => line(t => { const a = a0 + (a1 - a0) * t; return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, z] }, Math.max(10, Math.round(Math.abs(a1 - a0) * rad / (R * 0.018))), tag, thick)
  const ring = (cx, cy, z, rad, tag, passes = 2) => { const n = Math.max(44, Math.round(rad * 210)); for (let p = 0; p < passes; p++) for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; add(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, z, 0.004, tag) } }
  const disk = (cx, cy, z, rad, tag, dens = 1) => { const N = Math.max(8, Math.round(150 * (rad / R) * dens)); for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * rad; add(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z, 0.006, tag) } }
  // Rounded-rect outline (front face) as a fused tube.
  const roundRect = (cx, cy, z, hw, hh, cr, tag, thick = 3) => {
    line(t => [cx - hw + cr + t * (2 * hw - 2 * cr), cy + hh, z], Math.round((2 * hw - 2 * cr) / (R * 0.02)) + 2, tag, thick)
    line(t => [cx - hw + cr + t * (2 * hw - 2 * cr), cy - hh, z], Math.round((2 * hw - 2 * cr) / (R * 0.02)) + 2, tag, thick)
    line(t => [cx - hw, cy - hh + cr + t * (2 * hh - 2 * cr), z], Math.round((2 * hh - 2 * cr) / (R * 0.02)) + 2, tag, thick)
    line(t => [cx + hw, cy - hh + cr + t * (2 * hh - 2 * cr), z], Math.round((2 * hh - 2 * cr) / (R * 0.02)) + 2, tag, thick)
    arc(cx + hw - cr, cy + hh - cr, z, cr, 0, Math.PI / 2, tag, thick)
    arc(cx - hw + cr, cy + hh - cr, z, cr, Math.PI / 2, Math.PI, tag, thick)
    arc(cx - hw + cr, cy - hh + cr, z, cr, Math.PI, Math.PI * 1.5, tag, thick)
    arc(cx + hw - cr, cy - hh + cr, z, cr, Math.PI * 1.5, Math.PI * 2, tag, thick)
  }
  return { add, line, seg, arc, ring, disk, roundRect }
}

// Object 08 — CLIENT PORTAL (Client Portal Development). An arched gateway/portal
// (double frame) with a glowing user figure standing inside it.
function _genClientPortal() {
  const pts = [], tags = []
  const B = _faceBuilder(pts, tags, Math.PI * 0.05, Math.PI * 0.02)
  const { add, line, arc } = B
  const FZ = R * 0.16, BZ = -R * 0.16   // real thickness (visible 3-D)
  const HW = R * 0.70, baseY = -R * 0.90, shY = R * 0.26, BW = R * 0.17   // thick frame band
  const inArch = (x, y, hw, topY) => { if (y < baseY) return false; if (y <= topY) return Math.abs(x) <= hw; return x * x + (y - topY) * (y - topY) <= hw * hw }
  const inBand = (x, y) => inArch(x, y, HW, shY) && !inArch(x, y, HW - BW, shY)
  // ── ARCH HOLLOW SHELL — bright front archway + dim back archway + clean side-wall
  //    surfaces (outer + inner + leg bottoms) at uniform density. Closed back, hollow
  //    doorway, no interior cloud. The side wall is one closed inverted-U contour. ──
  const archBandContour = (ho, hi, topY, botY) => {
    const P = [], ap = (x, y) => P.push([x, y]), nW = 24, nA = 42, nB = 6
    for (let i = 0; i <= nW; i++) ap(-ho, botY + (topY - botY) * i / nW)               // outer left wall up
    for (let i = 1; i <= nA; i++) { const a = Math.PI * (1 - i / nA); ap(Math.cos(a) * ho, topY + Math.sin(a) * ho) }  // outer arc
    for (let i = 1; i <= nW; i++) ap(ho, topY - (topY - botY) * i / nW)                // outer right wall down
    for (let i = 1; i <= nB; i++) ap(ho - (ho - hi) * i / nB, botY)                    // right leg bottom cap
    for (let i = 1; i <= nW; i++) ap(hi, botY + (topY - botY) * i / nW)                // inner right wall up
    for (let i = 1; i <= nA; i++) { const a = Math.PI * (i / nA); ap(Math.cos(a) * hi, topY + Math.sin(a) * hi) }      // inner arc
    for (let i = 1; i <= nW; i++) ap(-hi, topY - (topY - botY) * i / nW)               // inner left wall down
    for (let i = 1; i < nB; i++) ap(-hi - (ho - hi) * i / nB, botY)                    // left leg bottom cap
    return P
  }
  _shell(add, inBand, [-HW, HW, baseY, shY + HW], [archBandContour(HW, HW - BW, shY, baseY)],
    FZ, BZ, R * 0.032, { frontTag: 0.13, backTag: 0.66, wallFront: 0.10, wallBack: 0.56 })

  // ── USER FIGURE — filled glowing head disk + shoulders dome (raised, bright). ──
  const SZ = FZ + R * 0.04, headC = -R * 0.06, rHead = R * 0.16
  for (let p = 0; p < 2; p++) { const c = 60; for (let i = 0; i < c; i++) { const a = i / c * Math.PI * 2; add(Math.cos(a) * rHead, headC + Math.sin(a) * rHead, SZ, 0.004, 0.05) } }   // head rim
  for (let i = 0; i < 240; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * rHead; add(Math.cos(a) * rr, headC + Math.sin(a) * rr, SZ, 0.005, 0.18) }   // head fill
  const bw = R * 0.40, byBot = baseY + R * 0.06, bodyH = R * 0.44
  line(t => { const a = Math.PI * t; return [Math.cos(a) * bw, byBot + Math.sin(a) * bodyH, SZ] }, 110, 0.05, 3)   // shoulders rim
  for (let i = 0; i < 520; i++) { const x = (Math.random() * 2 - 1) * bw, ty = Math.random(); const yy = byBot + ty * bodyH; const halfW = bw * Math.sqrt(Math.max(0, 1 - ty * ty)); if (Math.abs(x) < halfW) add(x, yy, SZ, 0.006, 0.2) }

  // ── BASE PLATFORM — a glowing flattened ellipse disc the figure stands on. ──
  const pcx = 0, pcy = baseY - R * 0.04, prx = HW * 1.18, pry = HW * 0.26
  for (let p = 0; p < 3; p++) { const c = 160; for (let i = 0; i < c; i++) { const a = i / c * Math.PI * 2; add(pcx + Math.cos(a) * prx, pcy + Math.sin(a) * pry, FZ, 0.004, 0.05) } }   // bright rim
  for (let i = 0; i < 260; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()); add(pcx + Math.cos(a) * prx * rr, pcy + Math.sin(a) * pry * rr, FZ - R * 0.01, 0.006, 0.5) }   // disc fill
  // ── Ambient dots floating around the portal. ──
  for (let i = 0; i < 90; i++) { const a = Math.random() * Math.PI * 2, rr = HW * (1.2 + Math.random() * 0.5); add(Math.cos(a) * rr, shY * 0.5 + Math.sin(a) * rr * 0.7, FZ, 0.02, 0.2 + Math.random() * 0.5) }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.012)
  out.normal = [0, 0, 1]
  return out
}

// Object 09 — SMART DASHBOARDS (Smart Dashboards). A landscape panel with a donut
// chart, a rising bar chart, and a header line — a data dashboard.
function _genSmartDashboard() {
  const pts = [], tags = []
  const B = _faceBuilder(pts, tags, Math.PI * 0.05, Math.PI * 0.02)
  const { add, line, ring, roundRect } = B
  const FZ = R * 0.11, BZ = -R * 0.13, SZ = FZ + R * 0.02   // real thickness (visible 3-D)
  const HW = R * 1.06, HH = R * 0.72, CR = R * 0.12, BW = R * 0.10
  const inRR = (x, y, hw, hh, cr) => { const ax = Math.abs(x), ay = Math.abs(y); if (ax > hw || ay > hh) return false; if (ax <= hw - cr || ay <= hh - cr) return true; return (ax - (hw - cr)) ** 2 + (ay - (hh - cr)) ** 2 <= cr * cr }
  // ── PANEL BORDER — SOLID VOLUME frame band filled through the FULL depth at
  //    CONTINUOUS z (front bright → back dim). Screen interior stays hollow/dark. A
  //    real 3-D bezel from any angle, not stacked sheets. ──
  const innerCR = Math.max(R * 0.04, CR - BW)
  const inBand = (x, y) => inRR(x, y, HW, HH, CR) && !inRR(x, y, HW - BW, HH - BW, innerCR)
  // ── BEZEL HOLLOW SHELL — bright front bezel + dim back bezel + clean side walls,
  //    uniform density; screen interior hollow; rear closed; no interior cloud. ──
  _shell(add, inBand, [-HW, HW, -HH, HH], [_rrContour(0, 0, HW, HH, CR), _rrContour(0, 0, HW - BW, HH - BW, innerCR)],
    FZ, BZ, R * 0.026, { frontTag: 0.13, backTag: 0.66, wallFront: 0.10, wallBack: 0.56 })
  roundRect(0, 0, FZ, HW, HH, CR, 0.03, 2)                                          // extra-crisp outer front edge
  roundRect(0, 0, FZ, HW - BW, HH - BW, innerCR, 0.1, 2)                            // extra-crisp inner front edge
  // ── Header — title bar (left) + 3 menu dots (right). ──
  for (let k = 0; k < 4; k++) add(-HW * 0.66 + k * R * 0.07, HH - R * 0.22, SZ, 0.01, 0.06)
  line(t => [-HW * 0.5 + t * R * 0.42, HH - R * 0.22, SZ], 22, 0.3, 1)
  for (let k = 0; k < 3; k++) add(HW * 0.58 + k * R * 0.12, HH - R * 0.22, SZ, 0.012, 0.06)
  // ── Donut chart (lower-left) — filled annulus + one hot highlighted segment. ──
  const dcx = -HW * 0.52, dcy = -HH * 0.04, dr = R * 0.30, dri = R * 0.16
  ring(dcx, dcy, SZ, dr, 0.06, 3); ring(dcx, dcy, SZ, dri, 0.12, 2)
  for (let i = 0; i < 520; i++) { const a = Math.random() * Math.PI * 2, rr = dri + Math.random() * (dr - dri); add(dcx + Math.cos(a) * rr, dcy + Math.sin(a) * rr, SZ, 0.005, 0.3) }
  for (let i = 0; i < 200; i++) { const a = Math.PI * 0.12 + Math.random() * Math.PI * 0.72, rr = dri + Math.random() * (dr - dri); add(dcx + Math.cos(a) * rr, dcy + Math.sin(a) * rr, SZ + R * 0.006, 0.004, 0.03) }
  // ── Bar chart (right) — filled rising bars on a baseline, bright tops. ──
  const bx0 = R * 0.06, baseY = -HH * 0.5, bw = R * 0.13, gap = R * 0.06
  const heights = [R * 0.30, R * 0.50, R * 0.40, R * 0.66, R * 0.86]
  heights.forEach((h, i) => {
    const x = bx0 + i * (bw + gap)
    for (let k = 0; k < Math.round(h / R * 130); k++) add(x + Math.random() * bw, baseY + Math.random() * h, SZ, 0.005, 0.34)
    line(t => [x, baseY + h * t, SZ], Math.round(h / (R * 0.02)) + 2, 0.07, 1)
    line(t => [x + bw, baseY + h * t, SZ], Math.round(h / (R * 0.02)) + 2, 0.07, 1)
    line(t => [x + bw * t, baseY + h, SZ + R * 0.004], 9, 0.03, 2)   // hot top
  })
  line(t => [bx0 - gap * 0.6 + t * (bw * 5 + gap * 5), baseY, SZ], 48, 0.18, 1)
  // ── Base platform — glowing flattened ellipse under the panel. ──
  const pcy = -HH - R * 0.12, prx = HW * 0.96, pry = R * 0.15
  for (let p = 0; p < 2; p++) { const c = 150; for (let i = 0; i < c; i++) { const a = i / c * Math.PI * 2; add(Math.cos(a) * prx, pcy + Math.sin(a) * pry, FZ, 0.004, 0.1) } }
  for (let i = 0; i < 170; i++) { const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()); add(Math.cos(a) * prx * rr, pcy + Math.sin(a) * pry * rr, FZ - R * 0.01, 0.006, 0.6) }
  const out = _padToBigTagged(pts, tags, N_ORB, 0.012)
  out.normal = [0, 0, 1]
  return out
}

// Object 10 — AI COMMUNICATION & SUPPORT AGENT (Chat Signal). One bright HOLLOW
// speech bubble (with 3 hot dots + tail), broadcast arcs flanking it, and two
// person-in-circle avatar nodes below linked by a dotted connector.
function _genAIChat() {
  const pts = [], tags = []
  const B = _faceBuilder(pts, tags, Math.PI * 0.035, Math.PI * 0.012)   // near front-on at rest (clean); the idle sway + transition reveal the inflation
  const { add, arc } = B
  const bx = 0, by = R * 0.34, bhw = R * 0.72, bhh = R * 0.46, bcr = R * 0.42
  const DEPTH = R * 0.24   // gentle cushion puff (not a ball) → reads as a rounded bubble, stays tidy at rest
  // Rounded-rect signed distance (negative inside) drives BOTH membership and a smooth
  // PUFF: z = DEPTH·√(t(2-t)), t = inside-distance / bhh. The bubble inflates into a
  // rounded pillow (max bulge at the centre → 0 at the silhouette), so it's a genuine
  // volumetric form from any angle — NOT a flat outline pushed back through z.
  const sdf = (x, y) => { const qx = Math.abs(x - bx) - (bhw - bcr), qy = Math.abs(y - by) - (bhh - bcr), ox = Math.max(qx, 0), oy = Math.max(qy, 0); return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - bcr }
  const zb = (x, y) => { const d = -sdf(x, y); if (d <= 0) return 0; const t = Math.min(1, d / bhh); return DEPTH * Math.sqrt(t * (2 - t)) }
  // ── Bright silhouette rim (z=0) — the bubble outline (where front + back puff meet). ──
  { const P = _resample(_rrContour(bx, by, bhw, bhh, bcr), R * 0.012); for (const [x, y] of P) { add(x, y, 0, 0.002, 0.0); add(x, y, 0, 0.006, 0.06) } }
  // ── INFLATED SURFACE — an EVEN-but-jittered field of orbs riding the puffed pillow
  //    (front bright, back dim, rim hot). Jittered grid = even fine texture like the
  //    reference's dotted fill head-on, but the ±0.9·STEP jitter kills any lattice
  //    (no screen-door). On the puff surface it reads as a genuinely rounded 3-D shell
  //    when the bubble sways/turns. This IS the volume — no ribs, no flat extrusion. ──
  const STEP = R * 0.026
  for (let gy = by - bhh; gy <= by + bhh + 1e-6; gy += STEP) for (let gx = bx - bhw; gx <= bx + bhw + 1e-6; gx += STEP) {
    const x = gx + (Math.random() - 0.5) * STEP * 0.9, y = gy + (Math.random() - 0.5) * STEP * 0.9, s = sdf(x, y)
    if (s > -R * 0.004) continue
    const z = zb(x, y), edge = -s < R * 0.05
    add(x, y, z, 0.004, edge ? 0.08 : 0.32)                                                   // front face — even bright
    if ((Math.round((gx - bx) / STEP) + Math.round((gy - by) / STEP)) % 2 === 0) add(x, y, -z, 0.004, 0.74)   // back face — half-density, dim
  }
  // ── Three HOT ellipsis dots riding the FRONT of the puff (most-forward point). ──
  for (const dx of [-R * 0.30, 0, R * 0.30]) _diskFill(add, bx + dx, by, zb(bx + dx, by) + R * 0.02, R * 0.092, 0.0, R * 0.015)
  // ── Tail — a small 3-D cone hanging off the bottom-front (flattened in z). ──
  { const baseY = by - bhh + R * 0.05, tipY = by - bhh - R * 0.24, baseZ = zb(bx - R * 0.06, baseY) * 0.7
    for (let ri = 0; ri <= 8; ri++) { const t = ri / 8, y = baseY + (tipY - baseY) * t, rad = R * 0.095 * (1 - t), zc = baseZ * (1 - t * t), n = Math.max(1, Math.round(rad / (R * 0.02)) * 5)
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; add(bx - R * 0.05 * t + Math.cos(a) * rad, y, zc + Math.sin(a) * rad * 0.55, 0.004, 0.05 + t * 0.22) } } }
  // ── Broadcast "waves" — 3 small nested arcs bowing OUT each side (mid-depth). ──
  for (let w = 0; w < 3; w++) {
    const wr = R * (0.09 + w * 0.095), tag = 0.1 + w * 0.14
    arc(bx + bhw - R * 0.02, by, R * 0.06, wr, -Math.PI * 0.34, Math.PI * 0.34, tag, 2)
    arc(bx - bhw + R * 0.02, by, R * 0.06, wr, Math.PI * 0.66, Math.PI * 1.34, tag, 2)
  }
  // ── Two avatars at DIFFERENT depths (left forward, right back → a real 3-D scene),
  //    each a small puffed disc, linked by a 3-D dotted curve. ──
  const ay = -R * 0.66, arr = R * 0.26
  const avs = [[-R * 0.66, R * 0.18], [R * 0.66, -R * 0.18]]   // [x, z]
  for (const [cx, cz] of avs) {
    const adome = (lx, ly) => { const d = arr - Math.hypot(lx - cx, ly - ay); return d <= 0 ? 0 : R * 0.16 * Math.sqrt(1 - (1 - d / arr) ** 2) }
    { const P = _resample(_circleContour(cx, ay, arr, 80), R * 0.013); for (const [x, y] of P) { add(x, y, cz, 0.002, 0.0); add(x, y, cz, 0.006, 0.06) } }   // bright rim
    _personIcon(add, cx, ay, cz + adome(cx, ay) + R * 0.02, arr, 0.06, R * 0.015)                                                                        // icon on the dome front
    for (let i = 0; i < 90; i++) { const lx = cx + (Math.random() * 2 - 1) * arr, ly = ay + (Math.random() * 2 - 1) * arr; if (Math.hypot(lx - cx, ly - ay) > arr) continue; add(lx, ly, cz + adome(lx, ly), 0.005, 0.6) }   // faint domed face
  }
  { const [lx, lz] = avs[0], [rx, rz] = avs[1], x0 = lx + arr * 0.5, x1 = rx - arr * 0.5; for (let i = 0; i <= 46; i++) { const t = i / 46, x = x0 + t * (x1 - x0), y = ay - R * 0.06 - Math.sin(Math.PI * t) * R * 0.16, z = lz + (rz - lz) * t; if (i % 2 === 0) add(x, y, z, 0.004, 0.4) } }   // 3-D smile-curve link
  // ── Ground glow — soft faint filled puddle. ──
  for (let yy = -R * 0.045; yy <= R * 0.045 + 1e-6; yy += R * 0.024) for (let xx = -R * 0.40; xx <= R * 0.40 + 1e-6; xx += R * 0.034) { const e = (xx / (R * 0.40)) ** 2 + (yy / (R * 0.045)) ** 2; if (e <= 1) add(xx, ay - R * 0.42 + yy, -R * 0.05, 0.012, 0.68 + e * 0.12) }
  const out = _padToBigTagged(pts, tags, N_ORB, 0.006)
  out.normal = [0, 0, 1]
  return out
}

// Object 11 — WEB APP & APP DEVELOPMENT (Browser + Phone). A browser window
// (top bar + dots + content) with a phone overlapping its lower-right corner.
function _genWebApp() {
  const pts = [], tags = []
  const TY0 = Math.PI * 0.015, TX0 = Math.PI * 0.025
  const cY0 = Math.cos(TY0), sY0 = Math.sin(TY0), cX0 = Math.cos(TX0), sX0 = Math.sin(TX0)
  // A "card" placed in 3-D: local point → yaw(Y) + pitch(X) → translate → manual
  // perspective foreshortening (near parts bigger, far parts smaller → a strongly
  // receding panel, not a faint orthographic tilt) → scene tilt.
  const FOCAL = R * 3.8
  const mkCard = (cx, cy, cz, yaw, pitch) => {
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cpt = Math.cos(pitch), spt = Math.sin(pitch)
    return (lx, ly, lz, jit, tag) => {
      const x1 = lx * cyw + lz * syw, z1 = -lx * syw + lz * cyw
      const y2 = ly * cpt - z1 * spt, z2 = ly * spt + z1 * cpt
      const Z = cz + z2, persp = FOCAL / (FOCAL - Z)
      const X = (cx + x1) * persp, Y = (cy + y2) * persp
      const xg = X * cY0 + Z * sY0, zg = -X * sY0 + Z * cY0
      pts.push(xg + (Math.random() - .5) * jit, (Y * cX0 - zg * sX0) + (Math.random() - .5) * jit, (Y * sX0 + zg * cX0) + (Math.random() - .5) * jit)
      tags.push(tag)
    }
  }
  const tubeLine = (addC, P, lz, tag, thick = 3) => { const Q = _resample(P, R * 0.016); for (const [x, y] of Q) for (let k = 0; k < thick; k++) addC(x, y, lz, k === 0 ? 0.002 : 0.005, tag) }
  const seg = (addC, x0, y0, x1, y1, lz, tag, thick = 3) => { const n = Math.max(6, Math.round(Math.hypot(x1 - x0, y1 - y0) / (R * 0.016))); for (let i = 0; i <= n; i++) { const t = i / n; for (let k = 0; k < thick; k++) addC(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, lz, k === 0 ? 0.002 : 0.005, tag) } }
  // Extruded 3-D rounded frame: bright front outline + dim back outline + side wall.
  const frame3D = (addC, hw, hh, cr, th, frontTag, backTag) => {
    const P = _rrContour(0, 0, hw, hh, cr)
    tubeLine(addC, P, th, frontTag, 3)
    tubeLine(addC, P, -th, backTag, 2)
    const Q = _resample(P, R * 0.032)
    for (const [x, y] of Q) for (let z = -th; z <= th + 1e-6; z += R * 0.028) addC(x, y, z, 0.003, 0.46 - (z + th) / (2 * th) * 0.34)   // side wall (front-bright→back-dim)
  }

  // ── BROWSER PANEL — yawed back to the LEFT (clear 3-D perspective), dim, behind. ──
  const brw = R * 0.74, brh = R * 0.54, brTh = R * 0.05
  const aB = mkCard(-R * 0.46, R * 0.20, -R * 0.12, Math.PI * 0.27, Math.PI * 0.015)
  frame3D(aB, brw, brh, R * 0.05, brTh, 0.34, 0.66)
  seg(aB, -brw, brh - R * 0.16, brw, brh - R * 0.16, brTh, 0.34, 1)                 // chrome divider
  for (let i = 0; i < 3; i++) _diskFill(aB, -brw + R * 0.14 + i * R * 0.12, brh - R * 0.08, brTh, R * 0.028, 0.24, R * 0.013)   // tab dots
  for (let r = 0; r < 4; r++) { const ly = brh - R * 0.34 - r * R * 0.15, w = (r % 2 === 0 ? 1.4 : 0.95) * brw; seg(aB, -brw + R * 0.12, ly, -brw + R * 0.12 + Math.min(w, 1.9 * brw), ly, brTh, 0.5, 1) }   // content lines

  // ── SMARTPHONE — near-upright in front-right, the HERO, brighter, 3-D slab. ──
  const phw = R * 0.40, phh = R * 0.80, phTh = R * 0.06
  const aP = mkCard(R * 0.48, -R * 0.04, R * 0.16, -Math.PI * 0.07, Math.PI * 0.01)
  frame3D(aP, phw, phh, R * 0.12, phTh, 0.03, 0.5)
  tubeLine(aP, _rrContour(0, 0, phw - R * 0.05, phh - R * 0.14, R * 0.09), phTh + R * 0.004, 0.14, 2)   // screen border
  seg(aP, -R * 0.06, phh - R * 0.08, R * 0.06, phh - R * 0.08, phTh + R * 0.004, 0.06, 2)               // earpiece
  { const c = 46, rr2 = R * 0.05, hyb = -phh + R * 0.11; for (let p = 0; p < 2; p++) for (let i = 0; i < c; i++) { const a = i / c * 6.28; aP(Math.cos(a) * rr2, hyb + Math.sin(a) * rr2, phTh + R * 0.004, 0.003, 0.06) } }   // home button
  // 3×3 CLEAN app tiles (filled squares on a uniform grid — NOT scattered).
  const gx0 = -R * 0.21, gy0 = R * 0.21, gstep = R * 0.21, tile = R * 0.072
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const tx = gx0 + c * gstep, ty = gy0 - r * gstep
    for (let yy = -tile; yy <= tile + 1e-6; yy += R * 0.020) for (let xx = -tile; xx <= tile + 1e-6; xx += R * 0.020) aP(tx + xx, ty + yy, phTh + R * 0.006, 0.002, 0.13)
  }
  // ── Ground glow / reflection under both. ──
  const aG = mkCard(R * 0.02, -R * 0.94, 0, 0, 0)
  for (let i = 0; i < 90; i++) { const a = Math.random() * 6.28, rr3 = Math.sqrt(Math.random()) * R * 0.55; aG(Math.cos(a) * rr3, Math.sin(a) * rr3 * 0.24, 0, 0.02, 0.55) }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.008)
  out.normal = [0, 0, 1]
  return out
}

// Object 12 — IoT SYSTEM DEVELOPMENT (Chip Network). A central microchip (square +
// pins + inner detail) radiating connection lines to small device nodes around it.
function _genIoT() {
  const pts = [], tags = []
  const B = _faceBuilder(pts, tags, Math.PI * 0.05, Math.PI * 0.02)
  const { add, line, arc, ring, roundRect } = B
  const FZ = 0

  // ── CENTRAL CHIP — a genuine ISOMETRIC 3-D slab. Local space: a flat square in the
  //    x-z plane (y = thickness/up axis), rotated ~iso and projected so the BRIGHT
  //    TOP face reads as a rhombus sitting above two DIM side faces → a clear 3-D
  //    microchip, never a flat messy square. ──
  const chip = R * 0.50, th = R * 0.12        // half-width · half-thickness
  const ry = Math.PI * 0.17, rx = Math.PI * 0.33
  const cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx)
  const isoAdd = (x, y, z, jit, tag) => {
    const x1 = x * cyr + z * syr, z1 = -x * syr + z * cyr
    pts.push(x1 + (Math.random() - .5) * jit, (y * cxr - z1 * sxr) + (Math.random() - .5) * jit, (y * sxr + z1 * cxr) + (Math.random() - .5) * jit)
    tags.push(tag)
  }
  const STEP = R * 0.032
  // TOP (bright) + BOTTOM (dim) faces — one uniform grid, mirrored through thickness.
  for (let z = -chip; z <= chip + 1e-6; z += STEP) for (let x = -chip; x <= chip + 1e-6; x += STEP) {
    isoAdd(x, th, z, 0.004, 0.15)
    isoAdd(x, -th, z, 0.004, 0.74)
  }
  // 4 SIDE WALLS — each edge swept through the thickness at the SAME density.
  const wall = (fx, fz, tx, tz) => {
    const L = Math.hypot(tx - fx, tz - fz), nS = Math.max(2, Math.round(L / STEP)), nY = Math.max(2, Math.round(2 * th / STEP))
    for (let i = 0; i <= nS; i++) { const t = i / nS, x = fx + (tx - fx) * t, z = fz + (tz - fz) * t
      for (let j = 0; j <= nY; j++) { const y = -th + 2 * th * j / nY, fy = (y + th) / (2 * th); isoAdd(x, y, z, 0.003, 0.6 - fy * 0.48) } }
  }
  wall(-chip, chip, chip, chip); wall(chip, chip, chip, -chip); wall(chip, -chip, -chip, -chip); wall(-chip, -chip, -chip, chip)
  // TOP-FACE DETAIL — two concentric square outlines + a central donut, on y=th.
  const sqOutline = (h, lift, tag) => {
    const n = Math.round(2 * h / STEP)
    for (let s = 0; s < 4; s++) for (let i = 0; i <= n; i++) { const t = i / n; let x, z
      if (s === 0) { x = -h + 2 * h * t; z = h } else if (s === 1) { x = h; z = h - 2 * h * t } else if (s === 2) { x = h - 2 * h * t; z = -h } else { x = -h; z = -h + 2 * h * t }
      isoAdd(x, th + lift, z, 0.003, tag) }
  }
  sqOutline(chip * 0.84, R * 0.004, 0.03)
  sqOutline(chip * 0.54, R * 0.005, 0.07)
  for (let p = 0; p < 2; p++) { const c = 90; for (let i = 0; i < c; i++) { const a = i / c * 6.28; isoAdd(Math.cos(a) * chip * 0.30, th + R * 0.006, Math.sin(a) * chip * 0.30, 0.002, 0.03) } }   // donut outer
  for (let p = 0; p < 2; p++) { const c = 56; for (let i = 0; i < c; i++) { const a = i / c * 6.28; isoAdd(Math.cos(a) * chip * 0.16, th + R * 0.007, Math.sin(a) * chip * 0.16, 0.002, 0.06) } }   // donut inner
  { const step = R * 0.019; for (let rr = 0; rr <= chip * 0.12 + 1e-6; rr += step) { const n = rr < 1e-6 ? 1 : Math.max(6, Math.round(2 * Math.PI * rr / step)); for (let i = 0; i < n; i++) { const a = (i / n) * 6.28; isoAdd(Math.cos(a) * rr, th + R * 0.008, Math.sin(a) * rr, 0.002, 0.0) } } }   // clean hot die centre
  // PINS — 4 short legs per side, at mid-thickness, extending outward (real IC legs).
  const NPIN = 4, pinLen = R * 0.14
  for (let s = 0; s < 4; s++) for (let i = 0; i < NPIN; i++) {
    const off = -chip * 0.6 + (i + 0.5) * (chip * 1.2 / NPIN), n = 5
    for (let k = 0; k <= n; k++) { const t = k / n, e = chip + pinLen * t; let x, z
      if (s === 0) { x = off; z = e } else if (s === 1) { x = e; z = off } else if (s === 2) { x = off; z = -e } else { x = -e; z = off }
      for (let pass = 0; pass < 2; pass++) isoAdd(x, 0, z, 0.004, 0.1) }
  }

  // ── DEVICE NODES — 6 icons in rounded-square panels on a hexagon around the chip,
  //    each linked to the chip by a dotted spoke (screen-facing, as in the ref). ──
  const glyph = (type, cx, cy, s, tag) => {
    if (type === 'wifi') { for (let k = 1; k <= 3; k++) arc(cx, cy - s * 0.5, FZ, s * 0.4 * k, Math.PI * 0.2, Math.PI * 0.8, tag, 2); add(cx, cy - s * 0.5, FZ, 0.004, tag) }
    else if (type === 'thermo') { line(t => [cx, cy - s * 0.5 + t * s, FZ], 10, tag, 2); for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * s * 0.28; add(cx + Math.cos(a) * rr, cy - s * 0.6 + Math.sin(a) * rr, FZ, 0.004, tag) } }
    else if (type === 'gear') { ring(cx, cy, FZ, s * 0.45, tag, 2); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; add(cx + Math.cos(a) * s * 0.6, cy + Math.sin(a) * s * 0.6, FZ, 0.004, tag) } ring(cx, cy, FZ, s * 0.16, tag, 1) }
    else if (type === 'layers') { for (let r = -1; r <= 1; r++) line(t => [cx - s * 0.5 + t * s, cy + r * s * 0.35, FZ], 12, tag, 2) }
    else if (type === 'doc') { for (let r = -1; r <= 1; r++) line(t => [cx - s * 0.4 + t * s * 0.8, cy - r * s * 0.3, FZ], 10, tag, 2) }
    else if (type === 'bulb') { ring(cx, cy + s * 0.1, FZ, s * 0.45, tag, 2); line(t => [cx - s * 0.25 + t * s * 0.5, cy - s * 0.6, FZ], 6, tag, 2) }
  }
  const RXn = R * 1.04, RYn = R * 0.98
  const devices = [
    [0, RYn, 'wifi'], [RXn * 0.87, RYn * 0.5, 'thermo'], [RXn * 0.87, -RYn * 0.5, 'doc'],
    [0, -RYn, 'bulb'], [-RXn * 0.87, -RYn * 0.5, 'layers'], [-RXn * 0.87, RYn * 0.5, 'gear'],
  ]
  for (const [nx, ny, type] of devices) {
    const d = Math.hypot(nx, ny), dirx = nx / d, diry = ny / d
    const startR = chip + pinLen + R * 0.06, endR = d - R * 0.18
    for (let i = 0; i <= 28; i++) { const t = i / 28, rr = startR + (endR - startR) * t; if (i % 2 === 0) add(dirx * rr, diry * rr, FZ, 0.004, 0.5) }   // dotted spoke
    roundRect(nx, ny, FZ, R * 0.17, R * 0.15, R * 0.04, 0.08, 2)       // panel frame
    glyph(type, nx, ny, R * 0.11, 0.14)
  }
  // soft ground glow beneath the chip — tight flat ellipse, dim (no stray scatter)
  for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * R * 0.42; add(Math.cos(a) * rr, -R * 0.78 + Math.sin(a) * rr * 0.16, FZ - R * 0.02, 0.012, 0.6) }
  const out = _padToBigTagged(pts, tags, N_ORB, 0.006)
  out.normal = [0, 0, 1]
  return out
}

// Object 13 — PROOF (Trust Badge). A heraldic shield (double border) with a bold
// checkmark inside and a row of 5 stars arcing above it.
function _genProof() {
  const pts = [], tags = []
  const B = _faceBuilder(pts, tags, Math.PI * 0.05, Math.PI * 0.03)
  const { add, line, ring } = B
  const FZ = R * 0.12, BZ = -R * 0.12, SZ = FZ + R * 0.03   // deeper closed shell (stronger 3-D)
  const sw = R * 0.72, topY = R * 0.54, botY = -R * 1.02, cy = (topY + botY) / 2
  const sideX = (u) => sw * (1 - Math.pow(Math.max(0, (u - 0.32) / 0.68), 1.7))
  const yAt = (u) => topY + (botY - topY) * u
  const yTopAt = (x) => topY + Math.sin(Math.PI * (x + sw) / (2 * sw)) * R * 0.10
  const inShield = (x, y) => {
    if (y < botY || Math.abs(x) > sw) return false
    if (y > topY) return y <= yTopAt(x)
    const u = (y - topY) / (botY - topY)
    return u >= 0 && u <= 1 && Math.abs(x) <= sideX(u)
  }
  const shieldContour = () => {
    const P = [], n = 90
    for (let i = 0; i <= n; i++) { const t = i / n; P.push([-sw + 2 * sw * t, topY + Math.sin(Math.PI * t) * R * 0.10]) }   // top dome
    for (let i = 1; i <= n; i++) { const u = i / n; P.push([sideX(u), yAt(u)]) }                                            // right side → point
    for (let i = 1; i < n; i++) { const u = 1 - i / n; P.push([-sideX(u), yAt(u)]) }                                        // left side back up
    return P
  }
  // ── DENSE FILLED SHIELD BODY — hollow shell with a RIM-BRIGHT / centre-DIM gradient
  //    + staggered rows so it reads as a premium luminous badge, NOT a flat screen-door
  //    grid (and the centre is calmer, fixing "too much brightness in places"). ──
  const ftag = (x, y) => { const u = Math.max(0, Math.min(1, (y - topY) / (botY - topY))), hw = sideX(u), ex = hw > 1e-3 ? Math.min(1, Math.abs(x) / hw) : 1; return 0.52 - 0.34 * ex }   // dim interior, bright only near the rim
  _shell(add, inShield, [-sw, sw, botY, topY + R * 0.10], [shieldContour()], FZ, BZ, R * 0.024,
    { frontTagFn: ftag, backTag: 0.66, wallFront: 0.10, wallBack: 0.56, stagger: true, faceJit: 0.008 })
  // ── Bright DOUBLE-RIM on the front face (crisp outer + inner accent line). ──
  const outline = (s, z, tag, thick) => {
    line(t => { const u = t, yy = yAt(u); return [sideX(u) * s, cy + (yy - cy) * s, z] }, 150, tag, thick)
    line(t => { const u = t, yy = yAt(u); return [-sideX(u) * s, cy + (yy - cy) * s, z] }, 150, tag, thick)
    line(t => { const x = (-sw + 2 * sw * t) * s; return [x, cy + (topY - cy) * s + Math.sin(Math.PI * t) * R * 0.10 * s, z] }, 100, tag, thick)
  }
  outline(1.0, FZ + R * 0.004, 0.02, 3)     // crisp bright outer rim
  outline(0.82, FZ + R * 0.004, 0.06, 2)    // inner accent rim (the double line)
  // ── Circular check badge (centred): bright ring + outer dotted ring + bold check. ──
  const bcx = 0, bcy = -R * 0.12, br = R * 0.39
  ring(bcx, bcy, SZ, br, 0.04, 3)
  for (let i = 0; i < 70; i++) { const a = (i / 70) * 6.28; add(bcx + Math.cos(a) * br * 1.16, bcy + Math.sin(a) * br * 1.16, SZ, 0.004, 0.12) }   // outer dotted ring
  const ck = [[bcx - R * 0.19, bcy - R * 0.0], [bcx - R * 0.02, bcy - R * 0.18], [bcx + R * 0.24, bcy + R * 0.19]]
  for (let s = 0; s < ck.length - 1; s++) for (let pass = 0; pass < 3; pass++) line(t => [ck[s][0] + (ck[s + 1][0] - ck[s][0]) * t, ck[s][1] + (ck[s + 1][1] - ck[s][1]) * t, SZ + R * 0.006], 44, 0.0, 4)
  // ── 5 FILLED solid stars arcing above — uniform-grid point-in-polygon fill + a
  //    bright rim, so each star is clean & identical (middle biggest/brightest). ──
  const star = (cx, sy, rO, tag) => {
    const N = 5, v = []
    for (let i = 0; i < 2 * N; i++) { const a = -Math.PI / 2 + i * Math.PI / N, rr = i % 2 === 0 ? rO : rO * 0.46; v.push([Math.cos(a) * rr, Math.sin(a) * rr]) }
    const inStar = (px, py) => { let c = false; for (let i = 0, j = v.length - 1; i < v.length; j = i++) { const xi = v[i][0], yi = v[i][1], xj = v[j][0], yj = v[j][1]; if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) c = !c } return c }
    const step = rO * 0.10
    for (let py = -rO; py <= rO + 1e-6; py += step) for (let px = -rO; px <= rO + 1e-6; px += step) if (inStar(px, py)) add(cx + px, sy + py, SZ, 0.003, tag)
    for (let i = 0; i < v.length; i++) { const a2 = v[i], b2 = v[(i + 1) % v.length]; line(t => [cx + a2[0] + (b2[0] - a2[0]) * t, sy + a2[1] + (b2[1] - a2[1]) * t, SZ], 7, 0.04, 1) }   // thin crisp rim
  }
  for (let i = 0; i < 5; i++) { const f = i / 4, x = -R * 0.56 + R * 1.12 * f, sy = topY + R * 0.32 + Math.sin(Math.PI * f) * R * 0.15; star(x, sy, i === 2 ? R * 0.135 : R * 0.115, 0.42) }   // 5 stars, dim interior + thin edge, narrow arc so all fit
  // ── Base glow — a tight STRUCTURED flat ellipse + a hot tip flare (no random spray). ──
  for (let i = 0; i < 12; i++) add(0, botY - R * 0.03, FZ, 0.012, 0.1)                                                                                            // hot point at the tip
  for (let i = 0; i < 44; i++) { const a = (i / 44) * 6.28; add(Math.cos(a) * R * 0.30, botY - R * 0.11 + Math.sin(a) * R * 0.05, FZ - R * 0.01, 0.006, 0.4) }     // tight ground ellipse
  const out = _padToBigTagged(pts, tags, N_ORB, 0.007)
  out.normal = [0, 0, 1]
  return out
}

// Object 14 — ABOUT (Constellation Network). A small central globe ringed by a
// constellation of person-nodes, connected to the centre and to each other.
function _genAbout() {
  const pts = [], tags = []
  const TY = Math.PI * 0.04, TX = Math.PI * 0.05
  const cY = Math.cos(TY), sY = Math.sin(TY), cX = Math.cos(TX), sX = Math.sin(TX)
  const tilt = (x, y, z) => { const x1 = x * cY + z * sY, z1 = -x * sY + z * cY; return [x1, y * cX - z1 * sX, y * sX + z1 * cX] }
  const add = (x, y, z, jit, tag) => { const [tx, ty, tz] = tilt(x, y, z); pts.push(tx + (Math.random() - .5) * jit, ty + (Math.random() - .5) * jit, tz + (Math.random() - .5) * jit); tags.push(tag) }
  const ring2 = (cx, cy, z, rad, tag, passes = 2) => { const c = Math.max(40, Math.round(rad * 200)); for (let p = 0; p < passes; p++) for (let i = 0; i < c; i++) { const a = (i / c) * Math.PI * 2; add(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, z, 0.004, tag) } }
  const FZ = R * 0.05
  // ── 6 avatar nodes on a dotted ORBIT ring (person-in-circle), pulled IN so the
  //    circles never clip the frame and the cluster reads tight like the reference. ──
  const NP = 6, ringR = R * 0.90, ringRy = R * 0.82, nodeR = R * 0.17, nodes = []
  for (let i = 0; i < NP; i++) { const a = Math.PI / 2 + i * (Math.PI * 2 / NP); nodes.push([Math.cos(a) * ringR, Math.sin(a) * ringRy]) }
  // ── CONNECTOR NETWORK (drawn first, behind nodes) — centre→node spokes + the
  //    node→node hexagon, dotted, so the cluster reads as a connected constellation. ──
  const grm = R * 0.52   // globe radius (prominent centrepiece, still open/airy)
  const dot = (x0, y0, x1, y1, n, tag, every = 2) => { for (let i = 0; i <= n; i++) { if (i % every) continue; const t = i / n; add(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, FZ - R * 0.01, 0.004, tag) } }
  for (const [nx, ny] of nodes) { const d = Math.hypot(nx, ny), ux = nx / d, uy = ny / d; dot(ux * (grm + R * 0.04), uy * (grm + R * 0.04), nx - ux * (nodeR + R * 0.02), ny - uy * (nodeR + R * 0.02), 28, 0.2) }   // centre → node
  for (let i = 0; i < NP; i++) { const [ax, ay] = nodes[i], [bx, by] = nodes[(i + 1) % NP]; const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; dot(ax + ux * (nodeR + R * 0.02), ay + uy * (nodeR + R * 0.02), bx - ux * (nodeR + R * 0.02), by - uy * (nodeR + R * 0.02), 30, 0.24) }   // node → node hexagon
  // dotted elliptical orbit guide
  for (let i = 0; i < 170; i++) { const a = (i / 170) * Math.PI * 2; if (i % 2 === 0) add(Math.cos(a) * ringR, Math.sin(a) * ringRy, FZ - R * 0.02, 0.004, 0.34) }

  // ── Central GLOBE — OPEN lat/long wireframe (front bright / back dim), no dense
  //    surface skin, so it reads airy & structural like the reference (not a stippled
  //    ball). A faint sparse interior haze gives just a hint of volume. ──
  const gr = grm
  const gridTag = (tz) => { const nf = (tz / gr) * 0.5 + 0.5; return 0.06 + (1 - Math.max(0, Math.min(1, nf))) * 0.62 }
  const gAdd = (x, y, z) => { const [, , tz] = tilt(x, y, z); add(x, y, z, 0.003, gridTag(tz)) }
  for (let m = 0; m < 10; m++) { const phi = (m / 10) * Math.PI, cp = Math.cos(phi), sp = Math.sin(phi); for (let i = 0; i < 130; i++) { const a = (i / 130) * Math.PI * 2, s = Math.sin(a); gAdd(gr * s * cp, gr * Math.cos(a), gr * s * sp) } }
  for (const ly of [0, 0.26, -0.26, 0.5, -0.5, 0.72, -0.72, 0.88, -0.88]) { const yy = gr * ly, rr = gr * Math.sqrt(Math.max(0, 1 - ly * ly)); const n = Math.max(48, Math.round(130 * rr / gr)); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; gAdd(rr * Math.cos(a), yy, rr * Math.sin(a)) } }
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < 360; i++) { const fy = 1 - (i / 359) * 2, fr = Math.sqrt(1 - fy * fy), fa = golden * i; const [, , tz] = tilt(Math.cos(fa) * fr * gr, fy * gr, Math.sin(fa) * fr * gr); add(Math.cos(fa) * fr * gr * 0.9, fy * gr * 0.9, Math.sin(fa) * fr * gr * 0.9, 0.006, tz > 0 ? 0.8 : 0.94) }   // faint interior haze only

  // ── Person-in-circle avatar nodes (clean filled head + shoulders, bright ring). ──
  for (const [nx, ny] of nodes) { ring2(nx, ny, FZ, nodeR, 0.05, 4); _personIcon(add, nx, ny, FZ + R * 0.004, nodeR, 0.06, R * 0.014) }
  // ── Base glow — tight STRUCTURED ellipse + a short tapering vertical beam (no spray). ──
  const baseY = -ringRy - R * 0.06
  for (let i = 0; i < 46; i++) { const a = (i / 46) * 6.28, r = Math.sqrt(i / 46) * R * 0.32; add(Math.cos(a) * r, baseY + Math.sin(a) * r * 0.18, FZ - R * 0.01, 0.008, 0.52) }
  for (let i = 0; i < 24; i++) { const t = i / 24; add((Math.random() - .5) * R * 0.015, baseY - t * R * 0.28, FZ, 0.008, 0.36 + t * 0.3) }
  const out = _padToBigTagged(pts, tags, N_ORB, 0.006)
  out.normal = [0, 0, 1]
  return out
}

// Object 15 — PROCESS (Circular Flow). Four arc segments with arrowheads forming a
// clockwise cycle, a node at each quarter, and a small centre hub.
function _genProcess() {
  const pts = [], tags = []
  const B = _faceBuilder(pts, tags, Math.PI * 0.04, Math.PI * 0.02)
  const { add } = B
  const CR = R * 0.82, TILT = 0.72                       // ring plane tipped toward the viewer → a real 3-D orbital track
  const cT = Math.cos(TILT), sT = Math.sin(TILT)
  // A point on the orbital ring at angle phi (phi=PI/2 → far/top, -PI/2 → near/bottom).
  const onRing = (phi, rad = CR) => { const x = rad * Math.cos(phi), yl = rad * Math.sin(phi); return [x, yl * cT, -yl * sT] }
  const dtag = (z, lo, hi) => { const fz = (z / (CR * sT)) * 0.5 + 0.5; return hi - Math.max(0, Math.min(1, fz)) * (hi - lo) }   // near (z>0) bright → far dim
  const addRing = (phi, rad, jit, lo, hi) => { const [x, y, z] = onRing(phi, rad); add(x, y, z, jit, dtag(z, lo, hi)) }
  const rot2 = (v, th) => [v[0] * Math.cos(th) - v[1] * Math.sin(th), v[0] * Math.sin(th) + v[1] * Math.cos(th)]
  const nodeAng = [Math.PI / 2, 0, -Math.PI / 2, Math.PI], gap = 0.40   // top, right, bottom, left
  // ── ORBITAL RING — dotted tilted ellipse, near-bright / far-dim → reads 3-D. ──
  const N = 220
  for (let i = 0; i < N; i++) { if (i % 2) continue; addRing((i / N) * Math.PI * 2, CR, 0.004, 0.12, 0.56) }
  // ── Faint concentric core rings (same tilted plane → nested ellipses) + a hub. ──
  for (const rr of [R * 0.17, R * 0.28, R * 0.39]) { const n = Math.max(50, Math.round(rr * 220)); for (let i = 0; i < n; i++) { if (i % 2) continue; addRing((i / n) * Math.PI * 2, rr, 0.004, 0.5, 0.74) } }
  // ── Central CORE — a small glowing 3-D orb (fibonacci sphere) anchoring the cycle:
  //    a hot dense core + a faint lat/long shell, front-bright / back-dim. ──
  { const ccr = R * 0.085, golden = Math.PI * (3 - Math.sqrt(5))
    _diskFill(add, 0, 0, R * 0.02, R * 0.035, 0.0, R * 0.012)                                                                 // hot inner core (front)
    for (let i = 0; i < 150; i++) { const fy = 1 - (i / 149) * 2, fr = Math.sqrt(Math.max(0, 1 - fy * fy)), fa = golden * i, z = Math.sin(fa) * fr * ccr; add(Math.cos(fa) * fr * ccr, fy * ccr, z, 0.004, z > 0 ? 0.12 : 0.6) } }   // sphere shell
  // ── 4 clockwise flow arcs between adjacent nodes (following the ring) + arrowheads. ──
  for (let s = 0; s < 4; s++) {
    const from = nodeAng[s]; let to = nodeAng[(s + 1) % 4]
    let a0 = from - gap, a1 = to + gap; if (a1 > a0) a1 -= Math.PI * 2
    const steps = 48
    for (let i = 0; i <= steps; i++) { if (i % 2) continue; addRing(a0 + (a1 - a0) * (i / steps), CR, 0.003, 0.05, 0.4) }
    const [ex, ey, ez] = onRing(a1)
    let tx = Math.sin(a1), ty = -Math.cos(a1) * cT; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl   // clockwise-flow tangent
    const back = [-tx, -ty], hsz = R * 0.14, b1 = rot2(back, 0.55), b2 = rot2(back, -0.55)
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i <= 8; i++) { const t = i / 8; add(ex + b1[0] * hsz * t, ey + b1[1] * hsz * t, ez, 0.005, 0.05); add(ex + b2[0] * hsz * t, ey + b2[1] * hsz * t, ez, 0.005, 0.05) }   // crisp arrowhead
  }
  // ── 4 STARBURST nodes on the ring at DIFFERENT depths (3-D arrangement). ──
  const starburst = (phi, hot) => {
    const [cx, cy, cz] = onRing(phi)
    _diskFill(add, cx, cy, cz + R * 0.01, R * 0.07, 0.0, R * 0.012)                                                                                          // clean hot core
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28; for (let j = 1; j <= 9; j++) add(cx + Math.cos(a) * R * 0.185 * (j / 9), cy + Math.sin(a) * R * 0.185 * (j / 9), cz, 0.004, 0.04 + (j / 9) * 0.32) }   // spikes (inner bright → fade out)
    for (let p = 0; p < 3; p++) for (let i = 0; i < 60; i++) { const a = i / 60 * 6.28; add(cx + Math.cos(a) * R * 0.205, cy + Math.sin(a) * R * 0.205, cz, 0.003, hot ? 0.28 : 0.4) }   // bright halo ring
  }
  nodeAng.forEach((ang, i) => starburst(ang, i % 2 === 0))
  const out = _padToBigTagged(pts, tags, N_ORB, 0.01)
  out.normal = [0, 0, 1]
  return out
}

// Object 16 — CONTACT (Signal Beacon). A chat bubble (dots + tail) broadcasting
// concentric signal waves left and right.
function _genContact() {
  const pts = [], tags = []
  const B = _faceBuilder(pts, tags, Math.PI * 0.035, Math.PI * 0.012)   // near front-on; sway/transition reveal the puff
  const { add, arc } = B
  const bx = 0, by = R * 0.16, bhw = R * 0.60, bhh = R * 0.42, bcr = R * 0.40
  // ── MAIN BEACON BUBBLE — a genuinely inflated 3-D pillow (SDF puff + even jittered
  //    surface), matching the AI-agent bubble's quality. ──
  const zb = _inflatedBubble(add, bx, by, bhw, bhh, bcr, R * 0.22)
  // ── Three HOT ellipsis dots riding the FRONT of the puff. ──
  for (const dx of [-R * 0.24, 0, R * 0.24]) _diskFill(add, bx + dx, by, zb(bx + dx, by) + R * 0.02, R * 0.078, 0.0, R * 0.014)
  // ── Tail — a small 3-D cone hanging off the bottom-front (points down-left). ──
  { const baseY = by - bhh + R * 0.04, tipY = by - bhh - R * 0.22, baseZ = zb(bx - R * 0.04, baseY) * 0.7
    for (let ri = 0; ri <= 8; ri++) { const t = ri / 8, y = baseY + (tipY - baseY) * t, rad = R * 0.08 * (1 - t), zc = baseZ * (1 - t * t), n = Math.max(1, Math.round(rad / (R * 0.02)) * 5)
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; add(bx - R * 0.07 * t + Math.cos(a) * rad, y, zc + Math.sin(a) * rad * 0.55, 0.004, 0.05 + t * 0.22) } } }
  // ── Falling-signal trail — 3 clean fading dots dropping straight under the tail. ──
  for (let k = 0; k < 3; k++) { const y = by - bhh - R * 0.34 - k * R * 0.12; _diskFill(add, bx - R * 0.05, y, 0, R * (0.038 - k * 0.008), 0.32 + k * 0.18, R * 0.011) }
  // ── Signal "waves" — the beacon broadcast: 3 larger nested arcs sweeping OUT each
  //    side, clearly outside the bubble (2 passes → crisp). ──
  for (let w = 0; w < 3; w++) {
    const wr = R * (0.15 + w * 0.17), tag = 0.1 + w * 0.15
    arc(bx + bhw + R * 0.04, by, R * 0.05, wr, -Math.PI * 0.46, Math.PI * 0.46, tag, 3)
    arc(bx - bhw - R * 0.04, by, R * 0.05, wr, Math.PI - Math.PI * 0.46, Math.PI + Math.PI * 0.46, tag, 3)
  }
  // ── Ground glow — soft faint filled puddle below. ──
  for (let yy = -R * 0.04; yy <= R * 0.04 + 1e-6; yy += R * 0.022) for (let xx = -R * 0.34; xx <= R * 0.34 + 1e-6; xx += R * 0.030) { const e = (xx / (R * 0.34)) ** 2 + (yy / (R * 0.04)) ** 2; if (e <= 1) add(bx + xx, by - bhh - R * 0.66 + yy, -R * 0.04, 0.012, 0.66 + e * 0.12) }
  const out = _padToBigTagged(pts, tags, N_ORB, 0.006)
  out.normal = [0, 0, 1]
  return out
}

// Object 17 — OUR WORK (Showcase Frames). Three stacked/offset rounded frames; the
// front one carries an image glyph (sun + mountains).
function _genOurWork() {
  const pts = [], tags = []
  const B = _faceBuilder(pts, tags, Math.PI * 0.05, Math.PI * 0.02)
  const { add, line, ring, roundRect } = B
  const fhw = R * 0.68, fhh = R * 0.52, fcr = R * 0.08
  const stack = [
    [R * 0.34, R * 0.30, -R * 0.08, 0.6, 2],   // back (dim)
    [R * 0.17, R * 0.15, -R * 0.01, 0.34, 2],  // mid
  ]
  for (const [dx, dy, z, tag, thick] of stack) roundRect(dx, dy, z, fhw, fhh, fcr, tag, thick)
  // ── FRONT frame — dense bright double-row border (the beaded gallery frame). ──
  const fx = -R * 0.18, fy = -R * 0.16, fz = R * 0.08
  roundRect(fx, fy, fz, fhw, fhh, fcr, 0.04, 3)
  roundRect(fx, fy, fz, fhw - R * 0.035, fhh - R * 0.035, fcr - R * 0.02, 0.12, 2)
  // ── Image glyph — sun (filled disc) + two mountain peaks (right taller). ──
  for (let i = 0; i < 40; i++) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * R * 0.07; add(fx - fhw * 0.44 + Math.cos(a) * rr, fy + fhh * 0.40 + Math.sin(a) * rr, fz + R * 0.01, 0.004, 0.05) }
  const baseY = fy - fhh * 0.44
  const mtn = [[fx - fhw * 0.62, baseY], [fx - fhw * 0.20, fy + fhh * 0.04], [fx + fhw * 0.02, baseY], [fx + fhw * 0.34, fy + fhh * 0.26], [fx + fhw * 0.66, baseY]]
  for (let s = 0; s < mtn.length - 1; s++) for (let pass = 0; pass < 2; pass++) line(t => [mtn[s][0] + (mtn[s + 1][0] - mtn[s][0]) * t, mtn[s][1] + (mtn[s + 1][1] - mtn[s][1]) * t, fz + R * 0.005], 24, 0.05, 3)
  const out = _padToBigTagged(pts, tags, N_ORB, 0.012)
  out.normal = [0, 0, 1]
  return out
}

/* Exported so service detail pages reuse the EXACT live home objects. */
export const CARD_GENERATORS = [
  _genBrowserFrame, _genCommandCube, _genCodeBlock, _genWorkflowPath,
  _genIntelligenceOrbit, _genConnectedCubes, _genFunnel,
  _genClientPortal, _genSmartDashboard, _genAIChat, _genWebApp, _genIoT,
  _genProof, _genAbout, _genProcess, _genContact, _genOurWork,
]

/* Match every card object's visual footprint to card 0 (the globe): centre
   each shape's robust bounding box on the group origin and scale it so its
   largest robust dimension equals the globe's. The 5th–95th percentile box
   ignores sparse outliers (funnel stream dots, sparkle satellites) so the
   normalisation tracks the shape's visual mass, not its extremes. Keeps all
   seven objects the same on-screen size, centred on the rotation axis. */
export function normalizeCardShapes(bufs) {
  const robustBox = (pos) => {
    const n = pos.length / 3
    const xs = new Float32Array(n), ys = new Float32Array(n), zs = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      xs[i] = pos[i * 3]; ys[i] = pos[i * 3 + 1]; zs[i] = pos[i * 3 + 2]
    }
    const lo = Math.floor(n * 0.05), hi = Math.ceil(n * 0.95) - 1
    const span = (a) => { a.sort(); return [a[lo], a[hi]] }
    const [x0, x1] = span(xs), [y0, y1] = span(ys), [z0, z1] = span(zs)
    return {
      cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2,
      half: Math.max(x1 - x0, y1 - y0, z1 - z0) / 2,
    }
  }
  const ref = robustBox(bufs[0])
  bufs.forEach((pos, k) => {
    const b = robustBox(pos)
    /* card 0 defines the footprint (s=1) but is recentred like the rest */
    const s = k === 0 ? 1 : Math.min(1.45, Math.max(0.9, ref.half / b.half))
    for (let i = 0; i < pos.length; i += 3) {
      pos[i]     = (pos[i]     - b.cx) * s
      pos[i + 1] = (pos[i + 1] - b.cy) * s
      pos[i + 2] = (pos[i + 2] - b.cz) * s
    }
  })
}

/* ── Section 3 — the funnel's orbs rearranged into a wide bottom wave ──────────
   No new particles: the last carousel card's funnel buffer (cardBufs[6]) is
   lerped into this wave grid as Section 3 scrolls in (scrollState.sec3 0→1), and
   the group drops low / recentres / scales up so the SAME orbs read as a wide
   wave receding across the bottom of the viewport. Placement was dialled in with
   scripts/wave-proto.mjs (projected through the real Scene camera). */
const WAVE_COLS  = 192
const WAVE_ROWS  = 72       // 192×72 = 13824 = N_ORB, so orbs map 1:1 to the grid
const WAVE_HW    = 14.0     // local half-width (spans full viewport width when low)
const WAVE_ZN    = 2.0      // near row z (toward camera, clipped just below the viewport)
const WAVE_ZF    = -2.5     // far row z — close so the BACK projects very low on screen
const WAVE_LIFT  = 0.9      // far L/R edges rise into the empty side gutters
const WAVE_TILT  = 0.0      // flat (no tilt) so the back edge stays low, like the mockup
const WAVE_CX    = 0.0      // group recentres horizontally
const WAVE_CY    = -2.6     // group drops low so the wave sits in the bottom band, below cards
const WAVE_SCALE = 1.0      // group scales up from the carousel-end 0.55
const WAVE_OP    = 1.3      // wave brightness in Section 3 (calm, vivid blue — not white)
const WAVE_SIZE  = 0.72     // crisp wave dots (the funnel's actual orbs)
// Vivid electric blue: raw RGB, blue-dominant with a LOW green so additive
// overlap stays a saturated electric blue instead of clipping toward white.
const WAVE_COLOR = (() => { const c = new THREE.Color(); c.r = 0.10; c.g = 0.30; c.b = 1.35; return c })()
const _waveCol   = new THREE.Color()             // scratch for the per-frame tint
const _transColTo = new THREE.Color()            // scratch for the transition from→to tint
// Static per-orb grid (local x, edge-lift y, z); the gentle undulation is added
// on top per-frame in the render loop.
const WAVE_GRID = (() => {
  const out = new Float32Array(N_ORB * 3)
  for (let i = 0; i < N_ORB; i++) {
    const col = i % WAVE_COLS
    const row = (i / WAVE_COLS) | 0
    const nx  = col / (WAVE_COLS - 1) - 0.5            // -0.5 … 0.5
    out[i * 3]     = nx * 2 * WAVE_HW
    out[i * 3 + 1] = WAVE_LIFT * (nx * nx * 4)          // 0 centre → WAVE_LIFT edges
    out[i * 3 + 2] = WAVE_ZN + (WAVE_ZF - WAVE_ZN) * (row / (WAVE_ROWS - 1))
  }
  return out
})()

const TRAIL_LEN = 24
const TRAIL_LIFETIME = 1.0
// Hover: sample every Nth orb when finding the one nearest the cursor ray, and
// only light up if that orb is within HOVER_HIT (world units) of the ray. The
// Section-3 wave is far wider than the section-2 objects, so sample densely
// enough that the nearest sample is still close on the spread-out wave.
const HOVER_STEP = 8        // sample stride for the nearest-orb hover (Section 2) — finer = smoother
const HOVER_HIT2 = 0.5      // hit threshold² (a bit looser so the glow stays engaged across the shape)

/* ── Surface-orb shader ─────────────────────────────────────────────────────────
   uMorph = 0  →  sphere surface (full size, full opacity)
   uMorph = 1  →  particles converged to group origin (fully faded via uOpacity)
   Uses original sphere position for normalisation so tangent vectors are stable
   even as particles collapse toward the centre.
 ────────────────────────────────────────────────────────────────────────────── */
const MINI_VERT = `
  uniform vec4 uTrail[${TRAIL_LEN}];
  uniform float uTrailLifetime;
  uniform float uTime;
  uniform float uRadius;
  uniform float uScale;
  uniform float uSizeScale;
  uniform vec3 uCursorWorld;
  uniform float uCursorActive;
  uniform float uMorph;
  uniform float uMorphCard;
  uniform float uWaveFade;
  uniform float uTExplode;     // page-transition burst amount (0 = off → home/service rest unaffected)
  uniform float uDepthRadius;  // view-space half-depth of the object → front/back dimming
  attribute float aSize;
  attribute float aSeed;
  attribute float aSizeTag;
  attribute vec3 aPosTarget;
  attribute vec3 aExplode;     // per-orb outward burst vector (only used when uTExplode > 0)
  varying float vGlow;
  varying float vCardBlend;
  varying float vWaveFade;
  varying float vFront;        // 0 = back hemisphere, 1 = front (camera-facing)
  varying float vDepthOn;      // how much depth-dimming to apply (card objects only)
  varying float vSizeTag;      // 0 = big bright node … 1 = small dim fill (card objects)

  void main() {
    /* Phase 1: collapse sphere toward centre (uMorph 0→0.5) */
    vec3 collapsedPos = position * (1.0 - uMorph);
    /* Phase 2: rearrange from collapsed position to card shape (uMorphCard 0→1) */
    vec3 basePos = mix(collapsedPos, aPosTarget, uMorphCard);
    /* Page transition: burst the orbs outward then let them reassemble. */
    basePos += aExplode * uTExplode;

    /* Section-3 wave only: fade the far/back rows toward dark so the wave recedes
       and barely touches the cards (front = bottom of screen stays bright). */
    float wDepth = clamp((aPosTarget.z - (${WAVE_ZF.toFixed(1)})) / (${(WAVE_ZN - WAVE_ZF).toFixed(1)}), 0.0, 1.0);
    vWaveFade = mix(1.0, 0.06 + 0.94 * wDepth, uWaveFade);

    float cursorOff = 1.0 - uMorphCard;
    vec3 worldPos = (modelMatrix * vec4(basePos, 1.0)).xyz;

    float maxG = 0.0;
    for (int i = 0; i < ${TRAIL_LEN}; i++) {
      vec4 t = uTrail[i];
      float ageFactor = max(0.0, 1.0 - (t.w / uTrailLifetime));
      float d = distance(worldPos, t.xyz);
      float g = (1.0 - smoothstep(0.0, uRadius, d)) * ageFactor;
      maxG = max(maxG, g);
    }
    float g = pow(maxG, 1.5);
    float tw = 0.22 * sin(uTime * 1.6 + aSeed * 12.566);
    vGlow = clamp(g + tw * 0.5, 0.0, 1.6);
    vCardBlend = uMorphCard;

    float cd = distance(worldPos, uCursorWorld);
    float windProx = (1.0 - smoothstep(0.0, uRadius * 0.7, cd)) * uCursorActive * cursorOff;

    /* stable normals from original sphere position even as particles rearrange */
    vec3 localNorm = normalize(position);
    vec3 tangentRef = abs(localNorm.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 T1 = normalize(cross(localNorm, tangentRef));
    vec3 T2 = cross(localNorm, T1);
    float pushAngle = aSeed * 6.2832;
    vec3 pushDir = T1 * cos(pushAngle) + T2 * sin(pushAngle);
    float strengthMult = 0.15 + aSeed * 0.45;
    vec3 displacedPos = basePos + pushDir * windProx * strengthMult;

    vec4 mv = modelViewMatrix * vec4(displacedPos, 1.0);
    // Front/back depth read (camera-facing bright, far side dim) → dimensional
    // sphere. Only applies to the card objects (vDepthOn), so the hero sphere
    // and the Section-3 wave are untouched.
    float centerZ = modelViewMatrix[3].z;
    vFront = clamp((mv.z - centerZ) / max(uDepthRadius, 0.001) * 0.5 + 0.5, 0.0, 1.0);
    vDepthOn = uMorphCard * (1.0 - uWaveFade);
    float globeFactor = max(0.0, uSizeScale - 1.0);
    // aSizeTag: 0 = big bright node … 1 = small fill (continuous). Card objects get
    // a WIDE size range (rich variation); hero/wave have globeFactor→0 so they
    // ignore the tag (stay uniform).
    vSizeTag = aSizeTag;
    float effectiveScale = uSizeScale * (1.0 - clamp(aSizeTag, 0.0, 1.0) * globeFactor * 0.72);
    // Card orbs get a size boost (globeFactor>0) for denser, more luminous lines;
    // the hero sphere (globeFactor=0) keeps its original 2.0 so it's untouched.
    gl_PointSize = aSize * effectiveScale * (2.0 + globeFactor * 1.15) * (1.0 + vGlow * 3.2) * (uScale / -mv.z)
      * mix(1.0, 0.62 + 0.38 * vFront, vDepthOn * pow(clamp(aSizeTag, 0.0, 1.0), 1.4))
      * (1.0 - uMorphCard * 0.09);   // card-only: slightly smaller orbs → crisper fine detail (hero uMorphCard=0 untouched)
    gl_Position = projectionMatrix * mv;
  }
`
const MINI_FRAG = `
  uniform sampler2D uMap;
  uniform vec3 uColorBase;
  uniform vec3 uColorHot;
  uniform vec3 uColorCard;
  uniform float uOpacity;
  uniform float uMorph;
  varying float vGlow;
  varying float vCardBlend;
  varying float vWaveFade;
  varying float vFront;
  varying float vDepthOn;
  varying float vSizeTag;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    // Per-orb halo "bloom" in card/service mode (vCardBlend): blend a wide soft
    // radial falloff into the sprite so neighbouring orbs' halos overlap and FUSE
    // each line into a smooth glow (the look post-process bloom gives, but it stays
    // transparent + is scoped to cards). Home hero (vCardBlend=0) keeps the plain dot.
    float d = length(gl_PointCoord - vec2(0.5));
    float halo = pow(clamp(1.0 - d * 2.0, 0.0, 1.0), 1.75);
    float shape = mix(tex.a, max(tex.a, halo * 0.62), vCardBlend);
    if (shape < 0.008) discard;
    vec3 sphereCol = mix(uColorBase, uColorHot, vGlow);
    vec3 col = mix(sphereCol, uColorCard, vCardBlend);
    float opMult = mix(mix(0.8, 1.0, uMorph), 1.0, vCardBlend);
    float a = shape * uOpacity * opMult * (1.0 + vGlow * 0.8) * vWaveFade;
    // Depth dimming SCALED by size-tag: structural orbs (grid lines, rings = low
    // tag) stay bright + COMPLETE all the way around; only the dim fill (high tag)
    // darkens in back → the sphere gets volume without the rings/lines fading out.
    float dimAmt = vDepthOn * pow(clamp(vSizeTag, 0.0, 1.0), 1.4);
    a *= mix(1.0, 0.4 + 0.6 * vFront, dimAmt);
    col *= mix(1.0, 0.58 + 0.42 * vFront, dimAmt);
    // Bright "node" boost: big orbs (low aSizeTag) read brighter/hotter (card only).
    float nodeBoost = (1.0 - clamp(vSizeTag, 0.0, 1.0)) * vDepthOn;
    col = mix(col, uColorHot, nodeBoost * 0.28);
    a *= 1.0 + nodeBoost * 0.22;
    // Continuous tag→brightness/transparency falloff (card mode only). Low-tag
    // structural orbs stay full; high-tag orbs fade dimmer AND more transparent,
    // so a line whose tag ramps 0→1 tapers in size (vertex) and fades out (here).
    // Gated by vCardBlend so the home hero (vCardBlend=0) is byte-identical.
    float tagF = clamp(vSizeTag, 0.0, 1.0);
    a   *= mix(1.0, mix(1.0, 0.30, tagF), vCardBlend);
    col *= mix(1.0, mix(1.0, 0.74, tagF), vCardBlend);
    gl_FragColor = vec4(col * (1.0 + vGlow * 0.5 + nodeBoost * 0.28), a);
  }
`

/* ── Grid/dot collapse shader ───────────────────────────────────────────────────
   uMorph = 0  →  original sphere surface positions
   uMorph = 1  →  all particles at group origin (centre)
   Points shrink slightly as they collapse (reinforces the implosion read).
 ────────────────────────────────────────────────────────────────────────────── */
const MORPH_VERT = `
  uniform float uMorph;
  uniform float uSize;
  uniform float uScale;
  void main() {
    vec3 pos = position * (1.0 - uMorph);
    float sz = uSize * (1.0 - uMorph * 0.5);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = sz * (uScale / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const MORPH_FRAG = `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    if (tex.a < 0.01) discard;
    gl_FragColor = vec4(uColor, tex.a * uOpacity);
  }
`

function InteractiveMiniOrbs({ groupRef }) {
  const tex = getGlowDotTexture()
  const { camera, size, gl } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const localSphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(0, 0, 0), R), [])
  const localRay = useMemo(() => new THREE.Ray(), [])
  const invMat = useMemo(() => new THREE.Matrix4(), [])
  const localHit = useMemo(() => new THREE.Vector3(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const smoothHit = useMemo(() => new THREE.Vector3(), [])  // eased hover point → smooth glow
  const hoverInit = useRef(false)                           // false until the first hit (snap, don't ease)
  const ndc = useMemo(() => new THREE.Vector2(2, 2), [])
  // Local-space face plane for hover on flat card shapes (gear etc.) whose orbs
  // lie on a disk, not the globe's sphere shell. Working in local space makes
  // the hover spot track the surface at every group rotation angle.
  const localPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])

  useEffect(() => {
    const canvas = gl.domElement
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      ndc.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      ndc.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
    }
    const onLeave = () => ndc.set(2, 2)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [gl, ndc])

  const { positions, sizes, seeds, explode } = useMemo(() => {
    const N = 48
    const sphPts = []
    for (const [axis, sign] of [[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]]) {
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const u = (i + 0.5) / N * 2 - 1
          const v = (j + 0.5) / N * 2 - 1
          let x, y, z
          if (axis === 0)      { x = sign; y = u; z = v }
          else if (axis === 1) { x = u; y = sign; z = v }
          else                 { x = u; y = v; z = sign }
          const len = Math.sqrt(x*x + y*y + z*z)
          const r = R * (0.998 + Math.random() * 0.005)
          sphPts.push(x/len*r, y/len*r, z/len*r)
        }
      }
    }
    const count = sphPts.length / 3
    const p  = new Float32Array(sphPts)
    const s  = new Float32Array(count)
    const sd = new Float32Array(count)
    const ex = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      s[i]  = 0.013 + Math.random() * 0.005
      sd[i] = Math.random()
      // Per-orb outward burst vector (radial from the sphere point + scatter) for
      // the page-transition explode. Driven by uTExplode (0 at rest).
      const nx = p[i*3], ny = p[i*3+1], nz = p[i*3+2]
      const nl = Math.max(1e-3, Math.sqrt(nx*nx + ny*ny + nz*nz))
      const mag = 3.6 + Math.random() * 6.0
      ex[i*3]   = (nx/nl) * mag + (Math.random()-0.5) * 1.4
      ex[i*3+1] = (ny/nl) * mag + (Math.random()-0.5) * 1.4
      ex[i*3+2] = (nz/nl) * mag + (Math.random()-0.5) * 1.4
    }
    return { positions: p, sizes: s, seeds: sd, explode: ex }
  }, [])

  const trail = useMemo(() => Array.from({ length: TRAIL_LEN },
    () => new THREE.Vector4(1000, 1000, 1000, TRAIL_LIFETIME + 1)
  ), [])

  // Card morph state — never triggers re-renders
  const activeRef     = useRef(0)
  const phaseRef      = useRef('idle')
  const timerRef      = useRef(0)
  const targetAttrRef = useRef()
  const tagAttrRef    = useRef()
  const transActive   = useRef(false)   // page-transition morph running
  const transSwapped  = useRef(false)   // posTarget swapped from the from-shape to the to-shape

  // Pre-generate all 7 card shapes (tiled to N_ORB). Generators return either a
  // plain Float32Array of positions, or { pos, tags } when they differentiate
  // edge vs surface orbs (globe + gear). posTarget/tagTarget are the live GPU
  // buffers swapped on card change, exactly like aPosTarget.
  const cardData = useMemo(() => {
    const datas = CARD_GENERATORS.map(g => {
      const r = g()
      if (r instanceof Float32Array)
        return { pos: r, tags: new Float32Array(r.length / 3), normal: [0, 0, 1] }
      return { pos: r.pos, tags: r.tags, normal: r.normal || null }
    })
    normalizeCardShapes(datas.map(d => d.pos))
    return datas
  }, [])
  const cardBufs    = useMemo(() => cardData.map(d => d.pos),    [cardData])
  useMemo(() => {
    cardBoundingRadii = cardBufs.map((buf) => {
      let m = 0
      for (let i = 0; i < buf.length; i += 3) {
        const d2 = buf[i] * buf[i] + buf[i + 1] * buf[i + 1] + buf[i + 2] * buf[i + 2]
        if (d2 > m) m = d2
      }
      return Math.sqrt(m) || 1
    })
  }, [cardBufs])
  const cardTags    = useMemo(() => cardData.map(d => d.tags),   [cardData])
  const cardNormals = useMemo(() => cardData.map(d => d.normal), [cardData])
  const posTarget   = useMemo(() => new Float32Array(cardBufs[0]), [cardBufs])
  const tagTarget   = useMemo(() => new Float32Array(cardTags[0]), [cardTags])

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTrail:         { value: trail },
      uTrailLifetime: { value: TRAIL_LIFETIME },
      uTime:          { value: 0 },
      uRadius:        { value: 0.58 },
      uScale:         { value: size.height / 2 },
      uSizeScale:     { value: 1.0 },
      uMap:           { value: tex },
      uColorBase:     { value: new THREE.Color('#82c8f0') },
      uColorHot:      { value: new THREE.Color('#58b8f8') },
      uColorCard:     { value: new THREE.Color(CARD_COLORS[0]) },
      uOpacity:       { value: 1.0 },
      uCursorWorld:   { value: new THREE.Vector3() },
      uCursorActive:  { value: 0.0 },
      uMorph:         { value: 0.0 },
      uMorphCard:     { value: 0.0 },
      uWaveFade:      { value: 0.0 },   // Section-3 only: dim the wave's far/back rows
      uTExplode:      { value: 0.0 },   // page-transition burst (0 at rest)
      uDepthRadius:   { value: 1.5 },   // view-space half-depth for front/back dimming
    },
    vertexShader: MINI_VERT,
    fragmentShader: MINI_FRAG,
  }), [tex, size.height, trail])

  useFrame(({ clock }, delta) => {
    const tsx = transitionState
    // ── PAGE-TRANSITION MORPH: this ONE object does the black-hole morph itself ──
    // current shape → centre sphere (gather) → tighten (suck) → burst (explode) →
    // reassemble into the destination shape. No separate overlay, no hand-off.
    if (tsx.active && tsx.phase !== 'idle') {
      const u = material.uniforms
      if (!transActive.current) {
        transActive.current = true
        transSwapped.current = false
        activeRef.current = tsx.fromIndex
        posTarget.set(cardBufs[tsx.fromIndex]); tagTarget.set(cardTags[tsx.fromIndex])
        if (targetAttrRef.current) targetAttrRef.current.needsUpdate = true
        if (tagAttrRef.current) tagAttrRef.current.needsUpdate = true
      }
      // Swap to the destination shape while the orbs are a centre sphere
      // (uMorphCard ≈ 0) so the swap is invisible — do it as the burst begins.
      if (!transSwapped.current && tsx.explode > 0.02) {
        transSwapped.current = true
        activeRef.current = tsx.toIndex
        posTarget.set(cardBufs[tsx.toIndex]); tagTarget.set(cardTags[tsx.toIndex])
        if (targetAttrRef.current) targetAttrRef.current.needsUpdate = true
        if (tagAttrRef.current) tagAttrRef.current.needsUpdate = true
      }
      const isHomeDest = tsx.toKind === 'home'
      const re = tsx.reassemble
      // uMorphCard: card → sphere on the way in; sphere → destination on the way out
      // (the home hero is a sphere, so home destinations reassemble to a sphere).
      const mc = re > 0 ? (isHomeDest ? 0.0 : re) : (1.0 - tsx.gather)
      // uMorph (collapse depth): tighten the sphere through the suck, relax to the
      // destination's resting depth as it reassembles.
      const restMorph = isHomeDest ? 0.0 : 0.5
      const mo = re > 0 ? (0.45 + (restMorph - 0.45) * re) : (0.45 * tsx.suck)
      u.uMorph.value = mo
      u.uMorphCard.value = mc
      u.uTExplode.value = tsx.explode * (1.0 - re)   // burst, decaying as it reforms
      u.uWaveFade.value = 0.0
      u.uOpacity.value = MAX_CARD_OP
      u.uColorCard.value.setStyle(CARD_COLORS[tsx.fromIndex])
        .lerp(_transColTo.setStyle(CARD_COLORS[tsx.toIndex]), re)
      u.uTime.value = clock.getElapsedTime()
      u.uScale.value = size.height / 2
      u.uSizeScale.value = 2.0
      u.uRadius.value = 0.58 * END_SCALE
      u.uDepthRadius.value = ((cardBoundingRadii && cardBoundingRadii[transSwapped.current ? tsx.toIndex : tsx.fromIndex]) || 2.0) * (groupRef?.current?.scale.x || 0.7)
      u.uCursorActive.value = 0.0
      for (let i = 0; i < TRAIL_LEN; i++) trail[i].w = Math.min(trail[i].w + delta, TRAIL_LIFETIME + 1)
      return
    }
    if (transActive.current) {        // transition just ended → resume normal rendering
      transActive.current = false
      material.uniforms.uTExplode.value = 0.0
    }

    // ── SERVICE MODE: the persistent object IS this service page's hero object ──
    // Hold the service's card shape (fully formed, crisp) and run the same surface
    // hover-glow the home cards use. The group is docked to the slot by the
    // top-level useFrame below.
    if (worldState.mode === 'service') {
      const u = material.uniforms
      const idx = worldState.index ?? 0
      if (activeRef.current !== idx) {
        activeRef.current = idx
        posTarget.set(cardBufs[idx]); tagTarget.set(cardTags[idx])
        if (targetAttrRef.current) targetAttrRef.current.needsUpdate = true
        if (tagAttrRef.current) tagAttrRef.current.needsUpdate = true
        phaseRef.current = 'idle'
      }
      u.uColorCard.value.setStyle(CARD_COLORS[idx])
      u.uMorph.value = 0.5            // card-mode collapse depth
      u.uMorphCard.value = 1.0        // fully the card shape
      u.uWaveFade.value = 0.0
      u.uOpacity.value = MAX_CARD_OP
      u.uTime.value = clock.getElapsedTime()
      u.uScale.value = size.height / 2
      u.uSizeScale.value = 2.0        // edge-orb boost, same as card mode
      u.uRadius.value = 0.58 * END_SCALE
      u.uDepthRadius.value = ((cardBoundingRadii && cardBoundingRadii[idx]) || 2.0) * (groupRef?.current?.scale.x || 0.7)

      for (let i = 0; i < TRAIL_LEN; i++) trail[i].w = Math.min(trail[i].w + delta, TRAIL_LIFETIME + 1)

      // Surface hover-glow: light the orb nearest the cursor ray (same as cards).
      let hasHit = false
      const g = groupRef?.current
      if (g && ndc.x <= 1) {
        raycaster.setFromCamera(ndc, camera)
        invMat.copy(g.matrixWorld).invert()
        localRay.copy(raycaster.ray).applyMatrix4(invMat)
        localRay.direction.normalize()
        const lo = localRay.origin, ld = localRay.direction
        let bestD2 = Infinity
        for (let i = 0; i < N_ORB; i += HOVER_STEP) {
          const ix = i * 3
          const ox = posTarget[ix] - lo.x, oy = posTarget[ix + 1] - lo.y, oz = posTarget[ix + 2] - lo.z
          const t = ox * ld.x + oy * ld.y + oz * ld.z
          if (t < 0) continue
          const cx = ox - t * ld.x, cy = oy - t * ld.y, cz = oz - t * ld.z
          const d2 = cx * cx + cy * cy + cz * cz
          if (d2 < bestD2) { bestD2 = d2; localHit.set(posTarget[ix], posTarget[ix + 1], posTarget[ix + 2]) }
        }
        const sc = g.scale.x
        if (bestD2 * sc * sc < HOVER_HIT2) {
          hit.copy(localHit).applyMatrix4(g.matrixWorld)
          hasHit = true
        }
      }
      if (hasHit) {
        if (!hoverInit.current) { smoothHit.copy(hit); hoverInit.current = true }
        else smoothHit.lerp(hit, 0.28)
        let oi = 0, oa = -1
        for (let i = 0; i < TRAIL_LEN; i++) if (trail[i].w > oa) { oa = trail[i].w; oi = i }
        trail[oi].set(smoothHit.x, smoothHit.y, smoothHit.z, 0)
        u.uCursorWorld.value.copy(smoothHit)
        u.uCursorActive.value = 1.0
      } else {
        hoverInit.current = false
        u.uCursorActive.value = 0.0
      }
      return
    }

    const p     = scrollState.progress
    const scale = 1.0 + (END_SCALE - 1.0) * p

    // Phase 1 — collapse, sqrt ease-out (immediately visible at first scroll pixel)
    // Peaks at p=0.40; max collapseT=0.5 (orbs move to 50% of sphere radius)
    const rawT      = Math.min(1, Math.sqrt(p / 0.40))
    const collapseT = rawT * 0.5

    // Phase 2 — card morph, smoothstep over twice the old range (2× slower)
    // Starts at p=0.38 (slight overlap with collapse for seamless hand off)
    const cardScrollT = smoothstep(Math.max(0, Math.min(1, (p - 0.38) / 0.62)))

    // Card change transition state machine
    const wanted = carouselState.activeCard
    const phase  = phaseRef.current

    // Abort any in-flight transition when user scrolls back above the card zone
    if (p < 0.90 && phase !== 'idle') {
      phaseRef.current = 'idle'
      timerRef.current = 0
    }

    // Silent sync: keep buffer current while scroll drives the morph
    if (wanted !== activeRef.current && p < 0.90) {
      activeRef.current = wanted
      posTarget.set(cardBufs[wanted])
      tagTarget.set(cardTags[wanted])
      if (targetAttrRef.current) targetAttrRef.current.needsUpdate = true
      if (tagAttrRef.current)    tagAttrRef.current.needsUpdate = true
      material.uniforms.uColorCard.value.setStyle(CARD_COLORS[wanted])
    }

    // Trigger animated card swap only when fully in card mode
    if (p >= 0.90 && wanted !== activeRef.current && phaseRef.current === 'idle') {
      phaseRef.current = 'collapsing'
      timerRef.current = 0
    }

    timerRef.current += delta

    // Default: scroll drives card morph value
    let finalCardMorph = cardScrollT

    if (phaseRef.current === 'collapsing') {
      const t = Math.min(1, timerRef.current / CARD_COLLAPSE_DUR)
      finalCardMorph = 1.0 - t * t  // ease-in collapse back to 50%-collapsed position
      if (t >= 1) {
        activeRef.current = carouselState.activeCard
        posTarget.set(cardBufs[activeRef.current])
        tagTarget.set(cardTags[activeRef.current])
        if (targetAttrRef.current) targetAttrRef.current.needsUpdate = true
        if (tagAttrRef.current)    tagAttrRef.current.needsUpdate = true
        material.uniforms.uColorCard.value.setStyle(CARD_COLORS[activeRef.current])
        finalCardMorph = 0.0
        phaseRef.current = 'expanding'
        timerRef.current = 0
      }
    } else if (phaseRef.current === 'expanding') {
      const t = Math.min(1, timerRef.current / CARD_EXPAND_DUR)
      finalCardMorph = 1 - Math.pow(1 - t, 3)  // ease-out cubic bloom into new shape
      if (t >= 1) {
        finalCardMorph = 1.0
        phaseRef.current = 'idle'
        // Another change queued while expanding — start collapsing immediately
        if (carouselState.activeCard !== activeRef.current) {
          phaseRef.current = 'collapsing'
          timerRef.current = 0
        }
      }
    }

    // Card morph only kicks in once the collapse starts transitioning (p≥0.38)
    const usedCardMorph = p >= 0.38 ? finalCardMorph : 0.0

    // Edge-orb size boost applies only to cards that tag edge vs surface (globe,
    // gear, code block, clock, sparkle, rings, funnel). For all other cards uSizeScale stays 1.0 → orbs revert.
    const usesEdgeBoost = activeRef.current === 0 || activeRef.current === 1 || activeRef.current === 2 || activeRef.current === 3 || activeRef.current === 4 || activeRef.current === 5 || activeRef.current === 6

    // Section 3: the funnel's exact orbs (cardBufs[6]) morph into the wave grid
    // (the SAME orbs — no copy) and stay as the wave, undulating. The scene canvas
    // drops behind the content in Section 3 (scroll handler) so these real orbs
    // render behind the cards.
    const sec3 = scrollState.sec3
    const wave = smoothstep(sec3)
    if (activeRef.current === 6 && sec3 > 0.001) {
      const t  = clock.getElapsedTime()
      const fn = cardBufs[6]
      for (let i = 0; i < N_ORB; i++) {
        const ix = i * 3
        const lx = WAVE_GRID[ix], by = WAVE_GRID[ix + 1], lz = WAVE_GRID[ix + 2]
        const wy = by
          + 0.16 * Math.sin(lx * 1.7 + t * 0.5)
          + 0.12 * Math.sin(lx * 2.9 - lz * 0.9 + t * 0.8)
          + 0.12 * Math.sin(lz * 1.5 + t * 0.45)
          + 0.07 * Math.sin((lx * 3.4 + lz * 1.7) + t * 1.05)
        posTarget[ix]     = fn[ix]     + (lx - fn[ix])     * wave
        posTarget[ix + 1] = fn[ix + 1] + (wy - fn[ix + 1]) * wave
        posTarget[ix + 2] = fn[ix + 2] + (lz - fn[ix + 2]) * wave
      }
      if (targetAttrRef.current) targetAttrRef.current.needsUpdate = true
      waveBufDirty = true
    } else if (waveBufDirty && activeRef.current === 6) {
      // An instant scroll jump (scrollbar fling, Home key) can cross the gate
      // above in one frame and freeze the buffer mid-wave; restore the funnel's
      // exact positions once. Card swaps repair their own buffer.
      posTarget.set(cardBufs[6])
      if (targetAttrRef.current) targetAttrRef.current.needsUpdate = true
      waveBufDirty = false
    }
    // The funnel's ACTUAL orbs stay as the wave in Section 3 (no hand off). The
    // scene canvas drops behind the content (see the scroll handler) so these
    // real orbs render behind the cards.
    _waveCol.setStyle(CARD_COLORS[activeRef.current]).lerp(WAVE_COLOR, wave)
    material.uniforms.uColorCard.value.copy(_waveCol)
    material.uniforms.uMorph.value      = collapseT
    material.uniforms.uMorphCard.value  = usedCardMorph
    material.uniforms.uWaveFade.value   = wave
    material.uniforms.uOpacity.value    = MAX_CARD_OP + (WAVE_OP - MAX_CARD_OP) * wave
    material.uniforms.uTime.value       = clock.getElapsedTime()
    material.uniforms.uScale.value      = size.height / 2
    const baseSize = 1.0 + (usesEdgeBoost ? 1.0 : 0.0) * usedCardMorph
    material.uniforms.uSizeScale.value  = baseSize + (WAVE_SIZE - baseSize) * wave
    material.uniforms.uRadius.value     = 0.58 * scale
    material.uniforms.uDepthRadius.value = ((cardBoundingRadii && cardBoundingRadii[activeRef.current]) || 2.0) * (groupRef?.current?.scale.x || scale)

    for (let i = 0; i < TRAIL_LEN; i++) {
      trail[i].w = Math.min(trail[i].w + delta, TRAIL_LIFETIME + 1)
    }

    // Cursor interaction — hero sphere + Section-2 card objects only. The hover
    // effect is intentionally OFF in Section 3 onward (sec3 ≥ 0.5).
    raycaster.setFromCamera(ndc, camera)
    let hasHit = false
    if (groupRef?.current && (p < 0.62 || (p >= 0.85 && scrollState.sec3 < 0.5))) {
      invMat.copy(groupRef.current.matrixWorld).invert()
      localRay.copy(raycaster.ray).applyMatrix4(invMat)
      if (p >= 0.85) {
        // Section-2 card object: anchor the hover on the orb nearest the cursor
        // ray (the orb directly under the cursor) so the glow tracks the surface
        // of any shape at every angle.
        localRay.direction.normalize()
        const lo = localRay.origin, ld = localRay.direction
        let bestD2 = Infinity
        for (let i = 0; i < N_ORB; i += HOVER_STEP) {
          const ix = i * 3
          const ox = posTarget[ix] - lo.x, oy = posTarget[ix + 1] - lo.y, oz = posTarget[ix + 2] - lo.z
          const t = ox * ld.x + oy * ld.y + oz * ld.z
          if (t < 0) continue
          const cx = ox - t * ld.x, cy = oy - t * ld.y, cz = oz - t * ld.z
          const d2 = cx * cx + cy * cy + cz * cz          // perpendicular dist²
          if (d2 < bestD2) { bestD2 = d2; localHit.set(posTarget[ix], posTarget[ix + 1], posTarget[ix + 2]) }
        }
        const sc = groupRef.current.scale.x
        if (bestD2 * sc * sc < HOVER_HIT2) {
          hit.copy(localHit).applyMatrix4(groupRef.current.matrixWorld)
          hasHit = true
        }
      } else {
        // Hero sphere mode: intersect the collapsing sphere shell.
        localSphere.radius = R * Math.max(0.05, 1.0 - collapseT)
        if (localRay.intersectSphere(localSphere, localHit)) {
          hit.copy(localHit).applyMatrix4(groupRef.current.matrixWorld)
          hasHit = true
        }
      }
    }

    if (hasHit) {
      // Ease a smoothed point toward the (discrete) nearest-orb hit so the glow
      // GLIDES with the cursor instead of snapping orb-to-orb.
      if (!hoverInit.current) { smoothHit.copy(hit); hoverInit.current = true }
      else smoothHit.lerp(hit, 0.28)
      let oldestIdx = 0, oldestAge = -1
      for (let i = 0; i < TRAIL_LEN; i++) {
        if (trail[i].w > oldestAge) { oldestAge = trail[i].w; oldestIdx = i }
      }
      trail[oldestIdx].set(smoothHit.x, smoothHit.y, smoothHit.z, 0)
      material.uniforms.uCursorWorld.value.copy(smoothHit)
      material.uniforms.uCursorActive.value = 1.0
    } else {
      hoverInit.current = false
      material.uniforms.uCursorActive.value = 0.0
    }
  })

  return (
    <points renderOrder={2}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3}
          array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length}
          array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aSeed" count={seeds.length}
          array={seeds} itemSize={1} />
        <bufferAttribute
          ref={tagAttrRef}
          attach="attributes-aSizeTag"
          count={tagTarget.length}
          array={tagTarget}
          itemSize={1}
        />
        <bufferAttribute
          ref={targetAttrRef}
          attach="attributes-aPosTarget"
          count={positions.length / 3}
          array={posTarget}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aExplode"
          count={explode.length / 3}
          array={explode}
          itemSize={3}
        />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

function DepthOccluder() {
  const meshRef = useRef()
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ side: THREE.FrontSide })
    m.colorWrite = false
    return m
  }, [])
  useFrame(() => {
    if (!meshRef.current) return
    const s = Math.max(0.001, 1.0 - scrollState.progress * 1.8)
    meshRef.current.scale.setScalar(s)
  })
  return (
    <mesh ref={meshRef} renderOrder={-5}>
      <sphereGeometry args={[R * 0.992, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// Static particle cloud with optional scroll-driven fade (no morph)
function Particles({ positions, size, color, opacity, renderOrder = 4, fade = false }) {
  const tex = getGlowDotTexture()
  const count = positions.length / 3
  const matRef = useRef()
  useFrame(() => {
    if (!matRef.current || !fade) return
    const t = Math.min(1, Math.max(0, scrollState.progress / 0.6))
    matRef.current.opacity = opacity * (1 - t)
  })
  return (
    <points renderOrder={renderOrder}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={size} map={tex} color={color} sizeAttenuation transparent
        opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false}
        alphaTest={0.01} />
    </points>
  )
}

/* Collapse particles from sphere surface toward group origin as scroll increases.
   All grid, spoke, dot, and halo elements use this component.
   No cube destination — every particle converges to [0,0,0] in group space. */
function MorphParticles({ positions, size, color, opacity, renderOrder = 4 }) {
  const tex = getGlowDotTexture()
  const { size: viewport } = useThree()
  const pointsRef = useRef()
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uMorph:   { value: 0 },
      uSize:    { value: size },
      uScale:   { value: viewport.height / 2 },
      uMap:     { value: tex },
      uColor:   { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    vertexShader: MORPH_VERT,
    fragmentShader: MORPH_FRAG,
  }), [tex, viewport.height, size, color, opacity])

  useFrame(() => {
    const p = scrollState.progress
    const ct = gridCollapseT(p)
    material.uniforms.uMorph.value   = ct
    material.uniforms.uScale.value   = viewport.height / 2
    const fade = collapseFade(ct)
    material.uniforms.uOpacity.value = opacity * fade
    if (pointsRef.current) pointsRef.current.visible = fade > 0.005
  })

  const count = positions.length / 3
  return (
    <points ref={pointsRef} renderOrder={renderOrder}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

// Soccer-ball grid lines collapse inward
function SoccerGridParticles() {
  return (
    <>
      <MorphParticles positions={SOCCER_EDGE_POSITIONS}
        size={0.095} color="#1d6cb8" opacity={0.88} renderOrder={4} />
      <MorphParticles positions={SOCCER_EDGE_GLOW}
        size={0.156} color="#1858c0" opacity={0.38} renderOrder={3} />
    </>
  )
}

// Icon-spoke lines collapse inward
function CardinalSpokeParticles() {
  return (
    <MorphParticles positions={CARDINAL_SPOKE_POSITIONS}
      size={0.068} color="#a0eeff" opacity={0.96} renderOrder={6} />
  )
}

function VolumeField() {
  const arr = useMemo(() => {
    const count = 320
    const out = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = (0.12 + Math.random() * 0.80) * R
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      out[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      out[i * 3 + 1] = r * Math.cos(phi)
      out[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return out
  }, [])
  return <Particles positions={arr} size={0.014} color="#183060" opacity={0.45} renderOrder={1} fade />
}

// Junction vertex + hex + pentagon dots collapse inward
function JunctionDots() {
  return (
    <>
      <MorphParticles positions={JUNCTION_VERTEX_POSITIONS}
        size={0.18} color="#d8f0ff" opacity={0.92} renderOrder={7} />
      <MorphParticles positions={JUNCTION_HEX_POSITIONS}
        size={0.10} color="#90d0ff" opacity={0.78} renderOrder={6} />
      <MorphParticles positions={JUNCTION_PENT_POSITIONS}
        size={0.32} color="#ffffff" opacity={0.95} renderOrder={9} />
    </>
  )
}

// Icon halo rings collapse inward
function NodeHaloRings() {
  const spherePts = useMemo(() => {
    const pts = []
    ICON_CENTERS.forEach(c => {
      circleOnSphere(c, ICON_HALO_INNER, R * 1.003, 84).forEach(p => pts.push(p[0], p[1], p[2]))
    })
    return new Float32Array(pts)
  }, [])
  return (
    <MorphParticles positions={spherePts}
      size={0.040} color="#a8e8ff" opacity={0.92} renderOrder={8} />
  )
}

// Node cluster particles around each icon centre collapse inward
function NodeClusterParticles() {
  const tex = getGlowDotTexture()
  const { posSphere, count } = useMemo(() => {
    const perNode = 54
    const sphPts = []
    ICON_CENTERS.forEach(pc => {
      const n = pc.clone().normalize()
      const ref = Math.abs(n.y) > 0.85 ? new THREE.Vector3(1,0,0) : new THREE.Vector3(0,1,0)
      const e1 = new THREE.Vector3().crossVectors(n, ref).normalize()
      const e2 = new THREE.Vector3().crossVectors(e1, n).normalize()
      for (let k = 0; k < perNode; k++) {
        const alpha = 0.03 + Math.random() * 0.22
        const phi = Math.random() * Math.PI * 2
        const pt = n.clone()
          .multiplyScalar(Math.cos(alpha))
          .addScaledVector(e1, Math.sin(alpha) * Math.cos(phi))
          .addScaledVector(e2, Math.sin(alpha) * Math.sin(phi))
          .normalize()
          .multiplyScalar(R * (1.001 + Math.random() * 0.012))
        sphPts.push(pt.x, pt.y, pt.z)
      }
    })
    return { posSphere: new Float32Array(sphPts), count: sphPts.length / 3 }
  }, [])

  const { size: viewport } = useThree()
  const clusterRef = useRef()
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uMorph:   { value: 0 },
      uSize:    { value: 0.032 },
      uScale:   { value: viewport.height / 2 },
      uMap:     { value: tex },
      uColor:   { value: new THREE.Color('#9cd8ff') },
      uOpacity: { value: 0.65 },
    },
    vertexShader: MORPH_VERT,
    fragmentShader: MORPH_FRAG,
  }), [tex, viewport.height])

  useFrame(({ clock }) => {
    const p = scrollState.progress
    const ct = gridCollapseT(p)
    material.uniforms.uMorph.value  = ct
    material.uniforms.uScale.value  = viewport.height / 2
    const fade = collapseFade(ct)
    material.uniforms.uOpacity.value = (0.55 + 0.22 * Math.sin(clock.getElapsedTime() * 1.35)) * fade
    if (clusterRef.current) clusterRef.current.visible = fade > 0.005
  })

  return (
    <points ref={clusterRef} renderOrder={8}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={posSphere} itemSize={3} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

function PulsatingRings() {
  const tex = getGlowDotTexture()
  const { positions, count } = useMemo(() => {
    const pts = []
    ICON_CENTERS.forEach(c => {
      circleOnSphere(c, 0.165, R * 1.006, 80).forEach(p => pts.push(p[0], p[1], p[2]))
    })
    return { positions: new Float32Array(pts), count: pts.length / 3 }
  }, [])
  const { size: viewport } = useThree()
  const pointsRef = useRef()
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uMorph:   { value: 0 },
      uSize:    { value: 0.022 },
      uScale:   { value: viewport.height / 2 },
      uMap:     { value: tex },
      uColor:   { value: new THREE.Color('#c0f4ff') },
      uOpacity: { value: 0.28 },
    },
    vertexShader: MORPH_VERT,
    fragmentShader: MORPH_FRAG,
  }), [tex, viewport.height])
  useFrame(({ clock }) => {
    const p = scrollState.progress
    const ct = gridCollapseT(p)
    material.uniforms.uMorph.value  = ct
    material.uniforms.uScale.value  = viewport.height / 2
    const fade = collapseFade(ct)
    const pulse = 0.12 + 0.32 * (0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 0.9))
    material.uniforms.uOpacity.value = pulse * fade
    if (pointsRef.current) pointsRef.current.visible = fade > 0.005
  })
  return (
    <points ref={pointsRef} renderOrder={9}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

const NUM_FLOW = 300

function FlowParticles() {
  const posBuffer = useRef(new Float32Array(NUM_FLOW * 3))
  const geomRef = useRef()
  const stateRef = useRef(null)
  const matRef = useRef()

  if (!stateRef.current && FLOW_ARCS.length > 0) {
    stateRef.current = Array.from({ length: NUM_FLOW }, () => ({
      arcIdx: Math.floor(Math.random() * FLOW_ARCS.length),
      t: Math.random(),
      speed: 0.055 + Math.random() * 0.130,
    }))
  }

  const tex = getGlowDotTexture()

  useFrame((_, delta) => {
    const progress = scrollState.progress
    // Collapse toward sphere centre faster than surface orbs
    const colT     = Math.min(1, Math.sqrt(progress / 0.35))
    const colScale = 1 - colT
    const fade     = Math.max(0, 1 - progress / 0.35)
    if (matRef.current) matRef.current.opacity = 0.96 * fade
    if (!stateRef.current || !geomRef.current) return
    const pos = posBuffer.current
    stateRef.current.forEach((fp, i) => {
      fp.t += fp.speed * delta
      if (fp.t >= 1.0) {
        fp.t -= 1.0
        if (Math.random() < 0.20) fp.arcIdx = Math.floor(Math.random() * FLOW_ARCS.length)
      }
      const arc = FLOW_ARCS[fp.arcIdx]
      if (!arc || arc.length === 0) return
      const idx = Math.min(Math.floor(fp.t * (arc.length - 1)), arc.length - 1)
      const pt  = arc[idx]
      // Scale arc position toward origin (sphere centre) as collapse progresses
      pos[i * 3]     = pt[0] * colScale
      pos[i * 3 + 1] = pt[1] * colScale
      pos[i * 3 + 2] = pt[2] * colScale
    })
    geomRef.current.attributes.position.needsUpdate = true
  })

  return (
    <points renderOrder={11}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" count={NUM_FLOW}
          array={posBuffer.current} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={0.16} map={tex} color="#ffffff" sizeAttenuation transparent
        opacity={0.96} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false}
        alphaTest={0.01} />
    </points>
  )
}

function makeIconQuaternion(center) {
  const forward = center.clone().normalize()
  let worldUp = new THREE.Vector3(0, 1, 0)
  if (Math.abs(forward.dot(worldUp)) > 0.9) worldUp.set(1, 0, 0)
  const right = new THREE.Vector3().crossVectors(worldUp, forward).normalize()
  const up = new THREE.Vector3().crossVectors(forward, right).normalize()
  const m = new THREE.Matrix4().makeBasis(right, up, forward)
  return new THREE.Quaternion().setFromRotationMatrix(m)
}

function IconPlane({ center, texIndex }) {
  const tex = useMemo(() => createIconTexture(texIndex), [texIndex])
  const position = useMemo(() => center.clone().multiplyScalar(R * 1.006), [center])
  const quaternion = useMemo(() => makeIconQuaternion(center), [center])
  const meshRef = useRef()
  const matRef = useRef()
  useFrame(() => {
    const prog = scrollState.progress
    // Move toward sphere centre (group origin) faster than surface orbs
    const colT = Math.min(1, Math.sqrt(prog / 0.35))
    const fade = Math.max(0, 1 - prog / 0.33)
    if (meshRef.current) {
      meshRef.current.position.set(
        position.x * (1 - colT),
        position.y * (1 - colT),
        position.z * (1 - colT),
      )
      meshRef.current.scale.setScalar(Math.max(0.001, fade))
    }
    if (matRef.current) matRef.current.opacity = fade
  })
  return (
    <mesh ref={meshRef} position={position.toArray()} quaternion={quaternion.toArray()} renderOrder={8}>
      <planeGeometry args={[0.73, 0.73]} />
      <meshBasicMaterial ref={matRef} map={tex} transparent alphaTest={0.01}
        depthTest={true} depthWrite={false} side={THREE.FrontSide}
        blending={THREE.NormalBlending} />
    </mesh>
  )
}

const glowTexture = (() => {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
  grad.addColorStop(0,   'rgba(120,160,255,0.55)')
  grad.addColorStop(0.3, 'rgba(80,120,220,0.22)')
  grad.addColorStop(0.6, 'rgba(40, 80,180,0.08)')
  grad.addColorStop(1,   'rgba(0,  0,  0, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  return tex
})()

export default function HeroOrb({ mode = 'home' }) {
  const { gl, camera } = useThree()
  const groupRef = useRef()
  const glowRef = useRef()
  const isDragging = useRef(false)
  const snappingBack = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const enteredOsc = useRef(false)
  const dragRaycaster = useMemo(() => new THREE.Raycaster(), [])
  const dragLocalSphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(0, 0, 0), R * 1.05), [])
  const dragLocalRay = useMemo(() => new THREE.Ray(), [])
  const dragInvMat = useMemo(() => new THREE.Matrix4(), [])
  const tmpNdc = useMemo(() => new THREE.Vector2(), [])
  const screenVec = useMemo(() => new THREE.Vector3(), [])   // reused for the home-orb screen anchor
  const screenEdge = useMemo(() => new THREE.Vector3(), [])  // + a one-radius-right point → on-screen radius
  const screenRight = useMemo(() => new THREE.Vector3(), []) // camera-right in world space
  const tPosActive = useRef(false)                           // transition position morph running
  const tFromPos = useMemo(() => new THREE.Vector3(), [])    // captured source position
  const tFromScale = useRef(1)                               // captured source scale

  const [showHeavy, setShowHeavy] = useState(true)
  const heavyRef = useRef(true)
  const behindRef = useRef(false)
  const atmosRef = useRef(-1)       // last atmosphere opacity written (-1 = force first write)
  const glowBaseRef = useRef(0)     // lerped progress part of the glow halo opacity

  // Arriving on the home page (e.g. a service→home transition): mount the hero
  // decoration so it can EXPAND back in (the transition drives the collapse/expand
  // through scrollState.progress; the layers must be mounted to animate).
  useEffect(() => { if (mode === 'home') { heavyRef.current = true; setShowHeavy(true) } }, [mode])

  useEffect(() => {
    const onScroll = () => {
      // Only the home page drives the scroll choreography / atmosphere / canvas
      // z-index. On other routes the persistent canvas is frozen + hidden, so
      // bail. Also bail during a transition — the morph DRIVES scrollState.progress
      // to collapse/expand the hero decoration, and onScroll must not fight it.
      if (worldState.mode !== 'home' || transitionState.active) return
      const max = window.innerHeight
      scrollState.progress = Math.min(1, Math.max(0, window.scrollY / max))
      // The carousel now has real scroll distance (its cards are scroll-driven —
      // see scrollLayout), so sec3 only climbs 0→1 AFTER the last card, across
      // the scroll-out into Section 3. progress stays clamped at 1 throughout, so
      // the collapse/card-mode visuals are unchanged.
      scrollState.sec3 = deriveScroll(window.scrollY).sec3
      // Section 3+: drop the scene canvas BEHIND the page content so the wave —
      // the funnel's ACTUAL orbs, morphed — renders behind the cards (keeps them
      // solid). On top again for the hero/carousel. The flip is symmetric about
      // the transition midpoint (tiny hysteresis gap against jitter only):
      // direction-dependent thresholds meant the same scroll position rendered
      // different layering depending on travel direction — the root of the
      // "turns blue on scroll-up" bug. Mid-snap is also peak scroll velocity,
      // where the discrete flip is least visible.
      const s3 = scrollState.sec3
      let behind = behindRef.current
      if (!behind && s3 > 0.52) behind = true
      else if (behind && s3 < 0.48) behind = false
      if (behind !== behindRef.current) {
        behindRef.current = behind
        const cc = document.getElementById('canvas-container')
        if (cc) cc.style.zIndex = behind ? '1' : '3'
      }
      // Atmospheric glow: opacity is a pure function of scroll position — no
      // hysteresis, no CSS transition — so both directions render the identical
      // frame and nothing can linger into Section 2. The scroll snap is eased,
      // which keeps the ramp smooth on wheel/key steps; it completes exactly as
      // a down-snap lands and starts shrinking immediately on the way up.
      const atmosOp = Math.min(1, Math.max(0, (s3 - 0.15) / 0.85))
      if (atmosOp !== atmosRef.current) {
        atmosRef.current = atmosOp
        const el = document.getElementById('scene-atmosphere')
        if (el) el.style.opacity = String(atmosOp)
      }
      if (heavyRef.current && scrollState.progress > 0.80) {
        heavyRef.current = false
        setShowHeavy(false)
      } else if (!heavyRef.current && scrollState.progress < 0.63) {
        heavyRef.current = true
        setShowHeavy(true)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    // Screenshot harness hook — only with ?shot. Drives scroll progress directly
    // so the capture script can place the object in card mode deterministically.
    let cleanupShot
    if (new URLSearchParams(window.location.search).has('shot')) {
      window.__wfSetProgress = (v) => {
        scrollState.progress = Math.min(1, Math.max(0, v))
        const heavy = scrollState.progress < 0.7
        heavyRef.current = heavy
        setShowHeavy(heavy)
      }
      window.__wfSetRotY = (y) => { shotRotY = y }
      window.__wfSetSec3 = (v) => { scrollState.sec3 = Math.min(1, Math.max(0, v)) }
      cleanupShot = () => {
        delete window.__wfSetProgress; delete window.__wfSetRotY; delete window.__wfSetSec3
        shotRotY = null
      }
    }
    return () => { window.removeEventListener('scroll', onScroll); cleanupShot && cleanupShot() }
  }, [])

  useEffect(() => {
    const canvas = gl.domElement
    const onDown = (e) => {
      // Draggable on home and on service pages (where it's the docked object).
      if (worldState.mode !== 'home' && worldState.mode !== 'service') return
      const rect = canvas.getBoundingClientRect()
      tmpNdc.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      tmpNdc.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      dragRaycaster.setFromCamera(tmpNdc, camera)
      if (!groupRef.current) return
      dragInvMat.copy(groupRef.current.matrixWorld).invert()
      dragLocalRay.copy(dragRaycaster.ray).applyMatrix4(dragInvMat)
      if (!dragLocalRay.intersectsSphere(dragLocalSphere)) return
      e.preventDefault()
      isDragging.current = true
      snappingBack.current = false
      lastPointer.current = { x: e.clientX, y: e.clientY }
      document.body.style.userSelect = 'none'
      canvas.style.cursor = 'grabbing'
    }
    const onMove = (e) => {
      if (!isDragging.current || !groupRef.current) return
      const dx = e.clientX - lastPointer.current.x
      const dy = e.clientY - lastPointer.current.y
      lastPointer.current = { x: e.clientX, y: e.clientY }
      groupRef.current.rotation.y += dx * 0.008
      groupRef.current.rotation.x += dy * 0.008
    }
    const onUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        snappingBack.current = true
        document.body.style.userSelect = ''
        canvas.style.cursor = ''
      }
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [gl, camera, dragRaycaster, dragLocalSphere, dragLocalRay, dragInvMat, tmpNdc])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    // ── PAGE-TRANSITION: move the group source → screen-centre → destination ────
    const tsx = transitionState
    if (tsx.active && tsx.phase !== 'idle') {
      const g = groupRef.current
      if (glowRef.current) glowRef.current.material.opacity = 0   // no hero glow halo during the morph
      // Drive the hero decoration's collapse/expand via scrollState.progress (the
      // surface orbs ignore it during a morph, so only the grid/icons respond):
      // LEAVING home → shrink away (progress 0→1); ARRIVING home → expand back in.
      if (tsx.fromKind === 'home') scrollState.progress = tsx.gather
      else if (tsx.toKind === 'home') scrollState.progress = 1 - tsx.reassemble
      if (!tPosActive.current) {
        tPosActive.current = true
        tFromPos.copy(g.position)
        tFromScale.current = g.scale.x
      }
      const cx = camera.position.x, cy = camera.position.y
      const centerScale = 0.72
      // Destination position + scale.
      let dx = cx, dy = cy, dScale = centerScale
      const cw = gl.domElement.clientWidth, ch = gl.domElement.clientHeight
      if (tsx.toKind === 'service' && worldState.slot && cw > 0 && ch > 0) {
        const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
        const halfW = halfH * (cw / ch)
        const slot = worldState.slot
        dx = cx + ((slot.x / cw) * 2 - 1) * halfW
        dy = cy + (-((slot.y / ch) * 2 - 1)) * halfH
        const cardR = (cardBoundingRadii && cardBoundingRadii[tsx.toIndex]) || 2.0
        const worldR = (0.84 * Math.min(slot.w, slot.h) / 2) * halfH / (ch / 2)
        dScale = worldR / cardR
      } else if (tsx.toKind === 'home') {
        dx = ORB_X; dy = ORB_Y; dScale = 1.0
      }
      const re = tsx.reassemble
      let px, py, ps
      if (re > 0.0001) {
        const k = 1 - Math.pow(1 - re, 3)   // easeOutCubic → settle onto the destination
        px = cx + (dx - cx) * k
        py = cy + (dy - cy) * k
        ps = centerScale + (dScale - centerScale) * k
      } else {
        const gth = tsx.gather
        px = tFromPos.x + (cx - tFromPos.x) * gth
        py = tFromPos.y + (cy - tFromPos.y) * gth
        ps = tFromScale.current + (centerScale - tFromScale.current) * gth
      }
      g.position.set(px, py, 0)
      g.scale.setScalar(ps)
      // Spin hard through the black hole + burst, then settle as it reassembles.
      g.rotation.y += delta * (0.3 + 2.4 * tsx.suck + 1.5 * tsx.explode) * (1 - re)
      g.rotation.x += (0 - g.rotation.x) * Math.min(1, delta * 2)
      g.updateMatrixWorld()
      return
    }
    if (tPosActive.current) {
      tPosActive.current = false
      // Morph done: hand scrollState.progress back to the real scroll position.
      scrollState.progress = Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
    }

    // ── SERVICE MODE: dock the group onto the page's hero slot ──────────────────
    if (worldState.mode === 'service') {
      const g = groupRef.current
      if (glowRef.current) glowRef.current.material.opacity = 0   // no hero glow halo off-home
      const slot = worldState.slot
      const cw = gl.domElement.clientWidth, ch = gl.domElement.clientHeight
      if (slot && cw > 0 && ch > 0) {
        // px → world on the orb plane (z=0) for the Scene camera.
        const halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
        const halfW = halfH * (cw / ch)
        const ndcX = (slot.x / cw) * 2 - 1
        const ndcY = -((slot.y / ch) * 2 - 1)
        const wx = camera.position.x + ndcX * halfW
        const wy = camera.position.y + ndcY * halfH
        // Scale so the object fills ~84% of the slot's smaller dimension.
        const cardR = (cardBoundingRadii && cardBoundingRadii[worldState.index]) || 2.0
        const targetDiaPx = 0.84 * Math.min(slot.w, slot.h)
        const worldR = (targetDiaPx / 2) * halfH / (ch / 2)
        const targetScale = worldR / cardR
        const k = Math.min(1, delta * 8)
        g.position.x += (wx - g.position.x) * k
        g.position.y += (wy - g.position.y) * k
        const ns = g.scale.x + (targetScale - g.scale.x) * k
        g.scale.setScalar(ns)
      }
      // Idle ±sway (paused while dragging); ease rotation toward the oscillation.
      if (worldState.freezeSway) {
        const ke = Math.min(1, delta * 3)
        g.rotation.y += (worldState.devRotY - g.rotation.y) * ke
        g.rotation.x += (worldState.devRotX - g.rotation.x) * ke
        g.rotation.z += (0 - g.rotation.z) * ke
      } else if (!isDragging.current) {
        const t = state.clock.getElapsedTime()
        const oy = Math.sin(t * 0.32) * 0.20
        const ox = Math.sin(t * 0.24) * 0.07
        const ke = Math.min(1, delta * 1.8)
        g.rotation.y += (oy - g.rotation.y) * ke
        g.rotation.x += (ox - g.rotation.x) * ke
        g.rotation.z += (0 - g.rotation.z) * Math.min(1, delta * 2)
      }
      g.updateMatrixWorld()
      return
    }

    const p = scrollState.progress
    const sec3 = scrollState.sec3
    const e3 = smoothstep(sec3)
    // Section 3: recentre (x→0), drop to the bottom band (y→WAVE_CY) and scale up
    // so the funnel's orbs spread into a wide wave.
    let targetX = ORB_X + (END_X - ORB_X) * p
    let targetY = ORB_Y + (END_Y - ORB_Y) * p
    let targetScale = 1.0 + (END_SCALE - 1.0) * p
    targetX += (WAVE_CX - targetX) * e3
    targetY += (WAVE_CY - targetY) * e3
    targetScale += (WAVE_SCALE - targetScale) * e3
    const lerpAmt = Math.min(1, delta * 8)
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * lerpAmt
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * lerpAmt
    const curS = groupRef.current.scale.x
    const newS = curS + (targetScale - curS) * lerpAmt
    groupRef.current.scale.setScalar(newS)

    // Publish the live on-screen position of the home orb so a page transition
    // leaving/entering home can anchor the morph to the real object. Done before
    // the drag/shot early-returns so it stays current every frame.
    const gw = groupRef.current
    const cw = gl.domElement.clientWidth, ch = gl.domElement.clientHeight
    gw.getWorldPosition(screenVec)                            // world centre
    screenRight.setFromMatrixColumn(camera.matrixWorld, 0)    // camera-right (world)
    screenEdge.copy(screenVec).addScaledVector(screenRight, HOME_VIS_R * gw.scale.x)
    screenVec.project(camera)
    screenEdge.project(camera)
    const hx = (screenVec.x * 0.5 + 0.5) * cw
    const hy = (1 - (screenVec.y * 0.5 + 0.5)) * ch
    const hex = (screenEdge.x * 0.5 + 0.5) * cw
    const hey = (1 - (screenEdge.y * 0.5 + 0.5)) * ch
    transitionState.homeOrbScreen = {
      x: hx,
      y: hy,
      r: Math.hypot(hex - hx, hey - hy),
      rotY: gw.rotation.y,
      rotX: gw.rotation.x,
    }

    if (isDragging.current) return
    if (shotRotY !== null) { groupRef.current.rotation.set(0.2, shotRotY, 0); return }
    if (sec3 > 0.01) {
      // Tilt the wave slightly toward the camera (head-on + perspective) and hold
      // it still — the orbs animate themselves (undulation).
      enteredOsc.current = false
      const k = Math.min(1, delta * 2.5)
      groupRef.current.rotation.x += (WAVE_TILT - groupRef.current.rotation.x) * k
      groupRef.current.rotation.y += (0 - groupRef.current.rotation.y) * k
      groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * k
    } else if (p < 0.85 || carouselState.activeCard === 0) {
      enteredOsc.current = false
      let y = groupRef.current.rotation.y + delta * 0.044
      if (y > Math.PI)  y -= Math.PI * 2
      if (y < -Math.PI) y += Math.PI * 2
      groupRef.current.rotation.y = y
    } else {
      const t = state.clock.getElapsedTime()
      const oscTarget = Math.sin(t * 0.32) * 0.22
      if (!enteredOsc.current) {
        enteredOsc.current = true
        // Jump straight to the oscillation only when far off (arriving from the
        // hero's free spin); returning from the wave (rotation ≈ 0) the jump was
        // a visible single-frame pop, so from nearby lerp in instead.
        if (Math.abs(groupRef.current.rotation.y - oscTarget) > 0.6) {
          groupRef.current.rotation.y = oscTarget
        }
      }
      groupRef.current.rotation.y += (oscTarget - groupRef.current.rotation.y) * Math.min(1, delta * 1.5)
    }
    if (snappingBack.current) {
      const rot = groupRef.current.rotation
      rot.x += (0 - rot.x) * Math.min(1, delta * 3.5)
      rot.z += (0 - rot.z) * Math.min(1, delta * 3.5)
      if (Math.abs(rot.x) < 0.001 && Math.abs(rot.z) < 0.001) {
        rot.x = 0; rot.z = 0
        snappingBack.current = false
      }
    }
    if (glowRef.current) {
      // Glow halo only in the hero / Section 2 — faded out across Section 3.
      // Only the progress part goes through the lerp; the Section-3 factor is
      // applied instantly so the halo tracks scroll symmetrically — lerping it
      // made the halo bloom in late on scroll-up, a blue glow that scroll-down
      // never shows at the same position.
      const glowBase = p >= 0.85 ? Math.min(1, (p - 0.85) / 0.10) * 0.7 : 0
      glowBaseRef.current += (glowBase - glowBaseRef.current) * Math.min(1, delta * 4)
      glowRef.current.material.opacity = glowBaseRef.current * (1 - smoothstep(scrollState.sec3))
    }
  })

  // Hero decoration renders ONLY on the home page (and is unmounted by showHeavy
  // once you scroll past the hero). On service / other routes the object is just
  // the morphing orbs, so the globe grid / icons / glow nodes never appear.
  const heavyOn = showHeavy && mode === 'home'

  return (
    <group ref={groupRef} position={[ORB_X, ORB_Y, 0]}>
      <sprite ref={glowRef} renderOrder={0} scale={[R * 5.5, R * 5.5, 1]} position={[0, 0, -0.5]}>
        <spriteMaterial map={glowTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} />
      </sprite>
      <DepthOccluder />
      <InteractiveMiniOrbs groupRef={groupRef} />
      {/* Hero-only decoration (grid lines, glow nodes, icon halos, rings). Gated
          to the HOME page — on service pages the object is just the orbs in the
          service shape, so the globe grid/icons must NOT render. */}
      {heavyOn && <SoccerGridParticles />}
      {heavyOn && <CardinalSpokeParticles />}
      {heavyOn && <JunctionDots />}
      {heavyOn && <NodeHaloRings />}
      {heavyOn && <NodeClusterParticles />}
      {heavyOn && <FlowParticles />}
      {heavyOn && ICON_CENTERS.map((c, i) => (
        <IconPlane key={i} center={c} texIndex={i} />
      ))}
      {heavyOn && <PulsatingRings />}
    </group>
  )
}
