/* A window's controls: minimize, maximize / restore, close. Real buttons, labelled for assistive tech. */
export default function WindowControls({ title, maximized, onMinimize, onToggleMaximize, onClose }) {
  // pointerdown stops here, so a press on a control never starts a drag or reaches the window behind it
  const stop = (e) => e.stopPropagation()
  return (
    <div className="os-controls" onPointerDown={stop} onDoubleClick={stop}>
      <button type="button" className="os-control" aria-label={`Minimize ${title}`} title="Minimize" onClick={onMinimize}>
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
      </button>
      <button type="button" className="os-control" aria-label={`${maximized ? 'Restore' : 'Maximize'} ${title}`} title={maximized ? 'Restore' : 'Maximize'} onClick={onToggleMaximize}>
        {maximized ? (
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1"><rect x="2.5" y="4" width="5.5" height="5.5" rx="1" /><path d="M4.5 4V3.2a.7.7 0 0 1 .7-.7h3.6a.7.7 0 0 1 .7.7v3.6a.7.7 0 0 1-.7.7H8" /></svg>
        ) : (
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.1"><rect x="2.5" y="2.5" width="7" height="7" rx="1.2" /></svg>
        )}
      </button>
      <button type="button" className="os-control os-control--close" aria-label={`Close ${title}`} title="Close" onClick={onClose}>
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
      </button>
    </div>
  )
}
