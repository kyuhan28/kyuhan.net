import { useCallback, useEffect, useRef, useState } from 'react'
import { complete } from '../../lib/loading'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import TypewriterTitle from '../kokonutui/TypeWriter'
import SwitchButton from '../kokonutui/SwitchButton'

const TIME_KEY = 'kh.room.time'
function initialTime() {
  try { const saved = localStorage.getItem(TIME_KEY); if (saved === 'day' || saved === 'night') return saved } catch {  }
  const h = new Date().getHours()
  return h >= 7 && h < 19 ? 'day' : 'night'
}
import './desk.css'

const IGNORED_KEYS = new Set(['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape'])
const isTyping = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
const hasWebGL = () => {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}
const FALLBACK_ASPECT = 0.724 / 0.394
const MIN_SCREEN_LAYOUT = 960

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function squareToQuad(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3
  let g = 0, h = 0
  const det = dx1 * dy2 - dx2 * dy1
  if (Math.abs(det) > 1e-9 && (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9)) {
    g = (dx3 * dy2 - dx2 * dy3) / det
    h = (dx1 * dy3 - dx3 * dy1) / det
  }
  return { a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0, d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0, g, h }
}

function rectToQuad(sx, sy, sw, sh, q) {
  const { a, b, c, d, e, f, g, h } = squareToQuad(q)

  const A = a / sw, B = b / sh, D = d / sw, E = e / sh, G = g / sw, H = h / sh
  const C = c - A * sx - B * sy, F = f - D * sx - E * sy, W = 1 - G * sx - H * sy
  return `matrix3d(${A}, ${D}, 0, ${G}, ${B}, ${E}, 0, ${H}, 0, 0, 1, 0, ${C}, ${F}, 0, ${W})`
}

