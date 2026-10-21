import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { GALLERY_Z } from './camera'






const glossy = (color, opts = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.18, emissive: color, emissiveIntensity: 0, ...opts })
const glowing = (color, strength = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), toneMapped: false })


const spring = (stiff = 30, damp = 5) => ({ x: 0, v: 0, step(dt) { this.v += (-stiff * this.x - damp * this.v) * dt; this.x += this.v * dt }, kick(v) { this.v += v } })

function monolith() {
  const g = new THREE.Group()
  const slab = new THREE.Mesh(new RoundedBoxGeometry(1.2, 3.1, 0.5, 4, 0.12), glossy('#5b3dff'))
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.035, 2.7, 0.52), glowing('#a78bff', 2.2))
  g.add(slab, seam)
  let turns = 0
  let settled = 0
  const turn = spring(16, 4.5)
  return {
    group: g, glow: [slab.material],
    name: 'Monolith', description: 'Still, until you ask it to turn.',
    click() { turns += 1; turn.kick(-6) },
    update(t, dt) {
      turn.step(dt)
      settled = THREE.MathUtils.damp(settled, turns * Math.PI * 0.5, 4, dt)
      g.rotation.y = settled + turn.x * 0.12
      g.position.y = Math.sin(t * 0.5) * 0.12
    },
  }
}

function halo() {
  const g = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.12, 24, 128),
    new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.28, iridescence: 1, iridescenceIOR: 1.45, iridescenceThicknessRange: [200, 800] }))
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.025, 12, 96), glowing('#2fd8ff', 1.35))
  const innerColor = new THREE.Color('#2fd8ff')
  g.add(ring, inner)
  let spin = 0, pulse = 0
  return {
    group: g, glow: [],
    name: 'Halo', description: 'A ring of light that never quite stands still.',
    click() { spin += 9; pulse = 1 },
    update(t, dt) {
      spin *= Math.exp(-dt * 1.4)
      pulse *= Math.exp(-dt * 2.5)
      ring.rotation.y += (0.25 + spin) * dt
      inner.rotation.x = Math.sin(t * 0.6) * 0.6
      inner.rotation.y -= (0.4 + spin * 0.6) * dt
      inner.scale.setScalar(1 + pulse * 0.25)
      inner.material.color.copy(innerColor).multiplyScalar(1.35 + pulse * 3)
      g.rotation.z = Math.sin(t * 0.3) * 0.15
    },
  }
}

function prismStack() {
  const g = new THREE.Group()
  const colors = ['#ff6b6b', '#ff7d55', '#ff8a3d', '#ff6f8d', '#ff5fa2']
  const geo = new RoundedBoxGeometry(1, 0.42, 1, 3, 0.08)
  const layers = colors.map((c, i) => {
    const m = new THREE.Mesh(geo, glossy(c))
    m.position.y = (i - 2) * 0.46
    g.add(m)
    return m
  })
  const twist = spring(18, 3.2)
  return {
    group: g, glow: layers.map((l) => l.material),
    name: 'Prism Stack', description: 'Five layers, one twist, endlessly undone.',
    click() { twist.kick(9) },
    update(t, dt) {
      twist.step(dt)
      layers.forEach((l, i) => { l.rotation.y = (i - 2) * (0.22 + twist.x * 0.35) + Math.sin(t * 0.4 + i * 0.5) * 0.05 })
      g.rotation.y = t * 0.12
    },
  }
}

