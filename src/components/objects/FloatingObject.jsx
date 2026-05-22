import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'

export default function FloatingObject({
  position = [0, 0, 0],
  scale = 1,
  color = '#6366f1',
  delay = 0,
  scrollProgress = 0,
}) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

  // Scroll-driven rotation and position
  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = scrollProgress * Math.PI * 0.5 + state.clock.elapsedTime * 0.1
    meshRef.current.rotation.z = scrollProgress * Math.PI * 0.3
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.2
  })

  const handlePointerEnter = () => {
    setHovered(true)
    document.body.style.cursor = 'pointer'
    gsap.to(meshRef.current.scale, {
      x: scale * 1.25,
      y: scale * 1.25,
      z: scale * 1.25,
      duration: 0.4,
      ease: 'back.out(2)',
    })
  }

  const handlePointerLeave = () => {
    setHovered(false)
    document.body.style.cursor = 'default'
    if (!clicked) {
      gsap.to(meshRef.current.scale, {
        x: scale,
        y: scale,
        z: scale,
        duration: 0.4,
        ease: 'back.out(1.5)',
      })
    }
  }

  const handleClick = () => {
    setClicked((c) => !c)
    gsap.to(meshRef.current.rotation, {
      y: meshRef.current.rotation.y + Math.PI * 2,
      duration: 0.8,
      ease: 'power3.out',
    })
  }

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh
        ref={meshRef}
        position={position}
        scale={scale}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        castShadow
      >
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={hovered ? '#ffffff' : color}
          distort={hovered ? 0.5 : 0.2}
          speed={2}
          roughness={0.1}
          metalness={0.8}
          envMapIntensity={1}
        />
      </mesh>
    </Float>
  )
}
