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

  const siteRef = useRef(null)
  const desk = useRef(null)
  const [view, setView] = useState('desk')
  const [deskFailed, setDeskFailed] = useState(false)
  const leaveDesk = useCallback(() => { setDeskFailed(true); setView('portfolio') }, [])
  const backToDesk = useCallback(() => desk.current?.back(), [])

  return (
    <MotionConfig reducedMotion="user">
      <Intro onReveal={onReveal} />
      {!deskFailed && <DeskExperience revealed={ready} siteRef={siteRef} controls={desk} onView={setView} onExit={leaveDesk} />}
      <div className="site" ref={siteRef} data-view={view}>
        <DesktopEnvironment onBackToDesk={deskFailed ? undefined : backToDesk} />
      </div>
      <Grain />
      <Cursor />
    </MotionConfig>
  )
}
