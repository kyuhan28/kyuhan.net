import * as THREE from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'

/*
 * Turns an SVG file into a solid, glossy 3D object floating in the world.
 *
 * Filled shapes are extruded into thick pieces with rounded (beveled) edges; outlined shapes
 * (strokes) become round tubes that follow the line. Each piece keeps its SVG color, except colors
 * too dark to see against the black, which become a light lavender. The whole thing is centered and
 * scaled to a fixed size, then floats, turns slowly to show its depth, brightens on hover, and spins
 * when clicked.
 *
 * Set the file as `floatingSvg` in src/content/site.js (e.g. '/work/react.svg', from public/work/).
 * Until then, a generic "</>" is shown.
 */

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
  <g fill="#c4b5fd">
    <polygon points="30,8 36,14 16,30 36,46 30,52 4,30" />
    <polygon points="58,4 66,4 42,56 34,56" />
    <polygon points="70,8 64,14 84,30 64,46 70,52 96,30" />
  </g>
</svg>`

const withBase = (src) => (src.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : src)

function visible(color) {
  const hsl = {}
  color.getHSL(hsl)
  return hsl.l < 0.18 ? new THREE.Color('#c4b5fd') : color // black-on-black would disappear
}

// Build the solid pieces from SVG text. Returns a group sized `size` across, centered at 0.
function build(text, size, override = null) {
  const { paths } = new SVGLoader().parse(text)
  const inner = new THREE.Group()
  const materials = new Map()
  const material = (color) => {
    const key = color.getHexString()
    if (!materials.has(key)) {
      materials.set(key, new THREE.MeshPhysicalMaterial({
        // Gloss a little soft: broad flat faces mirror the key light into a blooming glare otherwise.
        color, roughness: 0.38, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.55,
        emissive: color, emissiveIntensity: 0.08,
        // Big flat faces mirror whole light panels of the studio reflections at some angles (a glare
        // that blooms on phones): reflect it more gently than the small, curved objects do.
        envMapIntensity: 0.35,
      }))
    }
    return materials.get(key)
  }

  // The SVG's own scale, so depth and bevels are proportional whatever its units.
  const bounds = new THREE.Box2()
  for (const path of paths) for (const sub of path.subPaths) for (const pt of sub.getPoints(24)) bounds.expandByPoint(pt)
  const extent = Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y) || 1
  const depth = extent * 0.16

  for (const path of paths) {
    const style = path.userData?.style || {}
    // Filled shapes: extruded, beveled solids.
    if (style.fill !== undefined && style.fill !== 'none' && style.fill !== 'transparent') {
      const shapes = path.toShapes() // three.js's current way (createShapes is deprecated)
      if (shapes.length) {
        const geo = new THREE.ExtrudeGeometry(shapes, {
          depth, curveSegments: 18,
          bevelEnabled: true, bevelThickness: extent * 0.022, bevelSize: extent * 0.014, bevelSegments: 3,
        })
        inner.add(new THREE.Mesh(geo, material(override ? new THREE.Color(override) : visible(path.color.clone()))))
      }
    }
    // Outlines: round tubes along the line, as thick as the stroke.
    if (style.stroke && style.stroke !== 'none' && style.stroke !== 'transparent') {
      const color = override ? new THREE.Color(override) : visible(new THREE.Color().setStyle(style.stroke, THREE.SRGBColorSpace))
      const radius = Math.max((style.strokeWidth || 1) / 2, extent * 0.006)
      for (const sub of path.subPaths) {
        const pts = sub.getPoints(96)
        if (pts.length < 2) continue
        const closed = pts[0].distanceTo(pts[pts.length - 1]) < extent * 1e-3
        if (closed) pts.pop()
        const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p.x, p.y, depth / 2)), closed, 'centripetal')
        inner.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(400, pts.length * 3), radius, 14, closed), material(color)))
      }
    }
  }

  // SVG's y axis points down: turn it the right way up (a rotation, so faces stay outward), then
  // center the whole object and scale it to `size`.
  inner.rotation.x = Math.PI
  const holder = new THREE.Group()
  holder.add(inner)
  const box = new THREE.Box3().setFromObject(holder)
  const center = box.getCenter(new THREE.Vector3())
  inner.position.sub(center)
  const dims = box.getSize(new THREE.Vector3())
  holder.scale.setScalar(size / Math.max(dims.x, dims.y, 1e-6))
  return holder
}

export function createSvgObject({ compact, src = null, position = null, size: sizeOverride = null, color = null }) {
  const group = new THREE.Group()
  group.name = 'svgObject'
  // In the opening view, upper right and in front of the cluster, balancing the logo cube on the left.
  group.position.set(...(position || (compact ? [1.9, 6.0, -3] : [5.0, 5.4, -2])))
  const size = sizeOverride || (compact ? 1.7 : 2.4)
  let model = null
  const place = (text) => {
    try {
      model = build(text, size, color)
    } catch (e) {
      console.warn('floatingSvg: could not turn this SVG into 3D; showing the default.', e)
      model = build(FALLBACK_SVG, size, color)
    }
    group.add(model)
  }
  if (src) {
    fetch(withBase(src))
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.text() })
      .then(place)
      .catch(() => {
        console.warn(`floatingSvg: couldn't load ${src} (check it's in public/ and the path has no "public/")`)
        place(FALLBACK_SVG)
      })
  } else {
    place(FALLBACK_SVG)
  }

  let hover = 0, spinVel = 0, extra = 0, bounce = 0, bounceVel = 0, flash = 0
  const base = group.position.clone()
  const api = {
    group,
    update(t, dt, { intro = 1, still = false }) {
      if (!model) return
      bounceVel += (-38 * bounce - 5.5 * bounceVel) * dt
      bounce += bounceVel * dt
      spinVel *= Math.exp(-dt * 1.8)
      extra += spinVel * dt
      flash *= Math.exp(-dt * 3)
      hover = Math.max(0, hover - dt * 3)
      const motion = still ? 0 : 1
      group.position.set(base.x, base.y + Math.sin(t * 0.55) * 0.18 * motion + bounce, base.z)
      group.rotation.set(Math.sin(t * 0.3) * 0.12 * motion, Math.sin(t * 0.21) * 0.55 * motion + extra, Math.sin(t * 0.17) * 0.05 * motion)
      group.scale.setScalar(THREE.MathUtils.smoothstep(intro, 0.15, 0.7) * (1 + hover * 0.04 + bounce * 0.1))
      model.traverse((o) => { if (o.isMesh) o.material.emissiveIntensity = 0.08 + hover * 0.25 + flash * 0.9 })
    },
    pick(raycaster) {
      if (!model) return null
      const hit = raycaster.intersectObject(group, true)[0]
      if (!hit) return null
      hover = Math.min(1, hover + 0.35)
      return { kind: 'svg', distance: hit.distance, api } // so the click reaches this object, not another
    },
    click() {
      spinVel += 9
      bounceVel += 4
      flash = 1
    },
  }
  return api
}
