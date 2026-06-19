/**
 * ParticleWave — a wide, horizontal, premium particle wave field.
 *
 * A reusable decorative "environment" element built from the SAME orb /
 * particle language as HeroOrb & CarouselOverlay: glowing blue glow-dot
 * sprites, additive blending, screen-space sizing, electric-blue → cyan
 * palette. Instead of a sphere it lays the particles out as a tilted grid
 * that undulates like a slow digital wave, anchored to the bottom of its
 * parent section.
 *
 * Self-contained: renders its own transparent <Canvas>, so it can be dropped
 * behind any section's content:
 *
 *   <section style={{ position: 'relative', overflow: 'hidden' }}>
 *     <ParticleWave />
 *     ...content (z-index above)...
 *   </section>
 *
 * Tunable via props (height, intensity, colors, density…) so the same object
 * can be reused — softer or stronger — across the rest of the site.
 */

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Glow-dot texture — identical gradient to iconTextures.makeGlowDotTex so
   the wave reuses the exact same particle look (kept local so this component
   owns its own GPU texture and never shares state across canvases). ──────── */
function makeGlowDotTex() {
  const S = 64
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0.0,  'rgba(255,255,255,1.0)')
  g.addColorStop(0.15, 'rgba(200,240,255,0.95)')
  g.addColorStop(0.40, 'rgba(80,180,255,0.50)')
  g.addColorStop(0.70, 'rgba(0,90,220,0.15)')
  g.addColorStop(1.0,  'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  const tex = new THREE.CanvasTexture(c)
  return tex
}

/* ── Shaders ──────────────────────────────────────────────────────────────
   The vertex shader is the wave engine: a grid of points (u across width,
   v in depth) is displaced in Y by a sum of slow, broad sine octaves. It
   also derives a per-point glow (crests + pulsing accent nodes) and a fade
   (soft edges, far-depth recede) that the fragment shader turns into the
   electric-blue → cyan bloom. Pure sines → seamless, jitter-free loop. */
const WAVE_VERT = `
  uniform float uTime;
  uniform float uScale;      // viewport.height / 2 → screen-space point size
  uniform float uAmp;        // master wave amplitude (world units)
  uniform float uSize;       // base point size
  uniform float uAccentSize; // accent-node point size
  uniform float uLift;       // edge-lift amount (wave curls up at L/R edges)

  attribute vec2  aGrid;     // (u,v): u 0→1 across width, v 0 far → 1 near
  attribute float aRand;     // per-point random seed
  attribute float aAccent;   // 1.0 for brighter accent nodes, else 0.0

  varying float vGlow;
  varying float vFade;
  varying float vAccent;

  void main() {
    vec3 pos = position;
    float u = aGrid.x;
    float v = aGrid.y;
    float t = uTime;
    float x = pos.x;
    float z = pos.z;

    // Broad, smooth, multi-octave travelling wave (calm digital surface).
    float w =
        sin(x * 0.16 + t * 0.90) * 0.55
      + sin(x * 0.31 - z * 0.20 + t * 0.62) * 0.30
      + sin((x * 0.5 + z) * 0.18 + t * 0.45) * 0.22
      + sin(abs(x) * 0.22 + t * 0.55) * 0.18;   // gentle inward roll

    // Edges curl up slightly (wave "rises" from left & right).
    float edge = abs(u - 0.5) * 2.0;             // 0 centre → 1 edges
    float lift = edge * edge * uLift;

    pos.y += (w + lift) * uAmp;

    // Brightness: crests glow; accent nodes add a restrained slow pulse.
    float h = w / 1.25;                          // ~[-1,1]
    float crest = smoothstep(-0.10, 0.98, h);
    float pulse = 0.5 + 0.5 * sin(t * 1.30 + aRand * 6.2831);
    float accentGlow = aAccent * (0.45 + 0.55 * pulse);
    vGlow = clamp(crest * 0.60 + accentGlow, 0.0, 1.6);
    vAccent = aAccent;

    // Fades: soft L/R edges, far rows recede into background, near row eased.
    float edgeFade  = 1.0 - smoothstep(0.60, 1.0, edge);
    float depthFade = smoothstep(0.0, 0.24, v);
    float nearFade  = 1.0 - smoothstep(0.93, 1.0, v) * 0.35;
    vFade = edgeFade * depthFade * nearFade;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float sz = mix(uSize, uAccentSize, aAccent) * (1.0 + vGlow * 1.55);
    gl_PointSize = clamp(sz * (uScale / -mv.z), 0.0, 26.0);
    gl_Position = projectionMatrix * mv;
  }
`

const WAVE_FRAG = `
  uniform sampler2D uMap;
  uniform vec3  uColorDim;   // deep electric blue (troughs / far)
  uniform vec3  uColorBase;  // electric blue (mid)
  uniform vec3  uColorHot;   // cyan-white highlight (crests / accents)
  uniform float uOpacity;

  varying float vGlow;
  varying float vFade;
  varying float vAccent;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    if (tex.a < 0.01) discard;

    float g = clamp(vGlow, 0.0, 1.0);
    vec3 col = mix(uColorDim, uColorBase, g);
    col = mix(col, uColorHot, smoothstep(0.55, 1.10, vGlow));

    float a = tex.a * uOpacity * vFade * (0.32 + vGlow * 0.92);
    gl_FragColor = vec4(col * (1.0 + vGlow * 0.55), a);
  }
`

