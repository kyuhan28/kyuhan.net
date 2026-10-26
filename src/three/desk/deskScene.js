import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createStickyNotes } from './stickyNotes'
import { createStudioRoom } from './studioRoom'
import { site } from '../../content/site'

/*
 * The workstation: Kyu Han's own Blender model (public/desk/little-office-desk.glb, exported from
 * little-office.blend): a walnut desk on graphite steel legs with a drawer cabinet, the monitor, a
 * full keyboard, a mouse on its pad, spiral notebooks, a mug, an architect lamp and the office chair.
 * It stands in a minimal developer studio (studioRoom.js): a dark architectural wall, a lit recess behind
 * the computer, a polished stone floor.
 *
 * buildDesk() returns at once (the floor, and a screen and a lamp light that are moved into place when
 * the model arrives); `loaded` resolves once the model is in the scene.
 *
 *   screen  an invisible plane laid exactly over the model's display: the camera frames it, and the
 *           portfolio page is mapped onto its four corners
 *   lamp    the model carries the lamp's shape; its light is recreated here, at the bulb, aimed along
 *           the shade (as in Blender)
 *   notes   sticky notes hung from the monitor's bottom bezel (stickyNotes.js): they sway, and flick when
 *           clicked
 * The model's parts are merged by material (about 400 objects into a few dozen meshes): it never moves,
 * and that keeps the drawing light, on phones too. The chair is merged on its own, so it can stand
 * where the site's front-on camera can see past it: CHAIR below (pushed back, turned to the side).
 */

