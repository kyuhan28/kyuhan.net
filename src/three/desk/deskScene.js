import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createStickyNotes } from './stickyNotes'
import { createSunlitRoom } from './sunlitRoom'
import { site } from '../../content/site'

export const DESK_TOP = 0.77
const MODEL_URL = `${import.meta.env.BASE_URL}desk/little-office-desk.glb`
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`
const MODEL_DESK_TOP = 1.805
const MODEL_SCALE = DESK_TOP / MODEL_DESK_TOP

const key = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const PART = { display: 'monitorflatdisplay', bezel: 'monitorlowerchin', bulb: 'lampwarmbulb', knuckle: 'lampheadknuckle', shade: 'lampconicalshade' }

const CHAIR = { shift: [1.15, 0, 0.05], turn: -0.45 }

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

    floor: new THREE.MeshStandardMaterial({ color: '#c9a888', roughness: 0.7, envMapIntensity: 0.3, transparent: true, alphaMap: floorFade() }),
  }
}
function room(M) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR.size, FLOOR.size).rotateX(-Math.PI / 2), M.floor)
  floor.receiveShadow = true
  floor.position.set(0, 0, FLOOR.centerZ)
  floor.renderOrder = -1
  return floor
}

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
    mesh.castShadow = !glowing
    mesh.receiveShadow = true
    ;(set === 'apart' ? apart : merged).add(mesh)
    geometries.forEach((g) => g !== mesh.geometry && g.dispose())
  }
  return { merged, apart }
}

function partBox(scene, part) {
  let found = null
  scene.traverse((o) => { if (!found && o.isMesh && key(o.name) === part) found = o })
  return found ? new THREE.Box3().setFromObject(found) : null
}

function stationery() {
  const K = 1 / MODEL_SCALE, TOP = 1.805
  const mat = (color, roughness = 0.5, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness })
  const g = new THREE.Group()
  g.name = 'stationery'
  const along = (geo) => geo.rotateZ(Math.PI / 2)

  const r = 0.0036 * K, body = 0.15 * K, cone = 0.02 * K
  const pencil = new THREE.Group()
  const part = (geo, m, x) => { const mesh = new THREE.Mesh(geo, m); mesh.position.x = x; mesh.castShadow = true; mesh.receiveShadow = true; pencil.add(mesh); return mesh }
  part(along(new THREE.CylinderGeometry(r, r, body, 6).rotateY(Math.PI / 6)), mat('#f2b632', 0.55), 0)
  part(along(new THREE.CylinderGeometry(r * 1.04, r * 1.04, 0.011 * K, 16)), mat('#c9cbd0', 0.32, 0.85), -body / 2 - 0.0055 * K)
  part(along(new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.009 * K, 16)), mat('#ec8aa0', 0.7), -body / 2 - 0.0155 * K)
  part(along(new THREE.ConeGeometry(r, cone, 6).rotateY(Math.PI / 6)).rotateZ(Math.PI), mat('#e6c197', 0.75), body / 2 + cone / 2)
  part(along(new THREE.ConeGeometry(r * 0.32, cone * 0.32, 12)).rotateZ(Math.PI), mat('#3b3b40', 0.4), body / 2 + cone - cone * 0.16)
  pencil.position.set(0.93, TOP + r * Math.cos(Math.PI / 6), 0.04)
  pencil.rotation.y = 0.32
  g.add(pencil)

  const pr = 0.0046 * K, barrel = 0.095 * K, cap = 0.045 * K
  const pen = new THREE.Group()
  const ppart = (geo, m, x, y = 0, z = 0) => { const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; pen.add(mesh); return mesh }
  ppart(along(new THREE.CylinderGeometry(pr, pr, barrel, 20)), mat('#1f3a6d', 0.32), 0)
  ppart(along(new THREE.CylinderGeometry(pr * 1.08, pr * 1.08, cap, 20)), mat('#16294d', 0.3), -barrel / 2 - cap / 2 + 0.006 * K)
  ppart(new THREE.BoxGeometry(cap * 0.7, 0.0008 * K, 0.0022 * K), mat('#c9cbd0', 0.28, 0.9), -barrel / 2 - cap * 0.4, pr * 1.12)
  ppart(along(new THREE.ConeGeometry(pr * 0.7, 0.012 * K, 20)).rotateZ(Math.PI), mat('#c9cbd0', 0.28, 0.9), barrel / 2 + 0.006 * K)
  pen.position.set(1.01, TOP + pr * 1.08, -0.07)
  pen.rotation.y = -0.21
  g.add(pen)
  return g
}

export function buildDesk({ reduce = false } = {}) {
  const M = createMaterials()
  const root = new THREE.Group()
  root.name = 'workspace'
  root.add(room(M))

  const studio = createSunlitRoom({ reduce })
  root.add(studio.group)

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.724, 0.394), new THREE.MeshBasicMaterial())
  screen.name = 'monitor screen (the portfolio is mapped onto it)'
  screen.visible = false
  screen.position.set(-0.05, 1.11, -0.24)
  root.add(screen)

  const lampLight = new THREE.SpotLight('#ffd6a3', 0, 0, THREE.MathUtils.degToRad(59), 0.65, 2)
  root.add(lampLight, lampLight.target)

  const notes = { current: null }

  const draco = new DRACOLoader().setDecoderPath(DRACO_PATH)
  const loader = new GLTFLoader().setDRACOLoader(draco)
  const loaded = loader.loadAsync(MODEL_URL).then((gltf) => {
    const model = gltf.scene
    model.updateMatrixWorld(true)

    const display = partBox(model, PART.display)
    const bezel = partBox(model, PART.bezel)
    const bulb = partBox(model, PART.bulb)
    const knuckle = partBox(model, PART.knuckle)
    const shade = partBox(model, PART.shade)
    const { merged, apart: chair } = mergeByMaterial(model, (o) => key(o.name).startsWith('chair'))
    model.traverse((o) => o.isMesh && o.geometry.dispose())

    const cb = new THREE.Box3().setFromObject(chair), pivot = new THREE.Vector3((cb.min.x + cb.max.x) / 2, 0, (cb.min.z + cb.max.z) / 2)
    chair.children.forEach((m) => m.geometry.translate(-pivot.x, 0, -pivot.z))
    chair.position.copy(pivot).add(new THREE.Vector3(...CHAIR.shift))
    chair.rotation.y = CHAIR.turn
    merged.add(chair)

    merged.traverse((o) => {
      if (o.isMesh && key(o.material.name).includes('shadelining')) Object.assign(o.material, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })

      if (o.isMesh && o.material.isMeshStandardMaterial && !o.material.isMeshPhysicalMaterial && /walnut/i.test(o.material.name)) {
        const w = o.material
        o.material = new THREE.MeshPhysicalMaterial({
          name: w.name, color: w.color.clone(), map: w.map, roughnessMap: w.roughnessMap, normalMap: w.normalMap,
          normalScale: w.normalScale.clone(), roughness: w.roughness, metalness: w.metalness, envMapIntensity: w.envMapIntensity,
          side: w.side, clearcoat: 0.32, clearcoatRoughness: 0.42,
        })
        w.dispose()
      }
    })
    merged.scale.setScalar(MODEL_SCALE)
    merged.add(stationery())
    root.add(merged)
    const S = MODEL_SCALE
    if (display) {
      const w = (display.max.x - display.min.x) * S, h = (display.max.y - display.min.y) * S
      screen.geometry.dispose()
      screen.geometry = new THREE.PlaneGeometry(w, h)
      screen.position.set(((display.min.x + display.max.x) / 2) * S, ((display.min.y + display.max.y) / 2) * S, display.max.z * S + 0.0005)
    }
    if (bulb && knuckle && shade) {
      const c = (b) => b.getCenter(new THREE.Vector3()).multiplyScalar(S)
      const dir = c(shade).sub(c(knuckle)).normalize()
      const r = bulb.getSize(new THREE.Vector3()).x * S / 2
      lampLight.position.copy(c(bulb)).addScaledVector(dir, r + 0.006)
      lampLight.target.position.copy(lampLight.position).add(dir)
    }
    if (bezel) {
      const b = { min: bezel.min.clone().multiplyScalar(S), max: bezel.max.clone().multiplyScalar(S) }
      notes.current = createStickyNotes(b, { reduce, labels: site.stickyNotes ?? [] })
      root.add(notes.current.group)
    }
    draco.dispose()
    return { parts: merged.children.length, screen: { width: screen.geometry.parameters.width, height: screen.geometry.parameters.height } }
  })
  return { root, screen, materials: M, lampLight, notes, studio, loaded }
}
