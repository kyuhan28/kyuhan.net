import { motion } from 'motion/react'
import icons from '../../content/tech-icons.json'
import { ease } from '../../motion/tokens'
import './techstack.css'

/*
 * Your technical skills as brand-colored badges with logos, grouped by area.
 *
 * Logos and colors come from src/content/tech-icons.json, written by `npm run icons` (see
 * scripts/build-tech-icons.mjs). A technology without a logo still gets a badge, in neutral gray.
 * Very dark brand colors are lightened so they read on black; on hover each badge fills with its
 * full brand color, with black or white text, whichever reads better.
 */

const NEUTRAL = '#8b8b96'

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const lighten = (hex, amount) => toHex(rgb(hex).map((v) => v + (255 - v) * amount))

function palette(name) {
  const icon = icons[name]
  const brand = icon ? `#${icon.hex}` : NEUTRAL
  const L = luminance(brand)
  return {
    icon,
    brand,
    soft: L < 0.06 ? lighten(brand, 0.6) : L < 0.14 ? lighten(brand, 0.35) : brand, // readable on black
    on: L > 0.4 ? '#000000' : '#ffffff', // text on the filled (hovered) badge
  }
}

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
      {icon ? (
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
