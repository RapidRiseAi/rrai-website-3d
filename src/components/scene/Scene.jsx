import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import HeroOrb from './HeroOrb'

function FaintBackdropDots() {
  const positions = useMemo(() => {
    const count = 160
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 38
      arr[i * 3 + 1] = (Math.random() - 0.5) * 38
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16 - 12
    }
    return arr
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#0a1a30"
        sizeAttenuation
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  )
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0.15, 7.4], fov: 42 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.NoToneMapping,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
    >
      <FaintBackdropDots />
      <Suspense fallback={null}>
        <HeroOrb />
      </Suspense>
    </Canvas>
  )
}
