import * as THREE from 'three'
import { mountainHeightAt } from './mountains'

/*
 * Day and night skies.
 *
 *   day    a blue gradient dome, a 3D sun (an animated, glowing surface with a soft corona),
 *          and 3D clouds: clusters of shaded, sunlit puffs drifting slowly across the sky
 *   night  black, with a 3D moon (craters and dark seas, lit from one side, with a soft halo);
 *          the stars are the scene's stardust
 *
 * The sun and moon sit "at infinity": they follow the camera, so they stay put in the sky
 * however far the camera travels.
 */

export const SUN_DIR = new THREE.Vector3(0.5, 0.26, -1).normalize() // right of the opening view, above the mountains, below the nav
export const MOON_DIR = new THREE.Vector3(-0.42, 0.34, -1).normalize() // upper left
// Deep enough to stay a vivid blue through the scene's filmic tone mapping.
export const DAY = { zenith: '#06318a', mid: '#1663c9', horizon: '#6fb0e6' }

const glowMaterial = (color, strength) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor; uniform float uStrength; varying vec2 vUv;
    void main() { float r = length(vUv - 0.5) * 2.0; float g = pow(max(0.0, 1.0 - r), 2.4); gl_FragColor = vec4(uColor * g * uStrength, 1.0); }
  `,
})

const NOISE = /* glsl */ `
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
`

export function createSky({ compact = false } = {}) {
  const group = new THREE.Group()
  group.name = 'sky'

  // The dome: a gradient that deepens toward the top, warming around the sun.
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(900, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uDay: { value: 1 },
        uZenith: { value: new THREE.Color(DAY.zenith) }, uMid: { value: new THREE.Color(DAY.mid) }, uHorizon: { value: new THREE.Color(DAY.horizon) },
        uSun: { value: SUN_DIR.clone() },
      },
      vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uDay; uniform vec3 uZenith, uMid, uHorizon, uSun; varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 sky = mix(uHorizon, uMid, smoothstep(0.0, 0.18, h));
          sky = mix(sky, uZenith, smoothstep(0.18, 0.75, h));
          float s = max(dot(d, uSun), 0.0);
          sky += vec3(1.0, 0.86, 0.62) * (pow(s, 12.0) * 0.1 + pow(s, 160.0) * 0.12); // a little warm air around the sun
          gl_FragColor = vec4(sky * uDay, 1.0);
        }
      `,
    }),
  )
  dome.renderOrder = -10
  group.add(dome)

  // The sun: a turning sphere with a boiling, glowing surface, plus a corona that blooms.
  const sunMat = new THREE.ShaderMaterial({
    fog: false, toneMapped: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vP; void main() { vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; varying vec3 vN; varying vec3 vP;
      ${NOISE}
      void main() {
        float limb = pow(max(dot(normalize(vN), vec3(0, 0, 1)), 0.0), 0.45); // brighter at the center
        float boil = fbm(normalize(vP) * 3.2 + vec3(0.0, uTime * 0.08, uTime * 0.05));
        vec3 col = mix(vec3(1.9, 1.15, 0.45), vec3(2.6, 2.2, 1.5), boil) * (0.55 + 0.6 * limb);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), sunMat)
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMaterial('#ffd59a', 0.7))
  const sunGroup = new THREE.Group()
  sunGroup.add(corona, sun)
  sun.scale.setScalar(36)
  corona.scale.setScalar(36 * 3.4)
  group.add(sunGroup)

  // The moon: craters and dark seas, lit from one side, with a soft cool halo.
  const moonMat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: { uLight: { value: new THREE.Vector3(0.75, 0.35, 0.55).normalize() } },
    vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vP; void main() { vN = normalize(mat3(modelMatrix) * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uLight; varying vec3 vN; varying vec3 vP;
      ${NOISE}
      void main() {
        vec3 p = normalize(vP);
        float seas = smoothstep(0.48, 0.62, fbm(p * 1.6 + 4.0));             // the dark maria
        float craters = smoothstep(0.55, 0.75, noise(p * 9.0)) * 0.35 + smoothstep(0.6, 0.8, noise(p * 22.0)) * 0.2;
        float albedo = 0.92 - seas * 0.38 - craters;
        float lit = smoothstep(-0.15, 0.6, dot(normalize(vN), uLight));       // the terminator, softened
        vec3 col = vec3(1.05, 1.07, 1.12) * albedo * (0.06 + 1.0 * lit);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), moonMat)
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowMaterial('#9fb4ff', 0.5))
  const moonGroup = new THREE.Group()
  moonGroup.add(halo, moon)
  moon.scale.setScalar(26)
  halo.scale.setScalar(26 * 5)
  group.add(moonGroup)

  // Clouds: small, thin wisps resting just above the mountain peaks (one instanced draw). Each one
  // looks up the mountains' height where it sits, settles a few meters above it, and drifts slowly.
  const cloudCount = compact ? 8 : 12
  const VIEW = new THREE.Vector3(0, 3, 13) // the opening view, for keeping the sun and moon clear
  const CLEAR = Math.cos(THREE.MathUtils.degToRad(10))
  const puffs = []
  let seed = 7
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const toView = new THREE.Vector3()
  for (let c = 0; c < cloudCount; c++) {
    let cx = 0, cz = -200, top = 30
    for (let tries = 0; tries < 300; tries++) {
      cx = (rand() - 0.5) * (compact ? 300 : 520)
      cz = -150 - rand() * 170
      top = mountainHeightAt(cx, cz)
      toView.set(cx, top + 8, cz).sub(VIEW).normalize()
      if (top > 18 && toView.dot(SUN_DIR) < CLEAR && toView.dot(MOON_DIR) < CLEAR) break // on a real peak, not in front of the sun or moon
    }
    const cy = top + 4 + rand() * 9
    const size = 2.6 + rand() * 3, n = 3 + Math.floor(rand() * 3)
    for (let k = 0; k < n; k++) {
      const t = n > 1 ? k / (n - 1) - 0.5 : 0
      puffs.push({ x: cx + t * size * 3 + (rand() - 0.5) * size, y: cy + (1 - Math.abs(t) * 1.6) * size * 0.3 + rand() * size * 0.2, z: cz + (rand() - 0.5) * size * 1.2, r: size * (0.6 + rand() * 0.5) * (1 - Math.abs(t) * 0.4) })
    }
  }
  // Thin: mostly see-through, softly shaded and tinted toward the sky.
  const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#b3cbe8', emissiveIntensity: 0.5, transparent: true, opacity: 0.3, depthWrite: false, fog: false })
  const clouds = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 10), cloudMat, puffs.length)
  clouds.frustumCulled = false
  group.add(clouds)
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pt = new THREE.Vector3()
  const SPAN = compact ? 300 : 520
  const placeClouds = (t) => {
    const drift = t * 0.45 // slow, so they linger by the summits
    puffs.forEach((p, i) => {
      const x = ((p.x + drift + SPAN / 2) % SPAN + SPAN) % SPAN - SPAN / 2 // wrap around
      m.compose(pt.set(x, p.y, p.z), q, sc.set(p.r * 1.3, p.r * 0.4, p.r)) // flat wisps
      clouds.setMatrixAt(i, m)
    })
    clouds.instanceMatrix.needsUpdate = true
  }
  placeClouds(0)

  let night = false
  const apply = () => {
    dome.material.uniforms.uDay.value = night ? 0 : 1
    sunGroup.visible = !night
    clouds.visible = !night
    moonGroup.visible = night
  }
  apply()

  return {
    group,
    get night() { return night },
    setNight(value) { night = !!value; apply() },
    update(t, camera, { still = false } = {}) {
      dome.position.copy(camera.position)
      const at = (dir, dist, g) => g.position.copy(camera.position).addScaledVector(dir, dist)
      at(SUN_DIR, 700, sunGroup)
      at(MOON_DIR, 700, moonGroup)
      corona.quaternion.copy(camera.quaternion)
      halo.quaternion.copy(camera.quaternion)
      if (!night) {
        sunMat.uniforms.uTime.value = still ? 0 : t
        sun.rotation.y = still ? 0 : t * 0.02
        if (!still) placeClouds(t)
      } else {
        moon.rotation.y = 0.4 + (still ? 0 : t * 0.004)
      }
    },
  }
}
