import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFinePointer, useIsCompact, usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { hasWebGL } from '../../lib/webgl'
import { complete } from '../../lib/loading'
import { pageTop } from '../../lib/dom'
import SceneBoundary from '../../three/SceneBoundary'
import SceneFallback from '../../three/SceneFallback'
import { STATION_IDS } from '../../three/space/camera'
import './world.css'


const SpaceScene = lazy(() => import('../../three/SpaceScene'))






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



  const getAnchors = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const header = document.querySelector('.nav')?.offsetHeight ?? 72
    return STATION_IDS.map((id, i) => {
      const el = document.getElementById(id)
      if (!el || i === 0) return 0
      return Math.min(max, Math.max(0, pageTop(el) - header))
    })
  }, [])



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
