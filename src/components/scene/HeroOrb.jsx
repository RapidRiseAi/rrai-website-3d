import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildSoccerBall, greatCircleArc, circleOnSphere, fibonacciSphere,
} from '../../utils/soccerBall'
import { createIconTexture, getGlowDotTexture } from '../../utils/iconTextures'

const R = 2.0

const { vertices, edges, pentagonCenters, hexCenters } = buildSoccerBall()

// Per-pentagon: 5 nearest vertices (pentagon corners)
const pentNeighborVerts = pentagonCenters.map(pc =>
  vertices
    .map((v, i) => ({ i, d: pc.distanceTo(v) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map(x => x.i)
)

// ── Select 8 maximally-spread icon positions from 12 pentagon centers ─────────
// Greedy max-min algorithm: each step picks the candidate farthest from the
// already-selected set, ensuring even distribution across the sphere.
const ICON_INDICES = (() => {
  const sel = [0]
  while (sel.length < 8) {
    let best = -1, bestD = -1
    for (let i = 0; i < pentagonCenters.length; i++) {
      if (sel.includes(i)) continue
      let minD = Infinity
      for (const j of sel) minD = Math.min(minD, pentagonCenters[i].distanceTo(pentagonCenters[j]))
      if (minD > bestD) { bestD = minD; best = i }
    }
    sel.push(best)
  }
  return sel
})()
const ICON_CENTERS = ICON_INDICES.map(i => pentagonCenters[i])

// ── Arc sampling ──────────────────────────────────────────────────────────────
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

// ── Pre-compute all geometry at module level ──────────────────────────────────

// Soccer-ball edges (90 edges of the truncated icosahedron) — the primary grid
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

// Wider glow pass for the same edges (slightly offset radius)
const SOCCER_EDGE_GLOW = (() => {
  const pts = []
  edges.forEach(([i, j]) => {
    const arc = greatCircleArc(vertices[i], vertices[j], R * 1.004, 16)
    sampleArc(arc, 0.10).forEach(p => pts.push(p[0], p[1], p[2]))
  })
  return new Float32Array(pts)
})()

// Spokes: each of the 8 icons to its 5 pentagon corner vertices
const SPOKE_POSITIONS = (() => {
  const pts = []
  ICON_INDICES.forEach(pi => {
    pentNeighborVerts[pi].forEach(vi => {
      const arc = greatCircleArc(pentagonCenters[pi], vertices[vi], R * 1.002, 18)
      FLOW_ARCS.push(arc)
      sampleArc(arc, 0.028).forEach(p => pts.push(p[0], p[1], p[2]))
    })
  })
  return new Float32Array(pts)
})()

// Mini glowing orbs scattered across the sphere surface between grid lines
const BETWEEN_POSITIONS = (() => {
  const count = 700
  const out = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const rad = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i * 2.618 // offset from other fibonacci distributions
    const r = R * (0.999 + Math.random() * 0.006)
    out[i * 3]     = Math.cos(theta) * rad * r
    out[i * 3 + 1] = y * r
    out[i * 3 + 2] = Math.sin(theta) * rad * r
  }
  return out
})()

// ── Invisible depth occluder: writes depth only, no color ────────────────────
function DepthOccluder() {
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ side: THREE.FrontSide })
    m.colorWrite = false
    return m
  }, [])
  return (
    <mesh renderOrder={-5}>
      <sphereGeometry args={[R * 0.992, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ── Reusable particle cloud ───────────────────────────────────────────────────
function Particles({ positions, size, color, opacity, renderOrder = 4 }) {
  const tex = getGlowDotTexture()
  const count = positions.length / 3
  return (
    <points renderOrder={renderOrder}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={size} map={tex} color={color} sizeAttenuation transparent
        opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false}
        alphaTest={0.01} />
    </points>
  )
}

// ── SOCCER BALL GRID ──────────────────────────────────────────────────────────
// 90 edges of the truncated icosahedron drawn as particle streams.
// Pentagon faces (12) and hex faces (20) stay clear — icons live inside them.
function SoccerGridParticles() {
  return (
    <>
      {/* Core edge particles */}
      <Particles positions={SOCCER_EDGE_POSITIONS} size={0.055} color="#58b8f8" opacity={0.88} renderOrder={4} />
      {/* Soft glow halo around each edge */}
      <Particles positions={SOCCER_EDGE_GLOW}      size={0.130} color="#1858c0" opacity={0.38} renderOrder={3} />
    </>
  )
}

// ── Spokes wiring icons into the grid ────────────────────────────────────────
function SpokeParticles() {
  return (
    <>
      <Particles positions={SPOKE_POSITIONS} size={0.070} color="#a0eeff" opacity={0.95} renderOrder={6} />
    </>
  )
}

// ── Mini glowing orbs between grid lines ─────────────────────────────────────
function BetweenLineParticles() {
  return (
    <Particles positions={BETWEEN_POSITIONS} size={0.040} color="#5090d8" opacity={0.75} renderOrder={2} />
  )
}

// ── Volume depth particles ────────────────────────────────────────────────────
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
  return <Particles positions={arr} size={0.014} color="#183060" opacity={0.45} renderOrder={1} />
}

// ── Junction dots at every grid vertex and face center ───────────────────────
function JunctionDots() {
  const { vertexArr, hexArr, pentArr } = useMemo(() => {
    const vArr = new Float32Array(vertices.length * 3)
    vertices.forEach((v, i) => { vArr[i*3]=v.x*R; vArr[i*3+1]=v.y*R; vArr[i*3+2]=v.z*R })
    const hArr = new Float32Array(hexCenters.length * 3)
    hexCenters.forEach((h, i) => { hArr[i*3]=h.x*R*1.001; hArr[i*3+1]=h.y*R*1.001; hArr[i*3+2]=h.z*R*1.001 })
    // Pentagon dots only for the 8 icon hubs (others are just non-icon grid nodes)
    const pArr = new Float32Array(ICON_CENTERS.length * 3)
    ICON_CENTERS.forEach((p, i) => { pArr[i*3]=p.x*R*1.002; pArr[i*3+1]=p.y*R*1.002; pArr[i*3+2]=p.z*R*1.002 })
    return { vertexArr: vArr, hexArr: hArr, pentArr: pArr }
  }, [])
  return (
    <>
      <Particles positions={vertexArr} size={0.18}  color="#d8f0ff" opacity={0.92} renderOrder={7} />
      <Particles positions={hexArr}    size={0.10}  color="#90d0ff" opacity={0.78} renderOrder={6} />
      <Particles positions={pentArr}   size={0.32}  color="#ffffff" opacity={0.95} renderOrder={9} />
    </>
  )
}

// ── Node halo rings — 8 icons only ───────────────────────────────────────────
function NodeHaloRings() {
  const { inner, outer } = useMemo(() => {
    const iPts = [], oPts = []
    ICON_CENTERS.forEach(c => {
      circleOnSphere(c, 0.155, R * 1.003, 96).forEach(p => iPts.push(p[0], p[1], p[2]))
      circleOnSphere(c, 0.245, R * 1.004, 128).forEach(p => oPts.push(p[0], p[1], p[2]))
    })
    return { inner: new Float32Array(iPts), outer: new Float32Array(oPts) }
  }, [])
  return (
    <>
      <Particles positions={inner} size={0.040} color="#a8e8ff" opacity={0.88} renderOrder={8} />
      <Particles positions={outer} size={0.026} color="#68c4f8" opacity={0.60} renderOrder={7} />
    </>
  )
}

// ── Dense animated hub clusters — 8 icons only ───────────────────────────────
function NodeClusterParticles() {
  const tex = getGlowDotTexture()
  const { positions, count } = useMemo(() => {
    const perNode = 54
    const pts = []
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
        pts.push(pt.x, pt.y, pt.z)
      }
    })
    return { positions: new Float32Array(pts), count: pts.length / 3 }
  }, [])

  const matRef = useRef()
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.55 + 0.22 * Math.sin(clock.getElapsedTime() * 1.35)
  })

  return (
    <points renderOrder={8}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={0.032} map={tex} color="#9cd8ff" sizeAttenuation
        transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false}
        depthTest={false} alphaTest={0.01} />
    </points>
  )
}

