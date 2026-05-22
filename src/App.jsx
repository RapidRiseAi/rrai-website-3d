import { useEffect, useRef } from 'react'
import Scene from './components/scene/Scene'
import HeroSection from './components/ui/HeroSection'
import ScrollSection from './components/ui/ScrollSection'

export default function App() {
  return (
    <>
      {/* Fixed 3D canvas — always in background */}
      <div id="canvas-container">
        <Scene />
      </div>

      {/* Scrollable content layers on top */}
      <div id="scroll-content">
        <HeroSection />
        <ScrollSection
          index={0}
          title="Interact"
          body="Hover and click the objects above to trigger animations."
        />
        <ScrollSection
          index={1}
          title="Explore"
          body="The environment reacts as you scroll through the page."
        />
        <ScrollSection
          index={2}
          title="Build"
          body="This scaffold is ready — start adding your own 3D objects and sections."
        />
      </div>
    </>
  )
}
