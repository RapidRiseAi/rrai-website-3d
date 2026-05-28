import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildSoccerBall, greatCircleArc, circleOnSphere,
} from '../../utils/soccerBall'
import { createIconTexture, getGlowDotTexture } from '../../utils/iconTextures'
import { carouselState } from '../../utils/carouselState'

const R = 1.70
const ORB_X = 2.45
const ORB_Y = 0.18
const END_X = -3.3
const END_SCALE = 0.55

const scrollState = { progress: 0 }

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
function gridCollapseT(p)  { return smoothstep(p / 0.76) }
function collapseFade(t)   { return Math.max(0, 1.0 - t * 1.5) }

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

const CARD_COLORS = [
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

function _genBrowserFrame() {
  const pts=[], W=R*.80, H=R*.70, D=R*.40
  _addRect(pts, 0,0,D*.5, W,H, 46,36, 0.025)
  _addRect(pts, 0,0,-D*.5, W*.90,H*.90, 40,30, 0.025)
  for (const [sx,sy] of [[1,1],[1,-1],[-1,1],[-1,-1]])
    _addLine(pts, sx*W,sy*H,D*.5, sx*W*.90,sy*H*.90,-D*.5, 10, 0.015)
  _addLine(pts, -W*.92,H*.58,D*.5+.02, W*.92,H*.58,D*.5+.02, 44, 0.015)
  for (let d=0; d<3; d++) _addCircle(pts, -W*.68+d*W*.125,H*.77,D*.5+.02, W*.027, 9, 0.008)
  return _padToBig(pts, N_ORB)
}
function _genCommandCube() {
  const pts=[]
  _addCubeEdges(pts, 0,0,0, R*.82, 18, 0.024)
  _addCubeEdges(pts, 0,0,0, R*.36, 10, 0.018)
  for (const x of[-1,1]) for (const y of[-1,1]) for (const z of[-1,1])
    _addLine(pts, x*R*.82,y*R*.82,z*R*.82, x*R*.36,y*R*.36,z*R*.36, 4, 0.016)
  return _padToBig(pts, N_ORB)
}
function _genAppStack() {
  const pts=[], pw=R*.36, ph=R*.74
  _addRect(pts, -R*.18,0,R*.28, pw,ph, 30,44, 0.022)
  _addCircle(pts, -R*.18,ph*.84,R*.30, R*.034, 10, 0.008)
  _addLine(pts, -R*.18-pw*.62,-ph*.83,R*.29, -R*.18+pw*.62,-ph*.83,R*.29, 16, 0.012)
  _addRect(pts, R*.24,-R*.07,-R*.08, pw*.88,ph*.84, 22,36, 0.022)
  _addCircle(pts, R*.24,ph*.84*.84-R*.07,-R*.06, R*.030, 9, 0.008)
  _addRect(pts, R*.56,-R*.16,-R*.38, pw*.74,ph*.68, 16,26, 0.022)
  return _padToBig(pts, N_ORB)
}
function _genWorkflowPath() {
  const pts=[]
  const n0=[-R*.56,-R*.72,-R*.04], n1=[R*.06,R*.02,R*.10], n2=[R*.60,R*.72,R*.04]
  for (const [nx,ny,nz] of [n0,n1,n2]) {
    _addCircle(pts, nx,ny,nz, R*.130, 26, 0.018)
    _addCircle(pts, nx,ny,nz, R*.058, 14, 0.012)
  }
  _addBezier(pts, n0,[n0[0]+R*.28,n0[1]+R*.52,n0[2]],[n1[0]-R*.28,n1[1]-R*.40,n1[2]],n1, 52, 0.028)
  _addBezier(pts, n1,[n1[0]+R*.26,n1[1]+R*.44,n1[2]],[n2[0]-R*.26,n2[1]-R*.42,n2[2]],n2, 52, 0.028)
  return _padToBig(pts, N_ORB)
}
function _genIntelligenceOrbit() {
  const pts=[], cR=R*.36, oR=R*.84, tilt=Math.PI/5.5
  for (let i=0; i<108; i++) {
    const phi=Math.acos(2*Math.random()-1), theta=Math.random()*Math.PI*2
    const r=cR*(0.96+Math.random()*.08)
    pts.push(r*Math.sin(phi)*Math.cos(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta))
  }
  for (let i=0; i<76; i++) {
    const a=(i/76)*Math.PI*2
    pts.push(Math.cos(a)*oR+(Math.random()-.5)*.022, Math.sin(a)*oR*Math.sin(tilt)+(Math.random()-.5)*.022, Math.sin(a)*oR*Math.cos(tilt)+(Math.random()-.5)*.022)
  }
  const satA=Math.PI*.42
  for (let k=0; k<14; k++) {
    const sa=satA+(Math.random()-.5)*.20, rr=oR*(1+(Math.random()-.5)*.06)
    pts.push(Math.cos(sa)*rr, Math.sin(sa)*rr*Math.sin(tilt), Math.sin(sa)*rr*Math.cos(tilt))
  }
  return _padToBig(pts, N_ORB)
}
function _genConnectedCubes() {
  const pts=[], cs=R*.26, ss=R*.18, dist=R*.80
  _addCubeEdges(pts, 0,0,0, cs, 7, 0.018)
  const sats=[[0,dist,R*.08],[0,-dist,-R*.08],[-dist,0,R*.10],[dist,0,-R*.10]]
  for (const [sx,sy,sz] of sats) {
    _addCubeEdges(pts, sx,sy,sz, ss, 5, 0.014)
    const len=Math.sqrt(sx*sx+sy*sy+sz*sz)
    _addLine(pts, sx/len*cs,sy/len*cs,sz/len*cs, sx-sx/len*ss,sy-sy/len*ss,sz-sz/len*ss, 10, 0.018)
  }
  return _padToBig(pts, N_ORB)
}
function _genFunnel() {
  const pts=[], topW=R*.82, botW=R*.12, topY=R*.70, botY=-R*.68, D=R*.30, H=topY-botY
  _addLine(pts, -topW,topY,D*.5, -botW,botY,0, 40, 0.038)
  _addLine(pts,  topW,topY,D*.5,  botW,botY,0, 40, 0.038)
  _addLine(pts, -topW,topY,D*.5,  topW,topY,D*.5, 52, 0.038)
  _addLine(pts, -botW,botY,0, botW,botY,0, 12, 0.025)
  _addLine(pts, -topW*.88,topY*.96,-D*.5, -botW*.88,botY*.96,0, 28, 0.038)
  _addLine(pts,  topW*.88,topY*.96,-D*.5,  botW*.88,botY*.96,0, 28, 0.038)
  _addLine(pts, -topW*.88,topY*.96,-D*.5,  topW*.88,topY*.96,-D*.5, 40, 0.038)
  for (let lv=1; lv<=2; lv++) {
    const t=lv/3, y=topY-H*t, wl=(topW+(botW-topW)*t)*.80, zl=D*.5*(1-t)
    _addLine(pts, -wl,y,zl, wl,y,zl, Math.ceil(wl*11), 0.030)
  }
  for (let k=0; k<38; k++) {
    const t=Math.random(), y=topY-H*t, wl=(topW+(botW-topW)*t)*.68, zl=D*.5*(1-t)
    pts.push((Math.random()-.5)*wl*2, y, (Math.random()-.5)*zl*2+zl*.5)
  }
  return _padToBig(pts, N_ORB)
}

const CARD_GENERATORS = [
  _genBrowserFrame, _genCommandCube, _genAppStack, _genWorkflowPath,
  _genIntelligenceOrbit, _genConnectedCubes, _genFunnel,
]

const TRAIL_LEN = 24
const TRAIL_LIFETIME = 1.0

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
  uniform vec3 uCursorWorld;
  uniform float uCursorActive;
  uniform float uMorph;
  uniform float uMorphCard;
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aPosTarget;
  varying float vGlow;
  varying float vCardBlend;

  void main() {
    /* Phase 1: collapse sphere toward centre (uMorph 0→0.5) */
    vec3 collapsedPos = position * (1.0 - uMorph);
    /* Phase 2: rearrange from collapsed position to card shape (uMorphCard 0→1) */
    vec3 basePos = mix(collapsedPos, aPosTarget, uMorphCard);

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
    vGlow = clamp(g + tw * 0.5, 0.0, 1.6) * cursorOff;
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
    gl_PointSize = aSize * 2.0 * (1.0 + vGlow * 6.6) * (uScale / -mv.z);
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

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    if (tex.a < 0.01) discard;
    vec3 sphereCol = mix(uColorBase, uColorHot, vGlow);
    vec3 col = mix(sphereCol, uColorCard, vCardBlend);
    float opMult = mix(mix(0.8, 1.0, uMorph), 1.0, vCardBlend);
    float a = tex.a * uOpacity * opMult * (1.0 + vGlow * 1.4);
    gl_FragColor = vec4(col * (1.0 + vGlow * 1.0), a);
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
    const p = new Float32Array(sphPts)
    const s = new Float32Array(count)
    const sd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      s[i] = 0.013 + Math.random() * 0.005
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

  // Pre-generate all 7 card shapes (tiled to N_ORB); posTarget is the live GPU buffer
  const cardBufs  = useMemo(() => CARD_GENERATORS.map(g => g()), [])
  const posTarget = useMemo(() => new Float32Array(cardBufs[0]), [cardBufs])

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
      uMap:           { value: tex },
      uColorBase:     { value: new THREE.Color('#82c8f0') },
      uColorHot:      { value: new THREE.Color('#58b8f8') },
      uColorCard:     { value: new THREE.Color(CARD_COLORS[0]) },
      uOpacity:       { value: 1.0 },
      uCursorWorld:   { value: new THREE.Vector3() },
      uCursorActive:  { value: 0.0 },
      uMorph:         { value: 0.0 },
      uMorphCard:     { value: 0.0 },
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
    // Starts at p=0.38 (slight overlap with collapse for seamless hand-off)
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
      if (targetAttrRef.current) targetAttrRef.current.needsUpdate = true
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
        if (targetAttrRef.current) targetAttrRef.current.needsUpdate = true
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

    // Always fully opaque — the transform is purely positional, never fades
    material.uniforms.uMorph.value     = collapseT
    material.uniforms.uMorphCard.value = usedCardMorph
    material.uniforms.uOpacity.value   = MAX_CARD_OP
    material.uniforms.uTime.value      = clock.getElapsedTime()
    material.uniforms.uScale.value     = size.height / 2
    material.uniforms.uRadius.value    = 0.58 * scale

    for (let i = 0; i < TRAIL_LEN; i++) {
      trail[i].w = Math.min(trail[i].w + delta, TRAIL_LIFETIME + 1)
    }

    // Cursor interaction only while the orbs are in sphere mode
    raycaster.setFromCamera(ndc, camera)
    let hasHit = false
    if (groupRef?.current && p < 0.62) {
      invMat.copy(groupRef.current.matrixWorld).invert()
      localRay.copy(raycaster.ray).applyMatrix4(invMat)
      localSphere.radius = R * Math.max(0.05, 1.0 - collapseT)
      if (localRay.intersectSphere(localSphere, localHit)) {
        hit.copy(localHit).applyMatrix4(groupRef.current.matrixWorld)
        hasHit = true
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
  const matRef = useRef()
  useFrame(({ clock }) => {
    if (!matRef.current) return
    const fade = Math.max(0, 1 - scrollState.progress / 0.4)
    matRef.current.opacity = (0.12 + 0.32 * (0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 0.9))) * fade
  })
  return (
    <points renderOrder={9}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={0.022} map={tex} color="#c0f4ff" sizeAttenuation
        transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false}
        depthTest={false} alphaTest={0.01} />
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
    if (matRef.current) {
      const fade = Math.max(0, 1 - scrollState.progress / 0.35)
      matRef.current.opacity = 0.96 * fade
    }
    if (!stateRef.current || !geomRef.current) return
    const pos = posBuffer.current
    stateRef.current.forEach((p, i) => {
      p.t += p.speed * delta
      if (p.t >= 1.0) {
        p.t -= 1.0
        if (Math.random() < 0.20) p.arcIdx = Math.floor(Math.random() * FLOW_ARCS.length)
      }
      const arc = FLOW_ARCS[p.arcIdx]
      if (!arc || arc.length === 0) return
      const idx = Math.min(Math.floor(p.t * (arc.length - 1)), arc.length - 1)
      const pt = arc[idx]
      pos[i * 3] = pt[0]; pos[i * 3 + 1] = pt[1]; pos[i * 3 + 2] = pt[2]
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
    const fade = Math.max(0, 1 - scrollState.progress / 0.33)
    if (meshRef.current) meshRef.current.scale.setScalar(fade)
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

export default function HeroOrb() {
  const { gl, camera } = useThree()
  const groupRef = useRef()
  const isDragging = useRef(false)
  const snappingBack = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const dragRaycaster = useMemo(() => new THREE.Raycaster(), [])
  const dragLocalSphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(0, 0, 0), R * 1.05), [])
  const dragLocalRay = useMemo(() => new THREE.Ray(), [])
  const dragInvMat = useMemo(() => new THREE.Matrix4(), [])
  const tmpNdc = useMemo(() => new THREE.Vector2(), [])

  const [showHeavy, setShowHeavy] = useState(true)
  const heavyRef = useRef(true)

  useEffect(() => {
    const onScroll = () => {
      const max = window.innerHeight
      scrollState.progress = Math.min(1, Math.max(0, window.scrollY / max))
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
    return () => window.removeEventListener('scroll', onScroll)
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

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const p = scrollState.progress
    const targetX = ORB_X + (END_X - ORB_X) * p
    const targetY = ORB_Y + (0 - ORB_Y) * p
    const targetScale = 1.0 + (END_SCALE - 1.0) * p
    const lerpAmt = Math.min(1, delta * 8)
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * lerpAmt
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * lerpAmt
    const curS = groupRef.current.scale.x
    const newS = curS + (targetScale - curS) * lerpAmt
    groupRef.current.scale.setScalar(newS)

    if (isDragging.current) return
    groupRef.current.rotation.y += delta * 0.044
    if (snappingBack.current) {
      const rot = groupRef.current.rotation
      rot.x += (0 - rot.x) * Math.min(1, delta * 3.5)
      rot.z += (0 - rot.z) * Math.min(1, delta * 3.5)
      if (Math.abs(rot.x) < 0.001 && Math.abs(rot.z) < 0.001) {
        rot.x = 0; rot.z = 0
        snappingBack.current = false
      }
    }
  })

  return (
    <group ref={groupRef} position={[ORB_X, ORB_Y, 0]}>
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
