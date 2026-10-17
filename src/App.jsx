import { useCallback, useState } from 'react'
import { MotionConfig } from 'motion/react'
import Intro from './components/intro/Intro'
import Nav from './components/nav/Nav'
import World from './components/world/World'
import { HeroSection, AboutSection, ProjectsSection, SkillsSection, ContactSection } from './components/sections/PortfolioSections'
import Footer from './components/sections/Footer'
import Cursor from './components/cursor/Cursor'
import Grain from './components/ambient/Grain'

export default function App() {
  // `ready` flips when the loader opens onto the world, and starts the opening shot.
  const [ready, setReady] = useState(false)
  const onReveal = useCallback(() => setReady(true), [])

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#about">Skip to content</a>
      <Intro onReveal={onReveal} />
      <World ready={ready} />
      <Nav ready={ready} />
      <main id="main">
        <HeroSection ready={ready} />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>
      <Footer />
      <Grain />
      <Cursor />
    </MotionConfig>
  )
}
