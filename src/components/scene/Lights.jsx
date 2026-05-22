export default function Lights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[-10, -5, -5]} color="#a855f7" intensity={2} />
      <pointLight position={[10, 5, 5]} color="#06b6d4" intensity={1.5} />
      <spotLight
        position={[0, 15, 0]}
        angle={0.4}
        penumbra={1}
        intensity={2}
        castShadow
      />
    </>
  )
}
