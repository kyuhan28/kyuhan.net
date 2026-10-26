import { AppTile } from './icons'

/*
 * A desktop icon: one click (or tap) opens its app, and selects the icon; Enter or Space opens it from the
 * keyboard (it's a button). Opening reopens a closed window, restores a minimized one, or brings an open one
 * to the front, so clicking again never makes a second window.
 */
export default function DesktopIcon({ app, selected, onSelect, onOpen }) {
  return (
    <button type="button" className={`os-icon${selected ? ' is-selected' : ''}`} title={`Open ${app.short}`}
      aria-label={`Open ${app.short}`}
      onPointerDown={(e) => e.stopPropagation()} // a press here isn't a press on the desktop (which clears the selection)
      onClick={() => { onSelect(); onOpen() }}>
      <AppTile name={app.icon} />
      <span className="os-icon__label">{app.short}</span>
    </button>
  )
}
