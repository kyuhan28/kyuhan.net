import { motion } from 'motion/react'
import { palette, withBase } from '../../apps/shared/techIcons'
import { ease } from '../../motion/tokens'
import './techstack.css'

/*
 * Your technical skills as brand-colored badges with logos, grouped by area (the classic portfolio page).
 * Logos and colors: src/apps/shared/techIcons.js (shared with the desktop's apps).
 */

function Badge({ name, index }) {
  const { icon, brand, soft, on } = palette(name)
  return (
    <motion.li
      className="tech__badge"
      style={{ '--brand': brand, '--soft': soft, '--on': on }}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, ease: ease.out, delay: index * 0.03 }}
    >
      {icon?.image ? (
        <img className="tech__logo" src={withBase(icon.image)} alt="" width="14" height="14" />
      ) : icon?.path ? (
        <svg className="tech__logo" viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} /></svg>
      ) : (
        <span className="tech__dot" aria-hidden="true" />
      )}
      <span className="tech__name">{name}</span>
    </motion.li>
  )
}

// A group's technologies: its `tech` list, or its `detail` line split at the commas.
const listOf = (area) => (area.tech?.length ? area.tech : String(area.detail || '').split(',')).map((t) => t.trim()).filter(Boolean)

export default function TechStack({ areas }) {
  return (
    <div className="tech-areas">
      {areas.map((area) => (
        <div key={area.area} className="tech-area">
          <h4 className="pf-area__name">{area.area}</h4>
          <ul className="tech" aria-label={area.area}>
            {listOf(area).map((name, i) => <Badge key={name} name={name} index={i} />)}
          </ul>
        </div>
      ))}
    </div>
  )
}
