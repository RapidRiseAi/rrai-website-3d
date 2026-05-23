import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  buildSoccerBall, greatCircleArc, circleOnSphere,
} from '../../utils/soccerBall'
import { createIconTexture, getGlowDotTexture } from '../../utils/iconTextures'

const R = 1.70
const ORB_X = 1.9          // start: right side of viewport
const END_X = -1.5         // end: left side of viewport (after scroll)
const END_SCALE = 0.55     // end: shrink so cube corners stay on-screen

// Single page → one HeroOrb instance, module-level scroll state is fine
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

const TRAIL_LEN = 24
const TRAIL_LIFETIME = 1.0

const MINI_VERT = `
  uniform vec4 uTrail[${TRAIL_LEN}];
  uniform float uTrailLifetime;
  uniform float uTime;
  uniform float uRadius;
  uniform float uScale;
  uniform vec3 uCursorWorld;
  uniform float uCursorActive;
  uniform float uMorph;
  attribute vec3 aPosCube;
  attribute float aSize;
  attribute float aSeed;
  varying float vGlow;

  void main() {
    // Morph each particle from its sphere position to its cube position
    vec3 basePos = mix(position, aPosCube, uMorph);
    vec3 worldPos = (modelMatrix * vec4(basePos, 1.0)).xyz;

    // Glow + wind fade out as the morph progresses
    float interactive = 1.0 - uMorph;

    // Glow: max age-weighted contribution across the full trail buffer
    float maxG = 0.0;
    for (int i = 0; i < ${TRAIL_LEN}; i++) {
      vec4 t = uTrail[i];
      float ageFactor = max(0.0, 1.0 - (t.w / uTrailLifetime));
      float d = distance(worldPos, t.xyz);
      float g = (1.0 - smoothstep(0.0, uRadius, d)) * ageFactor;
      maxG = max(maxG, g);
    }
    maxG *= interactive;
    float g = pow(maxG, 1.5);
    float tw = 0.22 * sin(uTime * 1.6 + aSeed * 12.566);
    vGlow = clamp(g + tw * 0.5 * interactive, 0.0, 1.6);

    // Wind: each orb has a unique seed-based push direction
    float cd = distance(worldPos, uCursorWorld);
    float windProx = (1.0 - smoothstep(0.0, uRadius * 0.7, cd)) * uCursorActive * interactive;

    vec3 localNorm = normalize(basePos);
    vec3 tangentRef = abs(localNorm.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 T1 = normalize(cross(localNorm, tangentRef));
    vec3 T2 = cross(localNorm, T1);
    float pushAngle = aSeed * 6.2832;
    vec3 pushDir = T1 * cos(pushAngle) + T2 * sin(pushAngle);
    float strengthMult = 0.15 + aSeed * 0.45;
    vec3 displacedPos = basePos + pushDir * windProx * strengthMult;

    vec4 mv = modelViewMatrix * vec4(displacedPos, 1.0);
    gl_PointSize = aSize * (1.0 + vGlow * 6.6) * (uScale / -mv.z);
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
  const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(ORB_X, 0, 0), R), [])
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

  const { positions, posCube, sizes, seeds } = useMemo(() => {
    const N = 54
    const sphPts = []
    const cubePts = []
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
          // Cube position: keep the (x,y,z) face-grid coords, scaled to R
          cubePts.push(x * R, y * R, z * R)
        }
      }
    }
    const count = sphPts.length / 3
    const p = new Float32Array(sphPts)
    const pc = new Float32Array(cubePts)
    const s = new Float32Array(count)
    const sd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      s[i] = 0.013 + Math.random() * 0.005
      sd[i] = Math.random()
    }
    return { positions: p, posCube: pc, sizes: s, seeds: sd }
  }, [])

  const trail = useMemo(() => Array.from({ length: TRAIL_LEN },
    () => new THREE.Vector4(1000, 1000, 1000, TRAIL_LIFETIME + 1)
  ), [])

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
      uOpacity:       { value: 1.0 },
      uCursorWorld:   { value: new THREE.Vector3() },
      uCursorActive:  { value: 0.0 },
      uMorph:         { value: 0.0 },
    },
    vertexShader: MINI_VERT,
    fragmentShader: MINI_FRAG,
  }), [tex, size.height, trail])

  useFrame(({ clock }, delta) => {
    // Drive the morph from scroll progress
    material.uniforms.uMorph.value = scrollState.progress
    material.uniforms.uTime.value = clock.getElapsedTime()
    material.uniforms.uScale.value = size.height / 2

    // Once the user starts scrolling we stop interactive cursor processing
    if (scrollState.progress > 0.05) {
      material.uniforms.uCursorActive.value = 0.0
      return
    }

    for (let i = 0; i < TRAIL_LEN; i++) {
      trail[i].w = Math.min(trail[i].w + delta, TRAIL_LIFETIME + 1)
    }
    raycaster.setFromCamera(ndc, camera)
    if (raycaster.ray.intersectSphere(sphere, hit)) {
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
        <bufferAttribute attach="attributes-aPosCube" count={posCube.length / 3}
          array={posCube} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length}
          array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aSeed" count={seeds.length}
          array={seeds} itemSize={1} />
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
    // Shrink the occluder to nothing as the sphere morphs into a cube
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

// Particles cloud with optional scroll-driven fade
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

function SoccerGridParticles() {
  return (
    <>
      <Particles positions={SOCCER_EDGE_POSITIONS} size={0.066} color="#58b8f8" opacity={0.88} renderOrder={4} fade />
      <Particles positions={SOCCER_EDGE_GLOW}      size={0.156} color="#1858c0" opacity={0.38} renderOrder={3} fade />
    </>
  )
}

function CardinalSpokeParticles() {
  return <Particles positions={CARDINAL_SPOKE_POSITIONS} size={0.068} color="#a0eeff" opacity={0.96} renderOrder={6} fade />
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
      <Particles positions={vertexArr} size={0.18} color="#d8f0ff" opacity={0.92} renderOrder={7} fade />
      <Particles positions={hexArr}    size={0.10} color="#90d0ff" opacity={0.78} renderOrder={6} fade />
      <Particles positions={pentArr}   size={0.32} color="#ffffff" opacity={0.95} renderOrder={9} fade />
    </>
  )
}

function NodeHaloRings() {
  const inner = useMemo(() => {
    const iPts = []
    ICON_CENTERS.forEach(c => {
      circleOnSphere(c, ICON_HALO_INNER, R * 1.003, 84).forEach(p => iPts.push(p[0], p[1], p[2]))
    })
    return new Float32Array(iPts)
  }, [])
  return <Particles positions={inner} size={0.040} color="#a8e8ff" opacity={0.92} renderOrder={8} fade />
}

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
    if (!matRef.current) return
    const fade = Math.max(0, 1 - scrollState.progress / 0.5)
    matRef.current.opacity = (0.55 + 0.22 * Math.sin(clock.getElapsedTime() * 1.35)) * fade
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
    const fade = Math.max(0, 1 - scrollState.progress / 0.5)
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
      const fade = Math.max(0, 1 - scrollState.progress / 0.4)
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
    // Icons shrink + fade out faster than the rest of the orb (gone by ~33% scroll)
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
  const dragSphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(ORB_X, 0, 0), R * 1.05), [])
  const tmpNdc = useMemo(() => new THREE.Vector2(), [])

  // Track scroll progress (0 = top of page, 1 = scrolled one viewport)
  useEffect(() => {
    const onScroll = () => {
      const max = window.innerHeight
      scrollState.progress = Math.min(1, Math.max(0, window.scrollY / max))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const canvas = gl.domElement
    const onDown = (e) => {
      // Drag only while the orb is in its initial sphere state
      if (scrollState.progress > 0.05) return
      const rect = canvas.getBoundingClientRect()
      tmpNdc.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      tmpNdc.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      dragRaycaster.setFromCamera(tmpNdc, camera)
      if (!dragRaycaster.ray.intersectsSphere(dragSphere)) return
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
  }, [gl, camera, dragRaycaster, dragSphere, tmpNdc])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Drive position + scale from scroll progress
    const p = scrollState.progress
    const targetX = ORB_X + (END_X - ORB_X) * p
    const targetScale = 1.0 + (END_SCALE - 1.0) * p
    // Smoothly approach target so scroll feels eased rather than 1:1 jittery
    const lerpAmt = Math.min(1, delta * 8)
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * lerpAmt
    const curS = groupRef.current.scale.x
    const newS = curS + (targetScale - curS) * lerpAmt
    groupRef.current.scale.setScalar(newS)

    if (isDragging.current) return

    // Auto-rotate around Y continuously
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
    <group ref={groupRef} position={[ORB_X, 0, 0]}>
      <DepthOccluder />
      <VolumeField />
      <InteractiveMiniOrbs />
      <SoccerGridParticles />
      <CardinalSpokeParticles />
      <JunctionDots />
      <NodeHaloRings />
      <NodeClusterParticles />
      <FlowParticles />
      {ICON_CENTERS.map((c, i) => (
        <IconPlane key={i} center={c} texIndex={i} />
      ))}
      <PulsatingRings />
    </group>
  )
}
