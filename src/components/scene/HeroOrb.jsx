import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildSoccerBall, greatCircleArc, circleOnSphere, fibonacciSphere,
} from '../../utils/soccerBall'
import { createIconTexture, getGlowDotTexture } from '../../utils/iconTextures'

const R = 2.0

const { vertices, edges, pentagonCenters, hexCenters } = buildSoccerBall()

const pentNeighborVerts = pentagonCenters.map(pc =>
  vertices
    .map((v, i) => ({ i, d: pc.distanceTo(v) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map(x => x.i)
)

// ── Arc sampling: place particles at regular spatial intervals ────────────────
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

const yAxis = new THREE.Vector3(0, 1, 0)
const north = new THREE.Vector3(0, 1, 0)
const south = new THREE.Vector3(0, -1, 0)

// ── Pre-compute all arc paths at module level ─────────────────────────────────

// Latitude ring particle positions (8 rings)
const LAT_POSITIONS = (() => {
  const pts = []
  const alphas = [0.36, 0.68, 0.98, 1.28, Math.PI - 0.98, Math.PI - 0.68, Math.PI - 0.36, Math.PI * 0.5]
  alphas.forEach(alpha => {
    const ring = circleOnSphere(yAxis, alpha, R * 1.001, 220)
    sampleArc(ring, 0.040).forEach(p => pts.push(p[0], p[1], p[2]))
  })
  return new Float32Array(pts)
})()

// Meridian particle positions (12 meridians)
const MERIDIAN_POSITIONS = (() => {
  const pts = []
  for (let i = 0; i < 12; i++) {
    const phi = (i / 12) * Math.PI * 2
    const eq = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi))
    const arc1 = greatCircleArc(north, eq, R * 1.001, 48)
    const arc2 = greatCircleArc(eq, south, R * 1.001, 48)
    sampleArc([...arc1, ...arc2.slice(1)], 0.048).forEach(p => pts.push(p[0], p[1], p[2]))
  }
  return new Float32Array(pts)
})()

// Adjacent pentagon connection paths + stored for flow animation
const FLOW_ARCS = []
const CONNECTION_POSITIONS = (() => {
  const pts = []
  let minD = Infinity
  for (let i = 0; i < pentagonCenters.length; i++)
    for (let j = i + 1; j < pentagonCenters.length; j++) {
      const d = pentagonCenters[i].distanceTo(pentagonCenters[j])
      if (d < minD) minD = d
    }
  for (let i = 0; i < pentagonCenters.length; i++) {
    for (let j = i + 1; j < pentagonCenters.length; j++) {
      if (pentagonCenters[i].distanceTo(pentagonCenters[j]) < minD * 1.08) {
        const arc = greatCircleArc(pentagonCenters[i], pentagonCenters[j], R * 1.003, 40)
        FLOW_ARCS.push(arc)
        sampleArc(arc, 0.038).forEach(p => pts.push(p[0], p[1], p[2]))
      }
    }
  }
  return new Float32Array(pts)
})()

// Spoke paths from icon centers to corner vertices
const SPOKE_POSITIONS = (() => {
  const pts = []
  pentagonCenters.forEach((pc, pi) => {
    pentNeighborVerts[pi].forEach(vi => {
      const arc = greatCircleArc(pc, vertices[vi], R * 1.002, 18)
      FLOW_ARCS.push(arc)
      sampleArc(arc, 0.028).forEach(p => pts.push(p[0], p[1], p[2]))
    })
  })
  return new Float32Array(pts)
})()

// ── Invisible depth occluder so back-face icons are hidden ────────────────────
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

// ── Reusable particle point cloud ─────────────────────────────────────────────
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

// ── GRID: particle streams along arcs (no line geometry) ──────────────────────

function LatGridParticles() {
  // Faint second glow pass for richness
  const glow = useMemo(() => {
    const pts = []
    const alphas = [0.36, 0.68, 0.98, 1.28, Math.PI - 0.98, Math.PI - 0.68, Math.PI - 0.36, Math.PI * 0.5]
    alphas.forEach(alpha => {
      const ring = circleOnSphere(yAxis, alpha, R * 1.004, 120)
      sampleArc(ring, 0.10).forEach(p => pts.push(p[0], p[1], p[2]))
    })
    return new Float32Array(pts)
  }, [])
  return (
    <>
      <Particles positions={LAT_POSITIONS} size={0.055} color="#58b8f8" opacity={0.85} renderOrder={4} />
      <Particles positions={glow}          size={0.12}  color="#1a5ab8" opacity={0.45} renderOrder={3} />
    </>
  )
}

function MeridianGridParticles() {
  const glow = useMemo(() => {
    const pts = []
    for (let i = 0; i < 12; i++) {
      const phi = (i / 12) * Math.PI * 2
      const eq = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi))
      const arc1 = greatCircleArc(north, eq, R * 1.004, 32)
      const arc2 = greatCircleArc(eq, south, R * 1.004, 32)
      sampleArc([...arc1, ...arc2.slice(1)], 0.12).forEach(p => pts.push(p[0], p[1], p[2]))
    }
    return new Float32Array(pts)
  }, [])
  return (
    <>
      <Particles positions={MERIDIAN_POSITIONS} size={0.048} color="#4aa8e8" opacity={0.78} renderOrder={4} />
      <Particles positions={glow}               size={0.11}  color="#1848a8" opacity={0.38} renderOrder={3} />
    </>
  )
}

