



export const GradeShader = {
  name: 'SpaceGrade',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: [1, 1] },
    uVignette: { value: 0.55 },
    uGrain: { value: 0.03 },
    uFringe: { value: 0.0016 },
    uFade: { value: 0 },
    uFadeColor: { value: [0.93, 0.92, 1.0] },
  },
  vertexShader:  `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader:  `
    uniform sampler2D tDiffuse;
    uniform float uTime, uVignette, uGrain, uFringe, uFade;
    uniform vec2 uResolution;
    uniform vec3 uFadeColor;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float d = length(c);
      vec2 shift = c * uFringe * d * 4.0;
      vec3 col = vec3(
        texture2D(tDiffuse, clamp(vUv + shift, 0.001, 0.999)).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, clamp(vUv - shift, 0.001, 0.999)).b
      );
      col *= mix(1.0, smoothstep(0.95, 0.2, d), uVignette);


      col = max(col - 0.01, 0.0) / (1.0 - 0.01);
      col = mix(col, uFadeColor, uFade);

      float lit = smoothstep(0.015, 0.12, dot(col, vec3(0.299, 0.587, 0.114)));
      col += (hash(vUv * uResolution + fract(uTime) * 100.0) - 0.5) * uGrain * lit;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}
