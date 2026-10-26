const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l) }

export const STUDIO = {

    backdrop: [[0.94, 0.8, 0.74], [0.86, 0.8, 0.9], [0.7, 0.7, 0.9]],
    glow: [1.0, 0.93, 0.86], glowStrength: 0.12, vignette: 0.15, floorHex: '#c9a888',

    sunColor: '#ffd6a8', sunIntensity: 5.8, lightDir: [0.5, 0.62, -0.6],

    hemiSky: '#aea3e6', hemiGround: '#efc1a2', hemi: 0.42,

    fillColor: '#ddd4ff', fill: 0.26, rimColor: '#ffe0c0', rim: 0.25, poolColor: '#fff1e2', pool: 0.15,
    lamp: 2.0, env: 0.3, exposure: 0.88,
}
STUDIO.lightDir = norm(STUDIO.lightDir)

export const NIGHT = {
  backdrop: [[0.07, 0.08, 0.16], [0.05, 0.06, 0.13], [0.03, 0.035, 0.09]],
  glow: [0.35, 0.42, 0.75], glowStrength: 0.08, vignette: 0.5, floorHex: '#5a4a44',
  sunColor: '#9fb3ff', sunIntensity: 0.7, lightDir: [0.5, 0.62, -0.6],
  hemiSky: '#2b3466', hemiGround: '#3a2a2c', hemi: 0.3,
  fillColor: '#5e6cc4', fill: 0.1, rimColor: '#8fa2ff', rim: 0.15, poolColor: '#ffd2a0', pool: 0.05,
  lamp: 9.0, env: 0.15, exposure: 1.0,
}

export const LOOKS = { day: STUDIO, night: NIGHT }
