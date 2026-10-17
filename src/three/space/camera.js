import * as THREE from 'three'

/*
 * The camera's journey through the world, one station per page section:
 *   0 hero       wide, at the edge of the grid
 *   1 about      into the field of floating objects
 *   2 projects   before the gallery of sculptures, which sit to the side of the work
 *   3 skills     low over the floor, looking out to the horizon: a quiet, minimal view
 *   4 contact    rising and pulling back over everything, as the objects gather
 *
 * Stations are joined by smooth splines (where the camera is, and where it looks). The page's
 * scroll position is mapped onto them by the sections' positions on the page, so each station is
 * reached exactly when its section is centered on screen.
 */

export const STATION_IDS = ['top', 'about', 'projects', 'skills', 'contact']
export const GALLERY_Z = -46
// The skills station looks out over open floor: objects keep clear of this stretch.
export const QUIET = { x: 0, zNear: -57, zFar: -86, halfWidth: 10.5, height: 5 }

const V = (x, y, z) => new THREE.Vector3(x, y, z)

function stations(compact) {
  const back = compact ? 3.5 : 0 // phones stand a little further back to fit the composition
  return {
    pos: [V(0, 3.1, 13 + back), V(1.6, 4.0, -6 + back), V(0, 3.3, -35 + back), V(-0.5, 1.25, -61 + back * 0.6), V(0, 8.5, -44 + back)],
    // Desktop: the gallery sits right of the text. Phones: lower, below the text.
    aim: [
      V(0, 2.4, -12),
      V(-0.8, 3.2, -32),
      compact ? V(0, 4.0, GALLERY_Z - 2) : V(1.5, 3.3, GALLERY_Z - 2), // the sculptures fill the right of the frame
      V(0.4, 1.6, -95), // out along the floor to the horizon
      V(0, 3.5, -86),
    ],
  }
}

export function createCameraRig({ compact }) {
  const { pos, aim } = stations(compact)
  const path = new THREE.CatmullRomCurve3(pos, false, 'centripetal')
  const look = new THREE.CatmullRomCurve3(aim, false, 'centripetal')
  const last = pos.length - 1
  // Where the opening shot starts: high and far, looking down at the grid as it lights up.
  const introFrom = { pos: V(0, 11, 34), aim: V(0, 0.5, -8) }
  return {
    count: pos.length,
    /** Station position s (0..4, fractional between stations) to camera position and target. */
    sample(s, outPos, outAim) {
      const u = THREE.MathUtils.clamp(s / last, 0, 1)
      path.getPoint(u, outPos)
      look.getPoint(u, outAim)
    },
    introFrom,
  }
}

/**
 * Map the page's scroll position onto stations, piecewise between the sections' centers.
 * anchors: scrollY at which each station's section is centered on screen (ascending).
 */
export function scrollToStation(scrollY, anchors) {
  if (!anchors.length) return 0
  if (scrollY <= anchors[0]) return 0
  for (let i = 1; i < anchors.length; i++) {
    if (scrollY <= anchors[i]) return i - 1 + (scrollY - anchors[i - 1]) / Math.max(1, anchors[i] - anchors[i - 1])
  }
  return anchors.length - 1
}
