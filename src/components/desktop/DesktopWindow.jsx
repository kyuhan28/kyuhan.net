import { useRef } from 'react'
import WindowControls from './WindowControls'
import { AppIcon } from './icons'
import { WINDOW } from './desktopState'

const HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi))
const pct = (f) => `${(f * 100).toFixed(4)}%`

export default function DesktopWindow({ app, win, rect, focused, z, minimizeTo, workspace, dispatch, children }) {
  const ref = useRef(null)
  const shown = win.state === WINDOW.NORMAL || win.state === WINDOW.MAXIMIZED
  const maximized = win.state === WINDOW.MAXIMIZED
  const id = app.id

  const gesture = (e, kind) => {
    if (win.state !== WINDOW.NORMAL || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    dispatch({ type: 'focus', id })
    const el = ref.current, handle = e.currentTarget
    const box = workspace.current.getBoundingClientRect()
    const W = box.width, H = box.height
    const minW = Math.min(app.minWidth / W, 1), minH = Math.min(app.minHeight / H, 1)
    const from = { px: e.clientX, py: e.clientY }
    const start = { ...rect }
    let cur = { ...rect }
    el.classList.add('is-gesturing', kind === 'move' ? 'is-moving' : 'is-resizing')
    handle.setPointerCapture(e.pointerId)
    const move = (ev) => {
      const dx = (ev.clientX - from.px) / W, dy = (ev.clientY - from.py) / H
      let { x, y, w, h } = start
      if (kind === 'move') {
        x = clamp(x + dx, 0, 1 - w); y = clamp(y + dy, 0, 1 - h)
      } else {
        if (kind.includes('e')) w = clamp(w + dx, minW, 1 - x)
        if (kind.includes('s')) h = clamp(h + dy, minH, 1 - y)
        if (kind.includes('w')) { const nx = clamp(x + dx, 0, x + w - minW); w += x - nx; x = nx }
        if (kind.includes('n')) { const ny = clamp(y + dy, 0, y + h - minH); h += y - ny; y = ny }
      }
      cur = { x, y, w, h }
      Object.assign(el.style, { left: pct(x), top: pct(y), width: pct(w), height: pct(h) })
    }
    const end = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
      handle.removeEventListener('lostpointercapture', end)
      el.classList.remove('is-gesturing', 'is-moving', 'is-resizing')
      dispatch({ type: 'setRect', id, rect: cur })
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
    handle.addEventListener('lostpointercapture', end)
  }

  const origin = minimizeTo ? `${minimizeTo.x}px ${minimizeTo.y}px` : '50% 100%'
  const style = maximized
    ? { zIndex: z, transformOrigin: origin }
    : { zIndex: z, transformOrigin: origin, left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) }
  return (
    <section ref={ref} className={`os-window is-${win.state}${focused ? ' is-focused' : ''}`} aria-label={app.title} inert={!shown}
      style={style} onPointerDown={() => dispatch({ type: 'focus', id })}>
      <header className="os-window__bar" onPointerDown={(e) => gesture(e, 'move')} onDoubleClick={() => dispatch({ type: 'toggleMaximize', id })}>
        <AppIcon name={app.icon} />
        <h2 className="os-window__title">{app.title}</h2>
        <WindowControls title={app.title} maximized={maximized}
          onMinimize={() => dispatch({ type: 'minimize', id })}
          onToggleMaximize={() => dispatch({ type: 'toggleMaximize', id })}
          onClose={() => dispatch({ type: 'close', id })} />
      </header>
      <div className="os-window__body">{children}</div>
      {!maximized && HANDLES.map((h) => (
        <span key={h} className={`os-rz os-rz--${h}`} aria-hidden="true" onPointerDown={(e) => { e.stopPropagation(); gesture(e, h) }} />
      ))}
    </section>
  )
}
