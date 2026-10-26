import * as THREE from 'three'

/*
 * The studio behind the desk: the way premium hardware is photographed. Not a place, just atmosphere.
 *
 *   One gradient dome: near-black overhead, easing to deep midnight-graphite low down (a soft light
 *   graphite by day). A soft, wide glow sits behind the computer, separating it from the darkness, and the
 *   light falls off toward the sides. The desk stands on the room's floor, which fades out with distance
 *   and dissolves into this (deskScene.js), so there is no edge anywhere.
 *
 * The only motion: the glow breathes almost imperceptibly (it stands still with reduced motion).
 * Drawn in its own pass behind the room, with a camera that mirrors the room's.
 */

const BACKDROP = /* glsl */ `
  uniform float uTime, uGlowStrength, uVignette;
  uniform vec3 uBackdrop[3], uGlow;
  vec3 backdropAt(vec3 d) {
    float h = d.y;
    vec3 c = mix(uBackdrop[0], uBackdrop[1], smoothstep(-0.12, 0.22, h));       // low -> middle
    c = mix(c, uBackdrop[2], smoothstep(0.18, 0.85, h));                         // -> overhead
    // the glow behind the computer: wide and low, softly elliptical
    float az = atan(d.x, -d.z);
    float el = h - 0.06;
    float glow = exp(-(az * az / 0.2 + el * el / 0.035));
    c += uGlow * glow * uGlowStrength * (0.97 + 0.03 * sin(uTime * 0.11));
    // the light falls off toward the sides (and behind)
    c *= 1.0 - uVignette * smoothstep(0.35, 1.6, abs(az));
    return c;
  }
`

function dome(U, radius) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: U,
    vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `${BACKDROP} varying vec3 vDir; void main() { gl_FragColor = vec4(backdropAt(normalize(vDir)), 1.0); }`,
  }))
}

/** The studio's scene and camera (its camera mirrors the room's), and its day/night update. */
export function buildBackdrop() {
  const U = {
    uTime: { value: 0 },
    uBackdrop: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
    uGlow: { value: new THREE.Vector3() }, uGlowStrength: { value: 0.5 }, uVignette: { value: 0.5 },
  }
  const scene = new THREE.Scene()
  scene.add(dome(U, 400))
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 1000)
  // the same backdrop, small, for the room's reflections (the reflection camera only sees ~100 m)
  const envScene = new THREE.Scene()
  envScene.add(dome(U, 40))
  return {
    scene,
    camera,
    envScene,
    ready: Promise.resolve(true), // nothing to download
    sync(roomCamera) {
      camera.position.copy(roomCamera.position)
      camera.quaternion.copy(roomCamera.quaternion)
      if (camera.fov !== roomCamera.fov || camera.aspect !== roomCamera.aspect) {
        camera.fov = roomCamera.fov
        camera.aspect = roomCamera.aspect
        camera.updateProjectionMatrix()
      }
    },
    /** Apply the studio look (studioLight.js), and the shared clock (for the glow). */
    update(tod, time) {
      U.uTime.value = time
      tod.backdrop.forEach((c, i) => U.uBackdrop.value[i].set(c[0], c[1], c[2]))
      U.uGlow.value.set(...tod.glow)
      U.uGlowStrength.value = tod.glowStrength
      U.uVignette.value = tod.vignette
    },
  }
}
