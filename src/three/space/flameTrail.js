import * as THREE from 'three'

/*
 * A little white flame on the grid floor that follows the camera, leaving a trail of light.
 *
 *   flame   a small flickering flame (drawn in a shader) with a pool of light on the grid around it
 *   trail   a ribbon of light laid on the floor behind it, tapering and fading over ~2 seconds
 *   embers  tiny sparks drifting up off the flame
 *
 * It stays a little ahead of the camera on the floor, placed so it sits near the bottom of the
 * screen however high or low the camera is. It follows with a slight lag, so scrolling sends it
 * racing after the camera and stretches the trail; when the camera rests it wanders gently on
 * the spot, so the trail curls. With reduced motion it's a calm, steady flame.
 */

const TRAIL_SECONDS = 2.2
const TRAIL_POINTS = 90
const EMBERS = 40
const SCREEN_DROP = THREE.MathUtils.degToRad(15) // how far below the middle of the screen it sits

const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
`

export function createFlameTrail({ compact = false } = {}) {
  const group = new THREE.Group()
  group.name = 'flameTrail'
  const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }

  // The flame: a billboard, its shape and flicker drawn in the shader.
  const flameMat = new THREE.ShaderMaterial({
    ...additive,
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uIntensity; varying vec2 vUv;
      ${NOISE}
      void main() {
        float x = vUv.x * 2.0 - 1.0, y = vUv.y;
        float n = noise(vec2(x * 3.0, y * 4.5 - uTime * 3.2)) * 0.6 + noise(vec2(x * 7.0, y * 9.0 - uTime * 5.0)) * 0.4;
        float width = mix(0.62, 0.02, pow(y, 0.85)) * (0.75 + 0.5 * n);      // wide at the base, licking up to a tip
        float d = abs(x + (n - 0.5) * 0.25 * y) / max(width, 1e-3);
        float body = (1.0 - smoothstep(0.55, 1.0, d)) * smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(0.62, 1.0, y + n * 0.18));
        float core = (1.0 - smoothstep(0.1, 0.55, d)) * (1.0 - smoothstep(0.08, 0.5, y));
        vec3 col = vec3(0.72, 0.84, 1.0) * body * 1.1 + vec3(1.7) * core;     // a hot white core, a cool white edge
        gl_FragColor = vec4(col * uIntensity, 1.0);
      }
    `,
  })
  const flame = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.0).translate(0, 0.5, 0), flameMat)

  // A pool of light on the grid around it.
  const poolMat = new THREE.ShaderMaterial({
    ...additive,
    uniforms: { uIntensity: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uIntensity; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(vec3(0.8, 0.88, 1.0) * pow(max(0.0, 1.0 - r), 2.2) * 0.55 * uIntensity, 1.0); }`,
  })
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2).rotateX(-Math.PI / 2), poolMat)
  pool.position.y = 0.03

  // The trail: a ribbon on the floor, rebuilt each frame from the flame's recent path.
  const positions = new Float32Array(TRAIL_POINTS * 2 * 3)
  const ages = new Float32Array(TRAIL_POINTS * 2)
  const sides = new Float32Array(TRAIL_POINTS * 2).map((_, i) => i % 2) // which edge of the ribbon
  const index = []
  for (let i = 0; i < TRAIL_POINTS - 1; i++) {
    const a = i * 2
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const trailGeo = new THREE.BufferGeometry()
  trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
  trailGeo.setAttribute('aAge', new THREE.BufferAttribute(ages, 1).setUsage(THREE.DynamicDrawUsage))
  trailGeo.setAttribute('aSide', new THREE.BufferAttribute(sides, 1))
  trailGeo.setIndex(index)
  const trailMat = new THREE.ShaderMaterial({
    ...additive,
    side: THREE.DoubleSide,
    uniforms: { uIntensity: { value: 1 } },
    vertexShader: /* glsl */ `attribute float aAge; attribute float aSide; varying float vAge; varying float vSide;
      void main() { vAge = aAge; vSide = aSide; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uIntensity; varying float vAge; varying float vSide;
      void main() {
        float edge = 1.0 - pow(abs(vSide * 2.0 - 1.0), 2.0);                   // brightest down the middle
        float fade = pow(1.0 - clamp(vAge, 0.0, 1.0), 2.4);
        gl_FragColor = vec4(vec3(0.82, 0.9, 1.0) * fade * (0.2 + 0.8 * edge) * 0.75 * uIntensity, 1.0);
      }`,
  })
  const trail = new THREE.Mesh(trailGeo, trailMat)
  trail.frustumCulled = false

  // Embers: tiny sparks drifting up off the flame.
  const emberPos = new Float32Array(EMBERS * 3)
  const emberLife = new Float32Array(EMBERS)
  const emberVel = Array.from({ length: EMBERS }, () => new THREE.Vector3())
  const emberAge = new Float32Array(EMBERS).fill(1)
  const emberGeo = new THREE.BufferGeometry()
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3).setUsage(THREE.DynamicDrawUsage))
  emberGeo.setAttribute('aLife', new THREE.BufferAttribute(emberLife, 1).setUsage(THREE.DynamicDrawUsage))
  const emberMat = new THREE.ShaderMaterial({
    ...additive,
    uniforms: { uIntensity: { value: 1 }, uScale: { value: 1 } },
    vertexShader: /* glsl */ `attribute float aLife; varying float vLife; uniform float uScale;
      void main() { vLife = aLife; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uScale * (0.06 + 0.1 * aLife) * 300.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform float uIntensity; varying float vLife;
      void main() { float r = length(gl_PointCoord - 0.5) * 2.0; if (r > 1.0) discard; gl_FragColor = vec4(vec3(1.4) * (1.0 - r) * vLife * uIntensity, 1.0); }`,
  })
  const embers = new THREE.Points(emberGeo, emberMat)
  embers.frustumCulled = false

  group.add(trail, pool, flame, embers)

  // State
  const head = new THREE.Vector3()
  const target = new THREE.Vector3()
  const dir = new THREE.Vector3()
  const history = [] // { x, z, t }
  let started = false
  let lastT = 0

  const layTrail = (t) => {
    const side = new THREE.Vector2()
    for (let i = 0; i < TRAIL_POINTS; i++) {
      const p = history[Math.min(i, history.length - 1)] || { x: head.x, z: head.z, t }
      const q = history[Math.min(i + 1, history.length - 1)] || p
      side.set(-(q.z - p.z), q.x - p.x)
      if (side.lengthSq() < 1e-8) side.set(1, 0)
      side.normalize()
      const age = i < history.length ? Math.min(1, (t - p.t) / TRAIL_SECONDS) : 1
      const width = 0.2 * Math.pow(1 - age, 0.9) * (1 - i / TRAIL_POINTS) // a thin streak, tapering to nothing
      const k = i * 6
      positions[k] = p.x + side.x * width; positions[k + 1] = 0.025; positions[k + 2] = p.z + side.y * width
      positions[k + 3] = p.x - side.x * width; positions[k + 4] = 0.025; positions[k + 5] = p.z - side.y * width
      ages[i * 2] = ages[i * 2 + 1] = age
    }
    trailGeo.attributes.position.needsUpdate = true
    trailGeo.attributes.aAge.needsUpdate = true
  }

  return {
    group,
    head,
    update(t, dt, camera, { intro = 1, still = false, night = true } = {}) {
      // Where it belongs: ahead of the camera on the floor, near the bottom of the screen.
      camera.getWorldDirection(dir)
      const pitchDown = Math.asin(THREE.MathUtils.clamp(-dir.y, -1, 1))
      const angle = THREE.MathUtils.clamp(pitchDown + SCREEN_DROP, THREE.MathUtils.degToRad(6), THREE.MathUtils.degToRad(75))
      const ahead = THREE.MathUtils.clamp(Math.max(camera.position.y, 0.4) / Math.tan(angle), 3, compact ? 26 : 34)
      const flat = Math.hypot(dir.x, dir.z) || 1
      // Off to the right of center: clear of the scroll cue (desktop) and the hero buttons (phones).
      const halfWide = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect
      const side = ahead * halfWide * (compact ? 0 : 0)
      const fx = dir.x / flat, fz = dir.z / flat
      target.set(camera.position.x + fx * ahead - fz * side, 0, camera.position.z + fz * ahead + fx * side)
      if (!still) target.x += Math.sin(t * 0.9) * 0.55, target.z += Math.cos(t * 0.7) * 0.35 // a gentle wander
      if (!started) { head.copy(target); started = true }
      head.x = THREE.MathUtils.damp(head.x, target.x, still ? 30 : 9, dt) // a slight lag, so it races after the camera
      head.z = THREE.MathUtils.damp(head.z, target.z, still ? 30 : 9, dt)
      // It races after the camera, but never falls so far behind that it drops out of the frame.
      const maxLag = ahead * 0.3
      const lagX = head.x - target.x, lagZ = head.z - target.z, lag = Math.hypot(lagX, lagZ)
      if (lag > maxLag) { head.x = target.x + (lagX / lag) * maxLag; head.z = target.z + (lagZ / lag) * maxLag }

      // Record its path for the trail (none with reduced motion: just the steady flame).
      if (still) history.length = 0
      else {
        const last = history[0]
        if (!last || Math.hypot(head.x - last.x, head.z - last.z) > 0.04 || t - last.t > 0.05) history.unshift({ x: head.x, z: head.z, t })
        while (history.length > TRAIL_POINTS || (history.length && t - history[history.length - 1].t > TRAIL_SECONDS)) history.pop()
      }
      layTrail(t)

      const presence = intro * (night ? 1 : 1.3) // a little stronger by day, on the pale floor
      const flicker = still ? 1 : 0.88 + 0.12 * Math.sin(t * 17.0) * Math.sin(t * 7.3)
      flame.position.set(head.x, 0.02, head.z)
      flame.quaternion.copy(camera.quaternion) // faces the camera
      flame.scale.setScalar(presence > 0 ? 0.85 + 0.15 * flicker : 0)
      flameMat.uniforms.uTime.value = still ? 0 : t
      flameMat.uniforms.uIntensity.value = presence * flicker
      pool.position.x = head.x
      pool.position.z = head.z
      poolMat.uniforms.uIntensity.value = presence * flicker
      trailMat.uniforms.uIntensity.value = presence

      // Embers
      embers.visible = !still
      if (!still) {
        const step = Math.min(0.05, Math.max(0, t - lastT))
        for (let i = 0; i < EMBERS; i++) {
          emberAge[i] += step / (0.7 + (i % 5) * 0.12)
          if (emberAge[i] >= 1) { // respawn at the flame
            emberAge[i] = Math.random() * 0.2
            emberPos[i * 3] = head.x + (Math.random() - 0.5) * 0.25
            emberPos[i * 3 + 1] = 0.15 + Math.random() * 0.3
            emberPos[i * 3 + 2] = head.z + (Math.random() - 0.5) * 0.25
            emberVel[i].set((Math.random() - 0.5) * 0.5, 0.6 + Math.random() * 0.9, (Math.random() - 0.5) * 0.5)
          }
          emberPos[i * 3] += emberVel[i].x * step
          emberPos[i * 3 + 1] += emberVel[i].y * step
          emberPos[i * 3 + 2] += emberVel[i].z * step
          emberLife[i] = (1 - emberAge[i]) * presence
        }
        emberGeo.attributes.position.needsUpdate = true
        emberGeo.attributes.aLife.needsUpdate = true
      }
      lastT = t
    },
  }
}
