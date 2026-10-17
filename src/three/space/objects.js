import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { GALLERY_Z, QUIET } from './camera'

/*
 * The floating objects: rounded and sharp cubes, prisms, spheres, rings, gems, chrome halos and a
 * few neon-edged hero blocks, spread along the whole journey.
 *
 * Each has its own idle rhythm (bob, sway, spin) and reacts to you:
 * - hover:  it brightens
 * - nearby: it drifts aside from the cursor and spins a little faster
 * - click:  a springy bounce, a spin and a flash of color
 * In the opening they emerge from the dark (nearest first); at the contact station they gather into a ring.
 * Each kind is one instanced draw. All motion is time-based (frame-rate independent), and nothing
 * is allocated per frame.
 */

export const PALETTE = ['#3d7bff', '#8b5cff', '#c4b5fd', '#ff6b6b', '#ff8a3d', '#ff5fa2', '#3dffb5', '#ffd23f']

// The colored rim lights, shared with SpaceApp. Objects keep clear of them: a point light's
// brightness climbs steeply up close, and an object within a meter or two blows out and blooms.
export const RIM_LIGHTS = [
  { color: '#ff3d8b', position: [-16, 9, -30], power: 520 },
  { color: '#3d7bff', position: [17, 9, -34], power: 480 },
  { color: '#8f5bff', position: [0, 12, -52], power: 600 },
]
// The contact station's glow: in front of the ring, between it and the camera, so it lights the
// gathered objects' faces evenly from ~20m instead of blowing out the nearest ones.
export const CONTACT_LIGHT = [0, 8, -66]
const LIGHT_CLEARANCE = 7

function seeded(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}


// Is this spot kept clear? The rim lights, the camera's path, the gallery, and the quiet floor.
function blocked(x, y, z) {
  for (const [lx, ly, lz] of [...RIM_LIGHTS.map((l) => l.position), CONTACT_LIGHT]) if (Math.hypot(x - lx, y - ly, z - lz) < LIGHT_CLEARANCE) return true
  const pathX = z > -6 ? 0 : z > -35 ? 1.2 : 0
  if (Math.abs(x - pathX) < 2.3 && y < 6 && z > -64) return true
  if (z < GALLERY_Z + 8 && z > GALLERY_Z - 8 && x > -8 && x < 10) return true // the gallery and the project list's view
  if (Math.abs(x - QUIET.x) < QUIET.halfWidth && z < QUIET.zNear && z > QUIET.zFar && y < QUIET.height) return true // the skills view stays minimal
  return false
}

