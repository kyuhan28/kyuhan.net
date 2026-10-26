import TechLogo from './TechLogo'
import './apps.css'
import { palette } from './techIcons'
import { backgroundVars } from './backgrounds'

export function AppShell({ accent, bg, backdrop, className = '', children }) {
  const style = { ...(accent ? { '--app-accent': accent } : {}), ...(bg ? backgroundVars(bg) : {}) }
  const content = <div className={`app ${className}`}>{children}</div>
  return (
    <div className={`app-frame${bg ? ` app-frame--${bg}` : ''}`} style={style}>
      {backdrop ? backdrop(content) : (<>{bg && <div className="app-bg" aria-hidden="true" />}{content}</>)}
    </div>
  )
}

export function AppHeader({ eyebrow, title, children }) {
  return (
    <header className="app-header">
      {eyebrow && <p className="app-eyebrow">{eyebrow}</p>}
      <h1 className="app-title">{title}</h1>
      {children && <div className="app-lede">{children}</div>}
    </header>
  )
}

export function TechTag({ name, detail, as: Item = 'li' }) {
  const { soft } = palette(name)
  return (
    <Item className="tech-tag" style={{ '--tag': soft }}>
      <TechLogo name={name} />
      <span>{name}</span>
      {detail && <span className="tech-tag__detail">{detail}</span>}
    </Item>
  )
}

export function TagList({ names, limit, className = '', inline = false }) {
  const shown = limit ? names.slice(0, limit) : names
  const List = inline ? 'span' : 'ul', Item = inline ? 'span' : 'li'
  return (
    <List className={`tag-list ${className}`}>
      {shown.map((n) => <TechTag key={n} name={n} as={Item} />)}
      {limit && names.length > limit && <Item className="tag-more">+{names.length - limit}</Item>}
    </List>
  )
}

export function LinkButton({ href, children, primary = false, icon }) {
  if (!href) return null
  const external = /^https?:/i.test(href)
  return (
    <a className={`app-button${primary ? ' app-button--primary' : ''}`} href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {icon}<span>{children}</span>{external && <span className="app-button__ext" aria-hidden="true">↗</span>}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="app-empty" role="status">
      <p className="app-empty__title">{title}</p>
      {children && <p className="app-empty__text">{children}</p>}
    </div>
  )
}
