import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildSoccerBall, greatCircleArc, circleOnSphere,
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

// ── Antipodal pentagon pairs ──────────────────────────────────────────────────
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

// Pick 4 antipodal pairs (8 icons) via greedy max-min spread
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

// Inner halo ring — angular radius just outside the icon plate (plate ≈ 0.139 rad)
const ICON_HALO_INNER = 0.150

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

// Spokes: inner halo ring edge → actual pentagon vertices (5 per icon).
// Start point sits on the inner halo circle in the direction of each vertex,
// so every spoke visually radiates outward from the icon plate edge to the real grid.
const CARDINAL_SPOKE_POSITIONS = (() => {
  const pts = []
  ICON_CENTERS.forEach((c, idx) => {
    const norm = c.clone().normalize()
    const nearVerts = pentNeighborVerts[idx].map(vi => vertices[vi])

    nearVerts.forEach(v => {
      // Tangent-plane direction from icon center toward this vertex
      const tangent = v.clone().sub(norm.clone().multiplyScalar(v.dot(norm)))
      if (tangent.length() < 1e-6) return
      tangent.normalize()

      // Start: point on inner halo ring in direction of this vertex
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

// ── INTERACTIVE MINI ORB SHADER ───────────────────────────────────────────────
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

    float tw = 0.22 * sin(uTime * 1.6 + aSeed * 12.566);
    vGlow = clamp(g + tw * 0.5, 0.0, 1.6);

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (1.0 + vGlow * 5.5) * (uScale / -mv.z);
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
    float a = tex.a * uOpacity * (1.0 + vGlow * 1.4);
    gl_FragColor = vec4(col * (1.0 + vGlow * 1.0), a);
  }
`

function InteractiveMiniOrbs() {
  const tex = getGlowDotTexture()
  const { camera, size, gl } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(), R), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  // Cursor NDC, written by a window-level listener so it works even when DOM
  // overlays (e.g. .hero-section with pointer-events:auto) sit on top of the canvas.
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
    // Cube-face subdivision projected onto sphere = uniform square grid pattern.
    // 6 faces × N² points each, all normalized to sphere surface.
    const N = 54   // 6 × 2916 = 17496 points — very dense square grid
    const pts = []
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
          pts.push(x/len*r, y/len*r, z/len*r)
        }
      }
    }
    const count = pts.length / 3
    const p = new Float32Array(pts)
    const s = new Float32Array(count)
    const sd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      s[i] = 0.013 + Math.random() * 0.005   // tiny, uniform dots (50% smaller)
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
      uRadius:    { value: 0.34 },
      uScale:     { value: size.height / 2 },
      uMap:       { value: tex },
      uColorBase: { value: new THREE.Color('#82c8f0') },
      uColorHot:  { value: new THREE.Color('#ffffff') },
      uOpacity:   { value: 1.0 },
    },
    vertexShader: MINI_VERT,
    fragmentShader: MINI_FRAG,
  }), [tex, size.height])

  useFrame(({ clock }) => {
    // Manual ray-vs-sphere using window-level NDC (R3F's own `pointer` is
    // unreliable here — the .hero-section overlay swallows mouse events
    // before they reach the canvas).
    raycaster.setFromCamera(ndc, camera)
    if (raycaster.ray.intersectSphere(sphere, hit)) {
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
      <Particles positions={SOCCER_EDGE_POSITIONS} size={0.066} color="#58b8f8" opacity={0.88} renderOrder={4} />
      <Particles positions={SOCCER_EDGE_GLOW}      size={0.156} color="#1858c0" opacity={0.38} renderOrder={3} />
    </>
  )
}

// Spokes from inner halo ring edge outward to the 5 surrounding grid vertices
function CardinalSpokeParticles() {
  return <Particles positions={CARDINAL_SPOKE_POSITIONS} size={0.068} color="#a0eeff" opacity={0.96} renderOrder={6} />
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

// ── Single halo ring hugging the icon plate edge ──────────────────────────────
function NodeHaloRings() {
  const inner = useMemo(() => {
    const iPts = []
    ICON_CENTERS.forEach(c => {
      circleOnSphere(c, ICON_HALO_INNER, R * 1.003, 84).forEach(p => iPts.push(p[0], p[1], p[2]))
    })
    return new Float32Array(iPts)
  }, [])
  return <Particles positions={inner} size={0.040} color="#a8e8ff" opacity={0.92} renderOrder={8} />
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

// ── Pulsating breathing rings ─────────────────────────────────────────────────
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
      <planeGeometry args={[0.86, 0.86]} />
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

      {/* Interactive mini orbs — square grid, cursor-reactive */}
      <InteractiveMiniOrbs />

      {/* Soccer ball grid */}
      <SoccerGridParticles />

      {/* Spokes from icon halo ring to surrounding grid vertices */}
      <CardinalSpokeParticles />

      {/* Junction dots */}
      <JunctionDots />

      {/* Single halo ring tight against each icon */}
      <NodeHaloRings />

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
