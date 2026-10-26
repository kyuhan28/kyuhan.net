import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

/*
 * The developer studio around the desk: architecture, materials and light, not objects. All in site
 * meters, around the desk (its top at 0.77 m, its back edge about 0.46 m behind the centre, the monitor
 * at the centre); sized for the camera's framing on wide and narrow screens.
 *
 *   back wall   large matte charcoal panels, divided by a few thin brushed-aluminium seams; it stands
 *               0.6 m behind the monitor (nothing comes near it) and takes the desk's real shadow
 *   recess      a shallow bay behind the computer, a deeper midnight tone, with one thin cyan strip
 *               along its lower inner edge: its light washes the bay (area lights, not a neon glow)
 *   seams       the two either side of the desk carry thin cool-white light lines
 *   cove        a recessed line of cool light along the foot of the wall, behind the desk
 *   ledge       left: a slim floating shelf with a soft under-light
 *   column      right: a narrow frosted-glass technical column, a fine line inside, three status lights
 * The only motion: the cyan light breathes a few percent over about ten seconds (still with reduced motion).
 */

const WALL_Z = -0.95 // the wall's face
const WALL_W = 9, WALL_H = 3.2
const SEAMS = [-2.3, -0.86, 0.86, 2.3] // x of the aluminium seams (the inner two are lit)
const RECESS = { x: 0.74, y0: 0.9, y1: 2.12, depth: 0.07 } // half width, bottom, top, depth
const CYAN = '#5ccfff', COOL = '#dbe6ff'

function materials() {
  return {
    panel: new THREE.MeshStandardMaterial({ color: '#2b2e35', roughness: 0.86, metalness: 0 }),        // matte charcoal
    recess: new THREE.MeshStandardMaterial({ color: '#151b27', roughness: 0.92, metalness: 0 }),       // deeper midnight
    returns: new THREE.MeshStandardMaterial({ color: '#1c1f25', roughness: 0.7, metalness: 0.2 }),      // the recess's sides: matte dark paint
    darkMetal: new THREE.MeshStandardMaterial({ color: '#25282e', roughness: 0.42, metalness: 0.85 }), // dark painted metal
    aluminium: new THREE.MeshStandardMaterial({ color: '#9aa1ab', roughness: 0.32, metalness: 1 }),    // brushed seams
    glass: new THREE.MeshPhysicalMaterial({ color: '#c9d6e8', roughness: 0.55, metalness: 0, transmission: 0, transparent: true, opacity: 0.16, depthWrite: false }),
    // light-emitting strips: unlit, a little above white so they read as light, kept low so they never compete
    cyan: new THREE.MeshBasicMaterial({ color: new THREE.Color(CYAN).multiplyScalar(1.9) }),
    cool: new THREE.MeshBasicMaterial({ color: new THREE.Color(COOL).multiplyScalar(0.62) }),
    dim: new THREE.MeshBasicMaterial({ color: new THREE.Color(COOL).multiplyScalar(0.55) }),
  }
}

const box = (w, h, d, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  return m
}

