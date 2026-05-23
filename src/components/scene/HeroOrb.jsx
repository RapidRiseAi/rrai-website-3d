import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import {
  buildSoccerBall, greatCircleArc, circleOnSphere, fibonacciSphere,
} from '../../utils/soccerBall'
import { createIconTexture, getGlowDotTexture } from '../../utils/iconTextures'

const R = 2.0

// ── Geometry precomputation at module level ───────────────────────────────────
const { vertices, edges, vertexTriangles, pentagonCenters, hexCenters } = buildSoccerBall()

// For each pentagon, find its 5 nearest truncated-icosahedron vertices
const pentNeighborVerts = pentagonCenters.map(pc =>
  vertices
    .map((v, i) => ({ i, d: pc.distanceTo(v) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map(x => x.i)
)

// Adjacent pentagon pairs (icosahedron edges = 30 pairs)
const icoEdgeLen = (() => {
  let m = Infinity
  for (let i = 0; i < pentagonCenters.length; i++)
    for (let j = i + 1; j < pentagonCenters.length; j++) {
      const d = pentagonCenters[i].distanceTo(pentagonCenters[j])
      if (d < m) m = d
    }
  return m
})()
const pentAdjPairs = (() => {
  const e = []
  for (let i = 0; i < pentagonCenters.length; i++)
    for (let j = i + 1; j < pentagonCenters.length; j++)
      if (pentagonCenters[i].distanceTo(pentagonCenters[j]) < icoEdgeLen * 1.05)
        e.push([i, j])
  return e
})()

// Hex-to-hex adjacency: secondary network layer
const hexMinDist = (() => {
  let m = Infinity
  for (let i = 0; i < hexCenters.length; i++)
    for (let j = i + 1; j < hexCenters.length; j++) {
      const d = hexCenters[i].distanceTo(hexCenters[j])
      if (d < m) m = d
    }
  return m
})()
const hexAdjPairs = (() => {
  const e = []
  for (let i = 0; i < hexCenters.length; i++)
    for (let j = i + 1; j < hexCenters.length; j++)
      if (hexCenters[i].distanceTo(hexCenters[j]) < hexMinDist * 1.05)
        e.push([i, j])
  return e
})()

// Pentagon-to-hexCenter cross links: every pentagon connects to its surrounding hex centers
const pentToHex = pentagonCenters.map(pc =>
  hexCenters
    .map((h, i) => ({ i, d: pc.distanceTo(h) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 5)
    .map(x => x.i)
)

// ── Fresnel rim shader ────────────────────────────────────────────────────────
const FRAG_RIM = `
  uniform vec3  glowColor;
  uniform float power;
  uniform float intensity;
  varying vec3  vN;
  varying vec3  vV;
  void main() {
    float rim = 1.0 - max(dot(vN, vV), 0.0);
    rim = pow(rim, power) * intensity;
    gl_FragColor = vec4(glowColor, rim);
  }
`
const VERT_RIM = `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`
function FresnelRim({ radius, color, power, intensity }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, side: THREE.FrontSide,
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      power:     { value: power },
      intensity: { value: intensity },
    },
    vertexShader: VERT_RIM, fragmentShader: FRAG_RIM,
  }), [color, power, intensity])
  return (
    <mesh renderOrder={20}>
      <sphereGeometry args={[radius, 96, 96]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ── DEPTH-ONLY occluder: writes depth so back icons fail depth test,
//     but renders only a very faint atmospheric tint so back-side
//     additive elements remain clearly visible through the sphere
function AtmosphereCore() {
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      blending: THREE.NormalBlending,
      uniforms: {},
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          // Center darker, edges fully transparent → does NOT block rim
          float facing = max(dot(vN, vV), 0.0);
          float core   = pow(facing, 1.3);
          float alpha  = 0.32 * core;
          // Subtle deep navy tint at center
          vec3 col = vec3(0.005, 0.020, 0.055);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    })
  }, [])
  return (
    <mesh renderOrder={-3}>
      <sphereGeometry args={[R * 0.985, 96, 96]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ── Localized orb glow sprite ─────────────────────────────────────────────────
function OrbGlow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 512
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    g.addColorStop(0,    'rgba(0, 130, 255, 0.45)')
    g.addColorStop(0.20, 'rgba(0,  95, 220, 0.25)')
    g.addColorStop(0.42, 'rgba(0,  55, 160, 0.10)')
    g.addColorStop(0.68, 'rgba(0,  22,  80, 0.03)')
    g.addColorStop(1,    'rgba(0,   0,  20, 0.00)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512)
    return new THREE.CanvasTexture(c)
  }, [])
  const s = R * 2.9
  return (
    <sprite scale={[s, s, 1]} position={[0, 0, -0.3]}>
      <spriteMaterial map={tex} transparent blending={THREE.AdditiveBlending}
        depthWrite={false} depthTest={false} />
    </sprite>
  )
}

// ── Reusable additive line layer ──────────────────────────────────────────────
function AdditiveLines({ positions, color, opacity, renderOrder = 3 }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])
  return (
    <lineSegments geometry={geo} renderOrder={renderOrder}>
      <lineBasicMaterial color={color} transparent opacity={opacity}
        blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
    </lineSegments>
  )
}

