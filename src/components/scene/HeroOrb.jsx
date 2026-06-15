import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildSoccerBall, greatCircleArc, circleOnSphere,
} from '../../utils/soccerBall'
import { createIconTexture, getGlowDotTexture } from '../../utils/iconTextures'
import { carouselState } from '../../utils/carouselState'
import { deriveScroll } from '../../utils/scrollLayout'

const R = 1.70
const ORB_X = 2.45
const ORB_Y = 0.18
const END_X = -3.3
const END_Y = -0.42       // card-mode group centre — projects to ~60% viewport height,
                          // the measured vertical centre of the carousel card column
const END_SCALE = 0.715   // carousel/card-mode group scale (+30% — Section-2 object size)

const scrollState = { progress: 0, sec3: 0 }
let shotRotY = null   // ?shot harness: force a card-object rotation for capture
let waveBufDirty = false  // wave wrote posTarget; one repair pass owed when it exits

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

function _genBrowserFrame() {
  const pts = [], tags = []
  const GR = R * 1.28

  const TY = Math.PI * 0.10
  const cT = Math.cos(TY), sT = Math.sin(TY)

  const arc = (fn, N, jit) => {
    for (let i = 0; i <= N; i++) {
      const [x, y, z] = fn(i / N)
      pts.push(
        x*cT + z*sT + (Math.random()-.5)*jit,
        y            + (Math.random()-.5)*jit,
       -x*sT + z*cT + (Math.random()-.5)*jit,
      )
      tags.push(0)  // grid-line orb = bright/large edge
    }
  }

  // Outer rim — full ring
  arc(t => [GR*Math.cos(t*Math.PI*2), GR*Math.sin(t*Math.PI*2), 0], 480, 0.004)

  // Equator: front and rear equally dense — same brightness both sides
  arc(t => [ GR*Math.cos(t*Math.PI),         0,  GR*Math.sin(t*Math.PI)],         360, 0.005)
  arc(t => [ GR*Math.cos(Math.PI+t*Math.PI), 0,  GR*Math.sin(Math.PI+t*Math.PI)], 360, 0.005)

  // Upper latitude y = GR·0.42
  const rU = GR * Math.sqrt(1 - 0.42*0.42)
  arc(t => [ rU*Math.cos(t*Math.PI),          GR*0.42,  rU*Math.sin(t*Math.PI)],         280, 0.005)
  arc(t => [ rU*Math.cos(Math.PI+t*Math.PI),  GR*0.42,  rU*Math.sin(Math.PI+t*Math.PI)], 280, 0.005)

  // Lower latitude y = -GR·0.42
  arc(t => [ rU*Math.cos(t*Math.PI),         -GR*0.42,  rU*Math.sin(t*Math.PI)],         280, 0.005)
  arc(t => [ rU*Math.cos(Math.PI+t*Math.PI), -GR*0.42,  rU*Math.sin(Math.PI+t*Math.PI)], 280, 0.005)

  // Center longitude: front and rear equally dense
  arc(t => [0,  GR*Math.sin((t-.5)*Math.PI),  GR*Math.cos((t-.5)*Math.PI)],  360, 0.005)
  arc(t => [0,  GR*Math.sin((t-.5)*Math.PI), -GR*Math.cos((t-.5)*Math.PI)],  360, 0.005)

  // Right longitude φ=60°
  const rx = 0.5, rz = Math.sqrt(1 - rx*rx)
  arc(t => [ GR*rx*Math.cos((t-.5)*Math.PI),  GR*Math.sin((t-.5)*Math.PI),  GR*rz*Math.cos((t-.5)*Math.PI)],  280, 0.005)
  arc(t => [ GR*rx*Math.cos((t-.5)*Math.PI),  GR*Math.sin((t-.5)*Math.PI), -GR*rz*Math.cos((t-.5)*Math.PI)],  280, 0.005)

  // Left longitude φ=120°
  arc(t => [-GR*rx*Math.cos((t-.5)*Math.PI),  GR*Math.sin((t-.5)*Math.PI),  GR*rz*Math.cos((t-.5)*Math.PI)],  280, 0.005)
  arc(t => [-GR*rx*Math.cos((t-.5)*Math.PI),  GR*Math.sin((t-.5)*Math.PI), -GR*rz*Math.cos((t-.5)*Math.PI)],  280, 0.005)

  // Fibonacci sphere surface fill — even distribution, no clusters
  const N_SURF = 2500
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < N_SURF; i++) {
    const fy = 1 - (i / (N_SURF - 1)) * 2
    const fr = Math.sqrt(1 - fy * fy)
    const ftheta = golden * i
    const x = Math.cos(ftheta) * fr * GR
    const y = fy * GR
    const z = Math.sin(ftheta) * fr * GR
    pts.push(
      x*cT + z*sT + (Math.random()-.5)*0.04,
      y            + (Math.random()-.5)*0.04,
     -x*sT + z*cT + (Math.random()-.5)*0.04,
    )
    tags.push(1)  // surface scatter = normal size, dimmer
  }

  return _padToBigTagged(pts, tags, N_ORB)
}
function _genCommandCube() {
  const pts = [], tags = []

  const GR      = R * 1.25
  const N_TEETH = 8
  const R_TOOTH = GR
  const R_BODY  = GR * 0.760
  const R_HOLE  = GR * 0.287
  const DEPTH   = R  * 0.34   // clear 3D thickness between the two gear faces
  const FZ      = DEPTH / 2
  const BZ      = -DEPTH / 2
  const period    = Math.PI * 2 / N_TEETH
  const halfTooth = period * 0.42 / 2

  // 3/4 tilt — front face dominant, enough to show the gear's full thickness
  const TY = Math.PI * 0.15, TX = Math.PI * 0.05
  const cY = Math.cos(TY), sY = Math.sin(TY)
  const cX = Math.cos(TX), sX = Math.sin(TX)
  const tilt = (x, y, z) => {
    const x1 = x*cY + z*sY, z1 = -x*sY + z*cY
    return [x1, y*cX - z1*sX, y*sX + z1*cX]
  }
  // tag 0 = edge orb (rendered 2× larger + brighter), tag 1 = surface orb (normal)
  const addPt = (x, y, z, jit, tag) => {
    const [tx, ty, tz] = tilt(x, y, z)
    pts.push(tx+(Math.random()-.5)*jit, ty+(Math.random()-.5)*jit, tz+(Math.random()-.5)*jit)
    tags.push(tag)
  }
  // Bright vertical edge line joining front face to back face at one (x,y);
  // n scales with DEPTH so the line stays densely packed over the thickness
  const edgeLine = (x, y, passes = 2, n = 11) => {
    for (let pass = 0; pass < passes; pass++)
      for (let k = 0; k <= n; k++) addPt(x, y, FZ - DEPTH * k/n, 0.004, 0)
  }

  const gearR = (θ) => {
    const t = ((θ % period) + period) % period
    return Math.min(t, period - t) <= halfTooth ? R_TOOTH : R_BODY
  }

  // Gear outline + crease corners.
  // NW=12: side-wall spacing ~0.043 scene units ≤ tiler jitter 0.05 → solid lines.
  const outline2d = [], corners = []
  const NV = 20, NW = 12, NT = 18
  for (let i = 0; i < N_TEETH; i++) {
    const θc = i * period
    const θv = θc - (period - halfTooth)
    const θr = θc - halfTooth
    const θf = θc + halfTooth
    for (let j = 0; j < NV; j++) {
      const θ = θv + (θr - θv)*j/NV
      outline2d.push([R_BODY*Math.cos(θ), R_BODY*Math.sin(θ)])
    }
    for (let j = 0; j <= NW; j++) {
      const r = R_BODY + (R_TOOTH-R_BODY)*j/NW
      outline2d.push([r*Math.cos(θr), r*Math.sin(θr)])
    }
    for (let j = 0; j <= NT; j++) {
      const θ = θr + (θf-θr)*j/NT
      outline2d.push([R_TOOTH*Math.cos(θ), R_TOOTH*Math.sin(θ)])
    }
    for (let j = 1; j <= NW; j++) {
      const r = R_TOOTH + (R_BODY-R_TOOTH)*j/NW
      outline2d.push([r*Math.cos(θf), r*Math.sin(θf)])
    }
    corners.push([R_BODY*Math.cos(θr), R_BODY*Math.sin(θr)])
    corners.push([R_TOOTH*Math.cos(θr), R_TOOTH*Math.sin(θr)])
    corners.push([R_TOOTH*Math.cos(θf), R_TOOTH*Math.sin(θf)])
    corners.push([R_BODY*Math.cos(θf), R_BODY*Math.sin(θf)])
  }

  // Front + back outline — equal passes so both gear faces are equally bright
  for (let pass = 0; pass < 3; pass++)
    for (const [x, y] of outline2d) addPt(x, y, FZ, 0.004, 0)
  for (let pass = 0; pass < 3; pass++)
    for (const [x, y] of outline2d) addPt(x, y, BZ, 0.004, 0)

  // Tooth crease corner depth connectors — give the gear its 3D read
  for (const [x, y] of corners) edgeLine(x, y, 2, 11)

  // Center hole circles (bright edge lines) + dim wall scatter
  const HC = 130
  for (let pass = 0; pass < 3; pass++)
    for (let i = 0; i < HC; i++) {
      const a = i / HC * Math.PI * 2
      addPt(R_HOLE*Math.cos(a), R_HOLE*Math.sin(a), FZ, 0.004, 0)
    }
  for (let pass = 0; pass < 3; pass++)
    for (let i = 0; i < HC; i++) {
      const a = i / HC * Math.PI * 2
      addPt(R_HOLE*Math.cos(a), R_HOLE*Math.sin(a), BZ, 0.004, 0)
    }
  for (let i = 0; i < 300; i++) {
    const a = Math.random() * Math.PI * 2
    addPt(R_HOLE*Math.cos(a), R_HOLE*Math.sin(a), FZ - Math.random()*DEPTH, 0.012, 1)
  }

  // Grid fill — regular lattice matching Object 03 treatment
  const inGear = (x, y) => {
    const r = Math.sqrt(x*x + y*y)
    return r >= R_HOLE && r <= gearR(Math.atan2(y, x))
  }
  const gStep = R * 0.065
  for (let gy = -R_TOOTH; gy <= R_TOOTH + 0.001; gy += gStep)
    for (let gx = -R_TOOTH; gx <= R_TOOTH + 0.001; gx += gStep)
      if (inGear(gx, gy)) addPt(gx, gy, FZ, 0.007, 1)
  for (let gy = -R_TOOTH; gy <= R_TOOTH + 0.001; gy += gStep * 1.6)
    for (let gx = -R_TOOTH; gx <= R_TOOTH + 0.001; gx += gStep * 1.6)
      if (inGear(gx, gy)) addPt(gx, gy, BZ, 0.007, 1)

  const out = _padToBigTagged(pts, tags, N_ORB)
  out.normal = tilt(0, 0, 1)
  return out
}
// Object 03 — 3D holographic CODE BLOCK.
// Clean line-based particle treatment: edges are tight strings of orbs, fills
// are light. Symbol is raised and larger. Corners are edge lines, not blobs.
function _genCodeBlock() {
  const pts = [], tags = []

  const HW    = R * 1.02
  const HH    = R * 0.92
  const CR    = R * 0.18
  const DEPTH = R * 0.34
  const FZ    = DEPTH / 2
  const BZ    = -DEPTH / 2
  const LIFT  = R * 0.20
  const SFZ   = FZ + LIFT

  // Single-centerline </> — no stroke width so corner/overlap artifacts impossible.
  // Each arm is one bright line of orbs. The V-shape of < and > reads cleanly.
  const ix   = R * 0.10, cw = R * 0.58, ch = R * 0.54
  const sltX = R * 0.075
  const glyphPaths = [
    [[-ix,  ch], [-ix-cw, 0], [-ix, -ch]],  // <
    [[ ix,  ch], [ ix+cw, 0], [ ix, -ch]],  // >
    [[-sltX, -ch], [sltX, ch]],             // /
  ]

  const TY = Math.PI * 0.15, TX = Math.PI * 0.05
  const cY = Math.cos(TY), sY = Math.sin(TY)
  const cX = Math.cos(TX), sX = Math.sin(TX)
  const tilt = (x, y, z) => {
    const x1 = x*cY + z*sY, z1 = -x*sY + z*cY
    return [x1, y*cX - z1*sX, y*sX + z1*cX]
  }
  const addPt = (x, y, z, jit, tag) => {
    const [tx, ty, tz] = tilt(x, y, z)
    pts.push(tx+(Math.random()-.5)*jit, ty+(Math.random()-.5)*jit, tz+(Math.random()-.5)*jit)
    tags.push(tag)
  }
  const vline = (x, y, z0, z1, passes, n) => {
    for (let p = 0; p < passes; p++)
      for (let k = 0; k <= n; k++) addPt(x, y, z0+(z1-z0)*k/n, 0.003, 0)
  }

  // Dense perimeter — nS=60 gives adjacent points ~0.048R apart so tiler
  // jitter (±0.025) fills gaps and the outline reads as a solid line.
  const nS = 60, nA = 12
  const peri = []
  const ap = (x, y) => peri.push([x, y])
  for (let i=0; i<nS; i++) { const t=i/nS; ap(-HW+CR+t*(2*HW-2*CR), HH) }
  for (let i=0; i<=nA; i++) { const a=Math.PI/2*(1-i/nA); ap(HW-CR+Math.cos(a)*CR, HH-CR+Math.sin(a)*CR) }
  for (let i=1; i<nS; i++) { const t=i/nS; ap(HW, HH-CR-t*(2*HH-2*CR)) }
  for (let i=0; i<=nA; i++) { const a=-Math.PI/2*i/nA; ap(HW-CR+Math.cos(a)*CR, -(HH-CR)+Math.sin(a)*CR) }
  for (let i=1; i<nS; i++) { const t=i/nS; ap(HW-CR-t*(2*HW-2*CR), -HH) }
  for (let i=0; i<=nA; i++) { const a=-Math.PI/2-Math.PI/2*i/nA; ap(-(HW-CR)+Math.cos(a)*CR, -(HH-CR)+Math.sin(a)*CR) }
  for (let i=1; i<nS; i++) { const t=i/nS; ap(-HW, -(HH-CR)+t*(2*HH-2*CR)) }
  for (let i=0; i<=nA; i++) { const a=Math.PI-Math.PI/2*i/nA; ap(-(HW-CR)+Math.cos(a)*CR, (HH-CR)+Math.sin(a)*CR) }

  for (let pass=0; pass<3; pass++) for (const [x,y] of peri) addPt(x, y, FZ, 0.003, 0)
  for (let pass=0; pass<3; pass++) for (const [x,y] of peri) addPt(x, y, BZ, 0.003, 0)

  // Side wall scatter — dim, no bright lines
  for (let i=0; i<280; i++) {
    const [x,y] = peri[Math.floor(Math.random()*peri.length)]
    addPt(x, y, FZ-Math.random()*DEPTH, 0.015, 1)
  }

  const inRR = (x, y) => {
    const ax=Math.abs(x), ay=Math.abs(y)
    if (ax>HW||ay>HH) return false
    if (ax<=HW-CR||ay<=HH-CR) return true
    return (ax-(HW-CR))**2+(ay-(HH-CR))**2<=CR*CR
  }
  const gStep = R * 0.065
  for (let gy=-HH; gy<=HH+0.001; gy+=gStep)
    for (let gx=-HW; gx<=HW+0.001; gx+=gStep)
      if (inRR(gx, gy)) addPt(gx, gy, FZ, 0.007, 1)
  for (let gy=-HH; gy<=HH+0.001; gy+=gStep*1.6)
    for (let gx=-HW; gx<=HW+0.001; gx+=gStep*1.6)
      if (inRR(gx, gy)) addPt(gx, gy, BZ, 0.007, 1)

  // Raised symbol: single-centerline approach.
  // Each vertex gets a depth vline (FZ→SFZ). Each segment gets a dense line
  // at SFZ (top, 5 passes = bright) and at FZ (base edge, 3 passes).
  // No stroke-width math = no corner crossing or cap-overlap artifacts.
  for (const path of glyphPaths) {
    // Depth connectors at every path vertex
    for (const [vx, vy] of path) vline(vx, vy, FZ, SFZ, 2, 10)
    for (let s=0; s<path.length-1; s++) {
      const [ax,ay] = path[s], [bx,by] = path[s+1]
      const dx=bx-ax, dy=by-ay, L=Math.hypot(dx,dy)
      const n = Math.round(L/(R*0.024))
      // Top line at SFZ — 5 passes gives a bold bright raised line
      for (let pass=0; pass<5; pass++)
        for (let k=0; k<=n; k++) { const t=k/n; addPt(ax+dx*t, ay+dy*t, SFZ, 0.003, 0) }
      // Base line at FZ — 3 passes (edge where symbol roots into slab surface)
      for (let pass=0; pass<3; pass++)
        for (let k=0; k<=n; k++) { const t=k/n; addPt(ax+dx*t, ay+dy*t, FZ, 0.003, 0) }
    }
  }

  const out = _padToBigTagged(pts, tags, N_ORB)  // default tileJit=0.05
  out.normal = tilt(0, 0, 1)
  return out
}
function _genWorkflowPath() {
  // Premium 3D clock built from orbs — time symbol for Workflow Automation.
  // Outer torus ring (with real tube thickness) + thin inner bezel ring + center
  // hub + two tapered hands at a 10:10 luxury angle + four minimal markers.
  // The whole form is tilted into a subtle 3/4 perspective so depth reads.
  const pts = [], tags = []

  // Overall scale — sized so the clock's diameter matches the neighbouring
  // Object 03 (code block, ~1.84R tall) rather than reading much smaller.
  const S = 2.1

  // 3/4 tilt: rotate about Y then X so the disc shows depth, hands lift off the face.
  const ax = 0.34, ay = 0.20
  const cax = Math.cos(ax), sax = Math.sin(ax), cay = Math.cos(ay), say = Math.sin(ay)
  const addPt = (x, y, z, jit, tag) => {
    x += (Math.random()-.5)*jit; y += (Math.random()-.5)*jit; z += (Math.random()-.5)*jit
    const x1 = x*cay + z*say, z1 = -x*say + z*cay
    const y2 = y*cax - z1*sax, z2 = y*sax + z1*cax
    pts.push(x1, y2, z2); tags.push(tag)
  }

  // Solid orb sphere: bright shell (tag-0) + light interior fill (tag-1).
  const addSphere = (cx, cy, cz, r, N, passes, shellTag=0) => {
    const gold = Math.PI*(3-Math.sqrt(5))
    for (let p=0; p<passes; p++)
      for (let i=0; i<N; i++) {
        const fy=1-(i/(N-1))*2, fr=Math.sqrt(1-fy*fy), fa=gold*i
        const rr=r*(0.92+Math.random()*0.08)
        addPt(cx+Math.cos(fa)*fr*rr, cy+fy*rr, cz+Math.sin(fa)*fr*rr, 0.006, shellTag)
      }
    const nI=Math.floor(N*0.5)
    for (let i=0; i<nI; i++) {
      const fy=1-(i/(nI-1))*2, fr=Math.sqrt(1-fy*fy), fa=gold*i*1.7
      const rr=r*Math.cbrt(Math.random())*0.8
      addPt(cx+Math.cos(fa)*fr*rr, cy+fy*rr, cz+Math.sin(fa)*fr*rr, 0.006, 1)
    }
  }

  // Torus ring: major circle radius Rmaj, tube thickness tubeR. Outward-facing
  // cross-section orbs are tag-0 (bright crisp rim), inner-facing are tag-1.
  const addTorus = (Rmaj, tubeR, Nmaj, Nmin, brightOuter=true) => {
    for (let i=0; i<Nmaj; i++) {
      const a=(i/Nmaj)*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a)
      for (let j=0; j<Nmin; j++) {
        const b=(j/Nmin)*Math.PI*2
        const rr=tubeR*(0.9+Math.random()*0.1)
        const R0=Rmaj+Math.cos(b)*rr
        const tag = brightOuter ? (Math.cos(b)>0.15 ? 0 : 1) : 1
        addPt(ca*R0, sa*R0, Math.sin(b)*rr, 0.005, tag)
      }
    }
  }

  // Tapered hand: volumetric tube from hub outward, lifted above the face in +z.
  const drawHand = (ang, len, w0, w1, zLift) => {
    const dx=Math.cos(ang), dy=Math.sin(ang)
    const px=-dy, py=dx  // perpendicular in face plane
    const nSeg=Math.max(Math.ceil(len/0.011), 14)
    for (let s=0; s<=nSeg; s++) {
      const t=s/nSeg
      const cx=dx*len*t, cy=dy*len*t
      const w=w0+(w1-w0)*t
      const ringN=8
      for (let k=0; k<ringN; k++) {
        const b=(k/ringN)*Math.PI*2
        const rr=w*(0.82+Math.random()*0.18)
        addPt(cx+Math.cos(b)*rr*px, cy+Math.cos(b)*rr*py, zLift+Math.sin(b)*rr, 0.005, 0)
      }
    }
  }

  // Outer frame — substantial bright torus (the dominant, most readable silhouette).
  addTorus(R*0.60*S, R*0.055*S, 240, 14, true)
  // Inner bezel — thin subtle ring for the premium watch-face feel.
  addTorus(R*0.485*S, R*0.018*S, 210, 7, false)

  // Center hub — small dense bright orb, anchor of the hands.
  addSphere(0, 0, R*0.055*S, R*0.062*S, 70, 3, 0)

  // Two hands at a 10:10 luxury display angle (12 o'clock = +Y / 90°).
  // Hour (short) → 10 o'clock = 150°; minute (long) → 2 o'clock = 30°.
  // Minute hand lifted slightly higher so it layers above the hour hand.
  drawHand(Math.PI*5/6, R*0.34*S, R*0.034*S, R*0.015*S, R*0.050*S)  // hour, 10 o'clock
  drawHand(Math.PI/6,   R*0.46*S, R*0.030*S, R*0.012*S, R*0.075*S)  // minute, 2 o'clock

  // Four minimal markers at 12 / 3 / 6 / 9.
  const mR=R*0.475*S
  for (const ma of [Math.PI/2, 0, -Math.PI/2, Math.PI]) {
    addSphere(Math.cos(ma)*mR, Math.sin(ma)*mR, R*0.02*S, R*0.034*S, 30, 2, 0)
  }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.035)
  out.normal = [0, 0, 1]
  return out
}
function _genIntelligenceOrbit() {
  // Premium sparkle cluster: three 4-pointed sparkles (large / medium / small).
  // Silhouette = 3D-puffed astroid  x = Rs·sin³t, y = Rs·cos³t.
  const pts = [], tags = []

  // 3/4 tilt — enough to read the rounded 3D volume (not a flat outline).
  const ax = 0.26, ay = 0.40
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
  const STEP = R * 0.026
  const TWO_PI = Math.PI * 2
  const drawSparkle = (cx, cy, cz, Rs, d) => {
    for (let phi = 0; phi <= Math.PI + 1e-4; ) {
      const s = Math.sin(phi)            // radial scale of this ring
      const z = d * Math.cos(phi)        // height of this ring
      if (s < 1e-3) {
        addPt(cx, cy, cz + z, 0.006, 1)  // pole (front / back)
      } else {
        const ringR = Rs * s
        const nT = Math.max(6, Math.round(6 * ringR / STEP))  // astroid perim ≈ 6R
        const t0 = Math.random() * TWO_PI
        for (let i = 0; i < nT; i++) {
          const t = t0 + (i / nT) * TWO_PI
          const st = Math.sin(t), ct = Math.cos(t)
          addPt(cx + ringR*st*st*st, cy + ringR*ct*ct*ct, cz + z, 0.006, 1)
        }
      }
      // advance φ so the meridian (radial+z) step stays ≈ STEP everywhere
      const c = Math.cos(phi)
      const ds = Math.sqrt(Rs*Rs*c*c + d*d*s*s)
      phi += STEP / Math.max(ds, 1e-3)
    }
  }

  // Spaced cluster (a clear gap between the three), sized to match the others;
  // thickness (d) is half the previous values per the brief.
  drawSparkle( 0,        0,        0,  R*0.88, R*0.28)  // large — centred
  drawSparkle( R*0.92,   R*0.70,   0,  R*0.38, R*0.12)  // medium — upper-right
  drawSparkle( R*0.80,  -R*0.60,   0,  R*0.27, R*0.09)  // small  — lower-right

  const out = _padToBigTagged(pts, tags, N_ORB, 0.035)
  out.normal = [0, 0, 1]
  return out
}
function _genConnectedCubes() {
  // Premium interlocking network — three glowing orb rings woven into a trefoil.
  // Each ring is a volumetric torus; a sin(2θ) z-weave makes them pass over/under
  // so the form reads as connected systems, not flat stacked circles.
  const pts = [], tags = []

  // Subtle 3/4 tilt so the rings feel dimensional but stay front-readable.
  const ax = 0.30, ay = 0.16
  const cax=Math.cos(ax), sax=Math.sin(ax), cay=Math.cos(ay), say=Math.sin(ay)
  const addPt = (x, y, z, jit, tag) => {
    x+=(Math.random()-.5)*jit; y+=(Math.random()-.5)*jit; z+=(Math.random()-.5)*jit
    const x1=x*cay+z*say, z1=-x*say+z*cay
    pts.push(x1, y*cax-z1*sax, y*sax+z1*cax); tags.push(tag)
  }

  const Rmaj = R*0.64    // ring major radius — scaled to match globe visual weight
  const tube = R*0.115   // tube thickness (reads solid, not thin)
  const sep  = R*0.51    // each ring centre's distance from the shared centroid
  const weave= R*0.128   // over/under weave depth that creates the interlock

  // Volumetric torus with edge hierarchy: outer + inner rims bright (tag-0),
  // the front/back tube surfaces softer (tag-1). A sin(2θ) weave threads it
  // through the others so crossings alternate front/back.
  const addRing = (cx, cy, phase) => {
    const Nmaj = 256, Nmin = 16
    for (let i=0; i<Nmaj; i++) {
      const th=(i/Nmaj)*Math.PI*2, ct=Math.cos(th), st=Math.sin(th)
      const zw = weave*Math.sin(2*th + phase)
      for (let j=0; j<Nmin; j++) {
        const ph=(j/Nmin)*Math.PI*2, cp=Math.cos(ph)
        const rr=tube*(0.9+Math.random()*0.1)
        const ring=Rmaj+cp*rr
        // outer rim (cp≈1) and inner rim (cp≈-1) are the crisp bright edges
        const tag = Math.abs(cp) > 0.45 ? 0 : 1
        addPt(cx+ct*ring, cy+st*ring, zw+Math.sin(ph)*rr, 0.005, tag)
      }
    }
    // Dedicated bright-rim passes — extra dense crisp edges on outer & inner contours.
    for (let i=0; i<Nmaj; i++) {
      const th=(i/Nmaj)*Math.PI*2, ct=Math.cos(th), st=Math.sin(th)
      const zw = weave*Math.sin(2*th + phase)
      addPt(cx+ct*(Rmaj+tube), cy+st*(Rmaj+tube), zw, 0.004, 0)  // outer rim
      addPt(cx+ct*(Rmaj-tube), cy+st*(Rmaj-tube), zw, 0.004, 0)  // inner rim
    }
  }

  // Trefoil arrangement: one ring up top, two lower-left / lower-right.
  addRing(0,            sep,      0)             // top
  addRing(-sep*0.866,  -sep*0.5,  Math.PI*2/3)   // lower-left
  addRing( sep*0.866,  -sep*0.5,  Math.PI*4/3)   // lower-right

  const out = _padToBigTagged(pts, tags, N_ORB, 0.035)
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

  // ── Top rim — dense, bright, crisp (double pass for a solid luminous lip) ──
  ring(topY, topR, 200, 0.004, true)
  ring(topY, topR*0.992, 200, 0.004, true)

  // ── Cone body — stacked rings tapering top→neck. Outer left/right edges and
  //    the rim of each ring are the crisp silhouette; surface fill is softer. ──
  const coneRows = 30
  for (let r=0; r<=coneRows; r++) {
    const t = r/coneRows
    const y = topY + (coneB-topY)*t
    const rad = topR + (neckR-topR)*t
    const n = Math.max(Math.round(rad*150), 30)
    for (let i=0; i<n; i++) {
      const a=(i/n)*Math.PI*2, sa=Math.sin(a)
      // Side silhouette edges (left/right, |sin a|≈... actually cos a≈±1) stay bright.
      const ca=Math.cos(a)
      const tag = (Math.abs(ca) > 0.86) ? 0 : 1   // left & right outer edges crisp
      addPt(Math.cos(a)*rad, y, sa*rad, 0.006, tag)
    }
  }

  // ── Output neck — short cylinder, dense enough to read as a clean channel ──
  const neckRows = 8
  for (let r=0; r<=neckRows; r++) {
    const t=r/neckRows
    const y=coneB+(neckB-coneB)*t
    ring(y, neckR, 46, 0.005, r===0 || r===neckRows)  // top & bottom rims brighter
    if (r!==0 && r!==neckRows) ring(y, neckR, 46, 0.005, false)
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
    [-0.68, topY + R*0.26,  0.42, R*0.052],
    [ 0.52, topY + R*0.34, -0.55, R*0.044],
    [ 0.88, topY + R*0.20,  0.18, R*0.038],
    [-0.22, topY + R*0.54,  0.72, R*0.034],
    [ 0.32, topY + R*0.58, -0.32, R*0.030],
    [-0.78, topY + R*0.46, -0.48, R*0.026],
    [ 0.58, topY + R*0.46,  0.58, R*0.022],
    [-0.08, topY + R*0.80,  0.18, R*0.019],
  ]
  for (const [xf, iy, zf, ir] of inSpheres) {
    const N=48, ix=xf*topR, iz=zf*topR
    for (let i=0;i<N;i++){
      const fy=1-(i/(N-1))*2, fr=Math.sqrt(1-fy*fy), fa=gold*i
      const rr=ir*(0.9+Math.random()*0.1)
      addPt(ix+Math.cos(fa)*fr*rr, iy+fy*rr, iz+Math.sin(fa)*fr*rr, 0.006, 0)
    }
  }

  const out = _padToBigTagged(pts, tags, N_ORB, 0.035)
  out.normal = [0, 0, 1]
  return out
}

