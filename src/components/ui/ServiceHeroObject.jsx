import { useRef, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CARD_GENERATORS, CARD_COLORS, normalizeCardShapes } from '../scene/HeroOrb'
import { getGlowDotTexture } from '../../utils/iconTextures'

/* Renders the SAME live 3D object the matching home-page expertise card uses,
   in the right side of a service hero. Reuses the exact CARD_GENERATORS /
   CARD_COLORS / normalizeCardShapes from HeroOrb so the shapes are byte-for-byte
   the current home objects.

   Interaction (service pages only):
     · idle  — oscillates ±20° to each side
     · hover — the same surface glow-trail the home-page objects use
     · grab  — drag to tilt, hard-capped at ±60° on each axis (no free spin)

   Object indices (home carousel order):
     0 globe · 1 gear · 2 code block · 3 workflow path
     4 intelligence orbit · 5 connected cubes · 6 funnel */
const SLUG_TO_OBJECT = {
  'website-development': 0,
  'software-development': 1,
  'web-app-development': 2,
  'automated-workflow': 3,
  'ai-implementation': 4,
  ecosystems: 5,
  'marketing-seo': 6,
  // no dedicated home card → nearest matching object
  'client-portal': 2,
  'smart-dashboards': 1,
  'ai-communication-agent': 4,
  'iot-development': 5,
}

/* ── Tuning ──────────────────────────────────────────────────────────────────── */
const SWAY = 0.349          // ±20° idle oscillation, in radians
const MAX_TILT = Math.PI / 3 // ±60° hard cap on grab tilt
const TRAIL_LEN = 16         // cursor glow-trail length (home page uses 24)
const TRAIL_LIFETIME = 0.55  // seconds a trail point stays lit
const GLOW_RADIUS = 0.42     // world-space radius of the glow falloff
const HOVER_HIT2 = 0.17      // (~0.41 world units)² — nearest-point hit threshold
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

const VERT = /* glsl */ `
  uniform float uSize; uniform float uScale;
  uniform vec4 uTrail[${TRAIL_LEN}];
  uniform float uTrailLifetime;
  uniform float uRadius;
  uniform vec3 uCursorWorld;
  uniform float uCursorActive;
  varying float vZ;
  varying float vGlow;
  void main() {
    vZ = position.z;
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    // Brightest proximity to any recent point in the cursor trail.
    float maxG = 0.0;
    for (int i = 0; i < ${TRAIL_LEN}; i++) {
      vec4 tp = uTrail[i];
      float ageFactor = max(0.0, 1.0 - (tp.w / uTrailLifetime));
      float d = distance(worldPos, tp.xyz);
      float g = (1.0 - smoothstep(0.0, uRadius, d)) * ageFactor;
      maxG = max(maxG, g);
    }
    vGlow = pow(maxG, 1.5);

    // Soft outward ripple at the live cursor point (like the home objects).
    float cd = distance(worldPos, uCursorWorld);
    float prox = (1.0 - smoothstep(0.0, uRadius * 0.8, cd)) * uCursorActive;
    vec3 displaced = position + normalize(position + 0.0001) * prox * 0.1;

    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    gl_PointSize = uSize * (1.0 + vGlow * 3.0) * (uScale / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`

const FRAG = /* glsl */ `
  uniform sampler2D uMap; uniform vec3 uColor; uniform vec3 uColorHot; uniform float uOpacity;
  varying float vZ; varying float vGlow;
  void main() {
    vec4 t = texture2D(uMap, gl_PointCoord);
    if (t.a < 0.01) discard;
    float b = 0.8 + clamp(vZ * 0.16, -0.22, 0.3);
    vec3 col = mix(uColor * b, uColorHot, clamp(vGlow, 0.0, 1.0));
    float op = uOpacity * (1.0 + vGlow * 0.9);
    gl_FragColor = vec4(col, t.a * op);
  }`

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* Generate + normalize all card shapes once (lazily, on first object render). */
let _bufs = null
function getCardBufs() {
  if (!_bufs) {
    _bufs = CARD_GENERATORS.map((g) => {
      const r = g()
      return r instanceof Float32Array ? r : r.pos
    })
    normalizeCardShapes(_bufs)
  }
  return _bufs
}
/* Scale so each object reads at the same on-screen size regardless of its units. */
function fitScale(buf) {
  let max = 0
  for (let i = 0; i < buf.length; i++) {
    const v = Math.abs(buf[i])
    if (v > max) max = v
  }
  return max > 0 ? 1.7 / max : 1
}

