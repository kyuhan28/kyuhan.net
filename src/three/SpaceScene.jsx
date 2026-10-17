import { useEffect, useRef, useState } from 'react'
import { createSpaceApp } from './space/SpaceApp'
import './scene.css'

/*
 * Hosts the Infinite Space environment (plain three.js, see ./space/SpaceApp.js) inside React.
 * The scene is created once; later prop changes go through update(). If WebGL fails, the error is
 * thrown during render so the surrounding error boundary shows the still instead.
 */
export default function SpaceScene({ ready, reduce, interactive, compact, getAnchors, onHover, onReady }) {
  const host = useRef(null)
  const app = useRef(null)
  const [error, setError] = useState(null)
  const latest = useRef({ ready, reduce, interactive, getAnchors, onHover })
  latest.current = { ready, reduce, interactive, getAnchors, onHover }

  useEffect(() => {
    let cancelled = false
    let created = null
    createSpaceApp(host.current, { ...latest.current, compact })
      .then((instance) => {
        if (cancelled) return instance.dispose()
        created = app.current = instance
        host.current.spaceApp = instance // reachable from the console for diagnosis: $('.space-host').spaceApp.stats()
        instance.update(latest.current)
        onReady?.()
      })
      .catch((e) => !cancelled && setError(e))
    return () => {
      cancelled = true
      created?.dispose()
      app.current = null
    }
  }, [compact]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    app.current?.update({ ready, reduce, interactive })
  }, [ready, reduce, interactive])

  // "Replay experience" anywhere on the page sends the camera back to the opening shot.
  useEffect(() => {
    const replay = () => app.current?.replay()
    window.addEventListener('space-replay', replay)
    return () => window.removeEventListener('space-replay', replay)
  }, [])

  if (error) throw error
  return <div ref={host} className="space-host" />
}
