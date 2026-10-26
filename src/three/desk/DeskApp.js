import * as THREE from 'three'
import { buildDesk, DESK_TOP } from './deskScene'
import { buildBackdrop } from './studioBackdrop'
import { STUDIO, LOOKS } from './studioLight'

const FOV = 42
const EASE = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const LOOK_DOWN = THREE.MathUtils.degToRad(8)

export function createDeskApp(host, { compact = false, reduce = false, onFocused, onFrame } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.autoClear = false
  renderer.info.autoReset = false
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  let envMap = null

  const backdrop = buildBackdrop()

  const hemi = new THREE.HemisphereLight('#ffb38a', '#2a170f', 0.5)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#ff9d5c', 1.55)
  sun.target.position.set(0, DESK_TOP, -0.05)
  sun.castShadow = true
  sun.shadow.mapSize.set(compact ? 1024 : 2048, compact ? 1024 : 2048)

  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 2.4, bottom: -2.4, near: 0.5, far: 12 })
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  sun.shadow.radius = 4
  const fill = new THREE.DirectionalLight('#9aa8ff', 0.38)
  fill.position.set(0.6, 1.9, 3.2)

  const rim = new THREE.DirectionalLight('#8fb0ff', 1.6)
  rim.position.set(-1.0, 1.25, -4.2)
  rim.target.position.set(0, 1.0, -0.15)
  const pool = new THREE.SpotLight('#cfd8ff', 0.9, 0, 0.62, 1, 1)
  pool.position.set(0, 5.2, 0.4)
  pool.target.position.set(0, 0, -0.3)
  scene.add(sun, sun.target, fill, rim, rim.target, pool, pool.target)
  renderer.shadowMap.autoUpdate = false

  const { root, screen, materials: M, lampLight, notes, studio: room, loaded } = buildDesk({ reduce })
  scene.add(root)

  const clockStart = performance.now()
  const clock = () => (reduce ? 40 : 40 + (performance.now() - clockStart) / 1000)
  let studio = STUDIO
  const applyLook = (look) => {
    studio = look
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
    backdrop.update(studio, clock())
    const previous = envMap
    envMap = pmrem.fromScene(backdrop.envScene, 0.02).texture
    scene.environment = envMap
    previous?.dispose()
  }
  applyLook(STUDIO)

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 30)
  const look = new THREE.Vector3()
  const pointer = new THREE.Vector2()
  const parallax = new THREE.Vector2()

  function overview(aspect) {
    const target = new THREE.Vector3(0, 1.07, -0.14)

    const width = aspect >= 1 ? 1.64 : aspect >= 0.75 ? 1.31 : aspect >= 0.6 ? 1.02 : 0.83
    const height = 0.94
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const dist = Math.max(height / 2 / t, width / 2 / (t * aspect)) * 1.03
    const pos = target.clone().add(new THREE.Vector3(0, Math.sin(LOOK_DOWN), Math.cos(LOOK_DOWN)).multiplyScalar(dist))
    return { pos, target }
  }

  function screenView(aspect) {
    screen.updateWorldMatrix(true, false)
    const center = new THREE.Vector3().setFromMatrixPosition(screen.matrixWorld)
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(screen.getWorldQuaternion(new THREE.Quaternion())).normalize()
    const scale = new THREE.Vector3().setFromMatrixScale(screen.matrixWorld)
    const w = screen.geometry.parameters.width * scale.x
    const h = screen.geometry.parameters.height * scale.y
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2))

    const fill = aspect < 0.75 ? 0.95 : 0.88
    const dist = Math.max(h / 2 / (t * fill), w / 2 / (t * aspect * fill))
    return { pos: center.clone().addScaledVector(normal, dist), target: center }
  }

  let mode = 'hidden'
  let move = null
  let raf = 0
  let width = 1, height = 1
  let lastDuration = 0
  let shadowRedraws = 0

  const view = () => (mode === 'focused' || mode === 'transition' ? screenView(camera.aspect) : overview(camera.aspect))

  function place(pos, target) {
    camera.position.copy(pos)
    look.copy(target)
    camera.lookAt(look)
  }

  function startMove(to, duration, done) {
    const from = { pos: camera.position.clone(), target: look.clone() }

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
      look.lerpVectors(move.from.target, move.to.target, 1 - Math.pow(1 - e, 2))
      camera.lookAt(look)
      if (k >= 1) { const done = move.done; move = null; done?.() }
      return true
    }

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
    renderer.render(backdrop.scene, backdrop.camera)
    renderer.clearDepth()
    if (renderer.shadowMap.needsUpdate) shadowRedraws++
    renderer.render(scene, camera)
    onFrame?.(screenCorners())
  }

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

    const dtNotes = lastNotes ? (now - lastNotes) / 1000 : 0
    const notesMoving = notes.current ? notes.current.update(dtNotes) : false
    room.update(dtNotes)
    lastNotes = now
    const busy = step(now) || notesMoving
    if (busy || reduce || now - lastDraw >= 33) {
      backdrop.update(studio, clock())
      draw()
      lastDraw = now
    }
    if (busy || !reduce) request()
  }
  let active = true
  function request() { if (!raf && active) raf = requestAnimationFrame(frame) }

  function resize() {
    width = host.clientWidth || window.innerWidth
    height = host.clientHeight || window.innerHeight
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    if (move) move.to = view()
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

  const lampGlow = { on: false, lining: [], bulb: [], halo: null }
  const haloTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128
    const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    r.addColorStop(0, 'rgba(255,226,180,0.9)'); r.addColorStop(0.25, 'rgba(255,196,130,0.35)'); r.addColorStop(1, 'rgba(255,180,110,0)')
    g.fillStyle = r; g.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  })()
  const setLampGlow = (on) => {
    lampGlow.on = on
    for (const { m, emissive, intensity } of lampGlow.lining) { m.emissive.set(on ? '#ffc98c' : emissive); m.emissiveIntensity = on ? 0.85 : intensity }
    for (const { m, intensity } of lampGlow.bulb) m.emissiveIntensity = on ? Math.max(intensity, 1) * 6 : intensity
    if (lampGlow.halo) lampGlow.halo.visible = on
  }
  const modelReady = loaded.then((info) => {
    renderer.shadowMap.needsUpdate = true
    const seen = new Set()
    root.traverse((o) => {
      if (!o.isMesh || seen.has(o.material)) return
      const m = o.material, name = m.name || ''
      if (/shade lining/i.test(name)) { seen.add(m); lampGlow.lining.push({ m, emissive: m.emissive.clone(), intensity: m.emissiveIntensity }) }
      if (/glowing bulb/i.test(name)) { seen.add(m); lampGlow.bulb.push({ m, intensity: m.emissiveIntensity }) }
    })

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: '#ffd9a6', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }))
    halo.scale.setScalar(0.32)
    lampLight.getWorldPosition(halo.position)
    halo.visible = false
    halo.renderOrder = 3
    scene.add(halo)
    lampGlow.halo = halo
    setLampGlow(lampGlow.on)
    request()
    return info
  })
    .catch((err) => { console.error('The desk model could not be loaded:', err); throw err })

  width = host.clientWidth || window.innerWidth
  height = host.clientHeight || window.innerHeight
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  const start = overview(camera.aspect)
  place(start.pos, start.target)
  draw()

  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2()
  function noteUnder(clientX, clientY) {
    if (!notes.current || mode !== 'desktop') return -1
    const r = renderer.domElement.getBoundingClientRect()
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    return notes.current.pick(raycaster)
  }

  let timeOfDay = 'day'
  return {

    setTimeOfDay(mode) {
      const next = mode === 'night' ? 'night' : 'day'
      if (next === timeOfDay) return
      timeOfDay = next
      applyLook(LOOKS[next])
      room.setTime?.(next)
      setLampGlow(next === 'night')
      request()
    },
    camera,
    screen,

    get notes() { return notes.current },

    noteAt: (x, y) => noteUnder(x, y) >= 0,

    poke(x, y) {
      const i = noteUnder(x, y)
      if (i < 0) return false
      notes.current.poke(i)
      request()
      return true
    },

    ready: Promise.all([backdrop.ready, modelReady]),
    get mode() { return mode },

    setActive(on) {
      active = on
      if (!on) { cancelAnimationFrame(raf); raf = 0 } else request()
    },

    returnToOverview(done) {
      if (mode !== 'focused') return false
      mode = 'returning'
      startMove(overview(camera.aspect), reduce ? 450 : 1700, () => { mode = 'desktop'; request(); done?.() })
      return true
    },

    screenCorners,

    reveal() {
      if (mode !== 'hidden') return
      const to = overview(camera.aspect)
      if (reduce) { mode = 'desktop'; place(to.pos, to.target); request(); return }
      mode = 'revealing'
      place(to.pos.clone().add(new THREE.Vector3(0, 0.12, 0.35)), to.target.clone().add(new THREE.Vector3(0, 0.03, 0)))
      startMove(to, 1600, () => { mode = 'desktop'; request() })
    },

    focusScreen() {
      if (mode !== 'desktop' && mode !== 'revealing') return false
      mode = 'transition'
      startMove(screenView(camera.aspect), reduce ? 650 : 2600, () => { mode = 'focused'; request(); onFocused?.() })
      return true
    },

    describe() {

      const v = screenView(camera.aspect)
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => new THREE.Vector3(x * screen.geometry.parameters.width / 2, y * screen.geometry.parameters.height / 2, 0).applyMatrix4(screen.matrixWorld).project(camera))
      const xs = corners.map((c) => c.x), ys = corners.map((c) => c.y)
      return { timeOfDay,
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