export function createObjects({ compact }) {
  const group = new THREE.Group()
  const rand = seeded(42)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const spot = () => {
    for (;;) {
      const z = 8 - Math.pow(rand(), 0.95) * 100
      const x = (rand() - 0.5) * (18 + Math.abs(z - 8) * 0.55)
      const y = 0.8 + Math.pow(rand(), 0.8) * (6 + Math.abs(z) * 0.08)
      if (!blocked(x, y, z)) return new THREE.Vector3(x, y, z)
    }
  }
  // Clearcoat a touch soft: sharp coats turn the colored lights into blooming pinpoints.
  const glossy = (opts = {}) => new THREE.MeshPhysicalMaterial({ roughness: 0.24, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.2, ...opts })
  const n = (desktop, phone) => (compact ? phone : desktop)
  const kinds = [
    { geo: new RoundedBoxGeometry(1, 1, 1, 4, 0.16), mat: glossy(), count: n(20, 10), size: [0.55, 1.3] },
    { geo: new THREE.BoxGeometry(1, 1, 1), mat: glossy({ roughness: 0.3 }), count: n(10, 5), size: [0.5, 1.0] }, // sharp-edged
    { geo: new RoundedBoxGeometry(0.6, 1.7, 0.6, 3, 0.1), mat: glossy(), count: n(9, 4), size: [0.7, 1.3] }, // prisms
    { geo: new THREE.SphereGeometry(0.5, 40, 24), mat: glossy({ roughness: 0.16 }), count: n(10, 5), size: [0.35, 0.9] },
    { geo: new THREE.TorusGeometry(0.48, 0.17, 24, 64), mat: glossy(), count: n(8, 4), size: [0.6, 1.2] },
    { geo: new THREE.IcosahedronGeometry(0.62, 0), mat: glossy({ flatShading: true, roughness: 0.12 }), count: n(8, 4), size: [0.5, 1.1] },
    { geo: new THREE.CapsuleGeometry(0.26, 0.6, 8, 24), mat: glossy(), count: n(7, 3), size: [0.7, 1.2] },
    {
      geo: new THREE.TorusGeometry(0.6, 0.06, 16, 96),
      mat: new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.3, iridescence: 1, iridescenceIOR: 1.4, iridescenceThicknessRange: [180, 700] }),
      count: n(6, 3), size: [0.8, 1.6], plain: true,
    },
  ]

  const items = []
  const meshes = []
  const color = new THREE.Color()
  const white = new THREE.Color('#ffffff')
  const newItem = (mesh, index, base, scale, c) => {
    const item = {
      mesh, index, base, scale, color: new THREE.Color(c), boost: 0, pos: base.clone(),
      quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6)),
      m: {
        bob: 0.12 + rand() * 0.35, bobSpeed: 0.35 + rand() * 0.55, sway: 0.05 + rand() * 0.18, swaySpeed: 0.2 + rand() * 0.35,
        spin: new THREE.Vector3((rand() - 0.5) * 0.6, (rand() - 0.5) * 0.8, (rand() - 0.5) * 0.5), phase: rand() * Math.PI * 2,
      },
      hover: 0, push: new THREE.Vector3(), bounce: 0, bounceVel: 0, spinAngle: 0, spinVel: 0, flash: 0,
      spinAxis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
      delay: 0, ring: new THREE.Vector3(),
    }
    items.push(item)
    return item
  }
  for (const k of kinds) {
    const mesh = new THREE.InstancedMesh(k.geo, k.mat, k.count)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    for (let i = 0; i < k.count; i++) {
      const c = k.plain ? '#ffffff' : pick(PALETTE)
      mesh.setColorAt(i, color.set(c))
      newItem(mesh, i, spot(), k.size[0] + rand() * (k.size[1] - k.size[0]), c)
    }
    group.add(mesh)
    meshes.push(mesh)
  }

  // Hero blocks: larger rounded cubes whose edges glow.
  const heroGeo = new RoundedBoxGeometry(1, 1, 1, 4, 0.1)
  const heroEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.012, 1.012, 1.012))
  const heroSpots = compact
    ? [[-3.2, 3.6, -4], [3.4, 2.6, -14], [-3.5, 4.2, -28]]
    : [[-6.5, 3.6, -5], [6.2, 2.6, -12], [-4.2, 5.6, -22], [9, 4.6, -27], [-11, 2.8, -16], [7.5, 6.5, -58]]
  heroSpots.forEach(([x, y, z], i) => {
    const c = PALETTE[(i * 3 + 1) % PALETTE.length]
    const mat = glossy({ color: new THREE.Color(c).multiplyScalar(0.55), roughness: 0.35, clearcoat: 0.6, emissive: new THREE.Color(c), emissiveIntensity: 0 })
    const mesh = new THREE.Mesh(heroGeo, mat)
    mesh.add(new THREE.LineSegments(heroEdges, new THREE.LineBasicMaterial({ color: new THREE.Color(c).multiplyScalar(3.2), toneMapped: false })))
    group.add(mesh)
    meshes.push(mesh)
    const item = newItem(mesh, -1, new THREE.Vector3(x, y, z), 1.5 + rand() * 0.9, c)
    item.m.spin.multiplyScalar(0.45) // big things turn slowly
  })

  // Emergence order (nearest the opening view first), and each object's place in the finale's ring.
  const ringCenter = new THREE.Vector3(0, 5.5, -88)
  items.forEach((item, i) => {
    item.delay = THREE.MathUtils.clamp((8 - item.base.z) / 110, 0, 1) * 0.55
    const a = (i / items.length) * Math.PI * 2 + rand() * 0.15
    const r = 11 + rand() * 9
    item.ring.set(ringCenter.x + Math.cos(a) * r, ringCenter.y + Math.sin(a) * r * 0.55 + (rand() - 0.5) * 2, ringCenter.z + (rand() - 0.5) * 8)
  })


  const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler()
  const spinQ = new THREE.Quaternion(), clickQ = new THREE.Quaternion()
  const closest = new THREE.Vector3(), away = new THREE.Vector3(), target = new THREE.Vector3()
  const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10)

  return {
    group,
    items,
    /** Advance every object. ctx: { ray, intro (0..1), finale (0..1), still } */
    update(t, dt, { ray, intro = 1, finale = 0, still = false }) {
      const gather = smoother(THREE.MathUtils.clamp(finale, 0, 1))
      const idle = still ? 0 : 1
      for (const item of items) {
        const { base, m } = item
        p.set(
          base.x + Math.sin(t * m.swaySpeed + m.phase) * m.sway * idle,
          base.y + Math.sin(t * m.bobSpeed + m.phase) * m.bob * idle,
          base.z + Math.cos(t * m.swaySpeed * 0.8 + m.phase) * m.sway * idle,
        )
        if (gather > 0) p.lerp(item.ring, gather) // the finale: gather into a ring

        // Cursor nearby: drift aside a little.
        target.set(0, 0, 0)
        if (ray && !still) {
          ray.closestPointToPoint(p, closest)
          const d = closest.distanceTo(p)
          const reach = 2.4 * item.scale
          if (d < reach && d > 1e-4) target.copy(away.subVectors(p, closest).normalize().multiplyScalar((reach - d) * 0.32))
        }
        item.push.lerp(target, 1 - Math.exp(-dt * 5))
        p.add(item.push)

        // Click: a damped spring for the bounce, a decaying spin, a fading flash.
        item.bounceVel += (-38 * item.bounce - 5.5 * item.bounceVel) * dt
        item.bounce += item.bounceVel * dt
        item.spinVel *= Math.exp(-dt * 2.2)
        item.spinAngle += item.spinVel * dt
        item.flash *= Math.exp(-dt * 3)
        p.y += item.bounce

        const spinRate = 1 + item.push.length() * 1.5 // spins a little faster with the cursor near
        q.copy(item.quat)
          .multiply(spinQ.setFromEuler(e.set(m.spin.x * t * spinRate * idle, m.spin.y * t * spinRate * idle, m.spin.z * t * idle)))
          .multiply(clickQ.setFromAxisAngle(item.spinAxis, item.spinAngle))

        const emerge = smoother(THREE.MathUtils.clamp((intro - item.delay) / 0.45, 0, 1)) // out of the dark
        const size = item.scale * emerge * (1 + item.bounce * 0.15)
        item.pos.copy(p)
        if (item.index >= 0) {
          item.mesh.setMatrixAt(item.index, m4.compose(p, q, s.setScalar(size)))
          const boost = item.hover * 0.5 + item.flash * 1.3
          if (Math.abs(boost - item.boost) > 0.002) { // recolor only when it changes
            item.boost = boost
            item.mesh.setColorAt(item.index, color.copy(item.color).multiplyScalar(1 + boost).lerp(white, item.flash * 0.25))
            item.mesh.instanceColor.needsUpdate = true
          }
        } else {
          item.mesh.position.copy(p)
          item.mesh.quaternion.copy(q)
          item.mesh.scale.setScalar(size)
          item.mesh.material.emissiveIntensity = item.hover * 0.35 + item.flash * 1.2
        }
        item.hover = Math.max(0, item.hover - dt * 3) // pick() raises it again while hovered
      }
      for (const mesh of meshes) if (mesh.isInstancedMesh) mesh.instanceMatrix.needsUpdate = true

    },
    /** The object under a ray, if any. Marks it hovered. */
    pick(raycaster, hover = true) {
      for (const mesh of meshes) if (mesh.isInstancedMesh) mesh.computeBoundingSphere()
      const hit = raycaster.intersectObjects(meshes, false)[0]
      if (!hit) return null
      const item = items.find((it) => it.mesh === hit.object && (it.index === -1 || it.index === hit.instanceId))
      if (item && hover) item.hover = Math.min(1, item.hover + 0.35)
      return item ? { kind: 'object', item, distance: hit.distance } : null
    },
    click(item) {
      item.bounceVel += 5.5
      item.spinVel += 7 * (item.spinAxis.x > 0 ? 1 : -1)
      item.flash = 1
    },
  }
}
