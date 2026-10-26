import { palette, withBase } from './techIcons'

/** A technology's logo (or a neutral dot if there's none), sized by the caller's CSS. */
export default function TechLogo({ name, className = 'tech-logo' }) {
  const { icon } = palette(name)
  if (icon?.image) return <img className={className} src={withBase(icon.image)} alt="" />
  if (icon?.path) return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} /></svg>
  return <span className={`${className} tech-logo--dot`} aria-hidden="true" />
}
