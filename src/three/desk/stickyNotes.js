import * as THREE from 'three'

/*
 * Sticky notes on the monitor's bottom bezel: four paper squares (yellow, blue, pink, green), evenly spaced
 * along the bezel, each stuck on by its top strip and hanging below the bezel's edge.
 *
 *   paper    each note is ONE continuous sheet (no separate pieces, so nothing can part or tear): its top is
 *            the adhesive strip, flat on the bezel; below a fold line it hangs, and it BENDS like paper:
 *            every column leaves the strip flat and attached along the whole width, curves through a short
 *            soft fold, then hangs. A twist grows from nothing at the fold to its full amount at the bottom.
 *   anchor   one per note, at the fold, with the note's resting tilt
 *   fold     a line just below the bezel's bottom edge, low enough that no part of the hanging paper ever
 *            rises above that edge, so it can never cut into the bezel
 *   motion   each note's swing (out from the monitor) and twist are the idle sway plus the flick's spring:
 *            one value each, clamped as a total; the sheet is reshaped from them every frame.
 *   flick    poke() pushes the spring: it swings out, wobbles about the fold and settles back. Pushes add up
 *            but are capped; the spring always returns to rest, so nothing drifts.
 * Placed from the bezel's real bounds (site space), so they follow the monitor wherever it is.
 *
 *   labels   each note carries a short label, handwritten (Caveat) on its hanging part (site.js: stickyNotes,
 *            in order yellow, blue, pink, green). It wraps and shrinks to fit; '\n' breaks a line; '' leaves it blank.
 *            It's drawn into the paper's own texture, so it bends and sways with the sheet.
 */

// Left to right: color, place across the bezel (a fraction of its width from the centre), tilt, size,
// and a slightly different strip height (so they don't hang at exactly one height). Labels: site.js.
const NOTES = [
  { color: '#FFE66D', at: -0.38, tilt: -0.04, size: 0.058, strip: 0.0105 },  // yellow
  { color: '#8ED8F8', at: -0.14, tilt: 0.03, size: 0.055, strip: 0.0095 },  // blue
  { color: '#FFB7D5', at: 0.14, tilt: -0.025, size: 0.057, strip: 0.0112 },  // pink
  { color: '#94DE8E', at: 0.38, tilt: 0.045, size: 0.054, strip: 0.0100 },  // green (a touch richer than #A8E6A1: it hangs in the lamp's warm light)
]
const MAX_TILT = 0.05
const CLEARANCE = 0.0012 // the paper sits this far in front of the bezel face (m)
const OUT_MAX = 0.85, IN_MAX = 0.3 // radians: how far a note may swing out from the monitor, and back toward it
const TWIST_MAX = 0.06 // paper barely twists: a twisted strip's edges would have to stretch

// Caveat (loaded with the site's fonts in index.html): legible, and it looks written by hand. If it can't
// load, the system's own handwriting face is used.
const LABEL_FONT = '"Caveat", "Segoe Print", "Bradley Hand", "Comic Neue", cursive'

/** Wrap a label into lines that fit `maxW` at the context's current font (explicit '\n' breaks first). */
function wrapLabel(g, text, maxW) {
  const lines = []
  for (const para of String(text).split('\n')) {
    let line = ''
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word
      if (line && g.measureText(next).width > maxW) { lines.push(line); line = word } else line = next
    }
    lines.push(line)
  }
  return lines
}

/** A label written in dark ink on the hanging part: as large as fits (up to four lines), the note tilted a
    touch, and each line wobbling slightly (its own small tilt and offset), as handwriting never sits straight. */
function drawLabel(g, text, top, tilt, seed = 1) {
  if (!text || !String(text).trim()) return
  const S = g.canvas.width, left = S * 0.09, maxW = S * 0.82, areaH = S * 0.93 - top
  const LH = 0.98 // handwriting sits closer together than type
  let size = S * 0.26, lines
  for (; size >= S * 0.09; size -= S * 0.008) {
    g.font = `700 ${size}px ${LABEL_FONT}`
    lines = wrapLabel(g, text, maxW)
    if (lines.length <= 4 && lines.length * size * LH <= areaH && lines.every((l) => g.measureText(l).width <= maxW)) break
  }
  let s = seed
  const wobble = () => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5) * 2 // -1..1, the same every time
  g.save()
  const blockH = lines.length * size * LH
  g.translate(S / 2, top + areaH / 2)
  g.rotate(tilt)
  g.fillStyle = 'rgba(16, 18, 34, 0.96)' // dark pen ink: still readable once the paper's color tints it
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  lines.forEach((l, k) => {
    g.save()
    g.translate(left - S / 2 + wobble() * S * 0.012, -blockH / 2 + size * 0.52 + k * size * LH + wobble() * size * 0.04)
    g.rotate(wobble() * 0.03) // each line its own slight slant
    g.fillText(l, 0, 0, maxW)
    g.restore()
  })
  g.restore()
}