/* ── A single wave layer (one tilted grid of glow-dots) ───────────────────── */
function WaveLayer({
  cols, rows, spanX, zNear, zFar,
  amp, size, accentSize, speed, opacity, lift,
  colorDim, colorBase, colorHot,
  accentRate, phase, tex, timeScale,
}) {
  const { size: viewport } = useThree()

  const geom = useMemo(() => {
    const total = cols * rows
    const positions = new Float32Array(total * 3)
    const grid = new Float32Array(total * 2)
    const rand = new Float32Array(total)
    const accent = new Float32Array(total)
    let idx = 0
    for (let j = 0; j < rows; j++) {
      const v = rows === 1 ? 1 : j / (rows - 1)   // 0 far → 1 near
      const z = zFar + (zNear - zFar) * v
      for (let i = 0; i < cols; i++) {
        const u = cols === 1 ? 0.5 : i / (cols - 1)
        const x = -spanX + 2 * spanX * u
        positions[idx * 3]     = x
        positions[idx * 3 + 1] = 0
        positions[idx * 3 + 2] = z
        grid[idx * 2]     = u
        grid[idx * 2 + 1] = v
        rand[idx]   = Math.random()
        accent[idx] = Math.random() < accentRate ? 1 : 0
        idx++
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aGrid',    new THREE.BufferAttribute(grid, 2))
    g.setAttribute('aRand',    new THREE.BufferAttribute(rand, 1))
    g.setAttribute('aAccent',  new THREE.BufferAttribute(accent, 1))
    return g
  }, [cols, rows, spanX, zNear, zFar, accentRate])

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime:       { value: phase },
      uScale:      { value: viewport.height / 2 },
      uAmp:        { value: amp },
      uSize:       { value: size },
      uAccentSize: { value: accentSize },
      uLift:       { value: lift },
      uOpacity:    { value: opacity },
      uMap:        { value: tex },
      uColorDim:   { value: new THREE.Color(colorDim) },
      uColorBase:  { value: new THREE.Color(colorBase) },
      uColorHot:   { value: new THREE.Color(colorHot) },
    },
    vertexShader: WAVE_VERT,
    fragmentShader: WAVE_FRAG,
  }), [tex, amp, size, accentSize, lift, opacity, colorDim, colorBase, colorHot, phase, viewport.height])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value  = phase + clock.getElapsedTime() * speed * timeScale
    material.uniforms.uScale.value = viewport.height / 2
  })

  return <points geometry={geom} material={material} />
}

/* ── Scene contents ───────────────────────────────────────────────────────── */
function WaveField({ intensity, timeScale }) {
  const tex = useMemo(() => makeGlowDotTex(), [])

  return (
    <>
      {/* Far atmosphere layer — sparser, dimmer, softer, recessed in depth */}
      <WaveLayer
        tex={tex} timeScale={timeScale}
        cols={64} rows={16} spanX={9.4} zNear={-3.4} zFar={-10.5}
        amp={0.70} size={0.110} accentSize={0.19} speed={0.72} lift={0.55}
        opacity={0.40 * intensity} accentRate={0.05} phase={11.0}
        colorDim="#0e3f8e" colorBase="#2c79d8" colorHot="#74c6f5"
      />
      {/* Near hero layer — denser, brighter, crisper, defined accent nodes */}
      <WaveLayer
        tex={tex} timeScale={timeScale}
        cols={138} rows={30} spanX={8.2} zNear={2.2} zFar={-7.0}
        amp={0.92} size={0.078} accentSize={0.165} speed={1.0} lift={0.85}
        opacity={0.88 * intensity} accentRate={0.04} phase={0.0}
        colorDim="#1a5cba" colorBase="#3e9bf2" colorHot="#a6e9ff"
      />
    </>
  )
}

/* ── Public component ─────────────────────────────────────────────────────── */
export default function ParticleWave({
  height = '56%',
  intensity = 1,
  className = '',
  style,
}) {
  const reduce = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  const timeScale = reduce ? 0.12 : 1

  return (
    <div
      className={`particle-wave ${className}`.trim()}
      style={{ height, ...style }}
      aria-hidden="true"
    >
      {/* Soft blue bloom anchoring the wave into the page background. */}
      <div className="particle-wave__bloom" />
      <Canvas
        className="particle-wave__canvas"
        camera={{ position: [0, 2.2, 7.2], fov: 42, near: 0.1, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.NoToneMapping,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        onCreated={({ camera }) => camera.lookAt(0, -2.6, -2.0)}
        frameloop="always"
      >
        <WaveField intensity={intensity} timeScale={timeScale} />
      </Canvas>
    </div>
  )
}
