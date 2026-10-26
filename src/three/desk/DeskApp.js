import * as THREE from 'three'
import { buildDesk, DESK_TOP } from './deskScene'
import { buildBackdrop } from './studioBackdrop'
import { STUDIO } from './studioLight'

/*
 * The desk experience's 3D runtime.
 *
 *   reveal()       a gentle settle into the full view of the desk, once the loading screen has gone
 *   focusScreen()  one smooth move to just in front of the monitor; the destination comes from the
 *                  screen mesh itself (its position, facing and size), not hardcoded numbers
 *
 * Frames are drawn on demand (reveal, transition, resize, a little pointer parallax), so the scene
 * costs almost nothing while it rests. Resize re-frames whatever view is current.
 */

const FOV = 42 // a wider lens from closer in: more of the desk top, horizon about a third of the way down
const EASE = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // ease in-out (cubic)
const LOOK_DOWN = THREE.MathUtils.degToRad(8) // a slightly elevated, mostly front-facing view

export function createDeskApp(host, { compact = false, reduce = false, onFocused, onFrame } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.autoClear = false // two passes: the environment, then the room
  renderer.info.autoReset = false
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap // (r186: PCFSoftShadowMap was removed; PCF + radius stays soft)
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envMap = null

  // The studio behind the desk (studioBackdrop.js), in its own pass behind the room.
  const backdrop = buildBackdrop()

  // The studio's light (studioLight.js): a key from the front left, a sky-like ambient, and a fill.
  const hemi = new THREE.HemisphereLight('#ffb38a', '#2a170f', 0.5)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#ff9d5c', 1.55)
  sun.target.position.set(0, DESK_TOP, -0.05)
  sun.castShadow = true
  sun.shadow.mapSize.set(compact ? 1024 : 2048, compact ? 1024 : 2048)
  Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 1.6, bottom: -1.6, near: 0.5, far: 12 })
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  sun.shadow.radius = 4
  const fill = new THREE.DirectionalLight('#9aa8ff', 0.38)
  fill.position.set(0.6, 1.9, 3.2)
  // studio lighting: a rim light from behind traces the computer's and lamp's edges against the dark, and
  // a soft pool of light falls on the floor around the desk
  const rim = new THREE.DirectionalLight('#8fb0ff', 1.6)
  rim.position.set(-1.0, 1.25, -4.2) // low and from behind: it grazes edges and silhouettes, not the desk's top
  rim.target.position.set(0, 1.0, -0.15)
  const pool = new THREE.SpotLight('#cfd8ff', 0.9, 0, 0.62, 1, 1)
  pool.position.set(0, 5.2, 0.4)
  pool.target.position.set(0, 0, -0.3)
  scene.add(sun, sun.target, fill, rim, rim.target, pool, pool.target)
  renderer.shadowMap.autoUpdate = false // the room is still: shadows are redrawn only when the light moves

  const { root, screen, materials: M, lampLight, notes, studio: room, loaded } = buildDesk({ reduce }) // the Blender model arrives through `loaded`
  scene.add(root)

  // ---------- the studio's light: one look, applied once ----------
  // The lights, shadows and reflections are set a single time; only the backdrop's glow breathes, on
  // the shared clock (which stands still with reduced motion).
  const studio = STUDIO
  hemi.color.set(studio.hemiSky); hemi.groundColor.set(studio.hemiGround); hemi.intensity = studio.hemi
  sun.color.set(studio.sunColor); sun.intensity = studio.sunIntensity
  sun.position.copy(sun.target.position).addScaledVector(new THREE.Vector3(...studio.lightDir), 5)
  renderer.shadowMap.needsUpdate = true
  fill.color.set(studio.fillColor); fill.intensity = studio.fill
  rim.color.set(studio.rimColor); rim.intensity = studio.rim
  pool.color.set(studio.poolColor); pool.intensity = studio.pool
  M.floor.color.set(studio.floorHex)
  lampLight.intensity = studio.lamp
  renderer.toneMappingExposure = studio.exposure
  scene.environmentIntensity = studio.env
  const clockStart = performance.now()
  const clock = () => (reduce ? 40 : 40 + (performance.now() - clockStart) / 1000)
  backdrop.update(studio, clock())
  envMap = pmrem.fromScene(backdrop.envScene, 0.02).texture // reflections from the backdrop, once
  scene.environment = envMap

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 30)
  const look = new THREE.Vector3()
  const pointer = new THREE.Vector2()
  const parallax = new THREE.Vector2()

  // ---------- framing ----------
  // The whole workspace on wide screens; on narrow (portrait) ones, the monitor and the essentials.
  function overview(aspect) {
    const target = new THREE.Vector3(0, 1.07, -0.14) // aimed up toward the monitor
    // Wide: the desk around the monitor. Tablets in portrait: the desk's middle. Phones: the monitor and
    // essentials. (Brought in twice, about 17% in all, so the screen reads larger; the keyboard, the sticky
    // notes and the lamp still frame it.)
    const width = aspect >= 1 ? 1.64 : aspect >= 0.75 ? 1.31 : aspect >= 0.6 ? 1.02 : 0.83
    const height = 0.94
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const dist = Math.max(height / 2 / t, width / 2 / (t * aspect)) * 1.03
    const pos = target.clone().add(new THREE.Vector3(0, Math.sin(LOOK_DOWN), Math.cos(LOOK_DOWN)).multiplyScalar(dist))
    return { pos, target }
  }

  // Just in front of the monitor, looking straight at it: computed from the screen mesh itself.
  function screenView(aspect) {
    screen.updateWorldMatrix(true, false)
    const center = new THREE.Vector3().setFromMatrixPosition(screen.matrixWorld)
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(screen.getWorldQuaternion(new THREE.Quaternion())).normalize()
    const scale = new THREE.Vector3().setFromMatrixScale(screen.matrixWorld)
    const w = screen.geometry.parameters.width * scale.x
    const h = screen.geometry.parameters.height * scale.y
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    // The screen fills most of the view (88% of the limiting side; 95% on tall screens, where the
    // overview is already close), keeping a sliver of bezel so it still reads as a monitor.
    const fill = aspect < 0.75 ? 0.95 : 0.88
    const dist = Math.max(h / 2 / (t * fill), w / 2 / (t * aspect * fill))
    return { pos: center.clone().addScaledVector(normal, dist), target: center }
  }

  // ---------- state ----------
  let mode = 'hidden' // hidden -> revealing -> desktop -> transition -> focused
  let move = null // { from, to, fromLook, toLook, start, duration, mid }
  let raf = 0
  let width = 1, height = 1
  let lastDuration = 0 // for checks: how long the last move was planned to take
  let shadowRedraws = 0 // for checks: how often the shadows were redrawn

  const view = () => (mode === 'focused' || mode === 'transition' ? screenView(camera.aspect) : overview(camera.aspect)) // 'returning' heads for the overview

  function place(pos, target) {
    camera.position.copy(pos)
    look.copy(target)
    camera.lookAt(look)
  }

  function startMove(to, duration, done) {
    const from = { pos: camera.position.clone(), target: look.clone() }
    // A gentle arc: a little higher midway, so the path stays well above the desk and keyboard.
    const mid = from.pos.clone().lerp(to.pos, 0.5)
    mid.y = Math.max(mid.y, from.pos.y, to.pos.y) + 0.03
    lastDuration = duration
    move = { from, to, mid, start: performance.now(), duration, done, curve: new THREE.QuadraticBezierCurve3(from.pos, mid, to.pos) }
    request()
  }

  function step(now) {
    if (move) {
      const k = Math.min(1, (now - move.start) / move.duration)
      const e = EASE(k)
      move.curve.getPoint(e, camera.position)
      look.lerpVectors(move.from.target, move.to.target, 1 - Math.pow(1 - e, 2)) // the eye settles on the screen a touch early
      camera.lookAt(look)
      if (k >= 1) { const done = move.done; move = null; done?.() }
      return true
    }
    // Resting on the full desk: a small parallax toward the pointer (not while focused).
    if (mode === 'desktop' && !reduce) {
      parallax.lerp(pointer, 0.08)
      const base = overview(camera.aspect)
      camera.position.copy(base.pos).add(new THREE.Vector3(parallax.x * 0.05, parallax.y * 0.03, 0))
      look.copy(base.target)
      camera.lookAt(look)
      return parallax.distanceTo(pointer) > 0.002
    }
    return false
  }

  function draw() {
    renderer.info.reset()
    backdrop.sync(camera)
    renderer.clear()
    renderer.render(backdrop.scene, backdrop.camera) // the environment, out to kilometers
    renderer.clearDepth()
    if (renderer.shadowMap.needsUpdate) shadowRedraws++
    renderer.render(scene, camera) // the room, with precise depth
    onFrame?.(screenCorners()) // where the screen is, so the page shown on it can follow exactly
  }
  /** The monitor screen's four corners (top-left, top-right, bottom-right, bottom-left), in CSS pixels. */
  function screenCorners() {
    screen.updateWorldMatrix(true, false)
    const { width: w, height: h } = screen.geometry.parameters
    return [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2], [-w / 2, -h / 2]].map(([x, y]) => {
      const v = new THREE.Vector3(x, y, 0).applyMatrix4(screen.matrixWorld).project(camera)
      return [((v.x + 1) / 2) * width, ((1 - v.y) / 2) * height]
    })
  }
  let lastDraw = 0, lastNotes = 0
  function frame(now) {
    raf = 0
    // the sticky notes sway, and settle after a flick (keep drawing while they do)
    const dtNotes = lastNotes ? (now - lastNotes) / 1000 : 0
    const notesMoving = notes.current ? notes.current.update(dtNotes) : false
    room.update(dtNotes) // the studio's slow light (barely there)
    lastNotes = now
    const busy = step(now) || notesMoving
    if (busy || reduce || now - lastDraw >= 33) { // at rest, the backdrop's glow breathes at ~30 fps
      backdrop.update(studio, clock())
      draw()
      lastDraw = now
    }
    if (busy || !reduce) request()
  }
  let active = true // false while the portfolio has the screen: nothing renders at all
  function request() { if (!raf && active) raf = requestAnimationFrame(frame) }

  function resize() {
    width = host.clientWidth || window.innerWidth
    height = host.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    if (move) move.to = view() // keep heading for the right place
    else if (mode !== 'hidden') { const v = view(); place(v.pos, v.target) }
    request()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(host)

  const onPointer = (e) => {
    pointer.set((e.clientX / width) * 2 - 1, -((e.clientY / height) * 2 - 1))
    if (mode === 'desktop') request()
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  // The model arrives a moment later: shadows are redrawn (they're only drawn on demand) and a frame requested.
  const modelReady = loaded.then((info) => { renderer.shadowMap.needsUpdate = true; request(); return info })
    .catch((err) => { console.error('The desk model could not be loaded:', err); throw err })
  // First frame: the full desk (drawn even while the loading screen covers it, so it's ready).
  width = host.clientWidth || window.innerWidth
  height = host.clientHeight || window.innerHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  const start = overview(camera.aspect)
  place(start.pos, start.target)
  draw()

  // ---------- the sticky notes: which one is under the pointer ----------
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2()
  function noteUnder(clientX, clientY) {
    if (!notes.current || mode !== 'desktop') return -1 // only while the whole desk is in view
    const r = renderer.domElement.getBoundingClientRect()
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    return notes.current.pick(raycaster)
  }

  return {
    camera,
    screen,
    /** For checks: the sticky notes' own animation (update, poke). */
    get notes() { return notes.current },
    /** Is there a sticky note under this point (CSS pixels)? */
    noteAt: (x, y) => noteUnder(x, y) >= 0,
    /** Flick the sticky note under this point, if there is one. True if one was flicked. */
    poke(x, y) {
      const i = noteUnder(x, y)
      if (i < 0) return false
      notes.current.poke(i)
      request()
      return true
    },
    /** Resolves once the backdrop and the desk model are both in the scene. */
    ready: Promise.all([backdrop.ready, modelReady]),
    get mode() { return mode },
    /** Pause completely (while the portfolio is full screen), or resume. */
    setActive(on) {
      active = on
      if (!on) { cancelAnimationFrame(raf); raf = 0 } else request()
    },
    /** From the screen back to the full view of the desk. */
    returnToOverview(done) {
      if (mode !== 'focused') return false
      mode = 'returning'
      startMove(overview(camera.aspect), reduce ? 450 : 1700, () => { mode = 'desktop'; request(); done?.() })
      return true
    },
    /** Where the screen is right now, in CSS pixels. */
    screenCorners,
    /** The loading screen has gone: settle gently into the full view of the desk. */
    reveal() {
      if (mode !== 'hidden') return
      const to = overview(camera.aspect)
      if (reduce) { mode = 'desktop'; place(to.pos, to.target); request(); return }
      mode = 'revealing'
      place(to.pos.clone().add(new THREE.Vector3(0, 0.12, 0.35)), to.target.clone().add(new THREE.Vector3(0, 0.03, 0)))
      startMove(to, 1600, () => { mode = 'desktop'; request() })
    },
    /** One smooth move to just in front of the monitor. Returns false if it can't start now. */
    focusScreen() {
      if (mode !== 'desktop' && mode !== 'revealing') return false // during the reveal's settle, it simply starts from where the camera is
      mode = 'transition'
      startMove(screenView(camera.aspect), reduce ? 650 : 2600, () => { mode = 'focused'; request(); onFocused?.() })
      return true
    },
    /** For checks: where the camera ends up, and how much of the view the screen fills. */
    describe() {
      const v = screenView(camera.aspect)
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => new THREE.Vector3(x * screen.geometry.parameters.width / 2, y * screen.geometry.parameters.height / 2, 0).applyMatrix4(screen.matrixWorld).project(camera))
      const xs = corners.map((c) => c.x), ys = corners.map((c) => c.y)
      return {
        mode, camera: camera.position.toArray().map((n) => +n.toFixed(3)), screenDestination: v.pos.toArray().map((n) => +n.toFixed(3)),
        screenFillsWidth: +((Math.max(...xs) - Math.min(...xs)) / 2).toFixed(2), screenFillsHeight: +((Math.max(...ys) - Math.min(...ys)) / 2).toFixed(2),
        screenCentered: +Math.hypot((Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2).toFixed(3),
        aboveDesk: camera.position.y > DESK_TOP + 0.2,
        lastMoveMs: lastDuration,
        backdrop: 'studio',
        shadowRedraws: shadowRedraws,
        stats: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles },
      }
    },
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      for (const sc of [scene, backdrop.scene]) sc.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []
        for (const m of mats) { for (const k in m) if (m[k]?.isTexture) m[k].dispose(); m.dispose() }
      })
      envMap?.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