/** Neutral paper: fine grain, a darker adhesive band at the top, a faint crease where it folds, and its label.
    The material's color tints it, so one texture serves every color. Redrawn once the site's font loads. */
function paperTexture(label, seed, stripFrac, tilt) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const paint = () => {
    let s = seed
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 3600; i++) {
      g.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.05)'
      g.fillRect(rand() * 256, rand() * 256, 1, 1)
    }
    const fold = stripFrac * 256
    g.fillStyle = 'rgba(0,0,0,0.07)' // the adhesive band
    g.fillRect(0, 0, 256, fold)
    const crease = g.createLinearGradient(0, fold, 0, fold + 28) // a soft shade where it folds
    crease.addColorStop(0, 'rgba(0,0,0,0.12)'); crease.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = crease
    g.fillRect(0, fold, 256, 28)
    drawLabel(g, label, fold + 14, tilt, seed)
    tex.needsUpdate = true
  }
  paint()
  // the site's font may still be on its way: write the label again once it's here
  document.fonts?.load(`700 40px ${LABEL_FONT}`).then(paint).catch(() => {})
  return tex
}
function softShadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const r = g.createRadialGradient(32, 32, 6, 32, 32, 32)
  r.addColorStop(0, 'rgba(0,0,0,0.45)'); r.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

/**
 * One note as a single sheet, laid out around the fold (y = 0): the adhesive strip above it (to +stripH), the
 * hanging part below (to -freeH). Rows are dense below the fold, where the paper bends.
 */
function noteSheet(w, stripH, freeH, cols = 8, rowsBelow = 18) {
  const ys = [stripH, stripH / 2, 0]
  for (let k = 1; k <= rowsBelow; k++) ys.push(-freeH * (k / rowsBelow) ** 1.15) // a little denser near the fold
  const size = stripH + freeH, pos = [], uv = [], index = []
  for (const y of ys) for (let c = 0; c <= cols; c++) {
    const x = (c / cols - 0.5) * w
    pos.push(x, y, 0); uv.push(c / cols, (y + freeH) / size)
  }
  const row = cols + 1
  for (let r = 0; r < ys.length - 1; r++) for (let c = 0; c < cols; c++) {
    const a = r * row + c, b = a + 1, d = a + row, e = d + 1
    index.push(a, d, b, b, d, e)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(index)
  geo.userData = { rest: Float32Array.from(pos), cols, rows: ys.length, freeH, w }
  return geo
}

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))

/**
 * Reshape a sheet for a swing (out from the monitor, radians) and a twist: above the fold it stays flat;
 * below, each column is walked down from the fold, its direction turning through a soft fold into the swing
 * angle, and the twist growing with distance. It stays one surface, attached along its whole top edge.
 */
function bend(geo, swing, twist, foldLength) {
  const { rest, cols, rows, freeH, w } = geo.userData
  const p = geo.attributes.position.array, row = cols + 1
  for (let c = 0; c <= cols; c++) {
    let y = 0, z = 0, prevRestY = 0
    for (let r = 0; r < rows; r++) {
      const i = (r * row + c) * 3, x0 = rest[i], y0 = rest[i + 1]
      if (y0 >= 0) { p[i] = x0; p[i + 1] = y0; p[i + 2] = 0; continue } // the strip: flat on the bezel
      // walk down the column from the fold, one step at a time, each step keeping its length (paper doesn't
      // stretch): its direction is the swing (through a soft fold) plus the paper's gentle forward curl
      const step = prevRestY - y0, d = -y0
      const t = (d - step / 2) / freeH
      // the paper's gentle curl, along its length only (the same down every column: paper can't curl two ways
      // at once without stretching), as an angle: the slope of 5.5 mm t^2
      const curl = Math.atan((0.011 * t) / freeH)
      const angle = swing * smooth((t * freeH) / foldLength) + curl
      y -= step * Math.cos(angle)
      z += step * Math.sin(angle)
      prevRestY = y0
      // the twist grows (with the square of the distance) from nothing at the fold; it turns the sheet about its own hanging line, so its offset
      // follows the paper's own normal at this row (which tips as the paper swings), never stretching it
      const tw = twist * (d / freeH) ** 2, off = -x0 * Math.sin(tw) // ~nothing through the fold, where the paper bends sharply
      p[i] = x0 * Math.cos(tw)
      p[i + 1] = y + off * Math.sin(angle)
      p[i + 2] = z + off * Math.cos(angle)
    }
  }
  geo.attributes.position.needsUpdate = true
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
}

/**
 * Notes along a bezel: `bezel` is its bounds in site space ({ min, max }: x across, y up, z toward the
 * viewer). Returns the group to add to the scene, and update / pick / poke / dispose.
 */
