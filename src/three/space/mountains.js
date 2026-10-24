import * as THREE from 'three'

/*
 * The mountains: three ranges on the horizon, lit like a night scene, carrying the floor's grid.
 *
 *   near  low foothills just past the floating objects
 *   mid   the main peaks
 *   far   broad, tall massifs, softened by distance
 *
 * Every mountain is built along a crest line (a ridge with a direction, not a cone), warped and
 * roughened with ridged noise, so silhouettes are natural and nothing repeats. Heights taper to
 * nothing at every edge (no cliffs where the mesh ends), and the base sits just below the floor,
 * so the two surfaces never fight for the same depth.
 *
 * The shader lights them from behind (a cool rim along the ridges), with a soft fill from the
 * viewer's side; steep rock is darker than gentle slopes, the highest gentle slopes catch a faint
 * frost, and the floor's grid is drawn over everything on the same lattice. Farther ranges fade
 * toward the dark and cool slightly (atmospheric perspective) without lifting the black sky, and a
 * slow mist drifts at their feet.
 */

const CELL = 4 // terrain resolution, in meters
const LINE = 4 // grid line spacing: every other line falls on the floor's major lines
const FRONT = -116 // where the foothills begin (beyond every floating object and the contact ring)
const BACK = -350
const HALF_WIDTH = 360
const BASE = -0.8 // flat ground sits just under the floor, so the floor always wins the depth test
const TALLEST = 74

// Deterministic noise, so the range is the same on every visit.
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz)
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1)
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz
}
function ridged(x, z, octaves = 5) {
  let sum = 0, amp = 0.5, freq = 1, weight = 1
  for (let o = 0; o < octaves; o++) {
    let n = 1 - Math.abs(noise(x * freq, z * freq) * 2 - 1)
    n *= n * weight
    weight = Math.min(1, n * 2)
    sum += n * amp
    freq *= 2.07
    amp *= 0.5
  }
  return sum
}

/*
 * Each mountain is a crest from (x1, z1) to (x2, z2), with a peak height and a half-width. The
 * crest is highest a little off-center, and falls away steeply to either side. Laid out by hand
 * for the camera: the big summit right of center, a counterweight on the left, valleys between.
 */
const RIDGES = [
  // near: low foothills, long and close
  { x1: -175, z1: -134, x2: -70, z2: -129, h: 13, w: 22 },
  { x1: 30, z1: -131, x2: 135, z2: -138, h: 11, w: 20 },
  { x1: -30, z1: -140, x2: 12, z2: -137, h: 8, w: 15 },
  { x1: 175, z1: -142, x2: 250, z2: -135, h: 14, w: 22 },
  { x1: -300, z1: -140, x2: -215, z2: -148, h: 12, w: 22 },
  // mid: the main peaks
  { x1: 18, z1: -196, x2: 92, z2: -182, h: 62, w: 34 },
  { x1: -122, z1: -168, x2: -54, z2: -176, h: 46, w: 27 },
  { x1: 128, z1: -164, x2: 178, z2: -152, h: 27, w: 22 },
  { x1: -246, z1: -188, x2: -172, z2: -208, h: 36, w: 30 },
  { x1: 218, z1: -206, x2: 296, z2: -190, h: 38, w: 30 },
  // far: broad massifs, set well back
  { x1: -340, z1: -296, x2: -128, z2: -306, h: 58, w: 62 },
  { x1: -70, z1: -318, x2: 150, z2: -300, h: TALLEST, w: 72 },
  { x1: 176, z1: -290, x2: 340, z2: -304, h: 54, w: 60 },
]

function ridgeHeight(x, z, r) {
  const dx = r.x2 - r.x1, dz = r.z2 - r.z1
  const len2 = dx * dx + dz * dz
  const t = Math.max(0, Math.min(1, ((x - r.x1) * dx + (z - r.z1) * dz) / len2)) // position along the crest
  const cx = r.x1 + dx * t, cz = r.z1 + dz * t
  const d = Math.hypot(x - cx, z - cz) / r.w // distance from the crest, in half-widths
  // Tallest ~40% along the crest, sagging toward the ends; past the ends it rounds off.
  const along = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.25))
  return r.h * along * Math.pow(Math.max(0, 1 - d), 1.3)
}

