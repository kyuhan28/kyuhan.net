/**
 * @author: @dorianbaffier
 * @description: Switch Button
 * @version: 2.0.0
 * @date: 2026-10-16
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */
import { useEffect, useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import './switch-button.css'

const cn = (...c) => c.filter(Boolean).join(' ')
const SIZES = { sm: { cls: 'ksb--sm', icon: 14 }, default: { cls: 'ksb--md', icon: 16 }, lg: { cls: 'ksb--lg', icon: 18 } }
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)'
const EASE_REVEAL = 'cubic-bezier(0.4, 0, 0.2, 1)'
const REVEAL_ATTR = 'data-theme-reveal'
const REVEAL_STYLE_ID = 'kokonut-theme-reveal'
const REVEAL_CSS = `html[${REVEAL_ATTR}]::view-transition-old(root),html[${REVEAL_ATTR}]::view-transition-new(root){animation:none;mix-blend-mode:normal}`

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
  const rad = (deg * Math.PI) / 180
  const at = (r) => ({ x: Number((12 + r * Math.cos(rad)).toFixed(2)), y: Number((12 + r * Math.sin(rad)).toFixed(2)) })
  return { deg, from: at(7.5), to: at(10) }
})

const ANIMATED_PROPS = ['opacity', 'scale', 'translate', 'filter']
function snapshot(elements) {
  const map = new Map()
  for (const el of elements) {
    const style = getComputedStyle(el)
    const frame = { offset: 0 }
    for (const prop of ANIMATED_PROPS) frame[prop] = style.getPropertyValue(prop)
    map.set(el, frame)
    for (const animation of el.getAnimations()) animation.cancel()
  }
  return map
}
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
function ensureRevealStyle() {
  if (document.getElementById(REVEAL_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = REVEAL_STYLE_ID
  style.textContent = REVEAL_CSS
  document.head.appendChild(style)
}
function timing(el, toDark) {
  const { part, index = '0' } = el.dataset
  const i = Number(index)
  switch (part) {
    case 'ray':
      return { delay: toDark ? i * 18 : 140 + i * 22, duration: 260, easing: EASE_OUT }
    case 'bite': return { delay: toDark ? 60 : 0, duration: 380, easing: EASE_IN_OUT }
    case 'disc': return { delay: toDark ? 40 : 0, duration: 380, easing: EASE_OUT }
    default: return { duration: 240, easing: EASE_OUT }
  }
}
function morph(from, toDark) {
  if (prefersReducedMotion()) return
  for (const [el, frame] of from) el.animate([frame, {}], { ...timing(el, toDark), fill: 'backwards' })
}

let revealRunning = false
function revealFrom(button, apply) {
  const doc = document
  if (typeof doc.startViewTransition !== 'function' || prefersReducedMotion() || revealRunning || doc.activeViewTransition) { apply(); return }
  const rect = button.getBoundingClientRect()
  const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const root = document.documentElement
  ensureRevealStyle()
  root.setAttribute(REVEAL_ATTR, '')
  revealRunning = true
  let transition, guard = 0
  try {
    transition = doc.startViewTransition(() => { clearTimeout(guard); flushSync(apply) })
    guard = setTimeout(() => transition.skipTransition?.(), 700)
  } catch { root.removeAttribute(REVEAL_ATTR); revealRunning = false; apply(); return }
  transition.ready
    .then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 500, easing: EASE_REVEAL, pseudoElement: '::view-transition-new(root)' })
    })
    .catch(() => {})
  transition.finished.catch(() => {}).finally(() => { root.removeAttribute(REVEAL_ATTR); revealRunning = false })
}

export default function SwitchButton({ className, size = 'default', showLabel = true, theme, onThemeChange, reveal = true, labels = ['Light', 'Dark'], onClick, ...props }) {
  const maskId = `${useId()}-moon`
  const iconRef = useRef(null)
  const labelRef = useRef(null)
  const controlled = theme !== undefined && typeof onThemeChange === 'function'
  const [observed, setObserved] = useState(null)

  useEffect(() => {
    if (controlled) return undefined
    const root = document.documentElement
    const read = () => setObserved(root.classList.contains('dark') ? 'dark' : 'light')
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [controlled])

  const current = controlled ? theme : observed
  const sizing = SIZES[size] || SIZES.default

  const handleClick = (e) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    const root = document.documentElement
    const from = controlled ? theme : root.classList.contains('dark') ? 'dark' : 'light'
    const next = from === 'dark' ? 'light' : 'dark'
    const button = e.currentTarget
    const apply = () => {
      const parts = [...(iconRef.current?.querySelectorAll('[data-part]') ?? []), ...(labelRef.current?.querySelectorAll('[data-part]') ?? [])]
      const before = snapshot(parts)
      button.dataset.theme = next
      if (!controlled) { root.classList.toggle('dark', next === 'dark'); root.style.colorScheme = next }
      onThemeChange?.(next)
      morph(before, next === 'dark')
    }
    if (reveal) revealFrom(button, apply)
    else apply()
  }

  return (
    <button aria-label={`${labels[1]}`} aria-pressed={current ? current === 'dark' : undefined}
      className={cn('ksb', sizing.cls, !showLabel && 'ksb--square', className)} data-theme={current || undefined}
      type="button" {...props} onClick={handleClick}>
      <svg aria-hidden="true" className="ksb__icon" fill="none" height={sizing.icon} ref={iconRef} viewBox="0 0 24 24" width={sizing.icon}>
        <mask id={maskId}>
          <rect fill="white" height="32" width="32" x="-4" y="-4" />
          <circle className="ksb__bite" cx="17" cy="7" data-part="bite" fill="black" r="7.5" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <circle className="ksb__disc" cx="12" cy="12" data-part="disc" fill="currentColor" r="4.75" />
        </g>
        <g stroke="currentColor" strokeLinecap="round" strokeWidth="2">
          {RAYS.map((ray, index) => (
            <line className="ksb__ray" data-index={index} data-part="ray" key={ray.deg} x1={ray.from.x} x2={ray.to.x} y1={ray.from.y} y2={ray.to.y} />
          ))}
        </g>
      </svg>
      {showLabel && (
        <span aria-hidden="true" className="ksb__labels" ref={labelRef}>
          <span className="ksb__label ksb__label--light" data-part="label">{labels[0]}</span>
          <span className="ksb__label ksb__label--dark" data-part="label">{labels[1]}</span>
        </span>
      )}
    </button>
  )
}