// ── PRIMARY: soccer ball edge grid ────────────────────────────────────────────
function SoccerGrid() {
  const positions = useMemo(() => {
    const pts = []
    edges.forEach(([i, j]) => {
      const arc = greatCircleArc(vertices[i], vertices[j], R, 40)
      for (let k = 0; k < arc.length - 1; k++) pts.push(...arc[k], ...arc[k + 1])
    })
    return new Float32Array(pts)
  }, [])
  return <AdditiveLines positions={positions} color="#5fc8f5" opacity={0.55} renderOrder={3} />
}

// Brighter overlay pass for front-line glow depth
function SoccerGridBright() {
  const positions = useMemo(() => {
    const pts = []
    edges.forEach(([i, j]) => {
      const arc = greatCircleArc(vertices[i], vertices[j], R * 1.001, 24)
      for (let k = 0; k < arc.length - 1; k++) pts.push(...arc[k], ...arc[k + 1])
    })
    return new Float32Array(pts)
  }, [])
  return <AdditiveLines positions={positions} color="#a0e6ff" opacity={0.22} renderOrder={4} />
}

// Inner vertex-triangle web
function VertexTriangleGrid() {
  const positions = useMemo(() => {
    const pts = []
    vertexTriangles.forEach(midpoints => {
      const n = midpoints.length
      for (let k = 0; k < n; k++) {
        const a = midpoints[k]
        const b = midpoints[(k + 1) % n]
        const arc = greatCircleArc(a, b, R, 14)
        for (let m = 0; m < arc.length - 1; m++) pts.push(...arc[m], ...arc[m + 1])
      }
    })
    return new Float32Array(pts)
  }, [])
  return <AdditiveLines positions={positions} color="#2a6ba5" opacity={0.38} renderOrder={3} />
}

// HEX-TO-HEX SECONDARY GRID — additional ecosystem connections
function HexConnectionGrid() {
  const positions = useMemo(() => {
    const pts = []
    hexAdjPairs.forEach(([i, j]) => {
      const arc = greatCircleArc(hexCenters[i], hexCenters[j], R * 1.001, 28)
      for (let k = 0; k < arc.length - 1; k++) pts.push(...arc[k], ...arc[k + 1])
    })
    return new Float32Array(pts)
  }, [])
  return <AdditiveLines positions={positions} color="#3a90c8" opacity={0.30} renderOrder={3} />
}

// Pentagon-to-hex cross links — service hubs reach into the hex network
function PentToHexLinks() {
  const positions = useMemo(() => {
    const pts = []
    pentagonCenters.forEach((pc, pi) => {
      pentToHex[pi].forEach(hi => {
        const arc = greatCircleArc(pc, hexCenters[hi], R * 1.002, 16)
        for (let k = 0; k < arc.length - 1; k++) pts.push(...arc[k], ...arc[k + 1])
      })
    })
    return new Float32Array(pts)
  }, [])
  return <AdditiveLines positions={positions} color="#62c4f4" opacity={0.42} renderOrder={4} />
}