function heightAt(x, z) {
  // Warp the coordinates gently, so crests bend and nothing looks ruled.
  const wx = x + (noise(x * 0.008, z * 0.008) - 0.5) * 36
  const wz = z + (noise(x * 0.008 + 7.3, z * 0.008 + 2.1) - 0.5) * 22
  let h = 0
  for (const r of RIDGES) h = Math.max(h, ridgeHeight(wx, wz, r))
  // Ridged detail scaled by height: crags and gullies on the big peaks, gentle texture low down,
  // plus a finer, sharper layer that breaks up the summits into jagged silhouettes.
  const crag = ridged(x * 0.021, z * 0.021)
  const jag = ridged(x * 0.055 + 11, z * 0.055 - 4, 3)
  h = h * (0.62 + 0.55 * crag) + h * 0.16 * (jag - 0.3) + 2.5 * crag * noise(x * 0.03, z * 0.03)
  h = Math.max(0, h)
  // Taper to nothing at every edge of the mesh: no cliffs where the terrain ends.
  const edge =
    THREE.MathUtils.smoothstep(-z, -FRONT, -FRONT + 14) *
    THREE.MathUtils.smoothstep(z, BACK, BACK + 40) *
    THREE.MathUtils.smoothstep(HALF_WIDTH - Math.abs(x), 0, 50)
  return BASE + h * edge
}

/** The mountains' height at a point on the ground (used to rest the clouds on the peaks). */
export const mountainHeightAt = (x, z) => heightAt(x, z)

