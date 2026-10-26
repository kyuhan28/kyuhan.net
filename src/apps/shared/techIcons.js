import fetched from '../../content/tech-icons.json'
import extra from '../../content/tech-icons-extra.json'

const NEUTRAL = '#8b8b96'
const icons = { ...fetched, ...extra }
export const withBase = (src) => (src.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : src)

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const toHex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const lighten = (hex, amount) => toHex(rgb(hex).map((v) => v + (255 - v) * amount))

export function palette(name) {
  const icon = icons[name]
  const brand = icon ? `#${icon.hex}` : NEUTRAL
  const L = luminance(brand)
  return {
    icon,
    brand,
    soft: L < 0.06 ? lighten(brand, 0.6) : L < 0.14 ? lighten(brand, 0.35) : brand,
    on: L > 0.4 ? '#000000' : '#ffffff',
  }
}
