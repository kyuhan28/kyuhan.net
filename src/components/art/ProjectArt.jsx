import { useId, useMemo } from 'react'
import './art.css'

/*
 * Deterministic generative artwork, used until a project has a real image.
 * Four studies of light on a dark field. All static: movement comes from the
 * parallax wrapper around them, which keeps them free to render.
 */

const W = 800
const H = 500

function Contour({ id }) {
  const paths = useMemo(() => {
    const out = []
    for (let k = 0; k < 16; k++) {
      let d = ''
      for (let x = -20; x <= W + 20; x += 16) {
        // Neighbouring lines share almost the same phase, so like real contours they never cross.
        const swell = 1 - Math.abs(k - 8) / 12
        const y =
          H / 2 + (k - 7.5) * 21 + Math.sin(x * 0.011 + k * 0.06) * 34 + Math.sin(x * 0.029 + k * 0.1) * 9 -
          Math.exp(-((x - 520) ** 2) / 26000) * 58 * swell
        d += `${x === -20 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `
      }
      out.push(d)
    }
    return out
  }, [])
  return paths.map((d, k) => (
    <path
      key={k}
      d={d}
      fill="none"
      stroke={k === 9 ? `url(#${id}-light)` : '#f4f4f6'}
      strokeOpacity={k === 9 ? 1 : 0.1 + (k % 4) * 0.05}
      strokeWidth={k === 9 ? 2 : 1}
    />
  ))
}

function Orbit({ id }) {
  return (
    <g transform={`translate(${W * 0.56} ${H / 2}) rotate(-16)`}>
      {Array.from({ length: 8 }, (_, k) => (
        <ellipse
          key={k}
          rx={70 + k * 44}
          ry={(70 + k * 44) * 0.36}
          fill="none"
          stroke={k === 4 ? `url(#${id}-light)` : '#f4f4f6'}
          strokeOpacity={k === 4 ? 1 : 0.16}
          strokeWidth={k === 4 ? 2 : 1}
          strokeDasharray={k % 3 === 1 ? '2 7' : undefined}
        />
      ))}
      {[0.6, 2.1, 3.9, 5.2].map((a, i) => {
        const r = 70 + (i * 2 + 1) * 44
        return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r * 0.36} r={i === 1 ? 6 : 3} fill={i === 1 ? '#a24dff' : '#f4f4f6'} />
      })}
      <circle r="18" fill={`url(#${id}-glow)`} />
    </g>
  )
}

function Lattice() {
  const dots = useMemo(() => {
    const out = []
    const cx = W * 0.6
    const cy = H * 0.48
    for (let gx = 0; gx <= 32; gx++) {
      for (let gy = 0; gy <= 20; gy++) {
        let x = (gx / 32) * W
        let y = (gy / 20) * H
        const dx = x - cx
        const dy = y - cy
        const d = Math.hypot(dx, dy)
        const pull = Math.exp(-(d * d) / 30000) * 46 // a lens bending the grid
        x += (dx / (d || 1)) * pull
        y += (dy / (d || 1)) * pull
        out.push({ x, y, o: 0.12 + Math.exp(-(d * d) / 40000) * 0.8, r: 1.2 + Math.exp(-(d * d) / 20000) * 1.6 })
      }
    }
    return out
  }, [])
  return dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#f4f4f6" fillOpacity={p.o} />)
}

function Signal({ id }) {
  const bars = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const t = i / 71
        const env = Math.sin(t * Math.PI) ** 1.6
        const h = 18 + env * (150 + Math.sin(i * 0.9) * 60 + Math.sin(i * 0.23) * 40)
        return { x: 40 + t * (W - 80), h }
      }),
    [],
  )
  return bars.map((b, i) => (
    <rect
      key={i}
      x={b.x - 2}
      y={H / 2 - b.h / 2}
      width="4"
      height={b.h}
      rx="2"
      fill={i > 40 && i < 52 ? `url(#${id}-light-v)` : '#f4f4f6'}
      fillOpacity={i > 40 && i < 52 ? 1 : 0.16 + (b.h / 260) * 0.3}
    />
  ))
}

const STUDIES = { contour: Contour, orbit: Orbit, lattice: Lattice, signal: Signal }

// '/work/x.webp' in site.js means "public/work/x.webp". Prefix the deploy base so the
// path still works when the site lives under a subpath such as a GitHub Pages repo URL.
const withBase = (src) => (src.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : src)

export default function ProjectArt({ kind = 'contour', image, alt = '', className = '' }) {
  const id = useId().replace(/:/g, '')
  if (image) {
    return <img className={`project-art project-art--image ${className}`} src={withBase(image)} alt={alt} loading="lazy" decoding="async" />
  }
  const Study = STUDIES[kind] ?? Contour
  return (
    <svg className={`project-art ${className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-bg`} cx="0.62" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#101018" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#a24dff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#a24dff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-light`} x1="0" x2="1">
          <stop offset="0" stopColor="#3d7bff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#3d7bff" />
          <stop offset="0.75" stopColor="#a24dff" />
          <stop offset="1" stopColor="#a24dff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-light-v`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d7bff" />
          <stop offset="1" stopColor="#a24dff" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-bg)`} />
      <Study id={id} />
    </svg>
  )
}
