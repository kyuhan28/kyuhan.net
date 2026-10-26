import { useEffect, useRef } from 'react'
import { APPS } from './apps'
import { AppIcon } from './icons'

export default function StartMenu({ open, dispatch, onBackToDesk, startRef }) {
  const menu = useRef(null)
  useEffect(() => {
    if (!open) return
    const items = () => [...menu.current.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')]
    items()[0]?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { dispatch({ type: 'closeStart' }); startRef.current?.focus() }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const list = items(), i = list.indexOf(document.activeElement)
        list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus()
      }
    }
    const onDown = (e) => { if (!menu.current.contains(e.target) && !startRef.current?.contains(e.target)) dispatch({ type: 'closeStart' }) }
    const onBlur = () => setTimeout(() => { if (document.activeElement?.tagName === 'IFRAME') dispatch({ type: 'closeStart' }) })
    window.addEventListener('keydown', onKey); window.addEventListener('pointerdown', onDown); window.addEventListener('blur', onBlur)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown); window.removeEventListener('blur', onBlur) }
  }, [open, dispatch, startRef])
  return (
    <div id="os-start-menu" ref={menu} className="os-start-menu" role="menu" aria-label="Start" hidden={!open}>
      <p className="os-start-menu__head">Kyu Han</p>
      {APPS.map((app) => (
        <button key={app.id} type="button" role="menuitem" className="os-start-menu__item" onClick={() => dispatch({ type: 'open', id: app.id })}>
          <AppIcon name={app.icon} size={18} /><span>{app.short}</span>
        </button>
      ))}
      <p className="os-start-menu__soon" role="note">More apps coming soon</p>
      {onBackToDesk && (
        <>
          <span className="os-start-menu__rule" role="separator" />
          <button type="button" role="menuitem" className="os-start-menu__item" onClick={() => { dispatch({ type: 'closeStart' }); onBackToDesk() }}>
            <AppIcon name="desk" size={18} /><span>Back to the desk</span>
          </button>
        </>
      )}
    </div>
  )
}
