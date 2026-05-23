import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'

const R = 1.85

const toXYZ = (lat, lon, r = R) => [
  r * Math.cos(lat) * Math.sin(lon),
  r * Math.sin(lat),
  r * Math.cos(lat) * Math.cos(lon),
]

function makeLatRing(lat, r = R, n = 120) {
  return Array.from({ length: n + 1 }, (_, i) =>
    toXYZ(lat, (i / n) * Math.PI * 2, r)
  )
}

function makeLonArc(lon, r = R, n = 120) {
  return Array.from({ length: n + 1 }, (_, i) =>
    toXYZ((i / n) * Math.PI - Math.PI / 2, lon, r)
  )
}

const LAT_DEG = [-60, -40, -20, 0, 20, 40, 60]
const LAT_RADS = LAT_DEG.map(d => d * Math.PI / 180)
const LON_COUNT = 12
const LON_RADS = Array.from({ length: LON_COUNT }, (_, i) => (i * Math.PI * 2) / LON_COUNT)

const OCTANT_POSITIONS = [
  [1, 1, 1], [-1, 1, 1], [1, 1, -1], [-1, 1, -1],
  [1, -1, 1], [-1, -1, 1], [1, -1, -1], [-1, -1, -1],
].map(([x, y, z]) => {
  const s = R / Math.sqrt(3)
  return new THREE.Vector3(x * s, y * s, z * s)
})

const ICON_DATA = [
  {
    label: 'Analytics',
    el: (
      <g>
        <rect x="3" y="12" width="4" height="8" rx="0.5" fill="none" />
        <rect x="10" y="7" width="4" height="13" rx="0.5" fill="none" />
        <rect x="17" y="3" width="4" height="17" rx="0.5" fill="none" />
      </g>
    ),
  },
  {
    label: 'IoT / Chip',
    el: (
      <g>
        <rect x="7" y="7" width="10" height="10" rx="1" fill="none" />
        <line x1="9" y1="7" x2="9" y2="4" /><line x1="12" y1="7" x2="12" y2="4" /><line x1="15" y1="7" x2="15" y2="4" />
        <line x1="9" y1="17" x2="9" y2="20" /><line x1="12" y1="17" x2="12" y2="20" /><line x1="15" y1="17" x2="15" y2="20" />
        <line x1="7" y1="9" x2="4" y2="9" /><line x1="7" y1="12" x2="4" y2="12" /><line x1="7" y1="15" x2="4" y2="15" />
        <line x1="17" y1="9" x2="20" y2="9" /><line x1="17" y1="12" x2="20" y2="12" /><line x1="17" y1="15" x2="20" y2="15" />
      </g>
    ),
  },
  {
    label: 'Identity',
    el: (
      <g>
        <rect x="2" y="5" width="20" height="14" rx="2" fill="none" />
        <circle cx="8" cy="12" r="2.5" fill="none" />
        <line x1="13" y1="10" x2="20" y2="10" />
        <line x1="13" y1="14" x2="18" y2="14" />
      </g>
    ),
  },
  {
    label: 'Integrations',
    el: (
      <g>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </g>
    ),
  },
  {
    label: 'Automation',
    el: (
      <g>
        <circle cx="12" cy="12" r="3" fill="none" />
        <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.9" y1="4.9" x2="7.1" y2="7.1" /><line x1="16.9" y1="16.9" x2="19.1" y2="19.1" />
        <line x1="4.9" y1="19.1" x2="7.1" y2="16.9" /><line x1="16.9" y1="7.1" x2="19.1" y2="4.9" />
      </g>
    ),
  },
  {
    label: 'Code',
    el: (
      <g>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
        <line x1="14" y1="4" x2="10" y2="20" />
      </g>
    ),
  },
  {
    label: 'Web Platform',
    el: (
      <g>
        <rect x="2" y="3" width="20" height="14" rx="2" fill="none" />
        <line x1="2" y1="7" x2="22" y2="7" />
        <line x1="6" y1="10" x2="18" y2="10" />
        <line x1="6" y1="13" x2="14" y2="13" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </g>
    ),
  },
  {
    label: 'AI Assistant',
    el: (
      <g>
        <rect x="3" y="7" width="18" height="12" rx="2" fill="none" />
        <path d="M8 7V5a1 1 0 011-1h6a1 1 0 011 1v2" fill="none" />
        <circle cx="9" cy="13" r="1" fill="currentColor" />
        <circle cx="15" cy="13" r="1" fill="currentColor" />
        <line x1="10" y1="16" x2="14" y2="16" />
      </g>
    ),
  },
]

