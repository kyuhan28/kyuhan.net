import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFinePointer, useIsCompact, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { hasWebGL } from '../../lib/webgl'
import { complete } from '../../lib/loading'
import { pageTop } from '../../lib/dom'
import SceneBoundary from '../../three/SceneBoundary'
import SceneFallback from '../../three/SceneFallback'
import { STATION_IDS } from '../../three/space/camera'
import './world.css'

// three.js loads in its own chunk, so the page's text never waits on it.
const SpaceScene = lazy(() => import('../../three/SpaceScene'))

/*
 * The world behind the whole page: a fixed full-screen scene that the page scrolls over.
 * Each section's arrival is a camera station; the label follows the cursor (or the tap) when it's
 * over a sculpture.
 */
export default function World({ ready }) {
  const reduce = usePrefersReducedMotion()
  const fine = useFinePointer()
  const compact = useIsCompact()
  const [webgl] = useState(() => hasWebGL())
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [label, setLabel] = useState(null)
  const tip = useRef(null)

  useEffect(() => { if (!webgl) complete('scene') }, [webgl])

  // The stations, as scroll positions: where each section's top arrives under the header, which is
  // exactly where the header's links land. Reading on glides the camera toward the next station.
  const getAnchors = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const header = document.querySelector('.nav')?.offsetHeight ?? 72
    return STATION_IDS.map((id, i) => {
      const el = document.getElementById(id)
      if (!el || i === 0) return 0
      return Math.min(max, Math.max(0, pageTop(el) - header))
    })
  }, [])

  // The label follows the pointer without re-rendering React on every move, and flips to the other
  // side of the pointer near the screen's edges so it's never cut off.
  const pointer = useRef({ x: 0, y: 0 })
  const place = useCallback(() => {
    const el = tip.current
    if (!el) return
    const { x: px, y: py } = pointer.current
    const w = el.offsetWidth, h = el.offsetHeight, gap = 18
    const x = px + gap + w > window.innerWidth - 8 ? px - gap - w : px + gap
    const y = py + gap + h > window.innerHeight - 8 ? py - gap - h : py + gap
    el.style.transform = `translate3d(${Math.max(8, x)}px, ${Math.max(8, y)}px, 0)`
  }, [])
  // When the label's text changes its size changes too: measure and place it again before paint.
  useLayoutEffect(place, [label, place])
  useEffect(() => {
    const move = (e) => { pointer.current = { x: e.clientX, y: e.clientY }; place() }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', move, { passive: true })
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', move) }
  }, [place])

  const live = webgl && !failed
  return (
    <div className="world" aria-hidden="true">
      <div className={`world__scene ${loaded ? 'is-loaded' : ''}`}>
        <SceneFallback />
        {live && (
          <SceneBoundary fallback={null} onError={() => { setFailed(true); complete('scene') }}>
            <Suspense fallback={null}>
              <SpaceScene
                ready={ready}
                reduce={reduce}
                interactive={fine && !reduce}
                compact={compact}
                getAnchors={getAnchors}
                onHover={setLabel}
                onReady={() => { setLoaded(true); complete('scene') }}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div ref={tip} className={`world__tip ${label ? 'is-on' : ''}`}>
        {label && (<><strong>{label.label}</strong><span>{label.description}</span></>)}
      </div>
    </div>
  )
}