// Service-to-service ecosystem arcs
function ServiceConnectionArcs() {
  const positions = useMemo(() => {
    const pts = []
    pentAdjPairs.forEach(([i, j]) => {
      const arc = greatCircleArc(pentagonCenters[i], pentagonCenters[j], R * 1.004, 32)
      for (let k = 0; k < arc.length - 1; k++) pts.push(...arc[k], ...arc[k + 1])
    })
    return new Float32Array(pts)
  }, [])
  return <AdditiveLines positions={positions} color="#7adfff" opacity={0.42} renderOrder={5} />
}

// Spokes: pentagon center to its 5 corner vertices
function NodeSpokes() {
  const positions = useMemo(() => {
    const pts = []
    pentagonCenters.forEach((pc, pi) => {
      pentNeighborVerts[pi].forEach(vi => {
        const arc = greatCircleArc(pc, vertices[vi], R * 1.002, 18)
        for (let k = 0; k < arc.length - 1; k++) pts.push(...arc[k], ...arc[k + 1])
      })
    })
    return new Float32Array(pts)
  }, [])
  return <AdditiveLines positions={positions} color="#a0eaff" opacity={0.78} renderOrder={6} />
}

// ── Reusable additive points layer ────────────────────────────────────────────
function AdditiveDots({ positions, size, color, opacity, renderOrder = 4 }) {
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

// Surface particle matrix — primary
function SurfaceDots() {
  const arr = useMemo(() => fibonacciSphere(1600, R * 1.001), [])
  return <AdditiveDots positions={arr} size={0.028} color="#4a96cc" opacity={0.62} renderOrder={2} />
}

// Surface particle matrix — secondary slightly offset radius for parallax richness
function SurfaceDotsSecondary() {
  const arr = useMemo(() => fibonacciSphere(700, R * 1.012), [])
  return <AdditiveDots positions={arr} size={0.020} color="#86c8f0" opacity={0.50} renderOrder={3} />
}

// Vertex glow dots — every truncated icosahedron vertex
function VertexGlowDots() {
  const arr = useMemo(() => {
    const out = new Float32Array(vertices.length * 3)
    vertices.forEach((v, i) => {
      out[i * 3] = v.x * R; out[i * 3 + 1] = v.y * R; out[i * 3 + 2] = v.z * R
    })
    return out
  }, [])
  return <AdditiveDots positions={arr} size={0.18} color="#d6f2ff" opacity={0.95} renderOrder={6} />
}

// Hexagon center dots
function HexCenterDots() {
  const arr = useMemo(() => {
    const out = new Float32Array(hexCenters.length * 3)
    hexCenters.forEach((p, i) => {
      out[i * 3] = p.x * R * 1.001; out[i * 3 + 1] = p.y * R * 1.001; out[i * 3 + 2] = p.z * R * 1.001
    })
    return out
  }, [])
  return <AdditiveDots positions={arr} size={0.13} color="#8edcff" opacity={0.85} renderOrder={5} />
}

// Edge midpoint dots
function EdgeMidpointDots() {
  const arr = useMemo(() => {
    const pts = []
    edges.forEach(([i, j]) => {
      const mid = vertices[i].clone().add(vertices[j]).normalize()
      pts.push(mid.x * R, mid.y * R, mid.z * R)
    })
    return new Float32Array(pts)
  }, [])
  return <AdditiveDots positions={arr} size={0.065} color="#5fb8ec" opacity={0.65} renderOrder={4} />
}

// Spoke endpoint dots — bright terminals where icons plug into the grid
function SpokeEndpointDots() {
  const arr = useMemo(() => {
    const pts = []
    pentagonCenters.forEach((_, pi) => {
      pentNeighborVerts[pi].forEach(vi => {
        const v = vertices[vi]
        pts.push(v.x * R * 1.002, v.y * R * 1.002, v.z * R * 1.002)
      })
    })
    return new Float32Array(pts)
  }, [])
  // Animate twinkling for life
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime()
      ref.current.material.opacity = 0.75 + 0.20 * Math.sin(t * 2.1)
    }
  })
  const tex = getGlowDotTexture()
  return (
    <points ref={ref} renderOrder={7}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={arr.length / 3} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.24} map={tex} color="#ffffff" sizeAttenuation transparent
        opacity={0.88} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false}
        alphaTest={0.01} />
    </points>
  )
}

