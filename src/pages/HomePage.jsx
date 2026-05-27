import { useState, useCallback } from 'react'
import Scene from '../components/scene/Scene'
import Navbar from '../components/ui/Navbar'
import HeroSection from '../components/ui/HeroSection'
import ScrollSection from '../components/ui/ScrollSection'
import ExpertiseCarousel from '../components/ui/ExpertiseCarousel'
import LoadingScreen from '../components/ui/LoadingScreen'
import useScrollSnap from '../hooks/useScrollSnap'

export default function HomePage() {
  const [loaded, setLoaded] = useState(false)
  const handleDone = useCallback(() => setLoaded(true), [])

  useScrollSnap()

  return (
    <>
      <LoadingScreen onDone={handleDone} />

      <Navbar loaded={loaded} />

      {/* Shadow sits in the same z-index layer as the canvas but EARLIER in DOM,
          so the canvas composites over it. Transparent canvas pixels (background)
          reveal the shadow; opaque canvas pixels (sphere/cube) paint on top of it.
          Result: sphere and cube genuinely layer above the shadow. */}
      <div id="ec-global-shadow" aria-hidden="true" />

      <div id="canvas-container">
        <Scene />
      </div>

      <div id="scroll-content">
        <HeroSection loaded={loaded} />
        <ExpertiseCarousel />
        <ScrollSection
          index={1}
          title="Real-Time Automation"
          body="Triggers, workflows, and intelligent agents respond to your data as it moves, removing the friction between insight and action."
        />
        <ScrollSection
          index={2}
          title="Built to Scale"
          body="The ecosystem grows with you. Add new tools, services, and integrations without breaking what's already working."
        />
      </div>
    </>
  )
}
