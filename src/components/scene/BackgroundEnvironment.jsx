import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'
import * as THREE from 'three'

function ParticleField() {
  const ref = useRef()

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02
    ref.current.rotation.x = state.clock.elapsedTime * 0.01
  })

  return (
    <group ref={ref}>
      <Stars radius={80} depth={50} count={4000} factor={4} saturation={0} fade speed={1} />
    </group>
  )
}

function GridPlane() {
  return (
    <gridHelper
      args={[40, 40, '#1e293b', '#0f172a']}
      position={[0, -4, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

function AtmosphereFog({ scrollProgress }) {
  const ref = useRef()

  useFrame(() => {
    if (!ref.current) return
    // Camera slow drift based on scroll
    ref.current.position.y = -scrollProgress * 3
  })

  return (
    <group ref={ref}>
      {/* Ambient glow spheres */}
      <mesh position={[-8, 2, -10]}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial color="#1e1b4b" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      <mesh position={[8, -2, -10]}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial color="#0c4a6e" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

export default function BackgroundEnvironment({ scrollProgress }) {
  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 15, 60]} />
      <ParticleField />
      <GridPlane />
      <AtmosphereFog scrollProgress={scrollProgress} />
    </>
  )
}
