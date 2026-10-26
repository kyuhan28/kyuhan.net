const GLYPHS = {
  about: <><circle cx="8" cy="6" r="2.6" /><path d="M3.2 13.4c.7-2.4 2.6-3.6 4.8-3.6s4.1 1.2 4.8 3.6" /></>,
  projects: <><path d="M2 4.6c0-.6.4-1 1-1h3.4l1.4 1.6H13c.6 0 1 .4 1 1v6.6c0 .6-.4 1-1 1H3c-.6 0-1-.4-1-1z" /></>,
  skills: <><path d="M9.2 1.8 3.6 9h4l-1 5.2L12.4 7h-4z" /></>,
  experience: <><rect x="2" y="4.6" width="12" height="8.6" rx="1.4" /><path d="M5.8 4.6V3.4c0-.5.4-.9.9-.9h2.6c.5 0 .9.4.9.9v1.2M2 8.4h12" /></>,
  contact: <><rect x="2" y="3.6" width="12" height="8.8" rx="1.4" /><path d="m2.6 4.4 5.4 4.2 5.4-4.2" /></>,
  desk: <><rect x="3" y="2.5" width="10" height="7" rx="1" /><path d="M8 9.5v2.5M5.5 12.5h5M1.5 14.5h13" /></>,
}
const ACCENT = { about: '#9fb4ff', projects: '#c4a7ff', skills: '#7fe0c8', experience: '#ffc98a', contact: '#8fe39a' }

export function AppIcon({ name, size = 16 }) {
  const glyph = GLYPHS[name]
  if (!glyph) return null
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" fill="none" stroke={ACCENT[name] || 'currentColor'}
      strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">{glyph}</svg>
  )
}

export function AppTile({ name }) {
  const accent = ACCENT[name] || '#9fb4ff'
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
      <defs>
        <linearGradient id={`tile-${name}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.32" /><stop offset="1" stopColor="#0f1016" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="11" fill={`url(#tile-${name})`} stroke="rgba(255,255,255,0.14)" />
      <g transform="translate(10 10) scale(1.75)" fill="none" stroke={accent} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">{GLYPHS[name]}</g>
    </svg>
  )
}

export function Monogram({ size = 18 }) {
  return (
    <svg viewBox="0 0 18 18" width={size} height={size} aria-hidden="true">
      <rect x="0.5" y="0.5" width="17" height="17" rx="4.5" fill="#0d0e12" stroke="#9fb4ff" />
      <path d="M4.5 4.5v9M4.5 9l4-4.5M4.5 9l4 4.5M10.5 4.5v9M13.5 4.5v9M10.5 9h3" stroke="#ececf1" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
