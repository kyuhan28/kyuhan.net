import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { PALETTE } from './objects'
import { SUN_DIR, MOON_DIR } from './sky'

/*
 * The far field: big, slow shapes out where the fog would otherwise swallow everything.
 *
 *   in the mountains  standing among the ridges, some sunk into the slopes
 *   in the sky        drifting high overhead
 *
 * They ignore the fog (so they read at a distance), are several meters across, and move slowly:
 * a gentle bob and turn. None sits in front of the sun or the moon. One instanced draw per shape.
 */

const VIEW = new THREE.Vector3(0, 3, 13) // the opening view, for keeping the sun and moon clear
const CLEAR = Math.cos(THREE.MathUtils.degToRad(7))

function seeded(seed) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export function createFarField({ compact = false } = {}) {
  const group = new THREE.Group()
  group.name = 'farField'
  const rand = seeded(97)
  // Lit by the sun (or the night key light) and the sky: directional light doesn't fade with distance.
  const material = () => new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.05, fog: false })

  const shapes = [
    new RoundedBoxGeometry(1, 1, 1, 3, 0.14),
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.SphereGeometry(0.55, 28, 18),
    new THREE.TorusGeometry(0.5, 0.18, 16, 48),
    new THREE.IcosahedronGeometry(0.62, 0),
    new THREE.OctahedronGeometry(0.62, 0),
    new THREE.ConeGeometry(0.6, 1.1, 4), // a pyramid
    new THREE.CapsuleGeometry(0.28, 0.7, 6, 18),
  ]
  const total = compact ? 34 : 64
  const perShape = Math.ceil(total / shapes.length)

  // In the mountains (about half), or high in the sky; never in front of the sun or moon.
  const toView = new THREE.Vector3()
  const place = () => {
    for (;;) {
      const inMountains = rand() < 0.5
      const p = inMountains
        ? new THREE.Vector3((rand() - 0.5) * 320, 5 + rand() * 34, -125 - rand() * 150)
        : new THREE.Vector3((rand() - 0.5) * 440, 30 + rand() * 55, -70 - rand() * 240)
      toView.subVectors(p, VIEW).normalize()
      if (toView.dot(SUN_DIR) < CLEAR && toView.dot(MOON_DIR) < CLEAR) return p
    }
  }

  const items = []
  const color = new THREE.Color()
  for (const geo of shapes) {
    const mat = material()
    const mesh = new THREE.InstancedMesh(geo, mat, perShape)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.frustumCulled = false
    for (let i = 0; i < perShape; i++) {
      const c = PALETTE[Math.floor(rand() * PALETTE.length)]
      mesh.setColorAt(i, color.set(c))
      const base = place()
      items.push({
        mesh, index: i, base,
        scale: (compact ? 2.6 : 3) + rand() * (compact ? 4.5 : 6),
        quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6)),
        spin: new THREE.Vector3((rand() - 0.5) * 0.12, (rand() - 0.5) * 0.16, (rand() - 0.5) * 0.1),
        bob: 0.6 + rand() * 1.8, bobSpeed: 0.08 + rand() * 0.14, phase: rand() * Math.PI * 2,
      })
    }
    group.add(mesh)
  }

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), turn = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3()
  const place3 = (t, intro, still) => {
    for (const it of items) {
      p.copy(it.base)
      if (!still) p.y += Math.sin(t * it.bobSpeed + it.phase) * it.bob
      q.copy(it.quat)
      if (!still) q.multiply(turn.setFromEuler(e.set(it.spin.x * t, it.spin.y * t, it.spin.z * t)))
      m.compose(p, q, s.setScalar(it.scale * intro))
      it.mesh.setMatrixAt(it.index, m)
    }
    for (const mesh of group.children) mesh.instanceMatrix.needsUpdate = true
  }
  place3(12, 1, true)

  return {
    group,
    count: items.length,
    update(t, { intro = 1, still = false } = {}) {
      place3(t, intro, still)
    },
  }
}
