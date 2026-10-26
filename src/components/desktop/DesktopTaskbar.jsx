import { forwardRef, useEffect, useState } from 'react'
import { APPS } from './apps'
import { WINDOW, isShown } from './desktopState'
import { AppIcon, Monogram } from './icons'

/** The local time, updated on the minute. */
function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let t
    const tick = () => { setNow(new Date()); t = setTimeout(tick, 60000 - (Date.now() % 60000) + 50) }
    t = setTimeout(tick, 60000 - (Date.now() % 60000) + 50)
    return () => clearTimeout(t)
  }, [])
  return (
    <time className="os-clock" dateTime={now.toISOString()} title={now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}>
      {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
    </time>
  )
}

/*
 * The taskbar: the launcher, one button per app (showing whether its window is open, active or minimized;
 * clicking reopens, restores, brings it forward, or minimizes it), and the tray: back to the 3D desk and the clock.
 */
const DesktopTaskbar = forwardRef(function DesktopTaskbar({ state, dispatch, onBackToDesk, buttonRefs }, startRef) {
  return (
    <nav className="os-taskbar" aria-label="Taskbar">
      <button ref={startRef} type="button" className={`os-start${state.startOpen ? ' is-pressed' : ''}`} aria-label="Start"
        aria-haspopup="menu" aria-expanded={state.startOpen} aria-controls="os-start-menu" onClick={() => dispatch({ type: 'toggleStart' })}>
        <Monogram />
      </button>
      <ul className="os-taskbar__apps">
        {APPS.map((app) => {
          const w = state.windows[app.id], active = isShown(w) && state.focused === app.id
          const label = w.state === WINDOW.CLOSED ? `Open ${app.title}` : w.state === WINDOW.MINIMIZED ? `Restore ${app.title}` : app.title
          return (
            <li key={app.id}>
              <button ref={(el) => { buttonRefs.current[app.id] = el }} type="button"
                className={`os-task is-${w.state}${active ? ' is-active' : ''}`} aria-label={label} aria-pressed={active}
                onClick={() => dispatch({ type: 'taskbar', id: app.id })}>
                <AppIcon name={app.icon} /><span className="os-task__label">{app.short}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="os-tray">
        {onBackToDesk && (
          <button type="button" className="os-tray__desk" onClick={onBackToDesk} aria-label="Back to the 3D desk" title="Back to the desk">
            <AppIcon name="desk" size={14} /><span>Desk</span>
          </button>
        )}
        <Clock />
      </div>
    </nav>
  )
})
export default DesktopTaskbar
