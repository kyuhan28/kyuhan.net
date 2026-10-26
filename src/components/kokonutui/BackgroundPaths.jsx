/**
 * @author: @dorianbaffier
 * @description: Background Paths
 * @version: 2.0.0
 * @date: 2026-10-14
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * Ported for this project from the Kokonut UI registry (https://kokonutui.com/r/background-paths.json):
 * the same ribbon of lines, the same flow, entrance, parting and reduced-motion behavior, written in
 * JavaScript with its Tailwind classes as plain CSS (background-paths.css).
 *
 * Adaptations for this site (the page can be shown on a 3D monitor through a CSS transform, and its content
 * covers the background):
 *   1. The canvas is sized from its layout size (clientWidth / clientHeight), not getBoundingClientRect(),
 *      which reports the *transformed* size (the canvas would stay low-resolution after entering).
 *   2. The cursor is heard across the whole page (not only on this element, which the content covers) and
 *      converted into the canvas's own coordinates, un-projecting any CSS transform on the way, so the
 *      lines part right under the cursor, on the monitor too. Outside the canvas, or when the cursor leaves
 *      the window, the opening closes.
 *   3. The cursor position is smoothed, so the opening glides after it rather than jumping, and starts
 *      at the cursor rather than sweeping in from a corner.
 *
 * Props: className, children (content over the lines; null for a bare background), count (42),
 * spread (1), angle (-8 degrees), speed (1; 0 holds it still), interactive (true: lines part around the cursor).
 */
import { useEffect, useRef } from 'react'
import './background-paths.css'

const cn = (...classes) => classes.filter(Boolean).join(' ')

const SAMPLES = 64
/** Lines reach this far past each side, so their ends never show. */
const OVERSCAN = 0.06
const DRAW_MS = 1400
const DRAW_STAGGER_MS = 40
const PART_RADIUS = 150
const PART_PUSH = 56

const LAYERS = [
  { width: 1, opacity: 0.16, phase: 0.6, pace: 0.7, part: 0.45 },
  { width: 1.25, opacity: 0.26, phase: 0.3, pace: 0.85, part: 0.75 },
  { width: 1.5, opacity: 0.4, phase: 0, pace: 1, part: 1 },
]

/**
 * Height of line `s` (-0.5 to 0.5 across the ribbon) at `u` (0 to 1 along
 * it). The ribbon turns over where `twist` crosses zero; that point and the
 * ribbon's curve both slide slowly with time, so the lines keep flowing.
 */
function lineY(s, u, layer, frame, shape, band) {
  const t = frame.time * layer.pace
  const x = u * frame.width
  const center = frame.height * 0.5 + shape.slope * (x - frame.width / 2) + band * 0.1 * Math.sin(Math.PI * 2 * (0.75 * u + 0.1) + layer.phase + t * 0.35)
  const turn = 0.22 + 0.09 * Math.sin(t * 0.21 + layer.phase)
  const breathe = 0.3 * Math.sin(t * 0.5 + s * 4 + layer.phase)
  const twist = Math.cos(Math.PI * (u - turn) + s * (0.6 + breathe) + layer.phase)
  return center + s * shape.spread * band * twist
}

/** Push a point away from the cursor, vertically, with a soft falloff. */
function part(x, y, frame, strength) {
  const { pointer } = frame
  if (pointer.amount < 0.001) return y
  const dx = x - pointer.x
  const dy = y - pointer.y
  const falloff = Math.exp(-(dx * dx + dy * dy) / (PART_RADIUS * PART_RADIUS))
  // A soft sign, so lines right under the cursor split smoothly, not snap.
  const side = dy / (Math.abs(dy) + 24)
  return y + side * falloff * PART_PUSH * strength * pointer.amount
}

