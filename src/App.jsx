import { useState, useCallback } from 'react'
import Scene from './components/scene/Scene'
import Navbar from './components/ui/Navbar'
import HeroSection from './components/ui/HeroSection'
import ScrollSection from './components/ui/ScrollSection'
import LoadingScreen from './components/ui/LoadingScreen'
import useScrollSnap from './hooks/useScrollSnap'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const handleDone = useCallback(() => setLoaded(true), [])

  useScrollSnap()

  return (
    <>
      <LoadingScreen onDone={handleDone} />

      <Navbar loaded={loaded} />

      <div className="hero-atmosphere" />
      <div className="hero-noise" aria-hidden="true" />
      <div className="bg-floor-grid" aria-hidden="true" />

      <div id="canvas-container">
        <Scene />
      </div>

      <div id="scroll-content">
        <HeroSection loaded={loaded} />
        <ScrollSection
          index={0}
          title="Unified Intelligence"
          body="Every service in your stack communicates through a shared network — analytics inform automation, integrations feed AI, everything is connected."
        />
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