export function createMountains({ compact = false } = {}) {
  const cols = Math.round((HALF_WIDTH * 2) / CELL), rows = Math.round((FRONT - BACK) / CELL)
  const grid = new THREE.PlaneGeometry(HALF_WIDTH * 2, FRONT - BACK, cols, rows)
  grid.rotateX(-Math.PI / 2)
  grid.translate(0, 0, (FRONT + BACK) / 2)
  const p = grid.attributes.position
  for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)))
  // One normal per face (non-indexed): crisp facets, and no shading glitches along triangle edges.
  const geo = grid.toNonIndexed()
  grid.dispose()
  geo.computeVertexNormals()
  // A per-face tone, so the rock varies without any texture to tile.
  const pos = geo.attributes.position
  const tone = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i += 3) {
    const v = noise(pos.getX(i) * 0.05, pos.getZ(i) * 0.05) * 0.7 + hash(pos.getX(i), pos.getZ(i)) * 0.3
    tone[i] = tone[i + 1] = tone[i + 2] = v
  }
  geo.setAttribute('aTone', new THREE.BufferAttribute(tone, 1))
  geo.computeBoundingSphere()

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uCamera: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uReveal: { value: 1000 },
      uFar: { value: compact ? 380 : 440 },
      uTallest: { value: TALLEST },
      uRock: { value: new THREE.Color('#2a2929') }, // steep faces: nearly black, a breath of blue
      uSlate: { value: new THREE.Color('#1f2131') }, // gentler slopes: dark slate
      uFrost: { value: new THREE.Color('#3b3b3b') }, // the highest gentle slopes
      uRim: { value: new THREE.Color('#242424') }, // backlight on the ridges: the site's violet, dimmed
      uLine: { value: new THREE.Color('#2f2f36') }, // the floor's line gray
      uMist: { value: new THREE.Color('#020202') },
      uDay: { value: 0 },
      uHaze: { value: new THREE.Color('#181818') }, // what distance fades toward: almost black
    },
    // Performance: faces are flat, so their lighting is constant across each face, and the mist
    // varies over tens of meters. All of that is computed once per vertex; only the grid lines (and
    // the opening's reveal) need work per pixel.
    vertexShader: /* glsl */ `
      attribute float aTone;
      uniform vec3 uCamera;
      uniform float uTime, uFar, uTallest;
      uniform vec3 uRock, uSlate, uFrost, uRim, uMist, uHaze;
      varying vec3 vWorld;
      varying vec3 vBase;   // everything but the grid lines
      varying float vLine;  // how much light the grid lines catch here
      varying float vFade;  // rise from the dark, depth, and distance fades, combined

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }

      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vec3 n = normalize(mat3(modelMatrix) * normal);
        if (n.y < 0.0) n = -n;
        vec3 toEye = normalize(uCamera - world.xyz);
        float d = length(world.xz - uCamera.xz);
        float h = world.y;
        float height = clamp(h / uTallest, 0.0, 1.0);
        float farness = smoothstep(140.0, 300.0, -world.z); // 0 near foothills, ~0.5 main peaks, 1 far massifs

        // Light: a cool backlight from beyond the range (rims the ridges), a soft fill from our side.
        vec3 back = normalize(vec3(-0.3, 0.55, -0.78));
        vec3 fill = normalize(vec3(0.45, 0.6, 0.66));
        float lit = max(dot(n, fill), 0.0);
        float edge = 1.0 - max(dot(n, toEye), 0.0);
        // A broad falloff, so whole ridges catch the backlight; its peak stays under the glow threshold.
        float rim = pow(edge, 2.0) * (0.25 + max(dot(n, back), 0.0)) * smoothstep(0.06, 0.45, height) * (1.25 - farness);

        // Surface: steep rock darker than gentle slopes; faint frost on the highest gentle ground.
        float steep = 1.0 - n.y;
        vec3 surface = mix(uSlate, uRock, smoothstep(0.25, 0.75, steep)) * (0.8 + 0.4 * aTone);
        float frost = smoothstep(0.62, 0.9, n.y) * smoothstep(0.4, 0.75, height);
        vec3 col = surface * (0.3 + 0.7 * lit) + uFrost * frost * lit + uRim * rim;

        // Mist drifting slowly at the feet of the ranges.
        vec2 drift = vec2(uTime * 0.6, uTime * 0.25);
        float m = noise(world.xz * 0.025 + drift * 0.025) * 0.6 + noise(world.xz * 0.06 - drift * 0.04) * 0.4;
        col += uMist * exp(-max(h, 0.0) / 9.0) * (0.35 + 0.65 * m);

        // Depth, like a painted backdrop: each range steps down in contrast and cools toward the dark,
        // wherever the camera is; distance adds to it as the camera approaches or recedes.
        float dim = mix(1.0, 0.34, farness);
        float air = max(smoothstep(140.0, uFar, d), farness * 0.55) * 0.85;
        vBase = mix(col * dim, uHaze * (0.5 + height), air);
        // Lines catch the rim light too, so they trace the ridges like light on the edges of a frame.
        vLine = (0.55 + 0.45 * lit + rim * 1.4) * smoothstep(0.0, 3.0, h) * dim * (1.0 - air);
        vFade = smoothstep(-0.8, 5.0, h) * (1.0 - smoothstep(uFar * 0.85, uFar * 1.05, d));
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCamera;
      uniform float uReveal;
      uniform vec3 uLine;
      uniform vec3 uHaze;
      uniform float uDay;
      varying vec3 vWorld;
      varying vec3 vBase;
      varying float vLine;
      varying float vFade;

      // The floor's line drawing: one crisp pixel, fading before lines crowd together.
      float gridLine(vec2 p, float spacing) {
        vec2 cell = p / spacing;
        vec2 px = max(fwidth(cell), vec2(1e-4));
        float crowd = max(px.x, px.y);
        vec2 dist = abs(fract(cell - 0.5) - 0.5) / px;
        return (1.0 - clamp(min(dist.x, dist.y), 0.0, 1.0)) * (1.0 - smoothstep(0.12, 0.45, crowd));
      }

      void main() {
        vec3 col = vBase + uLine * gridLine(vWorld.xz, ${LINE.toFixed(1)}) * vLine;
        float d = length(vWorld.xz - uCamera.xz);
        col = mix(uHaze * uDay, col, vFade * smoothstep(uReveal, uReveal - 14.0, d)); // the opening lights them last; by day they rise from the haze
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const mesh = new THREE.Mesh(geo, material)
  mesh.name = 'mountains'
  mesh.frustumCulled = false
  return {
    mesh,
    update(camera, { reveal = 1000, time = 0 } = {}) {
      material.uniforms.uCamera.value.copy(camera.position)
      material.uniforms.uReveal.value = reveal
      material.uniforms.uTime.value = time
    },
  }
}