function drawLines(ctx, frame, shape, color) {
  const { width, height } = frame
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // On tall, narrow screens a full-height ribbon turns too steeply to read,
  // so its height is capped relative to the width.
  const band = Math.min(height, width * 1.1)
  const perLayer = Math.max(1, Math.round(shape.count / LAYERS.length))
  const xs = new Float32Array(SAMPLES + 1)
  const ys = new Float32Array(SAMPLES + 1)

  LAYERS.forEach((layer, layerIndex) => {
    ctx.lineWidth = layer.width
    for (let i = 0; i < perLayer; i++) {
      const drawn = frame.drawn[layerIndex * perLayer + i] ?? 1
      if (drawn <= 0) continue
      const s = perLayer === 1 ? 0 : i / (perLayer - 1) - 0.5
      const last = Math.max(1, Math.ceil(SAMPLES * drawn))
      for (let k = 0; k <= last; k++) {
        const u = -OVERSCAN + (k / SAMPLES) * (1 + OVERSCAN * 2)
        const x = u * width
        const y = lineY(s, u, layer, frame, shape, band)
        xs[k] = x
        ys[k] = shape.interactive ? part(x, y, frame, layer.part) : y
      }
      // The ribbon's edges fade, its middle carries the weight.
      ctx.globalAlpha = layer.opacity * (0.45 + 0.55 * (1 - Math.abs(s) * 2))
      ctx.beginPath()
      ctx.moveTo(xs[0], ys[0])
      // Curves through the midpoints keep the line smooth at any sampling.
      for (let k = 1; k < last; k++) {
        const mx = (xs[k] + xs[k + 1]) / 2
        const my = (ys[k] + ys[k + 1]) / 2
        ctx.quadraticCurveTo(xs[k], ys[k], mx, my)
      }
      ctx.lineTo(xs[last], ys[last])
      ctx.stroke()
    }
  })
  ctx.globalAlpha = 1
}

const EASE_OUT = (t) => 1 - (1 - t) ** 3

/** Where a pointer is in the canvas's own coordinates, un-projecting a CSS transform on an ancestor. */
function pointerToLocal(canvas, clientX, clientY) {
  let host = canvas.parentElement
  while (host && host !== document.body && getComputedStyle(host).transform === 'none') host = host.parentElement
  if (!host || host === document.body) { // not transformed: the usual way
    const r = canvas.getBoundingClientRect()
    return { x: clientX - r.left, y: clientY - r.top }
  }
  const cs = getComputedStyle(host)
  const m = new DOMMatrix(cs.transform)
  const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat)
  // the host's untransformed position on screen
  let bx = 0, by = 0
  for (let n = host; n; n = n.offsetParent) { bx += n.offsetLeft; by += n.offsetTop }
  if (cs.position !== 'fixed') { bx -= window.scrollX; by -= window.scrollY }
  // invert the plane's projective map: [ux, uy, w] = H^-1 [X, Y, 1]
  const X = clientX - bx - ox, Y = clientY - by - oy
  const a = m.m11, b = m.m21, c = m.m41, d = m.m12, e = m.m22, f = m.m42, g = m.m14, h = m.m24, i = m.m44
  const A = e * i - f * h, B = c * h - b * i, C = b * f - c * e
  const D = f * g - d * i, E = a * i - c * g, F = c * d - a * f
  const G = d * h - e * g, H = b * g - a * h, I = a * e - b * d
  const w = G * X + H * Y + I
  if (Math.abs(w) < 1e-9) return null
  const px = (A * X + B * Y + C) / w + ox, py = (D * X + E * Y + F) / w + oy
  // and from the host into the canvas
  let cx = 0, cy = 0
  for (let n = canvas; n && n !== host; n = n.offsetParent) { cx += n.offsetLeft; cy += n.offsetTop }
  return { x: px - cx, y: py - cy }
}