// ── Pulsating breathing rings — 8 icons only ─────────────────────────────────
function PulsatingRings() {
  const tex = getGlowDotTexture()
  const { positions, count, phases } = useMemo(() => {
    const pts = []
    const phs = ICON_CENTERS.map((_, i) => (i / ICON_CENTERS.length) * Math.PI * 2)
    ICON_CENTERS.forEach(c => {
      circleOnSphere(c, 0.195, R * 1.006, 80).forEach(p => pts.push(p[0], p[1], p[2]))
    })
    return { positions: new Float32Array(pts), count: pts.length / 3, phases: phs }
  }, [])

  // Each icon's ring pulses at a different phase for organic feel
  const refs = useRef([])
  const allPts = useMemo(() => {
    const out = []
    ICON_CENTERS.forEach(c => out.push(circleOnSphere(c, 0.195, R * 1.006, 80)))
    return out
  }, [])

  const matRef = useRef()
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = 0.12 + 0.32 * (0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 0.9))
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

// ── Animated flow particles traveling through the network ─────────────────────
const NUM_FLOW = 300

function FlowParticles() {
  const posBuffer = useRef(new Float32Array(NUM_FLOW * 3))
  const geomRef = useRef()
  const stateRef = useRef(null)

  if (!stateRef.current && FLOW_ARCS.length > 0) {
    stateRef.current = Array.from({ length: NUM_FLOW }, () => ({
      arcIdx: Math.floor(Math.random() * FLOW_ARCS.length),
      t: Math.random(),
      speed: 0.055 + Math.random() * 0.130,
    }))
  }

  const tex = getGlowDotTexture()

  useFrame((_, delta) => {
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
      <pointsMaterial size={0.16} map={tex} color="#ffffff" sizeAttenuation transparent
        opacity={0.96} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false}
        alphaTest={0.01} />
    </points>
  )
}