function orbit() {
  const g = new THREE.Group()
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 32), glossy('#ff5fa2', { roughness: 0.14 }))
  g.add(core)
  const moons = [['#3dffb5', 1.1, 0.4, 0], ['#ffd23f', 1.35, -0.6, 2.1], ['#3d7bff', 0.95, 1.1, 4.2]].map(([c, r, tilt, phase]) => {
    const pivot = new THREE.Group()
    pivot.rotation.x = tilt
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), glossy(c))
    pivot.add(moon)
    g.add(pivot)
    return { pivot, moon, r, phase, angle: phase }
  })
  let boost = 0
  return {
    group: g, glow: [core.material],
    name: 'Orbit', description: 'Small worlds, keeping each other company.',
    click() { boost = 6 },
    update(t, dt) {
      boost *= Math.exp(-dt * 1.2)
      for (const m of moons) {
        m.angle += (0.7 + boost) * dt * (1.2 / m.r)
        m.moon.position.set(Math.cos(m.angle) * m.r, 0, Math.sin(m.angle) * m.r)
      }
      core.position.y = Math.sin(t * 0.8) * 0.06
    },
  }
}

function bloom() {
  const g = new THREE.Group()
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 20), glossy('#ffd23f'))
  g.add(center)
  const geo = new RoundedBoxGeometry(0.5, 0.5, 0.5, 3, 0.12)
  const petals = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2
    const m = new THREE.Mesh(geo, glossy(i % 2 ? '#c4b5fd' : '#3dffb5'))
    g.add(m)
    return { m, a }
  })
  const open = spring(14, 3)
  return {
    group: g, glow: petals.map((p) => p.m.material),
    name: 'Bloom', description: 'Opens when you notice it.',
    click() { open.kick(7) },
    update(t, dt) {
      open.step(dt)
      const r = 0.62 + Math.sin(t * 0.7) * 0.04 + open.x * 0.35
      for (const p of petals) {
        p.m.position.set(Math.cos(p.a) * r, Math.sin(p.a) * r, 0)
        p.m.rotation.set(t * 0.3 + p.a, t * 0.2, p.a)
      }
      g.rotation.z = t * 0.08
    },
  }
}

export function createGallery({ compact }) {
  const group = new THREE.Group()
  const layout = compact
    ? [[-2.3, 4.6, GALLERY_Z - 1], [2.3, 4.2, GALLERY_Z - 2], [0, 2.7, GALLERY_Z], [-2.1, 1.6, GALLERY_Z + 1], [2.2, 1.7, GALLERY_Z + 0.5]]

    : [[7.8, 3.3, GALLERY_Z - 1.2], [5.4, 4.4, GALLERY_Z - 0.6], [4.1, 2.3, GALLERY_Z + 0.4], [6.5, 1.9, GALLERY_Z + 0.2], [4.0, 5.5, GALLERY_Z - 1.6]]
  const pieces = [monolith(), halo(), prismStack(), orbit(), bloom()]
  pieces.forEach((piece, i) => {
    const holder = new THREE.Group()
    holder.position.set(...layout[i])
    holder.scale.setScalar(compact ? 0.8 : 0.78)
    holder.add(piece.group)
    piece.holder = holder
    piece.hover = 0
    piece.group.traverse((o) => { o.userData.piece = piece })
    group.add(holder)
  })
  const targets = pieces.map((p) => p.holder)
  return {
    group,
    pieces,
    update(t, dt, { intro = 1, still = false }) {
      const emerge = THREE.MathUtils.smoothstep(intro, 0.55, 1)
      for (const p of pieces) {
        if (!still) p.update(t, dt)
        p.hover = Math.max(0, p.hover - dt * 3)
        const lift = p.hover * 0.12
        p.holder.scale.setScalar((compact ? 0.8 : 0.78) * emerge * (1 + p.hover * 0.05))
        p.group.position.z = lift
        for (const m of p.glow) m.emissiveIntensity = p.hover * 0.25
      }
    },
    pick(raycaster, hover = true) {
      const hit = raycaster.intersectObjects(targets, true)[0]
      const piece = hit?.object.userData.piece
      if (!piece) return null
      if (hover) piece.hover = Math.min(1, piece.hover + 0.35)
      return { kind: 'sculpture', piece, label: piece.name, description: piece.description, distance: hit.distance }
    },
    click(piece) { piece.click() },
  }
}
