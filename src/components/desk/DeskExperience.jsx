import { useCallback, useEffect, useRef, useState } from 'react'
import { complete } from '../../lib/loading'
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import TypewriterTitle from '../kokonutui/TypeWriter'
import './desk.css'

/*
 * The opening experience: a 3D workspace whose monitor shows the real portfolio, and the way into it.
 *
 *   intro            the loading screen is up; the desk is built and drawn underneath it
 *   desktop          the full desk is in view; the monitor shows the portfolio; the first click, tap or
 *                    key press starts the move
 *   cameraTransition the camera moves to the monitor (one move: later input is ignored)
 *   entering         at the screen, the desktop grows from the monitor to fill the window
 *   portfolio        the simulated desktop is the page (the portfolio open in its window). The desk is paused.
 *   returning        "Back to the desk" (the taskbar or Start menu, or Escape): the desktop shrinks back
 *                    onto the screen, and the camera pulls back to the desk
 *
 * The screen shows siteRef: the simulated desktop (components/desktop), whose portfolio window holds the real
 * portfolio in its own document. While it's on the monitor, a perspective transform (matrix3d) maps it onto
 * the screen's four corners, which the 3D scene reports every frame it draws. `controls` receives { back }.
 */

const IGNORED_KEYS = new Set(['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape'])
const isTyping = (el) => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
const hasWebGL = () => {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}
const FALLBACK_ASPECT = 0.724 / 0.394 // the desk model's display, until the model has loaded
const MIN_SCREEN_LAYOUT = 960 // on the monitor, the desktop is never laid out narrower than this, so a phone's
// monitor shows the portfolio with room for its hero below the nav (measured: it needs a ~420 px viewport)
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** The projective map from the unit square onto the quad q (TL, TR, BR, BL): (u, v) -> point. */
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
/** The CSS matrix3d that maps the rectangle (sx, sy)-(sx + sw, sy + sh) onto the quad q (TL, TR, BR, BL). */
function rectToQuad(sx, sy, sw, sh, q) {
  const { a, b, c, d, e, f, g, h } = squareToQuad(q)
  // the rectangle onto the unit square: u = (x - sx) / sw, v = (y - sy) / sh
  const A = a / sw, B = b / sh, D = d / sw, E = e / sh, G = g / sw, H = h / sh
  const C = c - A * sx - B * sy, F = f - D * sx - E * sy, W = 1 - G * sx - H * sy
  return `matrix3d(${A}, ${D}, 0, ${G}, ${B}, ${E}, 0, ${H}, 0, 0, 1, 0, ${C}, ${F}, 0, ${W})`
}

