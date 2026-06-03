/**
 * PricingWave — the Section-3 wave, rendered on its OWN canvas that sits BEHIND
 * the page content (z-index 1, below #scroll-content). That guarantees the
 * opaque pricing cards are always in front of it at any screen size — the wave
 * can never bleed through them. Same orb language as the rest of the site
 * (glow-dot texture + additive blue points), placed low so it spans the bottom.
 *
 * Hover is screen-space: orbs whose projected position is near the cursor light
 * up, so the glow lands exactly under the pointer.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import { getGlowDotTexture } from '../../utils/iconTextures'

const BASE_OPACITY = 0.8    // wave brightness once fully faded in
const COLS = 192
const ROWS = 72
const HW   = 14.0    // half-width (world)
const ZN   = 2.0     // near row z
const ZF   = -2.5    // far row z
const LIFT = 0.9     // edge lift into the side gutters
const CY   = -2.6    // drops the wave into the bottom band

const VERT = `
  uniform float uTime;
  uniform float uSize;
  uniform float uScale;
  uniform vec2  uCursor;     // cursor NDC (-1..1)
  uniform float uCursorOn;
  uniform float uAspect;
  attribute float aRand;
  varying float vBright;
  varying float vHover;

  void main() {
    float lx = position.x;
    float lz = position.z;
    float nx = lx / ${HW.toFixed(1)};                 // -1..1

    // base height: edge-lift + several short, slow swells (kept gentle/low)
    float y = ${LIFT.toFixed(2)} * (nx * nx);
    y += 0.16 * sin(lx * 1.7 + uTime * 0.5);
    y += 0.12 * sin(lx * 2.9 - lz * 0.9 + uTime * 0.8);
    y += 0.12 * sin(lz * 1.5 + uTime * 0.45);
    y += 0.07 * sin((lx * 3.4 + lz * 1.7) + uTime * 1.05);
    vec3 p = vec3(lx, ${CY.toFixed(2)} + y, lz);

    // depth fade: far/back rows recede into the dark, front (bottom) stays bright
    float wDepth = clamp((lz - (${ZF.toFixed(1)})) / (${(ZN - ZF).toFixed(1)}), 0.0, 1.0);
    vBright = (0.10 + 0.90 * wDepth) * (0.5 + aRand * 0.6);

    vec4 mv   = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;

    // screen-space hover: brighten orbs whose projection is near the cursor
    vec2 ndc = clip.xy / clip.w;
    vec2 d   = (ndc - uCursor) * vec2(uAspect, 1.0);
    vHover   = (1.0 - smoothstep(0.0, 0.16, length(d))) * uCursorOn;

    gl_Position = clip;
    float sz = uSize * (0.55 + aRand * 0.8) * (1.0 + vHover * 2.6);
    gl_PointSize = clamp(sz * (uScale / -mv.z), 1.0, 70.0);
  }
`

const FRAG = `
  uniform sampler2D uTex;
  uniform vec3  uColor;
  uniform vec3  uHot;
  uniform float uOpacity;
  varying float vBright;
  varying float vHover;

  void main() {
    vec4 tex = texture2D(uTex, gl_PointCoord);
    // sharpen the soft glow-dot falloff so each orb has a defined core (crisp,
    // not a blur) while keeping a little glow halo
    float core = pow(tex.a, 1.8);
    vec3 col = mix(uColor, uHot, clamp(vHover, 0.0, 1.0));
    float a = core * uOpacity * vBright * (1.0 + vHover * 2.2);
    gl_FragColor = vec4(col, a);
  }
`

function WaveField() {
  const { size } = useThree()
  const matRef = useRef()
  const cursor = useRef({ x: 0, y: 0, on: 0 })

  const { positions, rands } = useMemo(() => {
    const pos = new Float32Array(COLS * ROWS * 3)
    const rnd = new Float32Array(COLS * ROWS)
    let i = 0
    for (let r = 0; r < ROWS; r++) {
      const z = ZN + (ZF - ZN) * (r / (ROWS - 1))
      for (let c = 0; c < COLS; c++) {
        pos[i * 3]     = (c / (COLS - 1) - 0.5) * 2 * HW
        pos[i * 3 + 1] = 0
        pos[i * 3 + 2] = z
        rnd[i] = Math.random()
        i++
      }
    }
    return { positions: pos, rands: rnd }
  }, [])

  const uniforms = useMemo(() => ({
    uTime:     { value: 0 },
    uSize:     { value: 0.19 },   // small, crisp dots (a little glow, not a blur)
    uScale:    { value: size.height / 2 },
    uTex:      { value: getGlowDotTexture() },
    // Vivid, contrasty electric blue (low green so dense spots stay blue, never white).
    uColor:    { value: (() => { const c = new THREE.Color(); c.r = 0.10; c.g = 0.30; c.b = 1.35; return c })() },
    uHot:      { value: (() => { const c = new THREE.Color(); c.r = 0.6; c.g = 0.9; c.b = 1.8; return c })() },
    uOpacity:  { value: 0.8 },    // calmer — not overwhelming
    uCursor:   { value: new THREE.Vector2(0, 0) },
    uCursorOn: { value: 0 },
    uAspect:   { value: size.width / size.height },
  }), [])

  useEffect(() => {
    const onMove = (e) => {
      cursor.current.x = (e.clientX / window.innerWidth) * 2 - 1
      cursor.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
      cursor.current.on = 1
    }
    const onLeave = () => { cursor.current.on = 0 }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerleave', onLeave) }
  }, [])

  useFrame(({ clock }) => {
    const u = uniforms
    u.uTime.value = clock.getElapsedTime()
    u.uScale.value = size.height / 2
    u.uAspect.value = size.width / size.height
    u.uCursor.value.set(cursor.current.x, cursor.current.y)
    // Hover on the wave is disabled for now (per request); keep the plumbing so
    // it's a one-line re-enable later.
    u.uCursorOn.value = 0
    // Fade IN as the top-layer funnel→wave morph hands off (sec3 0.5 → 0.85), so
    // the behind-the-cards wave takes over seamlessly once Section 3 has settled.
    const sec3 = Math.min(1, Math.max(0, window.scrollY / window.innerHeight - 1))
    const f = Math.max(0, Math.min(1, (sec3 - 0.5) / 0.35))
    u.uOpacity.value = BASE_OPACITY * (f * f * (3 - 2 * f))
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRand" count={rands.length} array={rands} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function PricingWave() {
  // Only render while Section 3 (or anything below it) is on screen.
  const [active, setActive] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      // Render from partway through the carousel→Section-3 morph (so it's ready to
      // fade in) and keep it on for the rest of the page.
      const sec3 = Math.min(1, Math.max(0, window.scrollY / window.innerHeight - 1))
      setActive(sec3 > 0.2)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div id="wave-container" aria-hidden="true">
      <Canvas
        frameloop={active ? 'always' : 'never'}
        camera={{ position: [0, 0.15, 7.4], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <WaveField />
      </Canvas>
    </div>
  )
}
