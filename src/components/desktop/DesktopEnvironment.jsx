import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { APPS } from './apps'
import { desktopReducer, initialDesktop, isShown } from './desktopState'
import DesktopWallpaper from './DesktopWallpaper'
import DesktopIcon from './DesktopIcon'
import DesktopWindow from './DesktopWindow'
import DesktopTaskbar from './DesktopTaskbar'
import StartMenu from './StartMenu'
import { saveRects } from './windowMemory'
import './desktop.css'

export default function DesktopEnvironment({ onBackToDesk }) {
  const [state, dispatch] = useReducer(desktopReducer, undefined, initialDesktop)
  const workspace = useRef(null)
  const startRef = useRef(null)
  const buttonRefs = useRef({})
  const windowRefs = useRef({})
  const [size, setSize] = useState({ w: 1280, h: 720 })
  const [origins, setOrigins] = useState({})

  const [launched, setLaunched] = useState(() => new Set(APPS.filter((a) => a.openAtStart).map((a) => a.id)))
  useEffect(() => {
    const open = APPS.filter((a) => state.windows[a.id].state !== 'closed' && !launched.has(a.id))
    if (open.length) setLaunched((s) => new Set([...s, ...open.map((a) => a.id)]))
  }, [state.windows, launched])

  useLayoutEffect(() => {
    const el = workspace.current
    const measure = () => setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const next = {}
    for (const app of APPS) {
      const w = windowRefs.current[app.id]?.firstElementChild, b = buttonRefs.current[app.id]
      if (!w || !b) continue
      const wr = w.getBoundingClientRect(), br = b.getBoundingClientRect()
      next[app.id] = { x: br.left + br.width / 2 - wr.left, y: br.top + br.height / 2 - wr.top }
    }
    setOrigins(next)
  }, [state.windows])

  useEffect(() => {
    saveRects(Object.fromEntries(Object.entries(state.windows).filter(([, w]) => w.rect).map(([id, w]) => [id, w.rect])))
  }, [state.windows])

  useEffect(() => {
    const onBlur = () => setTimeout(() => {
      const id = document.activeElement?.dataset?.appId
      if (id) dispatch({ type: 'focus', id })
    })
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [])

  const open = useCallback((id) => dispatch({ type: 'open', id }), [])
  const topId = [...state.order].reverse().find((id) => isShown(state.windows[id]))

  return (
    <div className="os" data-start-open={state.startOpen || undefined}>
      <div className="os-desktop" ref={workspace} onPointerDown={(e) => { if (e.target === e.currentTarget || e.target.closest('.os-wallpaper')) dispatch({ type: 'selectIcon', icon: null }) }}>
        <DesktopWallpaper />
        <ul className="os-icons" aria-label="Desktop">
          {APPS.map((app) => (
            <li key={app.id}>
              <DesktopIcon app={app} selected={state.selectedIcon === app.id}
                onSelect={() => dispatch({ type: 'selectIcon', icon: app.id })} onOpen={() => open(app.id)} />
            </li>
          ))}
        </ul>
        {APPS.map((app) => {
          const Content = app.component
          const win = state.windows[app.id]
          const rect = win.rect ?? app.defaultRect(size.w, size.h)
          return (
            <div key={app.id} ref={(el) => { windowRefs.current[app.id] = el }} className="os-window-layer">
              <DesktopWindow app={app} win={win} rect={rect} focused={topId === app.id && state.focused === app.id}
                z={10 + state.order.indexOf(app.id)} minimizeTo={origins[app.id]} workspace={workspace} dispatch={dispatch}>
                {launched.has(app.id) && <Content title={app.title} visible={isShown(win)} />}
              </DesktopWindow>
            </div>
          )
        })}
      </div>
      <StartMenu open={state.startOpen} dispatch={dispatch} onBackToDesk={onBackToDesk} startRef={startRef} />
      <DesktopTaskbar ref={startRef} state={state} dispatch={dispatch} onBackToDesk={onBackToDesk} buttonRefs={buttonRefs} />
    </div>
  )
}
