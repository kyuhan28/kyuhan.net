import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

const WALL_Z = -0.9, WALL_T = 0.16, WALL_W = 9, WALL_H = 3.2
const WIN = { x0: 0.32, x1: 1.58, y0: 1.02, y1: 2.48 }
const SKY_Z = WALL_Z - 1.8

function canvasTex(w, h, paint, { srgb = true, repeat } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  paint(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat) }
  t.anisotropy = 8
  return t
}
const seeded = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 }

const plaster = () => canvasTex(512, 512, (g, w, h) => {
  const r = seeded(11)
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 26; i++) {
    const x = r() * w, y = r() * h, rad = 60 + r() * 140
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    const warm = r() < 0.5
    grd.addColorStop(0, warm ? 'rgba(236,214,196,0.18)' : 'rgba(226,222,236,0.14)'); grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd; g.fillRect(0, 0, w, h)
  }
  for (let i = 0; i < 9000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.4)'; g.fillRect(r() * w, r() * h, 1, 1) }
}, { repeat: [1, 1] })

const oak = (repeat = [1, 1]) => canvasTex(512, 128, (g, w, h) => {
  const r = seeded(29)
  g.fillStyle = '#d9b68d'; g.fillRect(0, 0, w, h)
  for (let i = 0; i < 70; i++) {
    const y = r() * h, a = 0.05 + r() * 0.1
    g.strokeStyle = r() < 0.5 ? `rgba(150,105,62,${a})` : `rgba(255,240,215,${a})`
    g.lineWidth = 0.6 + r() * 1.8
    g.beginPath(); g.moveTo(0, y)
    for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 1.6 + (r() - 0.5) * 0.8)
    g.stroke()
  }
}, { repeat })

const view = () => canvasTex(1024, 640, (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#a9b2e6'); sky.addColorStop(0.38, '#d9c6e2'); sky.addColorStop(0.62, '#ffd7c2'); sky.addColorStop(1, '#ffe4cc')
  g.fillStyle = sky; g.fillRect(0, 0, w, h)
  const sun = g.createRadialGradient(w * 0.74, h * 0.52, 0, w * 0.74, h * 0.52, w * 0.42)
  sun.addColorStop(0, 'rgba(255,250,232,0.95)'); sun.addColorStop(0.25, 'rgba(255,236,206,0.55)'); sun.addColorStop(1, 'rgba(255,236,206,0)')
  g.fillStyle = sun; g.fillRect(0, 0, w, h)

  const r = seeded(5)
  for (let i = 0; i < 7; i++) {
    const cx = r() * w, cy = h * (0.12 + r() * 0.28), cw = 140 + r() * 220
    const c = g.createRadialGradient(cx, cy, 0, cx, cy, cw)
    c.addColorStop(0, 'rgba(255,248,244,0.35)'); c.addColorStop(1, 'rgba(255,248,244,0)')
    g.save(); g.translate(cx, cy); g.scale(1, 0.22); g.translate(-cx, -cy); g.fillStyle = c; g.fillRect(cx - cw, cy - cw, cw * 2, cw * 2); g.restore()
  }

  const hills = [['#e9c6cf', 0.64, 18, 0.004], ['#d5aec6', 0.71, 26, 0.006], ['#b993b6', 0.79, 30, 0.009], ['#9c7ea6', 0.87, 22, 0.014]]
  g.filter = 'blur(1.5px)'
  hills.forEach(([col, base, amp, f], k) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, h)
    for (let x = 0; x <= w; x += 8) g.lineTo(x, h * base - amp * Math.sin(x * f + k * 1.7) - amp * 0.6 * Math.sin(x * f * 2.3 + k))
    g.lineTo(w, h); g.closePath(); g.fill()
  })

  const t = seeded(17)
  g.fillStyle = '#7f6a8c'
  for (let x = -20; x < w + 40; x += 18 + t() * 26) {
    const rad = 16 + t() * 26, cy = h * 0.93 - t() * 18
    g.beginPath(); g.ellipse(x, cy, rad, rad * 1.15, 0, 0, Math.PI * 2); g.fill()
  }
  g.fillRect(0, h * 0.93, w, h * 0.07)
  g.filter = 'none'
})