// Pentagon anchor dots (icon centers)
function PentagonAnchorDots() {
  const arr = useMemo(() => {
    const out = new Float32Array(pentagonCenters.length * 3)
    pentagonCenters.forEach((p, i) => {
      out[i * 3] = p.x * R * 1.003; out[i * 3 + 1] = p.y * R * 1.003; out[i * 3 + 2] = p.z * R * 1.003
    })
    return out
  }, [])
  return <AdditiveDots positions={arr} size={0.30} color="#ffffff" opacity={0.85} renderOrder={9} />
}

// Cluster particles around each icon hub — animated twinkling
function NodeClusterDots() {
  const tex = getGlowDotTexture()
  const { positions, count, phases } = useMemo(() => {
    const perNode = 30
    const pts = []
    const phs = []
    pentagonCenters.forEach((pc, idx) => {
      const n = pc.clone().normalize()
      const ref = Math.abs(n.y) > 0.85 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
      const e1 = new THREE.Vector3().crossVectors(n, ref).normalize()
      const e2 = new THREE.Vector3().crossVectors(e1, n).normalize()
      for (let k = 0; k < perNode; k++) {
        const alpha = 0.04 + Math.random() * 0.22
        const phi = Math.random() * Math.PI * 2
        const pt = n.clone()
          .multiplyScalar(Math.cos(alpha))
          .addScaledVector(e1, Math.sin(alpha) * Math.cos(phi))
          .addScaledVector(e2, Math.sin(alpha) * Math.sin(phi))
          .normalize()
          .multiplyScalar(R * (1.0 + Math.random() * 0.012))
        pts.push(pt.x, pt.y, pt.z)
        phs.push(idx * 0.7 + k * 0.31)
      }
    })
    return { positions: new Float32Array(pts), count: pts.length / 3, phases: phs }
  }, [])

  const matRef = useRef()
  useFrame(({ clock }) => {
    if (matRef.current) {
      const t = clock.getElapsedTime()
      matRef.current.opacity = 0.62 + 0.18 * Math.sin(t * 1.3)
    }
  })

  return (
    <points renderOrder={8}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={0.038} map={tex} color="#9ce0ff" sizeAttenuation
        transparent opacity={0.72} blending={THREE.AdditiveBlending} depthWrite={false}
        depthTest={false} alphaTest={0.01} />
    </points>
  )
}

// Volume depth particles
function InnerDepthDots() {
  const arr = useMemo(() => {
    const count = 280
    const out = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = (0.20 + Math.random() * 0.72) * R
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      out[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      out[i * 3 + 1] = r * Math.cos(phi)
      out[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return out
  }, [])
  return <AdditiveDots positions={arr} size={0.022} color="#2862a5" opacity={0.45} renderOrder={1} />
}

// ── Icon node halos ──────────────────────────────────────────────────────────

function NodeInnerRings() {
  const lines = useMemo(() =>
    pentagonCenters.map((c, i) => ({ key: `ni${i}`, pts: circleOnSphere(c, 0.148, R * 1.002) }))
  , [])
  return (
    <group>
      {lines.map(({ key, pts }) => (
        <Line key={key} points={pts} color="#8fdcff" lineWidth={1.2}
          transparent opacity={0.75} blending={THREE.AdditiveBlending}
          depthWrite={false} depthTest={false} renderOrder={7} />
      ))}
    </group>
  )
}

function NodeOuterHaloDots() {
  const tex = getGlowDotTexture()
  const arr = useMemo(() => {
    const perRing = 36
    const pts = []
    pentagonCenters.forEach(c => {
      const ring = circleOnSphere(c, 0.235, R * 1.003, perRing - 1)
      for (let k = 0; k < perRing; k++) {
        const idx = k % ring.length
        pts.push(ring[idx][0], ring[idx][1], ring[idx][2])
      }
    })
    return new Float32Array(pts)
  }, [])
  const count = arr.length / 3
  return (
    <points renderOrder={8}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.044} map={tex} color="#a0e6ff" sizeAttenuation transparent
        opacity={0.80} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false}
        alphaTest={0.01} />
    </points>
  )
}