function ConnectionParticles() {
  const glow = useMemo(() => {
    const pts = []
    FLOW_ARCS.slice(0, CONNECTION_POSITIONS.length > 0 ? 30 : 0).forEach(arc => {
      sampleArc(arc, 0.10).forEach(p => pts.push(p[0], p[1], p[2]))
    })
    return new Float32Array(pts)
  }, [])
  return (
    <>
      <Particles positions={CONNECTION_POSITIONS} size={0.068} color="#80e4ff" opacity={0.92} renderOrder={5} />
      <Particles positions={glow}                 size={0.15}  color="#2870e0" opacity={0.42} renderOrder={4} />
    </>
  )
}

function SpokeParticles() {
  return <Particles positions={SPOKE_POSITIONS} size={0.075} color="#b0f0ff" opacity={0.96} renderOrder={6} />
}

function VolumeField() {
  const arr = useMemo(() => {
    const count = 360
    const out = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = (0.12 + Math.random() * 0.80) * R
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      out[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      out[i * 3 + 1] = r * Math.cos(phi)
      out[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return out
  }, [])
  return <Particles positions={arr} size={0.014} color="#183060" opacity={0.48} renderOrder={1} />
}

// ── Junction dots: bright nodes at grid intersections ────────────────────────
function JunctionDots() {
  const { vertexArr, hexArr, pentArr } = useMemo(() => {
    const vArr = new Float32Array(vertices.length * 3)
    vertices.forEach((v, i) => { vArr[i*3]=v.x*R; vArr[i*3+1]=v.y*R; vArr[i*3+2]=v.z*R })
    const hArr = new Float32Array(hexCenters.length * 3)
    hexCenters.forEach((h, i) => { hArr[i*3]=h.x*R*1.001; hArr[i*3+1]=h.y*R*1.001; hArr[i*3+2]=h.z*R*1.001 })
    const pArr = new Float32Array(pentagonCenters.length * 3)
    pentagonCenters.forEach((p, i) => { pArr[i*3]=p.x*R*1.002; pArr[i*3+1]=p.y*R*1.002; pArr[i*3+2]=p.z*R*1.002 })
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

// ── Node halos — dense dotted rings, embedded feel ────────────────────────────
function NodeHaloRings() {
  const { inner, outer } = useMemo(() => {
    const iPts = [], oPts = []
    pentagonCenters.forEach(c => {
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

// ── Dense hub clusters around each icon (animated) ───────────────────────────
function NodeClusterParticles() {
  const tex = getGlowDotTexture()
  const { positions, count } = useMemo(() => {
    const perNode = 54
    const pts = []
    pentagonCenters.forEach(pc => {
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

// ── Pulsating breathing rings around icon hubs ────────────────────────────────
function PulsatingRings() {
  const tex = getGlowDotTexture()
  const { positions, count } = useMemo(() => {
    const pts = []
    pentagonCenters.forEach(c => {
      circleOnSphere(c, 0.195, R * 1.006, 80).forEach(p => pts.push(p[0], p[1], p[2]))
    })
    return { positions: new Float32Array(pts), count: pts.length / 3 }
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
const NUM_FLOW = 280

function FlowParticles() {
  const posBuffer = useRef(new Float32Array(NUM_FLOW * 3))
  const geomRef = useRef()
  const stateRef = useRef(null)

  // Initialize lazily (FLOW_ARCS populated at module parse time)
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

// ── Icon planes ───────────────────────────────────────────────────────────────
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
      {/* Depth-only occluder — hides back-face icons, adds no tint */}
      <DepthOccluder />

      {/* Sparse interior depth particles (no surface, just volume) */}
      <VolumeField />

      {/* GRID — ALL particles, no line geometry */}
      <LatGridParticles />
      <MeridianGridParticles />
      <ConnectionParticles />
      <SpokeParticles />

      {/* Junction dots at intersections */}
      <JunctionDots />

      {/* Icon halo rings (dense dotted, embedded feel) */}
      <NodeHaloRings />

      {/* Dense particle clouds around each service hub */}
      <NodeClusterParticles />

      {/* Live data flow — particles traveling through the network */}
      <FlowParticles />

      {/* Icon planes (back-side occluded by DepthOccluder) */}
      {pentagonCenters.map((c, i) => (
        <IconPlane key={i} center={c} texIndex={i} />
      ))}

      {/* Animated breathing rings around hubs */}
      <PulsatingRings />
    </group>
  )
}
