import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { createGrid } from './grid'
import { createMountains } from './mountains'
import { createDust } from './particles'
import { createSky, DAY, SUN_DIR } from './sky'
import { createFarField } from './farField'
import { createFlameTrail } from './flameTrail'
import { createObjects, PALETTE, RIM_LIGHTS, CONTACT_LIGHT } from './objects'
import { createSvgObject } from './svgObject'
import { createCameraRig, scrollToStation } from './camera'
import { GradeShader } from './grade'













export const LOOK = {
  background: '#000000',
  fogDensity: 0.013,
  gridLine: '#2e2e30',
  gridMajor: '#3c3c40',
  bloom: { strength: 0.6, radius: 0.3, threshold: 1.05 },
  exposure: 1.0,
  introSeconds: 4.2,
}

const { damp, clamp, smootherstep } = THREE.MathUtils
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"], summary'

export async function createSpaceApp(container, options) {
  let state = { ...options }
  const compact = !!state.compact
  const phases = {}
  let mark = performance.now()
  const phase = (name) => { const now = performance.now(); phases[name] = Math.round(now - mark); mark = now }
  const breathe = () => new Promise((r) => setTimeout(r, 0))

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
  const maxRatio = Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.5)
  let pixelRatio = maxRatio
  renderer.setPixelRatio(pixelRatio)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = LOOK.exposure
  renderer.info.autoReset = false
  renderer.domElement.className = 'space-canvas'
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(LOOK.background)
  scene.fog = new THREE.FogExp2(LOOK.background, LOOK.fogDensity)
  const camera = new THREE.PerspectiveCamera(compact ? 56 : 46, 1, 0.1, 1200)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const env = pmrem.fromScene(room, 0.04).texture
  scene.environment = env
  scene.environmentIntensity = 0.32
  phase('environment')
  await breathe()

  const rig = createCameraRig({ compact })
  const grid = createGrid({ line: LOOK.gridLine, major: LOOK.gridMajor })
  const dust = createDust({ count: compact ? 500 : 1200, colors: PALETTE, brightness: 0.55 })
  const objects = createObjects({ compact })
  const svgObject = state.svg ? createSvgObject({ compact, src: state.svg }) : null // only when a file is set
  // A second one beside the Technical Skills (in the quiet floor view's open upper right), if set.
  const skillsSvg = state.skillsSvg?.src
    ? createSvgObject({ compact, src: state.skillsSvg.src, color: state.skillsSvg.color || null,
        position: compact ? [1.9, 5.9, -74] : [6.3, 4.8, -77], size: compact ? 1.6 : 2.6 })
    : null
  grid.mesh.name = 'grid'; dust.points.name = 'dust'; objects.group.name = 'objects';
  const mountains = createMountains({ compact })
  scene.add(grid.mesh, mountains.mesh, dust.points, objects.group)
  if (svgObject) scene.add(svgObject.group)
  if (skillsSvg) scene.add(skillsSvg.group)
  phase('world')
  await breathe()


  const hemi = new THREE.HemisphereLight('#6d5cff', '#0b0614', 0.55)
  scene.add(hemi)
  const key = new THREE.DirectionalLight('#e9eaff', 1.5)
  key.position.set(4, 10, 8)
  scene.add(key)
  for (const { color, position, power } of RIM_LIGHTS) {
    const light = new THREE.PointLight(color, power, 0, 2)
    light.position.set(...position)
    scene.add(light)
  }
  const finaleLight = new THREE.PointLight('#b48cff', 0, 0, 2)
  finaleLight.position.set(...CONTACT_LIGHT)
  scene.add(finaleLight)


  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), LOOK.bloom.strength, LOOK.bloom.radius, LOOK.bloom.threshold)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  const grade = new ShaderPass(GradeShader)
  grade.uniforms.uFadeColor.value = [0, 0, 0]
  composer.addPass(grade)


  let anchors = []
  const measure = () => { anchors = state.getAnchors?.() ?? [] }
  let s = 0
  let sTarget = 0
  const readScroll = () => { sTarget = scrollToStation(window.scrollY, anchors) }


  const ndc = new THREE.Vector2(9, 9)
  const pointerPx = { x: -1, y: -1 }
  let pointerFresh = false
  let fine = false
  const raycaster = new THREE.Raycaster()
  let hovered = null
  let hoverKey = ''
  const onMove = (e) => {
    fine = e.pointerType === 'mouse' || e.pointerType === 'pen'
    pointerPx.x = e.clientX
    pointerPx.y = e.clientY
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    pointerFresh = true
    requestRender()
  }
  const onLeave = () => { ndc.set(9, 9); pointerFresh = true }
  const pickAt = () => {
    raycaster.setFromCamera(ndc, camera)
    const hits = [objects.pick(raycaster), svgObject?.pick(raycaster), skillsSvg?.pick(raycaster)].filter(Boolean)
    hits.sort((a, b) => a.distance - b.distance)
    return hits[0] || null
  }
  const onClick = (e) => {
    if (e.target.closest?.(INTERACTIVE)) return
    if (window.getSelection?.()?.toString()) return
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    const hit = pickAt()
    if (!hit) return
    if (hit.kind === 'object') objects.click(hit.item)
    else if (hit.kind === 'svg') hit.api.click()
    clicks += 1
    lastClick = hit.kind
    if (!fine && hit.label) {
      state.onHover?.({ label: hit.label, description: hit.description })
      clearTimeout(tapLabel)
      tapLabel = setTimeout(() => state.onHover?.(null), 2600)
    }
    requestRender()
  }
  let tapLabel = 0
  let clicks = 0
  let lastClick = null
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('click', onClick)
  const onScroll = () => requestRender()
  window.addEventListener('scroll', onScroll, { passive: true })


  const resize = () => {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight)
    renderer.setPixelRatio(pixelRatio)
    composer.setPixelRatio(pixelRatio)
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    bloom.setSize((w * pixelRatio) / 2, (h * pixelRatio) / 2)
    grade.uniforms.uResolution.value = [w, h]
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    measure()
    requestRender()
  }


  let intro = state.reduce || state.ready ? 1 : 0
  let frameAvg = 1 / 60, lastAdjust = 0
  const adapt = (raw, now) => {
    if (state.reduce || raw > 0.25) return
    frameAvg += (raw - frameAvg) * 0.1
    if (now - lastAdjust < 0.6) return
    if (frameAvg > 1 / 50 && pixelRatio > 0.75) pixelRatio = Math.max(0.75, pixelRatio - 0.25)
    else if (frameAvg < 1 / 58 && pixelRatio < maxRatio) pixelRatio = Math.min(maxRatio, pixelRatio + 0.125)
    else return
    lastAdjust = now
    resize()
  }

  const pos = new THREE.Vector3(), aim = new THREE.Vector3(), floorHit = new THREE.Vector3()
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const view = { x: 0, y: 0 }
  const weights = [0, 0, 0, 0, 0]
  const timer = new THREE.Timer()
  let raf = 0

  let frames = 0
  // Day and night: the sky, fog, floor, mountains, light and stars all switch together.
  const sky = createSky({ compact })
  scene.add(sky.group)
  const farField = createFarField({ compact }) // big shapes out in the mountains and the sky
  scene.add(farField.group)
  const flameTrail = createFlameTrail({ compact }) // a little white flame on the grid, following the camera
  scene.add(flameTrail.group)
  const NIGHT_KEY = { color: key.color.clone(), intensity: key.intensity, position: key.position.clone() }
  const NIGHT_HEMI = { sky: hemi.color.clone(), ground: hemi.groundColor.clone(), intensity: hemi.intensity }
  const mu = mountains.mesh.material.uniforms
  const MOUNTAIN_KEYS = ['uRock', 'uSlate', 'uFrost', 'uRim', 'uLine', 'uMist', 'uHaze']
  const NIGHT_MOUNTAINS = Object.fromEntries(MOUNTAIN_KEYS.map((k) => [k, mu[k].value.clone()]))
  const DAY_MOUNTAINS = { uRock: '#566c8c', uSlate: '#7890b0', uFrost: '#f3f8ff', uRim: '#ffffff', uLine: '#e6f0ff', uMist: '#a9c8e8', uHaze: DAY.horizon }
  const rimLights = []
  scene.traverse((o) => { if (o.isPointLight && o !== finaleLight) { o.userData.night = o.intensity; rimLights.push(o) } })
  let appliedNight = null
  function applyMode(night) {
    appliedNight = night
    sky.setNight(night)
    scene.background = night ? new THREE.Color(LOOK.background) : new THREE.Color(DAY.horizon)
    scene.fog.color.set(night ? LOOK.background : DAY.horizon)
    scene.fog.density = night ? LOOK.fogDensity : 0.0075
    grid.mesh.material.uniforms.uDay.value = night ? 0 : 1
    mu.uDay.value = night ? 0 : 1
    MOUNTAIN_KEYS.forEach((k) => mu[k].value.copy(night ? NIGHT_MOUNTAINS[k] : new THREE.Color(DAY_MOUNTAINS[k])))
    hemi.color.copy(night ? NIGHT_HEMI.sky : new THREE.Color('#cfe6ff'))
    hemi.groundColor.copy(night ? NIGHT_HEMI.ground : new THREE.Color('#8a96aa'))
    hemi.intensity = night ? NIGHT_HEMI.intensity : 1.25
    key.color.copy(night ? NIGHT_KEY.color : new THREE.Color('#fff0d8'))
    key.intensity = night ? NIGHT_KEY.intensity : 2.4
    key.position.copy(night ? NIGHT_KEY.position : SUN_DIR.clone().multiplyScalar(60)) // daylight comes from the sun
    rimLights.forEach((l) => { l.intensity = l.userData.night * (night ? 1 : 0.3) })
    dust.points.visible = night // the stars come out at night
  }
  applyMode(!!state.night)

  const draw = () => {
    frames += 1
    renderer.info.reset()
    timer.update()
    const raw = timer.getDelta()
    const dt = Math.min(raw, 1 / 20)
    const t = state.reduce ? 12 : timer.getElapsed() + 12
    adapt(raw, timer.getElapsed())
    const still = !!state.reduce



    if (state.ready && intro < 1) intro = still ? 1 : Math.min(1, intro + Math.min(raw, 0.25) / LOOK.introSeconds)
    const opening = smootherstep(intro, 0, 1)


    readScroll()
    s = still ? sTarget : damp(s, sTarget, 3.2, dt)
    rig.sample(s, pos, aim)
    const intoFrom = (1 - opening) * clamp(1 - s, 0, 1)
    pos.lerp(rig.introFrom.pos, intoFrom)
    aim.lerp(rig.introFrom.aim, intoFrom)


    for (let i = 0; i < 5; i++) weights[i] = clamp(1 - Math.abs(s - i), 0, 1)
    const calm = 1 - weights[3] * 0.6
    const lean = state.interactive && fine && ndc.x < 2
    view.x = damp(view.x, lean ? ndc.x : 0, 2.4, dt)
    view.y = damp(view.y, lean ? ndc.y : 0, 2.4, dt)
    const drift = still ? 0 : 1
    pos.x += (Math.sin(t * 0.11) * 0.7 * drift + view.x * 1.2) * calm
    pos.y += (Math.sin(t * 0.17) * 0.22 * drift + view.y * 0.5) * calm
    aim.x += view.x * 0.7 * calm
    aim.y += view.y * 0.3 * calm
    camera.position.copy(pos)
    camera.lookAt(aim)
    sky.update(t, camera, { still })
    farField.update(t, { intro: opening, still })
    flameTrail.update(t, dt, camera, { intro: opening, still, night: appliedNight })
    camera.updateMatrixWorld()


    let ray = null
    if (fine && ndc.x < 2) {
      raycaster.setFromCamera(ndc, camera)
      ray = raycaster.ray
      const hit = pointerFresh || hovered ? pickAt() : null
      pointerFresh = false
      const key = hit ? (hit.label || 'object') : ''
      hovered = hit
      if (key !== hoverKey) {
        hoverKey = key
        state.onHover?.(hit && hit.label ? { label: hit.label, description: hit.description } : null)
        document.documentElement.classList.toggle('is-over-object', !!hit)
        window.dispatchEvent(new CustomEvent('space-hover', { detail: !!hit }))
      }
    }
    const cursorOnFloor = ray ? ray.intersectPlane(floor, floorHit) : null


    objects.update(t, dt, { ray, intro: opening, finale: weights[4], still })
    svgObject?.update(t, dt, { intro: opening, still })
    skillsSvg?.update(t, dt, { intro: opening, still })
    mountains.update(camera, { reveal: 8 + opening * opening * 420, time: t }) // t is frozen with reduced motion: still mist
    grid.update(camera, {
      reveal: 8 + opening * opening * 420,
      cursor: cursorOnFloor,
      cursorOn: cursorOnFloor ? 1 : 0,
    })
    dust.update(t, camera, pixelRatio)



    finaleLight.intensity = 520 * weights[4]

    grade.uniforms.uTime.value = t
    grade.uniforms.uFade.value = 1 - smootherstep(intro, 0, 0.22)
    composer.render(dt)
  }

  const loop = () => {
    raf = 0
    draw()
    if (!state.reduce && !document.hidden) raf = requestAnimationFrame(loop)
  }
  function requestRender() { if (!raf) raf = requestAnimationFrame(loop) }
  const onVisible = () => { if (!document.hidden) requestRender() }
  document.addEventListener('visibilitychange', onVisible)

  const observer = new ResizeObserver(resize)
  observer.observe(container)
  const bodyObserver = new ResizeObserver(measure)
  bodyObserver.observe(document.body)
  resize()
  draw()
  phase('first frame')
  requestRender()

  return {
    _debug: { scene, camera },
    stats: () => ({ ready: !!state.ready, frames, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, phases, station: +s.toFixed(2), intro: +intro.toFixed(2), clicks, lastClick, hover: hoverKey, pixelRatio }),
    bench(frames = 4) {
      const gl = renderer.getContext(), px = new Uint8Array(4)
      const wait = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
      draw(); wait()
      const t0 = performance.now()
      for (let i = 0; i < frames; i++) { draw(); wait() }
      return Math.round((performance.now() - t0) / frames)
    },

    replay() {
      intro = state.reduce ? 1 : 0
      requestRender()
    },
    update(next) {
      const wasReady = state.ready
      state = { ...state, ...next }
      if (!!state.night !== appliedNight) { applyMode(!!state.night); draw() } // switch now, so the reveal shows the new sky
      if (!wasReady && state.ready && state.reduce) intro = 1
      measure()
      requestRender()
    },
    dispose() {
      cancelAnimationFrame(raf)
      clearTimeout(tapLabel)
      raf = -1
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('click', onClick)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisible)
      document.documentElement.classList.remove('is-over-object')
      observer.disconnect()
      bodyObserver.disconnect()
      scene.traverse((o) => {
        o.geometry?.dispose()
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
        mats.forEach((m) => { Object.values(m).forEach((v) => v?.isTexture && v.dispose()); m.dispose() })
      })
      env.dispose(); pmrem.dispose(); room.dispose?.()
      composer.dispose(); bloom.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
