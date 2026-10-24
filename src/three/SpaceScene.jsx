import { useEffect, useRef, useState } from 'react'
import { createSpaceApp } from './space/SpaceApp'
import './scene.css'






export default function SpaceScene({ ready, reduce, interactive, compact, getAnchors, onHover, onReady, svg, skillsSvg }) {
  const host = useRef(null)
  const app = useRef(null)
  const [error, setError] = useState(null)
  const latest = useRef({ ready, reduce, interactive, getAnchors, onHover })
  latest.current = { ready, reduce, interactive, getAnchors, onHover }

  useEffect(() => {
    let cancelled = false
    let created = null
    createSpaceApp(host.current, { ...latest.current, compact, night: document.documentElement.classList.contains('dark'), svg, skillsSvg })
      .then((instance) => {
        if (cancelled) return instance.dispose()
        created = app.current = instance
        host.current.spaceApp = instance
        instance.update(latest.current)
        onReady?.()
      })
      .catch((e) => !cancelled && setError(e))
    return () => {
      cancelled = true
      created?.dispose()
      app.current = null
    }
  }, [compact])

  useEffect(() => {
    app.current?.update({ ready, reduce, interactive })
  }, [ready, reduce, interactive])


  useEffect(() => {
    const replay = () => app.current?.replay()
    window.addEventListener('space-replay', replay)
    return () => window.removeEventListener('space-replay', replay)
  }, [])

  // Day or night: follow the `dark` class the switch toggles on <html>.
  useEffect(() => {
    const root = document.documentElement
    const read = () => app.current?.update({ night: root.classList.contains('dark') })
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if (error) throw error
  return <div ref={host} className="space-host" />
}
