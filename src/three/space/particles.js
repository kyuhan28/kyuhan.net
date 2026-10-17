import * as THREE from 'three'

/*
 * Stardust: soft, round, twinkling motes drifting slowly through the air around the viewer. They
 * wrap around the camera as it travels, so the field is endless. Positions and twinkle are on the
 * GPU; the CPU only moves the field's center.
 */
export function createDust({ count, colors, brightness = 1 }) {
  const span = new THREE.Vector3(70, 24, 120)
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count)
  const col = new Float32Array(count * 3)
  const palette = colors.map((c) => new THREE.Color(c))
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * span.x
    pos[i * 3 + 1] = Math.random() * span.y
    pos[i * 3 + 2] = (Math.random() - 0.5) * span.z
    seed[i] = Math.random()
    const c = palette[Math.floor(Math.random() * palette.length)].clone().lerp(new THREE.Color('#ffffff'), 0.45)
    col.set([c.r, c.g, c.b], i * 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geometry.setAttribute('seed', new THREE.BufferAttribute(seed, 1))
  geometry.setAttribute('color', new THREE.BufferAttribute(col, 3))
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uCenter: { value: new THREE.Vector3() },
      uSpan: { value: span },
      uPixelRatio: { value: 1 },
      uBrightness: { value: brightness },
    },
    vertexShader: /* glsl */ `
      attribute float seed;
      attribute vec3 color;
      uniform float uTime, uPixelRatio;
      uniform vec3 uCenter, uSpan;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y += uTime * (0.08 + seed * 0.12);           // rising slowly
        p.x += sin(uTime * 0.2 + seed * 30.0) * 0.6;   // and wandering
        // wrap the field around the viewer, so it never runs out
        vec3 rel = p - uCenter;
        rel.xz = mod(rel.xz + uSpan.xz * 0.5, uSpan.xz) - uSpan.xz * 0.5;
        rel.y = mod(p.y, uSpan.y);
        vec3 world = vec3(uCenter.x + rel.x, rel.y, uCenter.z + rel.z);
        vec4 mv = viewMatrix * vec4(world, 1.0);
        gl_Position = projectionMatrix * mv;
        float twinkle = 0.55 + 0.45 * sin(uTime * (1.0 + seed * 2.0) + seed * 50.0);
        // Small, and capped: a mote drifting near the lens must never become a big blooming disc.
        gl_PointSize = min((2.0 + seed * 3.5) * uPixelRatio * (16.0 / -mv.z), 7.0 * uPixelRatio);
        vColor = color;
        vAlpha = twinkle * smoothstep(80.0, 20.0, -mv.z) * smoothstep(3.0, 8.0, -mv.z); // gone well before the lens
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uBrightness;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        float soft = smoothstep(0.5, 0.0, r);
        gl_FragColor = vec4(vColor * soft * vAlpha * 1.6 * uBrightness, 1.0);
      }
    `,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return {
    points,
    update(time, camera, pixelRatio) {
      material.uniforms.uTime.value = time
      material.uniforms.uCenter.value.copy(camera.position)
      material.uniforms.uPixelRatio.value = pixelRatio
    },
  }
}