export function createStickyNotes(bezel, { reduce = false, labels = [] } = {}) {
  const group = new THREE.Group()
  group.name = 'sticky notes'
  const cx = (bezel.min.x + bezel.max.x) / 2, width = bezel.max.x - bezel.min.x
  const edgeY = bezel.min.y, faceZ = bezel.max.z
  const shadowTex = softShadowTexture()
  const notes = NOTES.map((n, i) => {
    // the fold sits below the bezel's edge by enough that its tilted end stays below it: the paper only
    // ever bends below the fold, so nothing of it rises above the bezel's edge
    const drop = (n.size / 2) * Math.sin(MAX_TILT) + 0.0006
    const stripH = n.strip + drop, freeH = n.size - stripH
    const map = paperTexture(labels[i] ?? '', 7 + i * 131, stripH / n.size, (i % 2 ? 1 : -1) * 0.035)
    const paper = new THREE.MeshStandardMaterial({ color: n.color, map, roughness: 0.9, metalness: 0, side: THREE.DoubleSide })
    paper.name = `sticky note (${['yellow', 'blue', 'pink', 'green'][i]})`

    const anchor = new THREE.Group() // at the fold, with the note's resting tilt
    anchor.position.set(cx + n.at * width, edgeY - drop, faceZ + CLEARANCE)
    anchor.rotation.z = n.tilt
    const sheet = new THREE.Mesh(noteSheet(n.size, stripH, freeH), paper) // one continuous sheet
    sheet.userData.note = i
    // a soft shadow on the bezel, just behind the strip (between the paper and the bezel face)
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(n.size * 1.12, stripH * 1.3),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55 }))
    shade.position.set(0.0012, stripH * 0.55, -CLEARANCE * 0.5)
    anchor.add(shade, sheet)
    group.add(anchor)
    bend(sheet.geometry, 0, 0, freeH * 0.2)
    return {
      anchor, sheet, freeH,
      phase: i * 1.9 + 0.3, pace: 0.5 + i * 0.07, // each its own rhythm
      swing: 0, speed: 0, twist: 0, twistSpeed: 0, // the flick's springs (swing: out from the monitor; twist)
    }
  })
  const pickable = notes.map((n) => n.sheet)
  let time = 0

  return {
    group,
    /** Advance the notes. Returns true while a flick is still settling (keep drawing). */
    update(dt) {
      dt = Math.min(dt, 0.05)
      time += dt
      let settling = false
      for (const n of notes) {
        // the flick: a stiff, lightly damped spring back to rest
        n.speed += (-42 * n.swing - 3.4 * n.speed) * dt
        n.swing += n.speed * dt
        n.twistSpeed += (-55 * n.twist - 4 * n.twistSpeed) * dt
        n.twist += n.twistSpeed * dt
        if (Math.abs(n.speed) > 0.002 || Math.abs(n.swing) > 0.002 || Math.abs(n.twistSpeed) > 0.002) settling = true
        // the idle sway: small, slow, each note its own phase
        const idle = reduce ? 0 : 0.05 * Math.sin(time * n.pace * 2 + n.phase) + 0.012 * Math.sin(time * n.pace * 3.3 + n.phase * 2)
        const idleTwist = reduce ? 0 : 0.018 * Math.sin(time * n.pace * 1.6 + n.phase * 1.3)
        // one value per axis: idle + flick, clamped as a total (out from the monitor is positive)
        const out = THREE.MathUtils.clamp(idle + n.swing, -IN_MAX, OUT_MAX)
        if (out !== idle + n.swing) { n.swing = out - idle; n.speed *= -0.3 } // the clamp holds the spring too
        const twist = THREE.MathUtils.clamp(idleTwist + n.twist, -TWIST_MAX, TWIST_MAX)
        // the sheet takes the shape: a tighter fold while it's moving fast (paper flexes), softer at rest
        const fold = n.freeH * (0.22 - Math.min(0.1, Math.abs(n.speed) * 0.01))
        bend(n.sheet.geometry, out, twist, fold)
        n.sheet.userData.swing = out
        n.sheet.userData.twist = twist
      }
      return settling
    },
    /** Which note (if any) is under this ray. */
    pick(raycaster) {
      const hit = raycaster.intersectObjects(pickable, false)[0]
      return hit ? hit.object.userData.note : -1
    },
    /** Flick a note: it swings out from the monitor, wobbles about its fold, and settles back. */
    poke(i) {
      const n = notes[i]
      if (!n) return
      n.speed = Math.min(n.speed + (reduce ? 3 : 7.5), 14)
      n.twistSpeed += (i % 2 ? 1 : -1) * (reduce ? 0.3 : 0.7)
    },
    dispose() {
      group.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.map?.dispose(); o.material.dispose() } })
      shadowTex.dispose()
    },
  }
}
