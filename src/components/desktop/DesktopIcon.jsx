import { AppTile } from './icons'

export default function DesktopIcon({ app, selected, onSelect, onOpen }) {
  return (
    <button type="button" className={`os-icon${selected ? ' is-selected' : ''}`} title={`Open ${app.short}`}
      aria-label={`Open ${app.short}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => { onSelect(); onOpen() }}>
      <AppTile name={app.icon} />
      <span className="os-icon__label">{app.short}</span>
    </button>
  )
}
