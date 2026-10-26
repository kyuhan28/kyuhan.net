/*
 * The studio's light: one look for the desk, the developer studio around it (studioRoom.js, which adds its
 * own soft area lights) and the far backdrop (studioBackdrop.js). A neutral key and fill (so the walnut stays
 * walnut), a cool rim like spill from the wall's light strips, a soft pool on the floor, and the desk lamp
 * warm over the whole desk. Blue is the accent, not the room.
 *
 * Backdrop colors are display-space RGB triples (its shader writes them as-is); the room's light and
 * floor colors are hex strings for three.js.
 */
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l) }

export const STUDIO = {
    backdrop: [[0.06, 0.075, 0.12], [0.03, 0.04, 0.07], [0.012, 0.014, 0.02]],
    glow: [0.18, 0.3, 0.55], glowStrength: 0.55, vignette: 0.6, floorHex: '#101216',
    sunColor: '#e9e7f2', sunIntensity: 1.0, lightDir: [-0.55, 0.9, 0.55], // neutral, so the walnut stays walnut
    hemiSky: '#3b3f48', hemiGround: '#121214', hemi: 0.6,
    fillColor: '#d3d5db', fill: 0.9, rimColor: '#9fc6f0', rim: 0.8, poolColor: '#dde1ea', pool: 0.9,
    lamp: 6.0, env: 0.25, exposure: 1.1,
}
STUDIO.lightDir = norm(STUDIO.lightDir)