/* Exported so service detail pages reuse the EXACT live home objects. */
export const CARD_GENERATORS = [
  _genBrowserFrame, _genCommandCube, _genCodeBlock, _genWorkflowPath,
  _genIntelligenceOrbit, _genConnectedCubes, _genFunnel,
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
const HOVER_STEP = 24       // sample stride for the nearest-orb hover (Section 2)
const HOVER_HIT2 = 0.25     // (0.5 world units)²

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
  attribute float aSize;
  attribute float aSeed;
  attribute float aSizeTag;
  attribute vec3 aPosTarget;
  varying float vGlow;
  varying float vCardBlend;
  varying float vWaveFade;

  void main() {
    /* Phase 1: collapse sphere toward centre (uMorph 0→0.5) */
    vec3 collapsedPos = position * (1.0 - uMorph);
    /* Phase 2: rearrange from collapsed position to card shape (uMorphCard 0→1) */
    vec3 basePos = mix(collapsedPos, aPosTarget, uMorphCard);

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
    float globeFactor = max(0.0, uSizeScale - 1.0);
    float effectiveScale = uSizeScale * (1.0 - aSizeTag * globeFactor * 0.50);
    gl_PointSize = aSize * effectiveScale * 2.0 * (1.0 + vGlow * 3.2) * (uScale / -mv.z);
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

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    if (tex.a < 0.01) discard;
    vec3 sphereCol = mix(uColorBase, uColorHot, vGlow);
    vec3 col = mix(sphereCol, uColorCard, vCardBlend);
    float opMult = mix(mix(0.8, 1.0, uMorph), 1.0, vCardBlend);
    float a = tex.a * uOpacity * opMult * (1.0 + vGlow * 0.8) * vWaveFade;
    gl_FragColor = vec4(col * (1.0 + vGlow * 0.5), a);
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

  const { positions, sizes, seeds } = useMemo(() => {
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
    for (let i = 0; i < count; i++) {
      s[i]  = 0.013 + Math.random() * 0.005
      sd[i] = Math.random()
    }
    return { positions: p, sizes: s, seeds: sd }
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
    },
    vertexShader: MINI_VERT,
    fragmentShader: MINI_FRAG,
  }), [tex, size.height, trail])

  useFrame(({ clock }, delta) => {
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
      let oldestIdx = 0, oldestAge = -1
      for (let i = 0; i < TRAIL_LEN; i++) {
        if (trail[i].w > oldestAge) { oldestAge = trail[i].w; oldestIdx = i }
      }
      trail[oldestIdx].set(hit.x, hit.y, hit.z, 0)
      material.uniforms.uCursorWorld.value.copy(hit)
      material.uniforms.uCursorActive.value = 1.0
    } else {
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

export default function HeroOrb() {
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

  const [showHeavy, setShowHeavy] = useState(true)
  const heavyRef = useRef(true)
  const behindRef = useRef(false)
  const atmosRef = useRef(-1)       // last atmosphere opacity written (-1 = force first write)
  const glowBaseRef = useRef(0)     // lerped progress part of the glow halo opacity

  useEffect(() => {
    const onScroll = () => {
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

  return (
    <group ref={groupRef} position={[ORB_X, ORB_Y, 0]}>
      <sprite ref={glowRef} renderOrder={0} scale={[R * 5.5, R * 5.5, 1]} position={[0, 0, -0.5]}>
        <spriteMaterial map={glowTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} />
      </sprite>
      <DepthOccluder />
      <InteractiveMiniOrbs groupRef={groupRef} />
      {showHeavy && <SoccerGridParticles />}
      {showHeavy && <CardinalSpokeParticles />}
      {showHeavy && <JunctionDots />}
      {showHeavy && <NodeHaloRings />}
      {showHeavy && <NodeClusterParticles />}
      {showHeavy && <FlowParticles />}
      {showHeavy && ICON_CENTERS.map((c, i) => (
        <IconPlane key={i} center={c} texIndex={i} />
      ))}
      {showHeavy && <PulsatingRings />}
    </group>
  )
}
