import * as THREE from 'three'











export function createGrid({ line = '#2e2e30', major = '#3c3c40' } = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uCamera: { value: new THREE.Vector3() },
      uLine: { value: new THREE.Color(line) },
      uMajor: { value: new THREE.Color(major) },
      uReveal: { value: 1000 },
      uCursor: { value: new THREE.Vector2(0, 0) },
      uCursorOn: { value: 0 },
      uDay: { value: 0 },
      uBase: { value: new THREE.Color('#a9c8e8') }, // daytime floor
      uInk: { value: new THREE.Color('#3f6290') }, // daytime lines
      uHorizon: { value: new THREE.Color('#6fb0e6') }, // what the daytime floor fades into (the sky's horizon)
    },
    vertexShader:  `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader:  `
      uniform vec3 uCamera;
      uniform vec3 uLine;
      uniform vec3 uMajor;
      uniform float uReveal;
      uniform vec2 uCursor;
      uniform float uCursorOn;
      uniform float uDay;
      uniform vec3 uBase, uInk, uHorizon;
      varying vec3 vWorld;



      float line(vec2 p, float spacing, out float crowd) {
        vec2 cell = p / spacing;
        vec2 px = max(fwidth(cell), vec2(1e-4));
        crowd = max(px.x, px.y);
        vec2 dist = abs(fract(cell - 0.5) - 0.5) / px;
        return 1.0 - clamp(min(dist.x, dist.y), 0.0, 1.0);
      }

      void main() {
        vec2 p = vWorld.xz;
        float d = length(vWorld.xz - uCamera.xz);

        float crowdMinor, crowdMajor;
        float minor = line(p, 1.0, crowdMinor);
        float major = line(p, 8.0, crowdMajor);
        minor *= 1.0 - smoothstep(0.08, 0.3, crowdMinor);
        major *= 1.0 - smoothstep(0.1, 0.4, crowdMajor);

        float near = mix(0.32, 1.0, smoothstep(1.5, 16.0, d));
        float far = 1.0 - smoothstep(26.0, 110.0, d);
        far *= far;

        vec3 nightCol = max(uLine * minor, uMajor * major) * near * far;
        // Day: dark lines on a pale floor, fading into the horizon haze rather than into black.
        float farDay = 1.0 - smoothstep(30.0, 170.0, d);
        vec3 dayCol = mix(uHorizon, mix(uBase, uInk, max(minor * 0.55, major) * near), farDay);
        vec3 col = mix(nightCol, dayCol, uDay);


        vec2 dc = p - uCursor;
        col += uMajor * max(minor, major) * exp(-dot(dc, dc) / 6.0) * uCursorOn * 0.9 * far * (1.0 - uDay);

        col = mix(uHorizon * uDay, col, smoothstep(uReveal, uReveal - 14.0, d));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(420, 420, 1, 1), material)
  mesh.rotation.x = -Math.PI / 2
  mesh.frustumCulled = false
  return {
    mesh,
    update(camera, { reveal = 1000, cursor = null, cursorOn = 0 } = {}) {
      material.uniforms.uCamera.value.copy(camera.position)
      material.uniforms.uReveal.value = reveal
      if (cursor) material.uniforms.uCursor.value.set(cursor.x, cursor.z)
      material.uniforms.uCursorOn.value = cursorOn

      mesh.position.x = Math.round(camera.position.x / 8) * 8
      mesh.position.z = Math.round(camera.position.z / 8) * 8
    },
  }
}
