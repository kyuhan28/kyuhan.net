import * as THREE from 'three'

/*
 * Wireframe grid mountains on the horizon, made to fit the floor grid.
 *
 * A low-poly heightfield (angular, faceted peaks, generated in code) sits far behind everything.
 * Its lines are drawn the same way as the floor's, from world position on the same lattice, so the
 * floor's grid appears to drape up and over the peaks. Faces are black, so the mountains read as
 * solid silhouettes; a faint facet shading shows their shape between the lines. Their lower slopes
 * fade into the dark exactly where the floor grid has faded, so they rise out of the darkness
 * rather than standing on a visible edge, and their peaks catch a little more light.
 */

const CELL = 8 // facet size, in meters: big flat faces give the angular low-poly look
const LINE = 4 // grid line spacing: every other line falls on the floor's major lines, so the grids line up
const FRONT = -118 // where the foothills begin (beyond every floating object and the contact ring)
const BACK = -270
const HALF_WIDTH = 330 // wide enough for peaks with real valleys between them

// Deterministic value noise, so the range is the same on every visit.
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
// Ridged fractal noise: sharp crests, the craggy look of the reference.
function ridged(x, z) {
  let sum = 0, amp = 0.5, freq = 1, weight = 1
  for (let o = 0; o < 5; o++) {
    let n = 1 - Math.abs(noise(x * freq, z * freq) * 2 - 1)
    n *= n * weight
    weight = Math.min(1, n * 2)
    sum += n * amp
    freq *= 2.1
    amp *= 0.5
  }
  return sum
}

// A few named peaks give the range a composition (big on the right, a middle summit, a far left
// shoulder); ridged noise makes everything between them craggy.
const PEAKS = [
  { x: 62, z: -188, h: 50, r: 30 }, // the big summit, right of center
  { x: -74, z: -166, h: 36, r: 24 }, // left
  { x: -6, z: -146, h: 19, r: 14 }, // a small one near the middle, in front
  { x: 150, z: -150, h: 22, r: 18 }, // nearer, right
  { x: -175, z: -215, h: 44, r: 34 }, // far left, set back
  { x: 190, z: -230, h: 40, r: 32 }, // far right, set back
  { x: -270, z: -180, h: 30, r: 26 }, // the edges, for when the camera travels in
  { x: 280, z: -198, h: 32, r: 28 },
]

function heightAt(x, z) {
  const foothills = THREE.MathUtils.smoothstep(-z, -FRONT, -FRONT + 26) // flat where the range begins, full height 26m behind
  // Cone-like peaks (pointed summits, straight steep slopes), not rounded bells.
  let peaks = 0
  for (const p of PEAKS) {
    const d = Math.hypot(x - p.x, z - p.z) / (p.r * 1.25)
    peaks = Math.max(peaks, p.h * Math.pow(Math.max(0, 1 - d), 1.35))
  }
  const range = 2 + 6 * noise(x * 0.012 + 3.1, z * 0.012) // low ground between the peaks: real valleys
  const crag = ridged(x * 0.022, z * 0.022)
  return foothills * (peaks * (0.7 + 0.45 * crag) + range * crag)
}

export function createMountains({ compact = false } = {}) {
  const cols = Math.round((HALF_WIDTH * 2) / CELL), rows = Math.round((FRONT - BACK) / CELL)
  const geo = new THREE.PlaneGeometry(HALF_WIDTH * 2, FRONT - BACK, cols, rows)
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0, (FRONT + BACK) / 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)))
  geo.computeBoundingSphere()

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uCamera: { value: new THREE.Vector3() },
      uReveal: { value: 1000 },
      uLine: { value: new THREE.Color('#3c3c40') }, // the floor's own line gray
      uPeak: { value: new THREE.Color('#4a4a52') }, // the peaks a shade lighter
      uFar: { value: compact ? 300 : 360 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCamera;
      uniform float uReveal;
      uniform vec3 uLine;
      uniform vec3 uPeak;
      uniform float uFar;
      varying vec3 vWorld;

      // Same line drawing as the floor: one crisp pixel, fading before lines crowd together.
      float gridLine(vec2 p, float spacing) {
        vec2 cell = p / spacing;
        vec2 px = max(fwidth(cell), vec2(1e-4));
        float crowd = max(px.x, px.y);
        vec2 dist = abs(fract(cell - 0.5) - 0.5) / px;
        float l = 1.0 - clamp(min(dist.x, dist.y), 0.0, 1.0);
        return l * (1.0 - smoothstep(0.12, 0.45, crowd));
      }

      void main() {
        float d = length(vWorld.xz - uCamera.xz);
        float h = vWorld.y;
        float line = gridLine(vWorld.xz, ${LINE.toFixed(1)});

        float rise = smoothstep(0.5, 7.0, h);                  // out of the dark, where the floor has faded
        float far = 1.0 - smoothstep(uFar * 0.6, uFar, d);      // and into it again at the very back
        vec3 lineColor = mix(uLine, uPeak, smoothstep(12.0, 44.0, h));

        // Faceted shading from the surface itself, so the low-poly shapes read between the lines.
        vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        if (n.y < 0.0) n = -n;
        float facet = max(dot(n, normalize(vec3(-0.45, 0.75, 0.5))), 0.0);

        vec3 col = lineColor * line + vec3(0.004, 0.004, 0.005) * (0.2 + facet); // faces nearly black, like the floor: a hint of shape
        col *= rise * far;
        col *= smoothstep(uReveal, uReveal - 14.0, d); // the opening lights them last
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const mesh = new THREE.Mesh(geo, material)
  mesh.name = 'mountains'
  mesh.frustumCulled = false
  return {
    mesh,
    update(camera, { reveal = 1000 } = {}) {
      material.uniforms.uCamera.value.copy(camera.position)
      material.uniforms.uReveal.value = reveal
    },
  }
}