export default function BackgroundPaths({ className, children, count = 42, spread = 1, angle = -8, speed = 1, interactive = true }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!(root && canvas && ctx)) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const shape = { count, spread, slope: Math.tan((angle * Math.PI) / 180), interactive: interactive && !reduceMotion }
    const perLayer = Math.max(1, Math.round(count / LAYERS.length))
    const total = perLayer * LAYERS.length
    const frame = {
      width: 0,
      height: 0,
      // Start mid-flow, so the first frame isn't the same every visit.
      time: 40,
      drawn: new Array(total).fill(reduceMotion ? 1 : 0),
      pointer: { x: 0, y: 0, tx: 0, ty: 0, amount: 0, on: false },
    }
    let color = getComputedStyle(canvas).color
    let start = 0
    let last = 0
    let raf = 0
    let visible = true

    const paint = () => drawLines(ctx, frame, shape, color)

    const resize = () => {
      // Layout size, not getBoundingClientRect(): that one includes CSS transforms (see the note above).
      const w = canvas.clientWidth, h = canvas.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      frame.width = w
      frame.height = h
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      paint()
    }

    const loop = (now) => {
      raf = 0
      if (!start) { start = now; last = now }
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      frame.time += dt * speed
      // The entrance draws each line on once, left to right, staggered.
      const elapsed = now - start
      for (let i = 0; i < frame.drawn.length; i++) {
        if (frame.drawn[i] < 1) {
          const local = (elapsed - (i % perLayer) * DRAW_STAGGER_MS) / DRAW_MS
          frame.drawn[i] = EASE_OUT(Math.min(Math.max(local, 0), 1))
        }
      }
      const { pointer } = frame
      pointer.amount += ((pointer.on ? 1 : 0) - pointer.amount) * 0.08
      // the opening glides after the cursor (smoothed), so quick moves don't jump
      pointer.x += (pointer.tx - pointer.x) * 0.22
      pointer.y += (pointer.ty - pointer.y) * 0.22
      paint()
      const settling = frame.drawn.some((d) => d < 1) || (pointer.amount > 0.001 && !pointer.on) || pointer.on || Math.hypot(pointer.tx - pointer.x, pointer.ty - pointer.y) > 0.5
      if (visible && (speed > 0 || settling)) raf = requestAnimationFrame(loop)
    }
    const play = () => {
      if (!raf && visible && !reduceMotion) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }

    resize()
    canvas.style.opacity = '1'
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    // A tab coming back must not wake a background that's scrolled away.
    let onScreen = true
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      visible = onScreen && !document.hidden
      if (visible) play()
    })
    intersection.observe(root)
    const onVisibility = () => {
      visible = onScreen && !document.hidden
      if (visible) play()
    }
    document.addEventListener('visibilitychange', onVisibility)
    // Follow theme changes, which only change the inherited text color.
    const colorTimer = window.setInterval(() => {
      if (!visible) return
      const next = getComputedStyle(canvas).color
      if (next !== color) { color = next; paint() }
    }, 500)

    const onMove = (event) => {
      if (event.pointerType !== 'mouse' || !shape.interactive) return
      const p = pointerToLocal(canvas, event.clientX, event.clientY)
      const inside = p && p.x >= 0 && p.y >= 0 && p.x <= frame.width && p.y <= frame.height
      const { pointer } = frame
      if (!inside) { if (pointer.on) { pointer.on = false; play() } return }
      if (pointer.amount < 0.02) { pointer.x = p.x; pointer.y = p.y } // start at the cursor, not a corner
      pointer.tx = p.x
      pointer.ty = p.y
      pointer.on = true
      play()
    }
    const onLeave = () => { frame.pointer.on = false; play() }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    play()

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(colorTimer)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [count, spread, angle, speed, interactive])

  return (
    <div className={cn('kbp', className)} ref={rootRef}>
      {/* Faded at the top and bottom, and quieter behind centered content. */}
      <div aria-hidden="true" className="kbp__mask">
        <canvas className="kbp__canvas" ref={canvasRef} />
      </div>
      {children === undefined ? <DefaultContent /> : children}
    </div>
  )
}

function DefaultContent() {
  return (
    <div className="kbp__default">
      <h1 className="kbp__title">Calm by default</h1>
      <p className="kbp__text">A ribbon of lines that keeps flowing in one color, at any size. Move the cursor through it and the lines part around you.</p>
    </div>
  )
}