// ── Icon planes — placed at the 8 evenly distributed pentagon centers ─────────
// Icons live in the center of pentagon faces: no grid edge passes through them.
function IconPlane({ center, texIndex }) {
  const tex = useMemo(() => createIconTexture(texIndex), [texIndex])
  const position = useMemo(() => center.clone().multiplyScalar(R * 1.006), [center])
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), center.clone().normalize())
    return q
  }, [center])
  return (
    <mesh position={position.toArray()} quaternion={quaternion.toArray()} renderOrder={8}>
      <planeGeometry args={[0.78, 0.78]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.01}
        depthTest={true} depthWrite={false} side={THREE.FrontSide}
        blending={THREE.NormalBlending} />
    </mesh>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HeroOrb() {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.044
  })

  return (
    <group ref={groupRef}>
      {/* Depth occluder — hides back-face icons, no color output */}
      <DepthOccluder />

      {/* Sparse interior volume particles */}
      <VolumeField />

      {/* Mini glowing orbs floating between grid lines */}
      <BetweenLineParticles />

      {/* SOCCER BALL GRID — 90 truncated-icosahedron edges as particle streams */}
      <SoccerGridParticles />

      {/* Spokes wiring each icon into its 5 surrounding vertices */}
      <SpokeParticles />

      {/* Junction dots: 60 vertices + 20 hex centers + 8 icon hubs */}
      <JunctionDots />

      {/* Icon halos — only around the 8 selected icon positions */}
      <NodeHaloRings />

      {/* Animated hub particle clusters */}
      <NodeClusterParticles />

      {/* Live flow particles traveling the network */}
      <FlowParticles />

      {/* 8 icon planes — inside pentagon faces, no grid edge overlap */}
      {ICON_CENTERS.map((c, i) => (
        <IconPlane key={i} center={c} texIndex={i} />
      ))}

      {/* Animated breathing rings */}
      <PulsatingRings />
    </group>
  )
}