// Soft glow halo rendered as a sprite behind the orb
function OrbGlow() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    g.addColorStop(0,   'rgba(20, 100, 255, 0.55)')
    g.addColorStop(0.25,'rgba(10, 70, 220, 0.28)')
    g.addColorStop(0.55,'rgba(5, 40, 160, 0.10)')
    g.addColorStop(1,   'rgba(0, 10, 80, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 512)
    return new THREE.CanvasTexture(canvas)
  }, [])

  const s = R * 3.6
  return (
    <sprite scale={[s, s, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={1}
      />
    </sprite>
  )
}

function SphereGrid() {
  const dotPositions = useMemo(() => {
    const arr = []
    LAT_RADS.forEach(lat => {
      LON_RADS.forEach(lon => {
        const [x, y, z] = toXYZ(lat, lon)
        arr.push(x, y, z)
      })
    })
    return new Float32Array(arr)
  }, [])

  const dotCount = (LAT_RADS.length * LON_RADS.length)

  return (
    <group>
      {LAT_RADS.map((lat, i) => (
        <Line
          key={`lat${i}`}
          points={makeLatRing(lat)}
          color={Math.abs(lat) < 0.01 ? '#00ccff' : '#1166cc'}
          lineWidth={Math.abs(lat) < 0.01 ? 1.6 : 0.8}
          transparent
          opacity={Math.abs(lat) < 0.01 ? 1 : 0.7}
        />
      ))}

      {LON_RADS.map((lon, i) => (
        <Line
          key={`lon${i}`}
          points={makeLonArc(lon)}
          color={i === 0 ? '#00ccff' : '#1166cc'}
          lineWidth={i === 0 ? 1.6 : 0.8}
          transparent
          opacity={i === 0 ? 1 : 0.7}
        />
      ))}

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dotCount}
            array={dotPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          color="#88eeff"
          sizeAttenuation
          transparent
          opacity={1}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

function OrbIcon({ position, data, groupRef }) {
  const { camera } = useThree()
  const [hovered, setHovered] = useState(false)
  // Use a DOM ref to update visibility without causing React re-renders every frame
  const wrapRef = useRef()

  useFrame(() => {
    if (!groupRef.current || !wrapRef.current) return
    const wp = position.clone().applyMatrix4(groupRef.current.matrixWorld)
    const toCamera = camera.position.clone().sub(wp).normalize()
    const normal = wp.clone().normalize()
    const facing = normal.dot(toCamera) > 0.12
    wrapRef.current.style.opacity = facing ? '1' : '0'
    wrapRef.current.style.pointerEvents = facing ? 'auto' : 'none'
  })

  return (
    <Html position={position.toArray()} center zIndexRange={[100, 0]}>
      <div ref={wrapRef} style={{ opacity: 1, transition: 'opacity 0.2s', pointerEvents: 'auto' }}>
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'rgba(0, 8, 25, 0.80)',
            border: `1.5px solid ${hovered ? '#55ddff' : '#1a6bbf'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: hovered
              ? '0 0 20px #00ccff, 0 0 50px #0066cc44, inset 0 0 14px #003355'
              : '0 0 12px #004488bb, inset 0 0 8px #00111a',
            transition: 'box-shadow 0.25s, border-color 0.25s',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title={data.label}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={hovered ? '#66eeff' : '#2299dd'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            color={hovered ? '#66eeff' : '#2299dd'}
          >
            {data.el}
          </svg>
        </div>
      </div>
    </Html>
  )
}

export default function HeroOrb() {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <group>
      {/* Glow halo sits outside the rotating group so it doesn't wobble */}
      <OrbGlow />

      <group ref={groupRef}>
        {/* Dark core — occludes the backside of the grid */}
        <mesh renderOrder={-1}>
          <sphereGeometry args={[R * 0.93, 32, 32]} />
          <meshBasicMaterial color="#00060f" transparent opacity={0.92} depthWrite />
        </mesh>

        {/* Outer shell — subtle additive rim glow */}
        <mesh>
          <sphereGeometry args={[R * 1.02, 32, 32]} />
          <meshBasicMaterial
            color="#0055cc"
            transparent
            opacity={0.04}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <SphereGrid />

        {OCTANT_POSITIONS.map((pos, i) => (
          <OrbIcon key={i} position={pos} data={ICON_DATA[i]} groupRef={groupRef} />
        ))}
      </group>
    </group>
  )
}