const nightView = () => canvasTex(1024, 640, (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#070a1f'); sky.addColorStop(0.5, '#141a3f'); sky.addColorStop(0.78, '#2a2b55'); sky.addColorStop(1, '#3a3462')
  g.fillStyle = sky; g.fillRect(0, 0, w, h)
  const r = seeded(23)
  for (let i = 0; i < 260; i++) {
    const y = Math.pow(r(), 1.6) * h * 0.62, a = 0.25 + r() * 0.65 * (1 - y / (h * 0.7))
    g.fillStyle = `rgba(235,238,255,${a.toFixed(2)})`; const s = r() < 0.08 ? 2 : 1; g.fillRect(r() * w, y, s, s)
  }
  const mx = w * 0.28, my = h * 0.24
  const halo = g.createRadialGradient(mx, my, 0, mx, my, 120)
  halo.addColorStop(0, 'rgba(220,228,255,0.35)'); halo.addColorStop(1, 'rgba(220,228,255,0)')
  g.fillStyle = halo; g.fillRect(0, 0, w, h)
  g.fillStyle = '#eef1ff'; g.beginPath(); g.arc(mx, my, 22, 0, Math.PI * 2); g.fill()
  const hills = [['#22234a', 0.66, 18, 0.004], ['#1a1b3c', 0.72, 26, 0.006], ['#13142f', 0.79, 30, 0.009], ['#0e0f25', 0.87, 22, 0.014]]
  g.filter = 'blur(1.5px)'
  hills.forEach(([col, base, amp, f], k) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, h)
    for (let x = 0; x <= w; x += 8) g.lineTo(x, h * base - amp * Math.sin(x * f + k * 1.7) - amp * 0.6 * Math.sin(x * f * 2.3 + k))
    g.lineTo(w, h); g.closePath(); g.fill()
    if (k === 1) for (let i = 0; i < 14; i++) {
      const x = w * (0.45 + r() * 0.5), y = h * (base + 0.02 + r() * 0.04)
      g.fillStyle = `rgba(255,${190 + Math.round(r() * 40)},120,${(0.5 + r() * 0.4).toFixed(2)})`; g.fillRect(x, y, 2, 2)
    }
  })
  g.filter = 'none'
  const t = seeded(17)
  g.fillStyle = '#080917'
  for (let x = -20; x < w + 40; x += 18 + t() * 26) {
    const rad = 16 + t() * 26, cy = h * 0.93 - t() * 18
    g.beginPath(); g.ellipse(x, cy, rad, rad * 1.15, 0, 0, Math.PI * 2); g.fill()
  }
  g.fillRect(0, h * 0.93, w, h * 0.07)
})

const sideWindowCookie = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h)
  g.filter = 'blur(7px)'
  g.fillStyle = '#fff'
  const px = w * 0.2, py = h * 0.16, pw = w * 0.6, ph = h * 0.68, bar = w * 0.035
  g.fillRect(px, py, pw / 2 - bar / 2, ph * 0.62 - bar / 2)
  g.fillRect(px + pw / 2 + bar / 2, py, pw / 2 - bar / 2, ph * 0.62 - bar / 2)
  g.fillRect(px, py + ph * 0.62 + bar / 2, pw / 2 - bar / 2, ph * 0.38 - bar / 2)
  g.fillRect(px + pw / 2 + bar / 2, py + ph * 0.62 + bar / 2, pw / 2 - bar / 2, ph * 0.38 - bar / 2)

  g.filter = 'blur(5px)'
  g.fillStyle = '#000'
  const r = seeded(41)
  for (let i = 0; i < 9; i++) {
    const bx = px + pw * (0.08 + r() * 0.3), by = py + ph * (0.98 - r() * 0.05)
    const a = -Math.PI / 2 + (r() - 0.5) * 1.6, L = h * (0.12 + r() * 0.12), Wd = L * 0.32
    g.save(); g.translate(bx, by); g.rotate(a)
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(Wd, L * 0.2, Wd * 0.8, L * 0.8, L, 0); g.bezierCurveTo(Wd * 0.8, -L * 0.8, Wd, -L * 0.2, 0, 0); g.fill()
    g.restore()
  }
  g.filter = 'none'
}, { srgb: true })

const rbox = (w, h, d, mat, r = 0.006, seg = 3) => {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2)), mat)
  m.castShadow = m.receiveShadow = true
  return m
}
const at = (m, x, y, z) => { m.position.set(x, y, z); return m }

