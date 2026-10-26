import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import Nav from './components/nav/Nav'
import PortfolioBackground from './components/background/PortfolioBackground'
import { HeroSection, AboutSection, ProjectsSection, SkillsSection, ContactSection } from './components/sections/PortfolioSections'
import Footer from './components/sections/Footer'
import Cursor from './components/cursor/Cursor'

/*
 * The portfolio itself: the page that runs inside the desktop's portfolio window (App.jsx, `?view=portfolio`).
 * It's the real site, in its own document: its own scrolling, links, nav and Background Paths.
 *
 * Escape asks the desktop around it to go back to the 3D desk: a key pressed in here never reaches the
 * page outside, so it's sent as a message (same origin only).
 */
const isTyping = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

export default function PortfolioPage() {
  useEffect(() => {
    if (window.parent === window) return
    const onKey = (e) => {
      if (e.key !== 'Escape' || isTyping(e.target) || document.querySelector('[aria-expanded="true"]')) return
      window.parent.postMessage({ type: 'kyuhan:escape' }, window.location.origin)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#about">Skip to content</a>
      <PortfolioBackground />
      <Nav ready />
      <main id="main">
        <HeroSection ready />
        <AboutSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>
      <Footer />
      <Cursor />
    </MotionConfig>
  )
}
