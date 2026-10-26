export const backgrounds = {

  about: {
    base: '#0b0c10',
    lines: '#dfe2ea',
    count: 42,
    speed: 0.6,
    angle: -8,
    veil: 'rgba(11, 12, 16, 0.72)',
    veilFar: 'rgba(11, 12, 16, 0.12)',
  },

  projects: {
    base: '#0b0d10',
    lines: '#7f8a9a',
    interval: 0.075,
    speed: 0.55,
    interactive: true,
    seed: 26,
    labels: false,
  },

  skills: {
    base: '#0b0f19',
    dots: '#8fb3d9',
    spacing: 16,
    interactive: true,
    seed: 7,
  },

  experience: {
    image: '/work/experience-night.jpg',
    rain: 0.55,
    interactive: true,
    veil: 'rgba(10, 11, 16, 0.62)',
    veilFar: 'rgba(10, 11, 16, 0.18)',
  },

  contact: {
    base: '#060709',
    lines: '#8a93c8',
    density: 1,
    speed: 1,
    interactive: true,
  },
}

export function backgroundVars(app) {
  const b = backgrounds[app] || {}
  const vars = {}
  for (const [k, v] of Object.entries(b)) if (typeof v === 'string' || typeof v === 'number') vars[`--bg-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`] = typeof v === 'number' && k === 'gridSize' ? `${v}px` : v
  return vars
}