function ObjectPoints({ index }) {
  const ref = useRef()
  const { size, gl, camera } = useThree()
  const tex = useMemo(() => getGlowDotTexture(), [])
  const buf = useMemo(() => getCardBufs()[index], [index])
  const scale = useMemo(() => fitScale(buf), [buf])

  // Interaction state (refs so handlers don't trigger re-renders).
  const hovered = useRef(false)
  const dragging = useRef(false)
  const grab = useRef({ x: 0, y: 0 }) // accumulated grab tilt, clamped ±MAX_TILT
  const last = useRef({ x: 0, y: 0 })
  const ndc = useRef(new THREE.Vector2(2, 2)) // cursor in clip space; (2,2) = off

  // Hover glow-trail scratch objects.
  const trail = useMemo(
    () => Array.from({ length: TRAIL_LEN }, () => new THREE.Vector4(0, 0, 0, TRAIL_LIFETIME + 1)),
    [],
  )
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const invMat = useMemo(() => new THREE.Matrix4(), [])
  const localRay = useMemo(() => new THREE.Ray(), [])
  const hitWorld = useMemo(() => new THREE.Vector3(), [])

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(buf, 3))
    return g
  }, [buf])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uMap: { value: tex },
          uColor: { value: new THREE.Color(CARD_COLORS[index]) },
          uColorHot: { value: new THREE.Color(CARD_COLORS[index]).lerp(new THREE.Color('#dceeff'), 0.7) },
          uOpacity: { value: 0.62 },
          uSize: { value: 0.062 },
          uScale: { value: size.height / 2 },
          uTrail: { value: trail },
          uTrailLifetime: { value: TRAIL_LIFETIME },
          uRadius: { value: GLOW_RADIUS },
          uCursorWorld: { value: new THREE.Vector3() },
          uCursorActive: { value: 0 },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
      }),
    [tex, index, size.height, trail],
  )

  // Track the cursor in clip space (for the surface-glow raycast).
  useEffect(() => {
    const canvas = gl.domElement
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      ndc.current.x = ((e.clientX - r.left) / r.width) * 2 - 1
      ndc.current.y = -((e.clientY - r.top) / r.height) * 2 + 1
      if (dragging.current) {
        const dx = e.clientX - last.current.x
        const dy = e.clientY - last.current.y
        last.current = { x: e.clientX, y: e.clientY }
        grab.current.y = clamp(grab.current.y + dx * 0.009, -MAX_TILT, MAX_TILT)
        grab.current.x = clamp(grab.current.x + dy * 0.009, -MAX_TILT, MAX_TILT)
      }
    }
    const onLeave = () => ndc.current.set(2, 2)
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.userSelect = ''
      gl.domElement.style.cursor = hovered.current ? 'grab' : ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [gl])

  const onOver = useCallback((e) => {
    if (e.pointerType === 'touch') return
    hovered.current = true
    if (!dragging.current) gl.domElement.style.cursor = 'grab'
  }, [gl])
  const onOut = useCallback(() => {
    hovered.current = false
    if (!dragging.current) gl.domElement.style.cursor = ''
  }, [gl])
  const onDown = useCallback((e) => {
    if (e.pointerType === 'touch') return
    e.stopPropagation()
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
    gl.domElement.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }, [gl])

  useFrame((state, delta) => {
    const g = ref.current
    if (!g) return
    const t = state.clock.elapsedTime

    // ── Rotation: idle ±20° sway + grab tilt, total capped at ±60° ──────────────
    if (!dragging.current) {
      grab.current.x += (0 - grab.current.x) * 0.06
      grab.current.y += (0 - grab.current.y) * 0.06
    }
    const oscY = REDUCED ? 0 : Math.sin(t * 0.32) * SWAY
    const oscX = REDUCED ? -0.1 : Math.sin(t * 0.24) * 0.1
    const ty = clamp(oscY + grab.current.y, -MAX_TILT, MAX_TILT)
    const tx = clamp(oscX + grab.current.x, -MAX_TILT, MAX_TILT)
    g.rotation.y += (ty - g.rotation.y) * 0.18
    g.rotation.x += (tx - g.rotation.x) * 0.18
    if (!REDUCED) g.position.y = Math.sin(t * 0.5) * 0.05
    g.updateMatrixWorld()

    // ── Hover glow-trail: light up the surface point under the cursor ───────────
    for (let i = 0; i < TRAIL_LEN; i++) trail[i].w = Math.min(trail[i].w + delta, TRAIL_LIFETIME + 1)

    let hasHit = false
    if (ndc.current.x <= 1 && !REDUCED) {
      ray.setFromCamera(ndc.current, camera)
      invMat.copy(g.matrixWorld).invert()
      localRay.copy(ray.ray).applyMatrix4(invMat)
      localRay.direction.normalize()
      const lo = localRay.origin
      const ld = localRay.direction
      const stride = Math.max(3, Math.floor(buf.length / 3 / 1200)) * 3
      let bestD2 = Infinity
      let nx = 0, ny = 0, nz = 0
      for (let i = 0; i < buf.length; i += stride) {
        const ox = buf[i] - lo.x, oy = buf[i + 1] - lo.y, oz = buf[i + 2] - lo.z
        const proj = ox * ld.x + oy * ld.y + oz * ld.z
        if (proj < 0) continue
        const cx = ox - proj * ld.x, cy = oy - proj * ld.y, cz = oz - proj * ld.z
        const d2 = cx * cx + cy * cy + cz * cz
        if (d2 < bestD2) { bestD2 = d2; nx = buf[i]; ny = buf[i + 1]; nz = buf[i + 2] }
      }
      if (bestD2 * scale * scale < HOVER_HIT2) {
        hitWorld.set(nx, ny, nz).applyMatrix4(g.matrixWorld)
        // Drop the new hit into the oldest trail slot.
        let oldest = 0, oldestAge = -1
        for (let i = 0; i < TRAIL_LEN; i++) if (trail[i].w > oldestAge) { oldestAge = trail[i].w; oldest = i }
        trail[oldest].set(hitWorld.x, hitWorld.y, hitWorld.z, 0)
        material.uniforms.uCursorWorld.value.copy(hitWorld)
        material.uniforms.uCursorActive.value = 1
        hasHit = true
      }
    }
    if (!hasHit) material.uniforms.uCursorActive.value = 0
  })

  return (
    <group>
      <points ref={ref} geometry={geom} material={material} scale={scale} />
      {/* Invisible bounding sphere = a reliable hit area for grab + cursor
          (raycasting sparse points directly for the grab is unreliable). */}
      <mesh onPointerOver={onOver} onPointerOut={onOut} onPointerDown={onDown}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </group>
  )
}

export default function ServiceHeroObject({ slug }) {
  const index = SLUG_TO_OBJECT[slug]
  if (index == null) return null
  return (
    <div className="svc-hero-object" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6.3], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        frameloop={REDUCED ? 'demand' : 'always'}
      >
        <ObjectPoints index={index} />
      </Canvas>
    </div>
  )
}
