import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
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

// ── Antipodal pentagon pairs: every pentagon has an exact opposite ────────────
const ANTIPODAL_PAIRS = (() => {
  const pairs = []
  const used = new Set()
  for (let i = 0; i < pentagonCenters.length; i++) {
    if (used.has(i)) continue
    for (let j = i + 1; j < pentagonCenters.length; j++) {
      if (used.has(j)) continue
      if (pentagonCenters[i].clone().add(pentagonCenters[j]).length() < 0.01) {
        pairs.push([i, j])
        used.add(i); used.add(j)
        break
      }
    }
  }
  return pairs
})()

// Pick 4 antipodal pairs (8 icons) using greedy max-min for best spread
const ICON_INDICES = (() => {
  const selPairs = [0]
  while (selPairs.length < 4) {
    let best = -1, bestMinD = -1
    for (let pi = 0; pi < ANTIPODAL_PAIRS.length; pi++) {
      if (selPairs.includes(pi)) continue
      const [pa, pb] = ANTIPODAL_PAIRS[pi]
      let minD = Infinity
      for (const sp of selPairs) {
        const [a, b] = ANTIPODAL_PAIRS[sp]
        minD = Math.min(minD,
          pentagonCenters[pa].distanceTo(pentagonCenters[a]),
          pentagonCenters[pa].distanceTo(pentagonCenters[b]),
          pentagonCenters[pb].distanceTo(pentagonCenters[a]),
          pentagonCenters[pb].distanceTo(pentagonCenters[b]),
        )
      }
      if (minD > bestMinD) { bestMinD = minD; best = pi }
    }
    selPairs.push(best)
  }
  return selPairs.flatMap(pi => ANTIPODAL_PAIRS[pi])
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

// ── Soccer-ball edge positions (the primary grid) ─────────────────────────────
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

// Spokes from each of the 8 icons to its 5 pentagon corner vertices
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

// ── INTERACTIVE MINI ORB SHADER ───────────────────────────────────────────────
// Per-particle world position is compared to cursor hit point.
// Particles within uRadius brighten and grow. Subtle time-based twinkle.
const MINI_VERT = `
  uniform vec3 uMouse;
  uniform float uTime;
  uniform float uRadius;
  uniform float uScale;
  attribute float aSize;
  attribute float aSeed;
  varying float vGlow;

  void main() {
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    float d = distance(worldPos, uMouse);
    float g = 1.0 - smoothstep(0.0, uRadius, d);
    g = pow(g, 1.5);

    // Independent twinkle per particle (seed-driven)
    float tw = 0.22 * sin(uTime * 1.6 + aSeed * 12.566);
    vGlow = clamp(g + tw * 0.5, 0.0, 1.6);

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (1.0 + vGlow * 2.8) * (uScale / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const MINI_FRAG = `
  uniform sampler2D uMap;
  uniform vec3 uColorBase;
  uniform vec3 uColorHot;
  uniform float uOpacity;
  varying float vGlow;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    if (tex.a < 0.01) discard;
    vec3 col = mix(uColorBase, uColorHot, vGlow);
    float a = tex.a * uOpacity * (0.80 + vGlow * 1.6);
    gl_FragColor = vec4(col * (1.0 + vGlow * 0.9), a);
  }
`

function InteractiveMiniOrbs() {
  const tex = getGlowDotTexture()
  const { camera, size, pointer } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(), R), [])
  const hit = useMemo(() => new THREE.Vector3(), [])

  const { positions, sizes, seeds } = useMemo(() => {
    const count = 2400
    const p = new Float32Array(count * 3)
    const s = new Float32Array(count)
    const sd = new Float32Array(count)
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const rad = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i * 2.618
      const r = R * (0.998 + Math.random() * 0.010)
      p[i * 3]     = Math.cos(theta) * rad * r
      p[i * 3 + 1] = y * r
      p[i * 3 + 2] = Math.sin(theta) * rad * r
      // Mixed sizes: most small, some larger for variety
      s[i] = Math.random() < 0.25
        ? 0.055 + Math.random() * 0.030
        : 0.022 + Math.random() * 0.022
      sd[i] = Math.random()
    }
    return { positions: p, sizes: s, seeds: sd }
  }, [])

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uMouse:     { value: new THREE.Vector3(1000, 1000, 1000) },
      uTime:      { value: 0 },
      uRadius:    { value: 1.4 },
      uScale:     { value: size.height / 2 },
      uMap:       { value: tex },
      uColorBase: { value: new THREE.Color('#4090d8') },
      uColorHot:  { value: new THREE.Color('#ffffff') },
      uOpacity:   { value: 0.95 },
    },
    vertexShader: MINI_VERT,
    fragmentShader: MINI_FRAG,
  }), [tex, size.height])

  useFrame(({ clock }) => {
    ray.setFromCamera(pointer, camera)
    const intersected = ray.ray.intersectSphere(sphere, hit)
    if (intersected) {
      material.uniforms.uMouse.value.copy(hit)
    } else {
      material.uniforms.uMouse.value.set(1000, 1000, 1000)
    }
    material.uniforms.uTime.value = clock.getElapsedTime()
    material.uniforms.uScale.value = size.height / 2
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
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

// ── Invisible depth occluder ──────────────────────────────────────────────────
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

// ── Soccer ball grid ─────────────────────────────────────────────────────────
function SoccerGridParticles() {
  return (
    <>
      <Particles positions={SOCCER_EDGE_POSITIONS} size={0.055} color="#58b8f8" opacity={0.88} renderOrder={4} />
      <Particles positions={SOCCER_EDGE_GLOW}      size={0.130} color="#1858c0" opacity={0.38} renderOrder={3} />
    </>
  )
}

function SpokeParticles() {
  return <Particles positions={SPOKE_POSITIONS} size={0.070} color="#a0eeff" opacity={0.95} renderOrder={6} />
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

// ── Junction dots: vertices + hex centers + 8 icon hubs ──────────────────────
function JunctionDots() {
  const { vertexArr, hexArr, pentArr } = useMemo(() => {
    const vArr = new Float32Array(vertices.length * 3)
    vertices.forEach((v, i) => { vArr[i*3]=v.x*R; vArr[i*3+1]=v.y*R; vArr[i*3+2]=v.z*R })
    const hArr = new Float32Array(hexCenters.length * 3)
    hexCenters.forEach((h, i) => { hArr[i*3]=h.x*R*1.001; hArr[i*3+1]=h.y*R*1.001; hArr[i*3+2]=h.z*R*1.001 })
    const pArr = new Float32Array(ICON_CENTERS.length * 3)
    ICON_CENTERS.forEach((p, i) => { pArr[i*3]=p.x*R*1.002; pArr[i*3+1]=p.y*R*1.002; pArr[i*3+2]=p.z*R*1.002 })
    return { vertexArr: vArr, hexArr: hArr, pentArr: pArr }
  }, [])
  return (
    <>
      <Particles positions={vertexArr} size={0.18} color="#d8f0ff" opacity={0.92} renderOrder={7} />
      <Particles positions={hexArr}    size={0.10} color="#90d0ff" opacity={0.78} renderOrder={6} />
      <Particles positions={pentArr}   size={0.32} color="#ffffff" opacity={0.95} renderOrder={9} />
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

// ── 4 cardinal connection dots on each icon's outer halo ─────────────────────
function IconCardinalDots() {
  const positions = useMemo(() => {
    const alpha = 0.245
    const r = R * 1.005
    const pts = []
    ICON_CENTERS.forEach(c => {
      const norm = c.clone().normalize()
      const ref = Math.abs(norm.y) > 0.85 ? new THREE.Vector3(1,0,0) : new THREE.Vector3(0,1,0)
      const e1 = new THREE.Vector3().crossVectors(norm, ref).normalize()
      const e2 = new THREE.Vector3().crossVectors(e1, norm).normalize()
      for (let k = 0; k < 4; k++) {
        const phi = k * Math.PI / 2
        const pt = norm.clone()
          .multiplyScalar(Math.cos(alpha))
          .addScaledVector(e1, Math.sin(alpha) * Math.cos(phi))
          .addScaledVector(e2, Math.sin(alpha) * Math.sin(phi))
          .normalize()
          .multiplyScalar(r)
        pts.push(pt.x, pt.y, pt.z)
      }
    })
    return new Float32Array(pts)
  }, [])
  return <Particles positions={positions} size={0.20} color="#ffffff" opacity={0.95} renderOrder={9} />
}

// ── Dense animated hub clusters ──────────────────────────────────────────────
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

// ── Pulsating breathing rings ────────────────────────────────────────────────
function PulsatingRings() {
  const tex = getGlowDotTexture()
  const { positions, count } = useMemo(() => {
    const pts = []
    ICON_CENTERS.forEach(c => {
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

// ── Animated flow particles ───────────────────────────────────────────────────
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

// ── Icon planes ──────────────────────────────────────────────────────────────
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
      <DepthOccluder />

      <VolumeField />

      {/* Interactive mini orbs — react to cursor position */}
      <InteractiveMiniOrbs />

      {/* Soccer ball grid */}
      <SoccerGridParticles />

      {/* Spokes — wiring each icon into its 5 vertices */}
      <SpokeParticles />

      {/* Junction dots */}
      <JunctionDots />

      {/* Icon halos */}
      <NodeHaloRings />

      {/* 4 cardinal junction dots on each icon halo */}
      <IconCardinalDots />

      {/* Hub clusters */}
      <NodeClusterParticles />

      {/* Animated flow */}
      <FlowParticles />

      {/* 8 icons at 4 antipodal pentagon pairs */}
      {ICON_CENTERS.map((c, i) => (
        <IconPlane key={i} center={c} texIndex={i} />
      ))}

      {/* Breathing rings */}
      <PulsatingRings />
    </group>
  )
}
