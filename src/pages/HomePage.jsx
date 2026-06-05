import { useState, useCallback } from 'react'
import Scene from '../components/scene/Scene'
import Navbar from '../components/ui/Navbar'
import HeroSection from '../components/ui/HeroSection'
import ScrollSection from '../components/ui/ScrollSection'
import ExpertiseCarousel from '../components/ui/ExpertiseCarousel'
import FixedPricingSection from '../components/ui/FixedPricingSection'
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

      {/* Fixed atmospheric glow that lives BEHIND the wave (z-index 0). Eased in/
          out by the scroll handler so it's a calm, persistent background — not a
          foreground filter on the section. */}
      <div id="scene-atmosphere" aria-hidden="true" />

      <div id="canvas-container">
        <Scene />
      </div>

      <div id="scroll-content">
        <HeroSection loaded={loaded} />
        <ExpertiseCarousel />
        <FixedPricingSection />
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