function leafGeometry(len, wid) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(wid * 0.9, len * 0.18, wid * 0.7, len * 0.78, 0, len)
  s.bezierCurveTo(-wid * 0.7, len * 0.78, -wid * 0.9, len * 0.18, 0, 0)
  const g = new THREE.ShapeGeometry(s, 10)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i) / len
    p.setZ(i, -0.35 * len * y * y + Math.abs(x) * 0.25)
  }
  g.computeVertexNormals()
  return g
}

function plant(M, { leaves = 9, len = 0.11, wid = 0.035, pot = 0.055, potH = 0.07, seed = 3, spread = 0.9 } = {}) {
  const g = new THREE.Group()
  const prof = [[0, 0], [pot * 0.78, 0], [pot, potH * 0.92], [pot * 1.08, potH * 0.92], [pot * 1.08, potH], [pot * 0.96, potH]].map(([x, y]) => new THREE.Vector2(x, y))
  const p = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), M.terracotta); p.castShadow = p.receiveShadow = true
  const soil = new THREE.Mesh(new THREE.CircleGeometry(pot * 0.95, 24).rotateX(-Math.PI / 2), M.soil); soil.position.y = potH * 0.86
  g.add(p, soil)
  const r = seeded(seed), geo = leafGeometry(len, wid)
  for (let i = 0; i < leaves; i++) {
    const leaf = new THREE.Mesh(geo, r() < 0.5 ? M.leaf : M.leafLight); leaf.castShadow = true
    const yaw = (i / leaves) * Math.PI * 2 + r() * 0.5
    leaf.position.y = potH * 0.85
    leaf.rotation.set(-(0.25 + r() * spread * 0.7), yaw, 0, 'YXZ')
    leaf.scale.setScalar(0.75 + r() * 0.45)
    g.add(leaf)
  }
  return g
}

