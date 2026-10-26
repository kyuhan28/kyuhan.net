import { palette, withBase } from './techIcons'

export default function TechLogo({ name, className = 'tech-logo' }) {
  const { icon } = palette(name)
  if (icon?.image) return <img className={className} src={withBase(icon.image)} alt="" />
  if (icon?.path) return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} /></svg>
  return <span className={`${className} tech-logo--dot`} aria-hidden="true" />
}
