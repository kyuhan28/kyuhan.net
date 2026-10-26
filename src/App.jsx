import { useCallback, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import Intro from './components/intro/Intro'
import DeskExperience from './components/desk/DeskExperience'
import DesktopEnvironment from './components/desktop/DesktopEnvironment'
import Cursor from './components/cursor/Cursor'
import Grain from './components/ambient/Grain'

export default function App() {
  const [ready, setReady] = useState(false)
  const onReveal = useCallback(() => setReady(true), [])
  // The opening 3D workspace. Its monitor shows the simulated desktop (siteRef), with the portfolio open in
  // a window; entering the screen makes the desktop the page. If 3D can't start, the desktop is the page.
  const siteRef = useRef(null)
  const desk = useRef(null) // what the desk offers the desktop: { back } (back to the 3D desk)
  const [view, setView] = useState('desk') // 'desk' or 'portfolio'
  const [deskFailed, setDeskFailed] = useState(false)
  const leaveDesk = useCallback(() => { setDeskFailed(true); setView('portfolio') }, [])
  const backToDesk = useCallback(() => desk.current?.back(), [])

  return (
    <MotionConfig reducedMotion="user">
      <Intro onReveal={onReveal} />
      {!deskFailed && <DeskExperience revealed={ready} siteRef={siteRef} controls={desk} onView={setView} onExit={leaveDesk} />}
      {/* The simulated computer: on the monitor first, then the page itself. */}
      <div className="site" ref={siteRef} data-view={view}>
        <DesktopEnvironment onBackToDesk={deskFailed ? undefined : backToDesk} />
      </div>
      <Grain />
      <Cursor />
    </MotionConfig>
  )
}