export function createSunlitRoom({ reduce = false } = {}) {
  RectAreaLightUniformsLib.init()
  const plasterMap = plaster(), oakMap = oak([1, 1]), oakTopMap = oak([1, 1]), viewMap = view(), nightMap = nightView(), cookie = sideWindowCookie()
  const M = {
    wall: new THREE.MeshStandardMaterial({ color: '#efd1bc', map: plasterMap, roughness: 0.93 }),
    reveal: new THREE.MeshStandardMaterial({ color: '#e9cdb9', map: plasterMap, roughness: 0.93 }),
    paint: new THREE.MeshStandardMaterial({ color: '#f7f2ea', roughness: 0.55 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.2, depthWrite: false }),
    view: new THREE.MeshBasicMaterial({ map: viewMap, toneMapped: false }),
    oak: new THREE.MeshStandardMaterial({ color: '#ffffff', map: oakMap, roughness: 0.62 }),
    oakTop: new THREE.MeshStandardMaterial({ color: '#ffffff', map: oakTopMap, roughness: 0.55 }),
    cabinet: new THREE.MeshStandardMaterial({ color: '#ece1d3', roughness: 0.6 }),
    brass: new THREE.MeshStandardMaterial({ color: '#c9a46c', roughness: 0.32, metalness: 0.9 }),
    terracotta: new THREE.MeshStandardMaterial({ color: '#d08a6b', roughness: 0.85 }),
    soil: new THREE.MeshStandardMaterial({ color: '#5b4637', roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#5f8d55', roughness: 0.62, side: THREE.DoubleSide }),
    leafLight: new THREE.MeshStandardMaterial({ color: '#7aa865', roughness: 0.62, side: THREE.DoubleSide }),

    books: ['#a92b3a', '#d9861a', '#086471', '#1f4a7c', '#5e3590', '#2f7d49', '#d9661f', '#13786c'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.74 })),
    bookBand: new THREE.MeshStandardMaterial({ color: '#f1e5c8', roughness: 0.6 }),
  }
  const group = new THREE.Group(); group.name = 'sunlit room'
  const add = (...o) => { group.add(...o); return o[0] }

  const shape = new THREE.Shape()
  shape.moveTo(-WALL_W / 2, 0); shape.lineTo(WALL_W / 2, 0); shape.lineTo(WALL_W / 2, WALL_H); shape.lineTo(-WALL_W / 2, WALL_H); shape.closePath()
  const hole = new THREE.Path(); hole.moveTo(WIN.x0, WIN.y0); hole.lineTo(WIN.x0, WIN.y1); hole.lineTo(WIN.x1, WIN.y1); hole.lineTo(WIN.x1, WIN.y0); hole.closePath()
  shape.holes.push(hole)
  const wallGeo = new THREE.ShapeGeometry(shape)

  const uv = wallGeo.attributes.uv, pos = wallGeo.attributes.position
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 1.8, pos.getY(i) / 1.6)
  const wall = add(at(new THREE.Mesh(wallGeo, M.wall), 0, 0, WALL_Z)); wall.castShadow = wall.receiveShadow = true

  const W = WIN.x1 - WIN.x0, H = WIN.y1 - WIN.y0, cx = (WIN.x0 + WIN.x1) / 2, cy = (WIN.y0 + WIN.y1) / 2, rz = WALL_Z - WALL_T / 2
  const side = (w, h, x, y, rx, ry) => { const m = add(at(new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.reveal), x, y, rz)); m.rotation.set(rx, ry, 0); m.castShadow = m.receiveShadow = true }
  side(W, WALL_T, cx, WIN.y1, Math.PI / 2, 0); side(W, WALL_T, cx, WIN.y0, -Math.PI / 2, 0)
  side(WALL_T, H, WIN.x0, cy, 0, Math.PI / 2); side(WALL_T, H, WIN.x1, cy, 0, -Math.PI / 2)

  const T = 0.05, P = 0.018
  add(at(rbox(W + 2 * T, T, P, M.paint, 0.004), cx, WIN.y1 + T / 2, WALL_Z + P / 2))
  add(at(rbox(T, H + T, P, M.paint, 0.004), WIN.x0 - T / 2, cy + T / 2, WALL_Z + P / 2))
  add(at(rbox(T, H + T, P, M.paint, 0.004), WIN.x1 + T / 2, cy + T / 2, WALL_Z + P / 2))
  const sill = add(at(rbox(W + 0.16, 0.035, WALL_T + 0.07, M.paint, 0.006), cx, WIN.y0 - 0.0175, WALL_Z - WALL_T / 2 + 0.035))
  sill.receiveShadow = true
  const gz = WALL_Z - WALL_T * 0.62, S = 0.036
  const sash = (w, h, x, y) => add(at(rbox(w, h, 0.03, M.paint, 0.004), x, y, gz))
  sash(W, S, cx, WIN.y1 - S / 2); sash(W, S, cx, WIN.y0 + S / 2); sash(S, H, WIN.x0 + S / 2, cy); sash(S, H, WIN.x1 - S / 2, cy)
  sash(S * 0.8, H - 2 * S, cx, cy)
  sash(W - 2 * S, S * 0.8, cx, WIN.y0 + H * 0.66)
  const glass = add(at(new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * S, H - 2 * S), M.glass), cx, cy, gz - 0.002)); glass.renderOrder = 3
  const outside = add(at(new THREE.Mesh(new THREE.PlaneGeometry(7, 4.4), M.view), cx + 0.3, cy + 0.2, SKY_Z))
  outside.renderOrder = -2

  add(at(rbox(WALL_W, 0.085, 0.016, M.paint, 0.003), 0, 0.0425, WALL_Z + 0.008))

  const shelf = { x0: -1.4, x1: -0.62, y: 1.47, d: 0.17 }
  add(at(rbox(shelf.x1 - shelf.x0, 0.03, shelf.d, M.oak, 0.005), (shelf.x0 + shelf.x1) / 2, shelf.y, WALL_Z + shelf.d / 2))

  const BOOK_D = 0.13, bookZ = WALL_Z + 0.08, spineZ = bookZ + BOOK_D / 2 + 0.0012
  const spine = (x, y, w, h, tilt = 0) => {
    const g = new THREE.Group()
    for (const t of [0.12, 0.88]) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, h * 0.035, 0.002), M.bookBand), 0, (t - 0.5) * h, 0))
    g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w * 0.56, h * 0.16, 0.002), M.bookBand), 0, 0.08 * h, 0))
    g.position.set(x, y, spineZ); g.rotation.z = tilt
    return add(g)
  }
  ;[[0.03, 0.2, 0], [0.026, 0.182, 1], [0.034, 0.214, 2], [0.028, 0.19, 3], [0.032, 0.205, 4], [0.024, 0.172, 5]].reduce((x, [w, h, k]) => {
    const book = add(at(rbox(w, h, BOOK_D, M.books[k], 0.003), x + w / 2, shelf.y + 0.015 + h / 2, bookZ))
    book.castShadow = true
    spine(x + w / 2, shelf.y + 0.015 + h / 2, w, h)
    return x + w + 0.004
  }, shelf.x1 - 0.42)

  const lying = [[0.16, 0.026, 0.12, 6, 0.1], [0.145, 0.022, 0.108, 7, -0.07]]
  lying.reduce((y, [w, h, d, k, turn]) => {
    const book = add(at(rbox(w, h, d, M.books[k], 0.003), shelf.x1 - 0.12, y + h / 2, bookZ)); book.rotation.y = turn; book.castShadow = true
    return y + h
  }, shelf.y + 0.015)

  const cab = { x: 0.99, w: 0.42, d: 0.36, legH: 0.08, bodyH: 0.78 }
  const cz = WALL_Z + 0.015 + cab.d / 2, bodyY = cab.legH + cab.bodyH / 2
  add(at(rbox(cab.w, cab.bodyH, cab.d, M.cabinet, 0.008), cab.x, bodyY, cz)).name = 'cabinet carcass'
  add(at(rbox(cab.w + 0.016, 0.026, cab.d + 0.014, M.oakTop, 0.006), cab.x, cab.legH + cab.bodyH + 0.013, cz))
  const gap = 0.004, fronts = 3, inset = 0.012, fh = (cab.bodyH - 2 * inset - (fronts - 1) * gap) / fronts
  for (let k = 0; k < fronts; k++) {
    const y = cab.legH + inset + fh / 2 + k * (fh + gap)
    add(at(rbox(cab.w - 2 * inset, fh, 0.018, M.cabinet, 0.005), cab.x, y, cz + cab.d / 2 + 0.006))
    add(at(rbox(0.11, 0.012, 0.016, M.brass, 0.005), cab.x, y + fh * 0.2, cz + cab.d / 2 + 0.022))
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.007, cab.legH, 12), M.oak); leg.castShadow = true
    add(at(leg, cab.x + sx * (cab.w / 2 - 0.04), cab.legH / 2, cz + sz * (cab.d / 2 - 0.04)))
  }
  const fern = add(plant(M, { leaves: 11, len: 0.15, wid: 0.045, pot: 0.065, potH: 0.085, seed: 3 }))
  fern.position.set(cab.x + 0.05, cab.legH + cab.bodyH + 0.026, cz + 0.04)

  const glow = new THREE.RectAreaLight('#ffe2c6', 1.5, W - 2 * S, H - 2 * S)
  glow.position.set(cx, cy, gz + 0.01)
  glow.lookAt(cx - 0.7, 0.75, 0.8)
  add(glow)

  const streak = new THREE.SpotLight('#ffcf9c', 170, 0, 0.21, 0.18, 1)
  streak.position.set(3.4, 2.7, 0.7)
  streak.target.position.set(-0.62, 1.32, WALL_Z)
  streak.map = cookie
  streak.castShadow = true
  streak.shadow.mapSize.set(1024, 1024)
  streak.shadow.bias = -0.0006
  streak.shadow.normalBias = 0.02
  streak.shadow.radius = 3
  add(streak, streak.target)

  const SKY_FRONT = SKY_Z + 0.06
  const cloudTex = (seed) => canvasTex(512, 192, (g, w, h) => {
    const r = seeded(seed)
    g.filter = 'blur(9px)'
    const puffs = Array.from({ length: 9 }, () => [w * (0.18 + r() * 0.64), h * (0.44 + r() * 0.18), h * (0.17 + r() * 0.2)])
    for (const [x, y, rad] of puffs) {
      const shade = g.createRadialGradient(x, y + rad * 0.35, rad * 0.1, x, y + rad * 0.35, rad)
      shade.addColorStop(0, 'rgba(196,182,212,0.55)'); shade.addColorStop(1, 'rgba(196,182,212,0)')
      g.fillStyle = shade; g.beginPath(); g.arc(x, y + rad * 0.35, rad, 0, Math.PI * 2); g.fill()
    }
    for (const [x, y, rad] of puffs) {
      const puff = g.createRadialGradient(x, y - rad * 0.3, rad * 0.1, x, y, rad)
      puff.addColorStop(0, 'rgba(255,255,255,0.97)'); puff.addColorStop(0.6, 'rgba(250,244,246,0.75)'); puff.addColorStop(1, 'rgba(244,234,240,0)')
      g.fillStyle = puff; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill()
    }
    g.filter = 'none'
  })
  const cloudMaps = [cloudTex(31), cloudTex(57), cloudTex(83)]

  const CLOUD_Z = WALL_Z - 0.5
  const CLOUD_X0 = WIN.x0 - 0.9, CLOUD_X1 = WIN.x1 + 0.9
  const cloudY = () => 1.48 + Math.random() * 0.27
  const clouds = cloudMaps.map((map, k) => {
    const w = 0.45 + k * 0.12
    const mesh = add(new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.375),
      new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.92 })))

    mesh.position.set(WIN.x0 + 0.35 + k * ((CLOUD_X1 - CLOUD_X0) / 3), [1.64, 1.52, 1.72][k], CLOUD_Z - k * 0.01)
    if (mesh.position.x > CLOUD_X1) mesh.position.x -= CLOUD_X1 - CLOUD_X0
    mesh.userData.speed = 0.012 + k * 0.004
    mesh.renderOrder = 1
    return mesh
  })

  const STARS = 90, starPos = new Float32Array(STARS * 3), starSeed = new Float32Array(STARS * 2)
  const sr = seeded(41)
  for (let k = 0; k < STARS; k++) {
    starPos.set([-0.6 + sr() * 4.4, 1.7 + Math.pow(sr(), 0.8) * 1.9, SKY_FRONT], k * 3)
    starSeed.set([sr() * Math.PI * 2, 0.6 + sr() * 1.6], k * 2)
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  starGeo.setAttribute('seed', new THREE.BufferAttribute(starSeed, 2))
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixel: { value: Math.min(window.devicePixelRatio || 1, 2) } },
    vertexShader: `attribute vec2 seed; uniform float uTime; uniform float uPixel; varying float vA;
      void main() {
        vA = (0.55 + 0.45 * sin(uTime * (0.6 + seed.y * 0.8) + seed.x)) * (0.45 + seed.y * 0.32);
        gl_PointSize = (1.2 + seed.y) * uPixel;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `varying float vA;
      void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(0.93, 0.95, 1.0), vA * smoothstep(0.5, 0.15, d)); }`,
  })
  const stars = add(new THREE.Points(starGeo, starMat))
  stars.renderOrder = 1
  stars.visible = false
  let skyTime = 0

  const DAY = { glow: ['#ffe2c6', glow.intensity], streak: ['#ffcf9c', streak.intensity] }
  const NIGHT = { glow: ['#8796e0', 0.35], streak: ['#a9b8ff', 22] }
  const setTime = (mode) => {
    const look = mode === 'night' ? NIGHT : DAY
    M.view.map = mode === 'night' ? nightMap : viewMap
    glow.color.set(look.glow[0]); glow.intensity = look.glow[1]
    streak.color.set(look.streak[0]); streak.intensity = look.streak[1]
    for (const c of clouds) c.visible = mode !== 'night'
    stars.visible = mode === 'night'
  }
  return {
    setTime,
    group,

    update(dt) {
      if (reduce || !dt) return
      dt = Math.min(dt, 0.1)
      skyTime += dt
      if (stars.visible) starMat.uniforms.uTime.value = skyTime
      else for (const c of clouds) {
        c.position.x += c.userData.speed * dt
        if (c.position.x > CLOUD_X1) { c.position.x = CLOUD_X0; c.position.y = cloudY() }
      }
    },
    dispose() {
      group.traverse((o) => { if (o.isMesh) o.geometry.dispose() })
      starGeo.dispose(); starMat.dispose(); cloudMaps.forEach((t) => t.dispose()); clouds.forEach((c) => c.material.dispose())
      Object.values(M).flat().forEach((m) => m.dispose());
      [plasterMap, oakMap, oakTopMap, viewMap, nightMap, cookie].forEach((t) => t.dispose())
    },
  }
}
