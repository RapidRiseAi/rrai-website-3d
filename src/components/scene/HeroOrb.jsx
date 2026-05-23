import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import {
  buildSoccerBall, greatCircleArc, circleOnSphere, fibonacciSphere,
} from '../../utils/soccerBall'
import { createIconTexture, getGlowDotTexture } from '../../utils/iconTextures'

const R = 2.0

// ── Build all geometry once at module level ───────────────────────────────────
const { vertices, edges, vertexTriangles, pentagonCenters, hexCenters } = buildSoccerBall()

// ── Fresnel rim shell — bright at edges, transparent at center ────────────────
function FresnelRim({ radius, color, power, intensity, scale = 1 }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      power:     { value: power },
      intensity: { value: intensity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView   = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3  glowColor;
      uniform float power;
      uniform float intensity;
      varying vec3  vNormal;
      varying vec3  vView;
      void main() {
        float rim = 1.0 - max(dot(vNormal, vView), 0.0);
        rim = pow(rim, power) * intensity;
        gl_FragColor = vec4(glowColor, rim);
      }
    `,
  }), [color, power, intensity])

  return (
    <mesh scale={scale} renderOrder={2}>
      <sphereGeometry args={[radius, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// ── Tight sprite glow centered on orb — controlled, not page-bathing ─────────
function OrbGlow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 512
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    g.addColorStop(0,    'rgba(0, 130, 255, 0.55)')
    g.addColorStop(0.16, 'rgba(0, 100, 230, 0.32)')
    g.addColorStop(0.35, 'rgba(0,  60, 170, 0.15)')
    g.addColorStop(0.60, 'rgba(0,  24,  90, 0.05)')
    g.addColorStop(1,    'rgba(0,   0,  20, 0.00)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512)
    return new THREE.CanvasTexture(c)
  }, [])
  const s = R * 3.1
  return (
    <sprite scale={[s, s, 1]} position={[0, 0, -0.5]}>
      <spriteMaterial
        map={tex}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </sprite>
  )
}

// ── Main soccer ball edge grid ────────────────────────────────────────────────
function SoccerGrid() {
  const { positions, count } = useMemo(() => {
    const pts = []
    edges.forEach(([i, j]) => {
      const arc = greatCircleArc(vertices[i], vertices[j], R, 36)
      for (let k = 0; k < arc.length - 1; k++) pts.push(...arc[k], ...arc[k + 1])
    })
    return { positions: new Float32Array(pts), count: pts.length / 3 }
  }, [])

  return (
    <lineSegments renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#7fd8ff"
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  )
}

// Inner web of vertex triangles — subtle, lighter
function VertexTriangleGrid() {
  const { positions, count } = useMemo(() => {
    const pts = []
    vertexTriangles.forEach(midpoints => {
      const n = midpoints.length
      for (let k = 0; k < n; k++) {
        const a = midpoints[k]
        const b = midpoints[(k + 1) % n]
        const arc = greatCircleArc(
          a.clone().multiplyScalar(R),
          b.clone().multiplyScalar(R),
          R, 14
        )
        for (let m = 0; m < arc.length - 1; m++) pts.push(...arc[m], ...arc[m + 1])
      }
    })
    return { positions: new Float32Array(pts), count: pts.length / 3 }
  }, [])

  return (
    <lineSegments renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#3a9fdc"
        transparent
        opacity={0.28}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  )
}

// ── Pentagon icon node halos — small, embedded, not big rings ────────────────
function NodeHalos() {
  const ringLines = useMemo(() =>
    pentagonCenters.flatMap((c, idx) => [
      { key: `${idx}a`, pts: circleOnSphere(c, 0.155, R * 1.001), color: '#7fe4ff', w: 1.5, op: 0.85 },
      { key: `${idx}b`, pts: circleOnSphere(c, 0.205, R * 1.001), color: '#2a8fd0', w: 0.7, op: 0.40 },
    ])
  , [])

  return (
    <group>
      {ringLines.map(({ key, pts, color, w, op }) => (
        <Line
          key={key}
          points={pts}
          color={color}
          lineWidth={w}
          transparent
          opacity={op}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          renderOrder={4}
        />
      ))}
    </group>
  )
}

// Dotted ring of fine particles around each icon (the "halo dust" look)
function NodeHaloDots() {
  const tex = getGlowDotTexture()
  const arr = useMemo(() => {
    const perRing = 36
    const out = new Float32Array(pentagonCenters.length * perRing * 3)
    let o = 0
    pentagonCenters.forEach(c => {
      const ring = circleOnSphere(c, 0.255, R * 1.002, perRing - 1)
      for (let k = 0; k < perRing; k++) {
        const idx = k % ring.length
        out[o++] = ring[idx][0]
        out[o++] = ring[idx][1]
        out[o++] = ring[idx][2]
      }
    })
    return out
  }, [])
  const count = arr.length / 3
  return (
    <points renderOrder={4}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        map={tex}
        color="#9be7ff"
        sizeAttenuation
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  )
}

// ── Multi-layer dot field ──────────────────────────────────────────────────────

// Bright vertex glow dots
function VertexGlowDots() {
  const tex = getGlowDotTexture()
  const arr = useMemo(() => {
    const out = new Float32Array(vertices.length * 3)
    vertices.forEach((v, i) => {
      out[i * 3] = v.x * R; out[i * 3 + 1] = v.y * R; out[i * 3 + 2] = v.z * R
    })
    return out
  }, [])
  return (
    <points renderOrder={5}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={vertices.length} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.22}
        map={tex}
        color="#ddf4ff"
        sizeAttenuation
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  )
}

// Pentagon center bright anchor dots
function PentagonDots() {
  const tex = getGlowDotTexture()
  const arr = useMemo(() => {
    const out = new Float32Array(pentagonCenters.length * 3)
    pentagonCenters.forEach((p, i) => {
      out[i * 3] = p.x * R; out[i * 3 + 1] = p.y * R; out[i * 3 + 2] = p.z * R
    })
    return out
  }, [])
  return (
    <points renderOrder={6}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={pentagonCenters.length} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.30}
        map={tex}
        color="#ffffff"
        sizeAttenuation
        transparent
        opacity={0.92}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  )
}

// Hexagon center fine dots
function HexCenterDots() {
  const tex = getGlowDotTexture()
  const arr = useMemo(() => {
    const out = new Float32Array(hexCenters.length * 3)
    hexCenters.forEach((p, i) => {
      out[i * 3] = p.x * R; out[i * 3 + 1] = p.y * R; out[i * 3 + 2] = p.z * R
    })
    return out
  }, [])
  return (
    <points renderOrder={5}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={hexCenters.length} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.13}
        map={tex}
        color="#7fc8ff"
        sizeAttenuation
        transparent
        opacity={0.80}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  )
}

// Edge midpoint connector dots
function EdgeMidpointDots() {
  const tex = getGlowDotTexture()
  const arr = useMemo(() => {
    const pts = []
    edges.forEach(([i, j]) => {
      const mid = vertices[i].clone().add(vertices[j]).normalize()
      pts.push(mid.x * R, mid.y * R, mid.z * R)
    })
    return new Float32Array(pts)
  }, [])
  const count = arr.length / 3
  return (
    <points renderOrder={4}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        map={tex}
        color="#5fb4ff"
        sizeAttenuation
        transparent
        opacity={0.70}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  )
}

// Dense Fibonacci surface haze — the "data point matrix" wrapping the sphere
function SurfaceDots() {
  const tex = getGlowDotTexture()
  const arr = useMemo(() => fibonacciSphere(900, R * 1.001), [])
  const count = arr.length / 3
  return (
    <points renderOrder={2}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        map={tex}
        color="#4f9fd4"
        sizeAttenuation
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  )
}

// Sparse inner volume dots — gives 3D depth WITHOUT filling the center
function InnerDepthDots() {
  const tex = getGlowDotTexture()
  const arr = useMemo(() => {
    const count = 220
    const out = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Bias toward middle radii (not too central, not on surface)
      const r = (0.35 + Math.random() * 0.55) * R
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      out[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      out[i * 3 + 1] = r * Math.cos(phi)
      out[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return out
  }, [])
  const count = arr.length / 3
  return (
    <points renderOrder={1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={arr} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        map={tex}
        color="#1a4a88"
        sizeAttenuation
        transparent
        opacity={0.40}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        alphaTest={0.01}
      />
    </points>
  )
}

// ── Icon planes — small, embedded, premium ────────────────────────────────────
function IconPlane({ center, texIndex }) {
  const tex = useMemo(() => createIconTexture(texIndex), [texIndex])

  const position = useMemo(() =>
    center.clone().multiplyScalar(R * 1.005)
  , [center])

  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), center.clone().normalize())
    return q
  }, [center])

  return (
    <mesh
      position={position.toArray()}
      quaternion={quaternion.toArray()}
      renderOrder={7}
    >
      <planeGeometry args={[0.62, 0.62]} />
      <meshBasicMaterial
        map={tex}
        transparent
        alphaTest={0.01}
        depthTest={false}
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.NormalBlending}
      />
    </mesh>
  )
}

// Subtle animated breathing on icon halos
function PulsatingNodeHalos() {
  const groupRef = useRef()
  const phases = useMemo(() =>
    pentagonCenters.map((_, i) => (i / pentagonCenters.length) * Math.PI * 2)
  , [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.children.forEach((child, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.1 + phases[i])
      child.material.opacity = 0.15 + pulse * 0.35
    })
  })

  const ringPts = useMemo(() =>
    pentagonCenters.map(c => circleOnSphere(c, 0.180, R * 1.003))
  , [])

  return (
    <group ref={groupRef}>
      {ringPts.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#aaf0ff"
          lineWidth={1.0}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          renderOrder={5}
        />
      ))}
    </group>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HeroOrb() {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.055
  })

  return (
    <group>
      {/* Soft localized glow behind the orb only — does not flood the page */}
      <OrbGlow />

      <group ref={groupRef}>
        {/* Fresnel rim — the key to "transparent glass with bright edge" look */}
        <FresnelRim radius={R} color="#00aaff" power={2.6} intensity={1.35} />
        <FresnelRim radius={R * 1.012} color="#bff0ff" power={5.5} intensity={1.6} />
        <FresnelRim radius={R * 1.025} color="#0066cc" power={1.6} intensity={0.45} scale={1.0} />

        {/* Inner volume depth */}
        <InnerDepthDots />

        {/* Surface particle matrix */}
        <SurfaceDots />

        {/* Grid structure */}
        <SoccerGrid />
        <VertexTriangleGrid />

        {/* Junction dots */}
        <EdgeMidpointDots />
        <HexCenterDots />
        <VertexGlowDots />

        {/* Icon node halos */}
        <NodeHalos />
        <NodeHaloDots />
        <PulsatingNodeHalos />

        {/* Bright pentagon anchors */}
        <PentagonDots />

        {/* Embedded service icons */}
        {pentagonCenters.map((c, i) => (
          <IconPlane key={i} center={c} texIndex={i} />
        ))}
      </group>
    </group>
  )
}