export const DESK_TOP = 0.77 // height of the desk's surface, in the site's meters
const MODEL_URL = `${import.meta.env.BASE_URL}desk/little-office-desk.glb`
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`
const MODEL_DESK_TOP = 1.805 // the desk's surface in the Blender model's units
const MODEL_SCALE = DESK_TOP / MODEL_DESK_TOP

// The model's parts, by their Blender names (the loader tidies names, so they're matched loosely).
const key = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const PART = { display: 'monitorflatdisplay', bezel: 'monitorlowerchin', bulb: 'lampwarmbulb', knuckle: 'lampheadknuckle', shade: 'lampconicalshade' }
// The chair, pushed back from the desk and turned: in Blender's high view you see over it; the site
// looks at the desk front-on, where it would stand in front of the mouse and mug. (Model units, radians.)
const CHAIR = { shift: [1.15, 0, 0.05], turn: -0.45 }

// ---------- the studio floor ----------
function canvasTexture(w, h, paint, { srgb = true } = {}) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  paint(c.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(c)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}
// Solid around the desk, it fades out with distance (wider than deep) and dissolves into the studio
// backdrop behind it (studioBackdrop.js), so there is no edge. It receives the desk's real shadows.
const FLOOR = { size: 36, centerZ: -4, deskZ: -0.085 }
function floorFade() {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    const cx = w * 0.5, cy = h * (0.5 - (FLOOR.deskZ - FLOOR.centerZ) / FLOOR.size)
    g.save()
    g.translate(cx, cy)
    g.scale(1.45, 1)
    const r = g.createRadialGradient(0, 0, 0, 0, 0, w * 0.27)
    r.addColorStop(0, '#fff'); r.addColorStop(0.32, '#fff'); r.addColorStop(0.7, '#555'); r.addColorStop(1, '#000')
    g.fillStyle = r
    g.fillRect(-w, -h, w * 2, h * 2)
    g.restore()
  }, { srgb: false })
}
function createMaterials() {
  return {
    // the studio floor: matte (its color is set by studioLight.js)
    floor: new THREE.MeshStandardMaterial({ color: '#101216', roughness: 0.6, envMapIntensity: 0.35, transparent: true, alphaMap: floorFade() }), // polished dark stone
  }
}
function room(M) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR.size, FLOOR.size).rotateX(-Math.PI / 2), M.floor)
  floor.receiveShadow = true
  floor.position.set(0, 0, FLOOR.centerZ)
  floor.renderOrder = -1 // first among the see-through things: it's the furthest back of them
  return floor
}

// ---------- the model ----------
/** Merge the model's meshes by material (and matching vertex layout), in the model's own space. */
function mergeByMaterial(scene, separate = () => false) {
  scene.updateMatrixWorld(true)
  const groups = new Map()
  scene.traverse((o) => {
    if (!o.isMesh) return
    const g = o.geometry.clone().applyMatrix4(o.matrixWorld)
    const layout = Object.keys(g.attributes).sort().join(',') + (g.index ? '|i' : '')
    const set = separate(o) ? 'apart' : 'main'
    const id = set + '|' + o.material.uuid + '|' + layout
    if (!groups.has(id)) groups.set(id, { set, material: o.material, geometries: [], names: [] })
    groups.get(id).geometries.push(g)
    groups.get(id).names.push(o.name)
  })
  const merged = new THREE.Group(); merged.name = 'little office'
  const apart = new THREE.Group(); apart.name = 'chair'
  for (const { set, material, geometries, names } of groups.values()) {
    const mesh = new THREE.Mesh(geometries.length > 1 ? mergeGeometries(geometries, false) : geometries[0], material)
    mesh.name = names.length > 1 ? `${material.name} (${names.length} parts)` : names[0]
    const glowing = material.emissiveIntensity > 1 && material.emissive && material.emissive.getHex() !== 0
    mesh.castShadow = !glowing // the bulb doesn't block its own light (as in Blender)
    mesh.receiveShadow = true
    ;(set === 'apart' ? apart : merged).add(mesh)
    geometries.forEach((g) => g !== mesh.geometry && g.dispose())
  }
  return { merged, apart }
}
/** A named part's bounding box in the model's own space. */
function partBox(scene, part) {
  let found = null
  scene.traverse((o) => { if (!found && o.isMesh && key(o.name) === part) found = o })
  return found ? new THREE.Box3().setFromObject(found) : null
}

export function buildDesk({ reduce = false } = {}) {
  const M = createMaterials()
  const root = new THREE.Group()
  root.name = 'workspace'
  root.add(room(M))
  // the developer studio around it: wall, recess, light strips (built at once; it doesn't wait for the model)
  const studio = createStudioRoom({ reduce })
  root.add(studio.group)
  // the screen: placed where the display is once the model arrives (its size is set then too)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.724, 0.394), new THREE.MeshBasicMaterial())
  screen.name = 'monitor screen (the portfolio is mapped onto it)'
  screen.visible = false
  screen.position.set(-0.05, 1.11, -0.24)
  root.add(screen)
  // the lamp's light: aimed down along the shade once the model arrives
  const lampLight = new THREE.SpotLight('#ffd6a3', 0, 0, THREE.MathUtils.degToRad(59), 0.65, 2)
  root.add(lampLight, lampLight.target)

  // sticky notes on the monitor's bottom bezel (stickyNotes.js): hung once the model has arrived
  const notes = { current: null }

  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH)
  const loader = new GLTFLoader().setDRACOLoader(draco)
  const loaded = loader.loadAsync(MODEL_URL).then((gltf) => {
    const model = gltf.scene
    model.updateMatrixWorld(true)
    // anchors from the named parts, in the model's space, before merging
    const display = partBox(model, PART.display)
    const bezel = partBox(model, PART.bezel)
    const bulb = partBox(model, PART.bulb)
    const knuckle = partBox(model, PART.knuckle)
    const shade = partBox(model, PART.shade)
    const { merged, apart: chair } = mergeByMaterial(model, (o) => key(o.name).startsWith('chair'))
    model.traverse((o) => o.isMesh && o.geometry.dispose())
    // the chair: pivot on its own footprint, then pushed back and turned
    const cb = new THREE.Box3().setFromObject(chair), pivot = new THREE.Vector3((cb.min.x + cb.max.x) / 2, 0, (cb.min.z + cb.max.z) / 2)
    chair.children.forEach((m) => m.geometry.translate(-pivot.x, 0, -pivot.z))
    chair.position.copy(pivot).add(new THREE.Vector3(...CHAIR.shift))
    chair.rotation.y = CHAIR.turn
    merged.add(chair)
    // the lamp shade's lining sits right on the shade's inner wall: draw it on top, so they don't flicker
    merged.traverse((o) => {
      if (o.isMesh && key(o.material.name).includes('shadelining')) Object.assign(o.material, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
    })
    merged.scale.setScalar(MODEL_SCALE)
    root.add(merged)
    const S = MODEL_SCALE
    if (display) { // the display's front face, a hair in front of it
      const w = (display.max.x - display.min.x) * S, h = (display.max.y - display.min.y) * S
      screen.geometry.dispose()
      screen.geometry = new THREE.PlaneGeometry(w, h)
      screen.position.set(((display.min.x + display.max.x) / 2) * S, ((display.min.y + display.max.y) / 2) * S, display.max.z * S + 0.0005)
    }
    if (bulb && knuckle && shade) { // the light: just in front of the bulb, along the shade's axis
      const c = (b) => b.getCenter(new THREE.Vector3()).multiplyScalar(S)
      const dir = c(shade).sub(c(knuckle)).normalize()
      const r = bulb.getSize(new THREE.Vector3()).x * S / 2
      lampLight.position.copy(c(bulb)).addScaledVector(dir, r + 0.006)
      lampLight.target.position.copy(lampLight.position).add(dir)
    }
    if (bezel) {
      const b = { min: bezel.min.clone().multiplyScalar(S), max: bezel.max.clone().multiplyScalar(S) }
      notes.current = createStickyNotes(b, { reduce, labels: site.stickyNotes ?? [] }) // labels: site.js
      root.add(notes.current.group)
    }
    draco.dispose()
    return { parts: merged.children.length, screen: { width: screen.geometry.parameters.width, height: screen.geometry.parameters.height } }
  })
  return { root, screen, materials: M, lampLight, notes, studio, loaded }
}