export default function DeskExperience({ revealed, siteRef, controls, onView, onExit }) {
  const root = useRef(null)
  const host = useRef(null)
  const app = useRef(null)
  const started = useRef(false)
  const [phase, setPhase] = useState('intro')
  const [ready, setReady] = useState(false)
  const [time, setTime] = useState(initialTime)
  useEffect(() => {
    if (ready) app.current?.setTimeOfDay?.(time)
    try { localStorage.setItem(TIME_KEY, time) } catch {  }
  }, [time, ready])
  const reduce = usePrefersReducedMotion()

  const map = useRef({ on: true, corners: null, blend: 0 })

  const place = useCallback(() => {
    const el = siteRef.current
    if (!el) return
    const m = map.current
    if (!m.on || !m.corners) {
      for (const k of ['transform', 'transformOrigin', 'width', 'height', 'position', 'zIndex', 'pointerEvents', 'willChange']) el.style[k] = ''
      el.removeAttribute('aria-hidden')
      el.classList.remove('is-on-screen')
      return
    }
    el.classList.add('is-on-screen')
    const vw = window.innerWidth, vh = window.innerHeight
    const target = m.corners
    const g = app.current?.screen?.geometry?.parameters
    const SCREEN_ASPECT = g ? g.width / g.height : FALLBACK_ASPECT

    let sw = vw, sh = vh
    if (vw / vh < SCREEN_ASPECT) sh = vw / SCREEN_ASPECT
    else sw = vh * SCREEN_ASPECT
    if (sw < MIN_SCREEN_LAYOUT) { sw = MIN_SCREEN_LAYOUT; sh = sw / SCREEN_ASPECT }
    const natural = [[0, 0], [sw, 0], [sw, sh], [0, sh]]
    const k = m.blend
    const q = target.map(([x, y], i) => [x + (natural[i][0] - x) * k, y + (natural[i][1] - y) * k])
    Object.assign(el.style, {
      position: 'fixed', zIndex: '870', pointerEvents: 'none', transformOrigin: '0 0', willChange: 'transform',
      width: `${sw + (vw - sw) * k}px`, height: `${sh + (vh - sh) * k}px`,
      transform: rectToQuad(0, 0, sw, sh, q),
    })
    el.setAttribute('aria-hidden', 'true')
  }, [siteRef])

  useEffect(() => {
    let gone = false
    map.current.on = true
    if (!hasWebGL()) { complete('desk'); onExit?.(); return }
    import('../../three/desk/DeskApp')
      .then(({ createDeskApp }) => {
        if (gone) return
        app.current = createDeskApp(host.current, {
          compact: window.innerWidth < 900,
          reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          onFocused: () => setPhase('screenFocused'),
          onFrame: (corners) => { map.current.corners = corners; place() },
        })
        host.current.deskApp = app.current
        const settled = Promise.race([app.current.ready, new Promise((r) => setTimeout(r, 8000))])
        settled.then(() => { if (gone) return; setReady(true); complete('desk') })
          .catch((error) => {
            if (gone) return
            console.warn('[desk] the desk model could not be loaded; showing the site instead.', error)
            complete('desk')
            onExit?.()
          })
      })
      .catch((error) => {
        console.warn('[desk] the 3D workspace could not start; showing the site instead.', error)
        complete('desk')
        onExit?.()
      })
    return () => {
      gone = true
      app.current?.dispose()
      app.current = null
      map.current.on = false
      place()
    }
  }, [onExit, place])

  useEffect(() => {
    if (!revealed || !ready || phase !== 'intro') return
    app.current.reveal()
    setPhase('desktop')
  }, [revealed, ready, phase])

  useEffect(() => {
    if (phase === 'portfolio') return
    const html = document.documentElement
    html.classList.add('desk-active')
    const el = root.current
    const hold = (e) => { if (e.cancelable) e.preventDefault() }
    el.addEventListener('wheel', hold, { passive: false })
    el.addEventListener('touchmove', hold, { passive: false })
    el.addEventListener('gesturestart', hold)
    return () => {
      html.classList.remove('desk-active')
      el.removeEventListener('wheel', hold)
      el.removeEventListener('touchmove', hold)
      el.removeEventListener('gesturestart', hold)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'desktop') return
    const go = () => {
      if (started.current) return
      if (app.current?.focusScreen()) { started.current = true; setPhase('cameraTransition') }
    }
    const onPointer = (e) => {
      if (e.button > 0) return
      if (app.current?.poke(e.clientX, e.clientY)) return
      go()
    }

    const onHover = (e) => { if (e.pointerType === 'mouse') root.current.style.cursor = app.current?.noteAt(e.clientX, e.clientY) ? 'pointer' : '' }
    const onKey = (e) => {
      if (e.repeat || IGNORED_KEYS.has(e.key) || isTyping(e.target)) return
      if (e.key === ' ') e.preventDefault()
      go()
    }
    const el = root.current
    el.addEventListener('pointerdown', onPointer)
    el.addEventListener('pointermove', onHover)
    window.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('pointerdown', onPointer)
      el.removeEventListener('pointermove', onHover)
      window.removeEventListener('keydown', onKey)
      el.style.cursor = ''
    }
  }, [phase])

  const tween = useCallback((from, to, ms, done) => {
    const start = performance.now()
    const stepFn = (now) => {
      const t = Math.min(1, (now - start) / ms)
      map.current.blend = from + (to - from) * ease(t)
      if (root.current) root.current.style.opacity = String(1 - map.current.blend)
      place()
      if (t < 1) requestAnimationFrame(stepFn)
      else done?.()
    }
    requestAnimationFrame(stepFn)
  }, [place])

  const finishEntering = useCallback(() => {
    map.current.on = false
    map.current.blend = 1
    place()
    app.current?.setActive(false)
    setPhase('portfolio')
    onView?.('portfolio')
    requestAnimationFrame(() => siteRef.current?.querySelector('.os-icon')?.focus())
  }, [place, onView, siteRef])

  useEffect(() => {
    if (phase !== 'screenFocused') return
    setPhase('entering')
    tween(0, 1, reduce ? 200 : 750, finishEntering)
  }, [phase, reduce, tween, finishEntering])

  const back = useCallback(() => {
    if (phase !== 'portfolio') return
    onView?.('desk')
    setPhase('returning')
    app.current?.setActive(true)
    map.current.on = true
    map.current.blend = 1
    requestAnimationFrame(() => {
      place()
      tween(1, 0, reduce ? 200 : 650, () => {
        if (!app.current?.returnToOverview(() => { started.current = false; setPhase('desktop') })) { started.current = false; setPhase('desktop') }
      })
    })
  }, [phase, onView, place, tween, reduce])

  useEffect(() => {
    if (!controls) return
    controls.current = { back }
    return () => { controls.current = null }
  }, [controls, back])

  useEffect(() => {
    if (phase !== 'portfolio') return
    const onKey = (e) => {
      if (e.key !== 'Escape' || isTyping(e.target) || document.querySelector('[aria-expanded="true"]')) return
      back()
    }
    const onMessage = (e) => {
      const frame = siteRef.current?.querySelector('.os-frame')
      if (e.origin !== window.location.origin || e.source !== frame?.contentWindow || e.data?.type !== 'kyuhan:escape') return
      if (document.querySelector('[aria-expanded="true"]')) return
      back()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('message', onMessage)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('message', onMessage) }
  }, [phase, back, siteRef])

  useEffect(() => {
    const onResize = () => place()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [place])

  const inPortfolio = phase === 'portfolio'
  return (
    <>
      <div className="desk" ref={root} data-phase={phase} data-reduce={reduce || undefined} aria-hidden={inPortfolio || undefined}>
        <div className="desk__canvas" ref={host} aria-hidden="true" />
        <p className={`desk__hint ${phase === 'desktop' ? '' : 'is-hidden'}`} role="status" aria-live="polite">
          {phase === 'desktop' ? (
            <TypewriterTitle as="span" sequences={[{ text: 'Click, tap, or press any key', deleteAfter: false }]} autoLoop={false} typingSpeed={55} startDelay={650} />
          ) : ''}
        </p>
      </div>
      <div className={`desk__time ${phase === 'desktop' ? '' : 'is-hidden'}`} onKeyDown={(e) => e.stopPropagation()}>
        <SwitchButton size="sm" labels={['Day', 'Night']} theme={time === 'night' ? 'dark' : 'light'}
          onThemeChange={(t) => setTime(t === 'dark' ? 'night' : 'day')} tabIndex={phase === 'desktop' ? 0 : -1} />
      </div>
    </>
  )
}
