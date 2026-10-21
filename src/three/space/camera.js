import * as THREE from 'three'














export const STATION_IDS = ['top', 'about', 'projects', 'skills', 'contact']
export const GALLERY_Z = -46

export const QUIET = { x: 0, zNear: -57, zFar: -86, halfWidth: 10.5, height: 5 }

const V = (x, y, z) => new THREE.Vector3(x, y, z)

function stations(compact) {
  const back = compact ? 3.5 : 0
  return {
    pos: [V(0, 3.1, 13 + back), V(1.6, 4.0, -6 + back), V(0, 3.3, -35 + back), V(-0.5, 1.25, -61 + back * 0.6), V(0, 8.5, -44 + back)],

    aim: [
      V(0, 2.4, -12),
      V(-0.8, 3.2, -32),
      compact ? V(0, 4.0, GALLERY_Z - 2) : V(1.5, 3.3, GALLERY_Z - 2),
      V(0.4, 1.6, -95),
      V(0, 3.5, -86),
    ],
  }
}

export function createCameraRig({ compact }) {
  const { pos, aim } = stations(compact)
  const path = new THREE.CatmullRomCurve3(pos, false, 'centripetal')
  const look = new THREE.CatmullRomCurve3(aim, false, 'centripetal')
  const last = pos.length - 1

  const introFrom = { pos: V(0, 11, 34), aim: V(0, 0.5, -8) }
  return {
    count: pos.length,

    sample(s, outPos, outAim) {
      const u = THREE.MathUtils.clamp(s / last, 0, 1)
      path.getPoint(u, outPos)
      look.getPoint(u, outAim)
    },
    introFrom,
  }
}





export function scrollToStation(scrollY, anchors) {
  if (!anchors.length) return 0
  if (scrollY <= anchors[0]) return 0
  for (let i = 1; i < anchors.length; i++) {
    if (scrollY <= anchors[i]) return i - 1 + (scrollY - anchors[i - 1]) / Math.max(1, anchors[i] - anchors[i - 1])
  }
  return anchors.length - 1
}
