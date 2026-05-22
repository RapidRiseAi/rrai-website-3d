import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { PerformanceMonitor } from '@react-three/drei'
import Lights from './Lights'
import BackgroundEnvironment from './BackgroundEnvironment'
import FloatingObject from '../objects/FloatingObject'
import { useScrollProgress } from '../../hooks/useScrollProgress'

function SceneContents() {
  const scrollProgress = useScrollProgress()

  return (
    <>
      <Lights />
      <BackgroundEnvironment scrollProgress={scrollProgress} />
      <FloatingObject scrollProgress={scrollProgress} position={[0, 0, 0]} />
      <FloatingObject scrollProgress={scrollProgress} position={[-3, 1, -2]} scale={0.6} color="#a855f7" delay={0.3} />
      <FloatingObject scrollProgress={scrollProgress} position={[3, -1, -1]} scale={0.8} color="#06b6d4" delay={0.6} />
    </>
  )
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <PerformanceMonitor>
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </PerformanceMonitor>
    </Canvas>
  )
}