// Pulsating breathing ring at each icon node — adds aliveness
function PulsatingRings() {
  const groupRef = useRef()
  const phases = useMemo(() =>
    pentagonCenters.map((_, i) => (i / pentagonCenters.length) * Math.PI * 2)
  , [])
  const ringPts = useMemo(() => pentagonCenters.map(c => circleOnSphere(c, 0.180, R * 1.004)), [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      child.material.opacity = 0.10 + 0.30 * (0.5 + 0.5 * Math.sin(t * 1.0 + phases[i]))
    })
  })

  return (
    <group ref={groupRef}>
      {ringPts.map((pts, i) => (
        <Line key={i} points={pts} color="#bbf4ff" lineWidth={0.8}
          transparent opacity={0.2} blending={THREE.AdditiveBlending}
          depthWrite={false} depthTest={false} renderOrder={9} />
      ))}
    </group>
  )
}

// ── Icon planes — depthTest:true so dark core occludes back-side icons ────────
function IconPlane({ center, texIndex }) {
  const tex = useMemo(() => createIconTexture(texIndex), [texIndex])
  const position = useMemo(() => center.clone().multiplyScalar(R * 1.005), [center])
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), center.clone().normalize())
    return q
  }, [center])
  return (
    <mesh
      position={position.toArray()}
      quaternion={quaternion.toArray()}
      renderOrder={8}
    >
      <planeGeometry args={[0.80, 0.80]} />
      <meshBasicMaterial
        map={tex}
        transparent
        alphaTest={0.01}
        depthTest={true}
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HeroOrb() {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.048
  })

  return (
    <group>
      <OrbGlow />

      <group ref={groupRef}>
        {/* Subtle volumetric core — Fresnel-darkened, doesn't block the rim */}
        <AtmosphereCore />

        {/* Deep volume */}
        <InnerDepthDots />

        {/* Surface particle matrix (two layers for parallax) */}
        <SurfaceDots />
        <SurfaceDotsSecondary />

        {/* Inner web */}
        <VertexTriangleGrid />

        {/* Secondary hex-to-hex grid for ecosystem richness */}
        <HexConnectionGrid />

        {/* Primary soccer ball edges */}
        <SoccerGrid />
        <SoccerGridBright />

        {/* Pentagon-to-hex cross links — services reach across the network */}
        <PentToHexLinks />

        {/* Service-to-service ecosystem arcs */}
        <ServiceConnectionArcs />

        {/* Spokes wiring icons into the grid */}
        <NodeSpokes />

        {/* Junction dots */}
        <EdgeMidpointDots />
        <HexCenterDots />
        <VertexGlowDots />
        <SpokeEndpointDots />

        {/* Icon node halos */}
        <NodeInnerRings />
        <NodeOuterHaloDots />

        {/* Living particles around hubs */}
        <NodeClusterDots />

        {/* Icon planes (occluded on back side) */}
        {pentagonCenters.map((c, i) => (
          <IconPlane key={i} center={c} texIndex={i} />
        ))}

        {/* Animated activity rings */}
        <PulsatingRings />

        {/* Bright anchors at icon centers */}
        <PentagonAnchorDots />

        {/* Fresnel rim layers on top — define the glass sphere boundary */}
        <FresnelRim radius={R}         color="#00a0ff" power={2.5} intensity={1.35} />
        <FresnelRim radius={R * 1.010} color="#caf0ff" power={6.0} intensity={1.85} />
        <FresnelRim radius={R * 1.022} color="#0055cc" power={1.5} intensity={0.45} />
      </group>
    </group>
  )
}