export function createStudioRoom({ reduce = false } = {}) {
  RectAreaLightUniformsLib.init()
  const M = materials()
  const group = new THREE.Group()
  group.name = 'developer studio'
  const receive = (m) => { m.receiveShadow = true; return m }

  // ---------- the back wall: one continuous surface, with an opening for the recess ----------
  const shape = new THREE.Shape()
  shape.moveTo(-WALL_W / 2, 0); shape.lineTo(WALL_W / 2, 0); shape.lineTo(WALL_W / 2, WALL_H); shape.lineTo(-WALL_W / 2, WALL_H); shape.closePath()
  const hole = new THREE.Path()
  hole.moveTo(-RECESS.x, RECESS.y0); hole.lineTo(-RECESS.x, RECESS.y1); hole.lineTo(RECESS.x, RECESS.y1); hole.lineTo(RECESS.x, RECESS.y0); hole.closePath()
  shape.holes.push(hole)
  const wall = receive(new THREE.Mesh(new THREE.ShapeGeometry(shape), M.panel))
  wall.position.z = WALL_Z
  group.add(wall)

  // the recess: a back panel set in, and its four returns
  const rw = RECESS.x * 2, rh = RECESS.y1 - RECESS.y0, rz = WALL_Z - RECESS.depth
  const back = receive(new THREE.Mesh(new THREE.PlaneGeometry(rw, rh), M.recess))
  back.position.set(0, (RECESS.y0 + RECESS.y1) / 2, rz)
  group.add(back)
  const ret = (w, h, x, y, rotX, rotY) => {
    const m = receive(new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.returns))
    m.position.set(x, y, WALL_Z - RECESS.depth / 2)
    m.rotation.set(rotX, rotY, 0)
    group.add(m)
  }
  ret(rw, RECESS.depth, 0, RECESS.y1, Math.PI / 2, 0)            // top return, facing down
  ret(rw, RECESS.depth, 0, RECESS.y0, -Math.PI / 2, 0)           // bottom return, facing up
  ret(RECESS.depth, rh, -RECESS.x, (RECESS.y0 + RECESS.y1) / 2, 0, Math.PI / 2)   // left return
  ret(RECESS.depth, rh, RECESS.x, (RECESS.y0 + RECESS.y1) / 2, 0, -Math.PI / 2)   // right return
  // the cyan strip along the recess's lower inner edge, tucked under a thin metal lip
  group.add(box(rw - 0.02, 0.004, 0.004, M.cyan, 0, RECESS.y0 + 0.006, rz + 0.012))
  group.add(box(rw, 0.008, 0.016, M.darkMetal, 0, RECESS.y0 + 0.012, rz + 0.026))

  // ---------- seams: thin brushed aluminium; the inner two carry a light line ----------
  for (const x of SEAMS) {
    group.add(box(0.012, WALL_H, 0.006, M.aluminium, x, WALL_H / 2, WALL_Z + 0.003))
    if (Math.abs(x) < 1) group.add(box(0.003, RECESS.y1 - RECESS.y0, 0.003, M.cool, x, (RECESS.y0 + RECESS.y1) / 2, WALL_Z + 0.0065)) // as tall as the recess: they frame it
  }

  // ---------- the cove: a recessed line of light along the foot of the wall ----------
  group.add(box(WALL_W, 0.05, 0.03, M.darkMetal, 0, 0.025, WALL_Z + 0.015))       // a dark plinth
  group.add(box(WALL_W - 0.1, 0.004, 0.004, M.dim, 0, 0.056, WALL_Z + 0.022))      // the light line on it

  // ---------- left: a slim floating ledge, softly lit from below ----------
  const ledge = { x0: -1.42, x1: -0.98, y: 1.46, d: 0.14 }
  group.add(box(ledge.x1 - ledge.x0, 0.022, ledge.d, M.darkMetal, (ledge.x0 + ledge.x1) / 2, ledge.y, WALL_Z + ledge.d / 2))
  group.add(box(ledge.x1 - ledge.x0 - 0.04, 0.003, 0.003, M.cool, (ledge.x0 + ledge.x1) / 2, ledge.y - 0.0125, WALL_Z + ledge.d - 0.02))

  // ---------- right: a narrow frosted-glass technical column ----------
  const col = { x: 1.13, y0: 0.98, y1: 1.72, w: 0.1, d: 0.05 }
  const cy = (col.y0 + col.y1) / 2, ch = col.y1 - col.y0
  group.add(box(col.w + 0.012, ch + 0.012, 0.012, M.darkMetal, col.x, cy, WALL_Z + 0.006))  // its frame on the wall
  group.add(box(0.003, ch - 0.06, 0.003, M.cyan, col.x, cy, WALL_Z + 0.02))                   // a fine line inside
  const pane = new THREE.Mesh(new THREE.BoxGeometry(col.w, ch, col.d), M.glass)
  pane.position.set(col.x, cy, WALL_Z + col.d / 2 + 0.012)
  pane.renderOrder = 2
  group.add(pane)
  const dot = new THREE.CircleGeometry(0.0045, 16)
  ;[[M.cyan, 0], [M.dim, 1], [M.dim, 2]].forEach(([mat, i]) => {           // three small status lights
    const d = new THREE.Mesh(dot, mat)
    d.position.set(col.x, col.y0 + 0.05 + i * 0.026, WALL_Z + col.d + 0.0125)
    group.add(d)
  })

  // ---------- light: area lights, so the strips actually light the architecture (softly) ----------
  const recessLight = new THREE.RectAreaLight(CYAN, 4.5, rw - 0.04, 0.03)
  recessLight.position.set(0, RECESS.y0 + 0.02, rz + 0.03)
  recessLight.lookAt(0, RECESS.y1, rz + 0.01)          // up across the bay's back panel
  const coveLight = new THREE.RectAreaLight(COOL, 0.9, 4, 0.04)
  coveLight.position.set(0, 0.06, WALL_Z + 0.04)
  coveLight.lookAt(0, 1.2, WALL_Z + 0.02)             // up the wall
  const ledgeLight = new THREE.RectAreaLight(COOL, 1.4, ledge.x1 - ledge.x0 - 0.04, 0.03)
  ledgeLight.position.set((ledge.x0 + ledge.x1) / 2, ledge.y - 0.016, WALL_Z + ledge.d - 0.03)
  ledgeLight.lookAt((ledge.x0 + ledge.x1) / 2, ledge.y - 1, WALL_Z + 0.02)   // down the wall below it
  // a wall-washer: a wide soft light near the top of the wall, grazing down it (the gentle top-to-bottom
  // gradient of a real studio wall)
  const washer = new THREE.RectAreaLight('#e6ebf5', 2.4, 6, 0.3)
  washer.position.set(0, 2.7, WALL_Z + 0.45)
  washer.lookAt(0, 0.9, WALL_Z)
  group.add(recessLight, coveLight, ledgeLight, washer)

  const cyanBase = M.cyan.color.clone()
  let time = 0
  return {
    group,
    /** The cyan light breathes a few percent over about ten seconds (still with reduced motion). */
    update(dt) {
      if (reduce) return
      time += Math.min(dt, 0.1)
      const k = 1 + 0.05 * Math.sin((time * Math.PI * 2) / 10)
      recessLight.intensity = 4.5 * k
      M.cyan.color.copy(cyanBase).multiplyScalar(k)
    },
    dispose() {
      group.traverse((o) => { if (o.isMesh) o.geometry.dispose() })
      Object.values(M).forEach((m) => m.dispose())
    },
  }
}
