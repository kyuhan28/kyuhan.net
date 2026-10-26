/*
 * Each app's background, in one place: change a color, a glow or an intensity here, and the app follows.
 * (Content lives in each app's data file; this is only how the apps look behind their content.)
 * Colors can be any CSS color. These become CSS variables on each app (apps.css draws them).
 */
export const backgrounds = {
  // About Me: warm charcoal, a soft warm light from the upper left, a whisper of paper grain.
  about: {
    base: '#141213',
    glow: 'rgba(255, 214, 176, 0.07)', // the warm light
    glowAt: '15% 0%', //                   where it falls
    grain: 0.05, //                        paper texture strength (0 for none)
  },

  // Projects: Kokonut UI's Topo Background, a living contour map. The first five are the component's own
  // props; `base` and `lines` are its background and line colors.
  projects: {
    base: '#0b0d10',
    lines: '#7f8a9a', //   muted cool gray (the component draws it at 16% for minor lines, 34% for index lines)
    interval: 0.075, //    height between contour lines: lower draws more lines
    speed: 0.55, //        how fast the terrain drifts (0 holds it still)
    interactive: true, //  a hill rises under the cursor; a click on the background sends a ripple
    seed: 26, //           which terrain (any whole number)
    labels: false, //      elevation numbers on the index contours (they'd sit under the content here)
  },

  // Skills: deep midnight, a faint technical grid, a soft mint accent in one corner.
  skills: {
    base: '#0b0f19',
    grid: 'rgba(140, 170, 230, 0.07)', // grid line color and opacity
    gridSize: 28, //                     px between grid lines
    accent: 'rgba(127, 224, 200, 0.07)', // the corner accent
    accentAt: '100% 0%',
  },

  // Experience: dark neutral, a gentle vertical gradient, a soft light behind the timeline.
  experience: {
    top: '#16171b',
    bottom: '#0e0f12',
    glow: 'rgba(255, 201, 138, 0.06)', // the light behind the timeline
    glowAt: '8% 28%',
  },

  // Contact: near-black, a soft cyan light in the upper right, a fainter blue below.
  contact: {
    base: '#0a0b0e',
    glow: 'rgba(92, 207, 255, 0.11)',
    glowAt: '88% 4%',
    glow2: 'rgba(110, 140, 255, 0.05)',
    glow2At: '10% 100%',
  },
}

/** An app's background settings as CSS variables, for its root element. */
export function backgroundVars(app) {
  const b = backgrounds[app] || {}
  const vars = {}
  for (const [k, v] of Object.entries(b)) if (typeof v === 'string' || typeof v === 'number') vars[`--bg-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`] = typeof v === 'number' && k === 'gridSize' ? `${v}px` : v
  return vars
}