export default function DeskExperience({ revealed, siteRef, controls, onView, onExit }) {
  const root = useRef(null)
  const host = useRef(null)
  const app = useRef(null)
  const started = useRef(false) // locks out a second transition
  const [phase, setPhase] = useState('intro')
  const [ready, setReady] = useState(false)
  const reduce = usePrefersReducedMotion()
  // where the page sits: on the screen's corners, blended toward its natural place (1 = full page)
  const map = useRef({ on: true, corners: null, blend: 0 })

  /** Put the portfolio where it belongs right now: on the monitor's screen, or (blend 1) the whole page. */
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
    const g = app.current?.screen?.geometry?.parameters // the display's real proportions
    const SCREEN_ASPECT = g ? g.width / g.height : FALLBACK_ASPECT
    // On the screen, the desktop is laid out at the display's own proportions, so it fills the monitor
    // edge to edge like a real computer's: the window's size where it fits (shorter on most screens,
    // narrower on very wide ones), and never narrower than MIN_SCREEN_LAYOUT, so a phone's monitor still
    // shows a properly laid-out desktop. As it enters, it grows to the window: a real layout, it reflows.
    let sw = vw, sh = vh
    if (vw / vh < SCREEN_ASPECT) sh = vw / SCREEN_ASPECT
    else sw = vh * SCREEN_ASPECT
    if (sw < MIN_SCREEN_LAYOUT) { sw = MIN_SCREEN_LAYOUT; sh = sw / SCREEN_ASPECT }
    const natural = [[0, 0], [sw, 0], [sw, sh], [0, sh]]
    const k = m.blend
    const q = target.map(([x, y], i) => [x + (natural[i][0] - x) * k, y + (natural[i][1] - y) * k])
    Object.assign(el.style, {
      position: 'fixed', zIndex: '870', pointerEvents: 'none', transformOrigin: '0 0', willChange: 'transform',
      width: `${sw + (vw - sw) * k}px`, height: `${sh + (vh - sh) * k}px`, // the desktop's size, growing to the window
      transform: rectToQuad(0, 0, sw, sh, q),
    })
    el.setAttribute('aria-hidden', 'true') // on the monitor it's a picture of the desktop, not the desktop
  }, [siteRef])

  // Build the scene (loaded on its own, so it never holds up the page) and report it to the loader.
  useEffect(() => {
    let gone = false
    map.current.on = true // (again: React's development mode mounts twice, and the cleanup turns it off)
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
        host.current.deskApp = app.current // for debugging, like the space world's host
        const settled = Promise.race([app.current.ready, new Promise((r) => setTimeout(r, 8000))])
        settled.then(() => { if (gone) return; setReady(true); complete('desk') })
          .catch((error) => { // the desk model couldn't be loaded: straight to the site, as without WebGL
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
      place() // never leave the portfolio transformed
    }
  }, [onExit, place])

  // The loading screen has finished: reveal the desk.
  useEffect(() => {
    if (!revealed || !ready || phase !== 'intro') return
    app.current.reveal()
    setPhase('desktop')
  }, [revealed, ready, phase])

  // While the desk is up: the page doesn't scroll, and wheel, touch and pinch can't move or zoom it.
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

  // The first click, tap or key press: one move to the monitor.
  useEffect(() => {
    if (phase !== 'desktop') return
    const go = () => {
      if (started.current) return
      if (app.current?.focusScreen()) { started.current = true; setPhase('cameraTransition') }
    }
    const onPointer = (e) => {
      if (e.button > 0) return
      if (app.current?.poke(e.clientX, e.clientY)) return // a sticky note: flick it, and stay at the desk
      go()
    }
    // a pointer over a sticky note shows it can be flicked
    const onHover = (e) => { if (e.pointerType === 'mouse') root.current.style.cursor = app.current?.noteAt(e.clientX, e.clientY) ? 'pointer' : '' }
    const onKey = (e) => {
      if (e.repeat || IGNORED_KEYS.has(e.key) || isTyping(e.target)) return
      if (e.key === ' ') e.preventDefault() // don't let the space bar scroll anything
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

  /** Animate the page between the screen (0) and the full window (1). */
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

  /** Become the portfolio: the page is itself again, and the desk rests. */
  const finishEntering = useCallback(() => {
    map.current.on = false
    map.current.blend = 1
    place()
    app.current?.setActive(false)
    setPhase('portfolio')
    onView?.('portfolio')
    requestAnimationFrame(() => siteRef.current?.querySelector('.os-icon')?.focus()) // the desktop: Enter opens the portfolio
  }, [place, onView, siteRef])

  // At the screen: the portfolio grows from the monitor to fill the window.
  useEffect(() => {
    if (phase !== 'screenFocused') return
    setPhase('entering')
    tween(0, 1, reduce ? 200 : 750, finishEntering)
  }, [phase, reduce, tween, finishEntering])

  /** Back to the desk: the portfolio shrinks onto the screen, then the camera pulls back. */
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

  // The desktop's way back to the 3D desk (its Start menu and taskbar).
  useEffect(() => {
    if (!controls) return
    controls.current = { back }
    return () => { controls.current = null }
  }, [controls, back])

  // On the desktop, Escape goes back to the desk (unless something else is using it, like the Start menu).
  // A key pressed inside the portfolio's window never reaches this page, so the portfolio sends it as a
  // message: accepted only from that window, on this origin.
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

  // Resizing while the page is on the screen: re-place it (the scene re-frames and reports new corners).
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
          {/* The prompt types in (Kokonut UI Typewriter): once, then stays. Input starts the move at any point. */}
          {phase === 'desktop' ? (
            <TypewriterTitle as="span" sequences={[{ text: 'Click, tap, or press any key', deleteAfter: false }]} autoLoop={false} typingSpeed={55} startDelay={650} />
          ) : ''}
        </p>
      </div>
    </>
  )
}
