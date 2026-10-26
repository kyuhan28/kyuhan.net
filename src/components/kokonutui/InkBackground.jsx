/**
 * @author: @dorianbaffier
 * @description: Ink Background
 * @version: 1.0.0
 * @date: 2026-10-21
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * Ported for this project from the Kokonut UI registry (https://kokonutui.com/r/ink-background.json): the
 * same stable-fluids solver, headline mask, bloom, stirring, gathering and sleep, in JavaScript, with its
 * Tailwind classes as plain CSS (ink-background.css).
 *
 * One adaptation: it's sized from its layout size (clientWidth / clientHeight), not getBoundingClientRect(),
 * which reports the *transformed* size: this site shows the desktop on a 3D monitor through a CSS transform.
 * (Pointer positions still use the on-screen rectangle: the desktop is only interactive once it's the page.)
 *
 * Props: text (the headline, written in ink; it bleeds when stirred and gathers again), accent (the color of
 * the ink a click drops; the headline's by default), children (content over the ink, under the headline),
 * headlineColor (optional headline ink color), rainbow (clicked/dragged pigment travels in color),
 * interactive (false: a still backdrop), className.
 */
import { useEffect, useRef, useState } from 'react'
import './ink-background.css'

const cn = (...c) => c.filter(Boolean).join(' ')

// The velocity field is solved on a grid this many cells on its short side; the ink is drawn on a finer one.
const SIM = 128
const DYE = 512
const PRESSURE_ITERATIONS = 20
// How fast stirred ink fades away, and how fast velocity calms down.
const DYE_FADE = 0.35
const VELOCITY_FADE = 1.2
// Swirl kept in the flow, so stirring curls instead of smearing.
const CURL = 22
// The headline pulls its ink back at this rate per frame once left alone, after this long.
const GATHER = 0.06
const GATHER_AFTER = 1200
// The loop stops after this long with nothing moving it.
const SLEEP_AFTER = 5000
const STIR_FORCE = 5200
const STIR_RADIUS = 0.0018
const DROP_RADIUS = 0.0035

const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texel;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texel.x, 0.0);
  vR = vUv + vec2(texel.x, 0.0);
  vT = vUv + vec2(0.0, texel.y);
  vB = vUv - vec2(0.0, texel.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 o;
`

function rainbowColor(hue) {
  return [0, 2 / 3, 1 / 3].map((offset) => {
    const h = ((hue + offset) % 1 + 1) % 1
    const channel = Math.max(0, Math.min(1, Math.abs(h * 6 - 3) - 1))
    return (0.18 + 0.82 * channel) * 0.95
  })
}

const SHADERS = {
  splat: `${HEAD}
uniform sampler2D uTarget;
uniform float aspect;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspect;
  vec3 s = exp(-dot(p, p) / radius) * color;
  o = vec4(texture(uTarget, vUv).xyz + s, 1.0);
}`,
  advect: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 simTexel;
uniform float dt;
uniform float fade;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * simTexel;
  o = texture(uSource, coord) / (1.0 + fade * dt);
}`,
  divergence: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vL).x;
  float r = texture(uVelocity, vR).x;
  float t = texture(uVelocity, vT).y;
  float b = texture(uVelocity, vB).y;
  vec2 c = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { l = -c.x; }
  if (vR.x > 1.0) { r = -c.x; }
  if (vT.y > 1.0) { t = -c.y; }
  if (vB.y < 0.0) { b = -c.y; }
  o = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`,
  curl: `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float l = texture(uVelocity, vL).y;
  float r = texture(uVelocity, vR).y;
  float t = texture(uVelocity, vT).x;
  float b = texture(uVelocity, vB).x;
  o = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`,
  vorticity: `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main() {
  float l = texture(uCurl, vL).x;
  float r = texture(uCurl, vR).x;
  float t = texture(uCurl, vT).x;
  float b = texture(uCurl, vB).x;
  float c = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  force /= length(force) + 0.0001;
  force *= curl * c;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * dt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`,
  pressure: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float l = texture(uPressure, vL).x;
  float r = texture(uPressure, vR).x;
  float t = texture(uPressure, vT).x;
  float b = texture(uPressure, vB).x;
  float d = texture(uDivergence, vUv).x;
  o = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float l = texture(uPressure, vL).x;
  float r = texture(uPressure, vR).x;
  float t = texture(uPressure, vT).x;
  float b = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(r - l, t - b);
  o = vec4(v, 0.0, 1.0);
}`,
  scale: `${HEAD}
uniform sampler2D uTarget;
uniform float value;
void main() {
  o = value * texture(uTarget, vUv);
}`,
  // Pulls the headline's ink (red channel) back toward the letters. Dropped ink (green) is left to drift and fade.
  gather: `${HEAD}
uniform sampler2D uDye;
uniform sampler2D uMask;
uniform float rate;
void main() {
  vec4 d = texture(uDye, vUv);
  float m = texture(uMask, vUv).r;
  o = vec4(mix(d.r, m, rate), d.g, 0.0, 1.0);
}`,
  // Restore the headline's own color; leave dropped rainbow pigment to drift.
  gatherPigment: `${HEAD}
uniform sampler2D uDye;
uniform sampler2D uPigment;
uniform sampler2D uMask;
uniform vec3 ink;
uniform float rate;
void main() {
  vec2 density = texture(uDye, vUv).rg;
  vec3 pigment = texture(uPigment, vUv).rgb;
  float keep = 1.0 - rate * density.r / max(density.r + density.g, 0.0001);
  float mask = texture(uMask, vUv).r;
  o = vec4(pigment * keep + ink * mask * rate, 1.0);
}`,
  display: `${HEAD}
uniform sampler2D uDye;
uniform sampler2D uPigment;
uniform bool rainbow;
uniform vec3 paper;
uniform vec3 ink;
uniform vec3 accent;
void main() {
  vec4 d = texture(uDye, vUv);
  if (rainbow) {
    // Pigment is density-weighted RGB. Advection carries both the color and its concentration.
    float density = d.r + d.g;
    vec3 pigment = texture(uPigment, vUv).rgb / max(density, 0.0001);
    float coverage = smoothstep(0.02, 0.85, density);
    o = vec4(mix(paper, clamp(pigment, 0.0, 1.0), coverage), 1.0);
    return;
  }
  // A soft knee, so thin washes stay pale and dense ink goes solid.
  float a = smoothstep(0.02, 0.85, d.r);
  float b = smoothstep(0.02, 0.85, d.g);
  vec3 c = mix(paper, ink, a);
  c = mix(c, accent, b * 0.92);
  o = vec4(c, 1.0);
}`,
}

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null }
  return shader
}

function link(gl, vertex, source) {
  const fragment = compile(gl, gl.FRAGMENT_SHADER, source)
  const program = gl.createProgram()
  if (!(fragment && program)) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.bindAttribLocation(program, 0, 'aPos')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  const uniforms = {}
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name)
  }
  return { program, uniforms }
}

/** Parses any CSS color, oklch included, by painting it into one pixel. */
function toRgb(color, probe) {
  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = color
  probe.fillRect(0, 0, 1, 1)
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

/**
 * A small stable-fluids solver (semi-Lagrangian advection, vorticity confinement, Jacobi pressure), in the
 * spirit of Jos Stam's paper and Pavel Dobryakov's WebGL port. Returns null where half-float render targets
 * aren't available.
 */
function createFluid(gl, rainbow = false) {
  if (!gl.getExtension('EXT_color_buffer_float')) return null
  gl.getExtension('OES_texture_float_linear')
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  if (!vertex) return null
  const programs = {}
  for (const name of Object.keys(SHADERS)) {
    const made = link(gl, vertex, SHADERS[name])
    if (!made) return null
    programs[name] = made
  }

  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const textures = []
  const framebuffers = []

  const target = (w, h, internal, format) => {
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null)
    const fbo = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.viewport(0, 0, w, h)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    textures.push(tex)
    framebuffers.push(fbo)
    return { tex, fbo, w, h }
  }

  const double = (w, h, internal, format) => {
    const pair = {
      read: target(w, h, internal, format),
      write: target(w, h, internal, format),
      swap: () => { const t = pair.read; pair.read = pair.write; pair.write = t },
    }
    return pair
  }

  let velocity, dye, pigment, pressure, divergence, curl
  let aspect = 1
  const mask = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, mask)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array([0]))

  const free = () => {
    for (const t of textures) gl.deleteTexture(t)
    for (const f of framebuffers) gl.deleteFramebuffer(f)
    textures.length = 0
    framebuffers.length = 0
  }

  const sizeFor = (short) => (aspect >= 1 ? [Math.round(short * aspect), short] : [short, Math.round(short / aspect)])

  // Binds a program, its textures and its output, and draws the quad.
  let unit = 0
  const run = (name, texel) => {
    const p = programs[name]
    gl.useProgram(p.program)
    gl.uniform2f(p.uniforms.texel, texel[0], texel[1])
    unit = 0
    return p
  }
  const bind = (p, uniform, tex) => {
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.uniform1i(p.uniforms[uniform], unit)
    unit++
  }
  const blit = (out, w, h) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fbo : null)
    gl.viewport(0, 0, out ? out.w : (w ?? 1), out ? out.h : (h ?? 1))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  let paper = [1, 1, 1]
  let inkColor = [0, 0, 0]
  let accentColor = [0, 0, 0]
  let canvasW = 1
  let canvasH = 1

  return {
    resize(w, h) {
      canvasW = w
      canvasH = h
      aspect = w / h
      free()
      const [sw, sh] = sizeFor(SIM)
      const [dw, dh] = sizeFor(DYE)
      velocity = double(sw, sh, gl.RG16F, gl.RG)
      pressure = double(sw, sh, gl.R16F, gl.RED)
      divergence = target(sw, sh, gl.R16F, gl.RED)
      curl = target(sw, sh, gl.R16F, gl.RED)
      dye = double(dw, dh, gl.RGBA16F, gl.RGBA)
      if (rainbow) pigment = double(dw, dh, gl.RGBA16F, gl.RGBA)
    },
    setMask(source) {
      gl.bindTexture(gl.TEXTURE_2D, mask)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, source)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    },
    setColors(p, i, a) {
      paper = p
      inkColor = i
      accentColor = a
    },
    splat(x, y, vx, vy, ink, radius) {
      const r = radius * (aspect > 1 ? aspect : 1)
      let p = run('splat', [1 / velocity.read.w, 1 / velocity.read.h])
      bind(p, 'uTarget', velocity.read.tex)
      gl.uniform1f(p.uniforms.aspect, aspect)
      gl.uniform2f(p.uniforms.point, x, y)
      gl.uniform3f(p.uniforms.color, vx, vy, 0)
      gl.uniform1f(p.uniforms.radius, r)
      blit(velocity.write)
      velocity.swap()
      if (ink[0] || ink[1]) {
        p = run('splat', [1 / dye.read.w, 1 / dye.read.h])
        bind(p, 'uTarget', dye.read.tex)
        gl.uniform1f(p.uniforms.aspect, aspect)
        gl.uniform2f(p.uniforms.point, x, y)
        gl.uniform3f(p.uniforms.color, ink[0], ink[1], 0)
        gl.uniform1f(p.uniforms.radius, r)
        blit(dye.write)
        dye.swap()
        if (rainbow) {
          // The headline blooms in its own color; clicks and drags introduce rainbow hues.
          const rgb = ink[0] ? inkColor : rainbowColor(x * 0.8 + performance.now() / 16000)
          const amount = ink[0] + ink[1]
          p = run('splat', [1 / pigment.read.w, 1 / pigment.read.h])
          bind(p, 'uTarget', pigment.read.tex)
          gl.uniform1f(p.uniforms.aspect, aspect)
          gl.uniform2f(p.uniforms.point, x, y)
          gl.uniform3f(p.uniforms.color, rgb[0] * amount, rgb[1] * amount, rgb[2] * amount)
          gl.uniform1f(p.uniforms.radius, r)
          blit(pigment.write)
          pigment.swap()
        }
      }
    },
    step(dt, gather) {
      const sim = [1 / velocity.read.w, 1 / velocity.read.h]
      let p = run('curl', sim)
      bind(p, 'uVelocity', velocity.read.tex)
      blit(curl)

      p = run('vorticity', sim)
      bind(p, 'uVelocity', velocity.read.tex)
      bind(p, 'uCurl', curl.tex)
      gl.uniform1f(p.uniforms.curl, CURL)
      gl.uniform1f(p.uniforms.dt, dt)
      blit(velocity.write)
      velocity.swap()

      p = run('divergence', sim)
      bind(p, 'uVelocity', velocity.read.tex)
      blit(divergence)

      p = run('scale', sim)
      bind(p, 'uTarget', pressure.read.tex)
      gl.uniform1f(p.uniforms.value, 0.8)
      blit(pressure.write)
      pressure.swap()

      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        p = run('pressure', sim)
        bind(p, 'uPressure', pressure.read.tex)
        bind(p, 'uDivergence', divergence.tex)
        blit(pressure.write)
        pressure.swap()
      }

      p = run('gradient', sim)
      bind(p, 'uPressure', pressure.read.tex)
      bind(p, 'uVelocity', velocity.read.tex)
      blit(velocity.write)
      velocity.swap()

      p = run('advect', sim)
      bind(p, 'uVelocity', velocity.read.tex)
      bind(p, 'uSource', velocity.read.tex)
      gl.uniform2f(p.uniforms.simTexel, sim[0], sim[1])
      gl.uniform1f(p.uniforms.dt, dt)
      gl.uniform1f(p.uniforms.fade, VELOCITY_FADE)
      blit(velocity.write)
      velocity.swap()

      p = run('advect', [1 / dye.read.w, 1 / dye.read.h])
      bind(p, 'uVelocity', velocity.read.tex)
      bind(p, 'uSource', dye.read.tex)
      gl.uniform2f(p.uniforms.simTexel, sim[0], sim[1])
      gl.uniform1f(p.uniforms.dt, dt)
      gl.uniform1f(p.uniforms.fade, DYE_FADE)
      blit(dye.write)
      dye.swap()

      if (rainbow) {
        p = run('advect', [1 / pigment.read.w, 1 / pigment.read.h])
        bind(p, 'uVelocity', velocity.read.tex)
        bind(p, 'uSource', pigment.read.tex)
        gl.uniform2f(p.uniforms.simTexel, sim[0], sim[1])
        gl.uniform1f(p.uniforms.dt, dt)
        gl.uniform1f(p.uniforms.fade, DYE_FADE)
        blit(pigment.write)
        pigment.swap()
      }

      if (gather > 0) {
        // Calm the water as the letters gather, so they settle crisp.
        p = run('scale', sim)
        bind(p, 'uTarget', velocity.read.tex)
        gl.uniform1f(p.uniforms.value, 1 - gather)
        blit(velocity.write)
        velocity.swap()

        if (rainbow) {
          p = run('gatherPigment', [1 / pigment.read.w, 1 / pigment.read.h])
          bind(p, 'uDye', dye.read.tex)
          bind(p, 'uPigment', pigment.read.tex)
          bind(p, 'uMask', mask)
          gl.uniform3fv(p.uniforms.ink, inkColor)
          gl.uniform1f(p.uniforms.rate, gather)
          blit(pigment.write)
          pigment.swap()
        }

        p = run('gather', [1 / dye.read.w, 1 / dye.read.h])
        bind(p, 'uDye', dye.read.tex)
        bind(p, 'uMask', mask)
        gl.uniform1f(p.uniforms.rate, gather)
        blit(dye.write)
        dye.swap()
      }
    },
    draw() {
      const p = run('display', [1 / dye.read.w, 1 / dye.read.h])
      bind(p, 'uDye', dye.read.tex)
      bind(p, 'uPigment', rainbow ? pigment.read.tex : dye.read.tex)
      gl.uniform1i(p.uniforms.rainbow, rainbow ? 1 : 0)
      gl.uniform3fv(p.uniforms.paper, paper)
      gl.uniform3fv(p.uniforms.ink, inkColor)
      gl.uniform3fv(p.uniforms.accent, accentColor)
      blit(null, canvasW, canvasH)
    },
    destroy() {
      free()
      gl.deleteTexture(mask)
      gl.deleteBuffer(quad)
      for (const p of Object.values(programs)) gl.deleteProgram(p.program)
      gl.deleteShader(vertex)
    },
  }
}

/** Where the headline sits: centre line as a share of the height, and size. */
function headline(width, height) {
  const size = Math.max(44, Math.min(width * 0.13, height * 0.24, 140))
  return { size, center: height * 0.4 }
}

/** Writes the headline into a canvas as soft white letters on black. */
function drawMask(canvas, text, width, height, font) {
  const scale = DYE / Math.min(width, height)
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { size, center } = headline(width, height)
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, width, height)
  ctx.font = `650 ${size}px ${font}`
  ctx.letterSpacing = `${-size * 0.045}px`
  // Fit longer headlines by reducing font size, keeping the letters' natural proportions.
  const measuredWidth = ctx.measureText(text).width
  if (measuredWidth > width - 32) {
    const fittedSize = size * (width - 32) / measuredWidth
    ctx.font = `650 ${fittedSize}px ${font}`
    ctx.letterSpacing = `${-fittedSize * 0.045}px`
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // A little blur gives the letters a wet, feathered edge to bleed from.
  ctx.filter = `blur(${Math.max(1, size * 0.012)}px)`
  ctx.fillStyle = 'white'
  ctx.fillText(text, width / 2, center, width - 32)
}

export default function InkBackground({ text = 'Write freely.', accent, headlineColor, rainbow = false, children, interactive = true, className }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const paperRef = useRef(null)
  const inkRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const [contentTop, setContentTop] = useState(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl2', { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: false })
    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    if (!(root && canvas && probe)) return
    const fluid = gl ? createFluid(gl, rainbow) : null
    if (!fluid) { setFailed(true); return }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const maskCanvas = document.createElement('canvas')

    let width = 0
    let height = 0
    let raf = 0
    let last = 0
    let visible = true
    let colorKey = ''
    // Time of the last stir, and of the last thing that moved the fluid.
    let touched = -Number.POSITIVE_INFINITY
    let active = performance.now()
    const born = performance.now()
    const hand = { x: 0, y: 0, on: false, down: false, moved: 0 }

    const readColors = () => {
      const paper = getComputedStyle(paperRef.current).color
      const ink = headlineColor || getComputedStyle(inkRef.current).color
      const key = `${paper}|${ink}|${accent}`
      if (key === colorKey) return false
      colorKey = key
      const inkRgb = toRgb(ink, probe)
      fluid.setColors(toRgb(paper, probe), inkRgb, accent ? toRgb(accent, probe) : inkRgb)
      return true
    }

    const build = () => {
      // Layout size, not getBoundingClientRect(): that one includes CSS transforms (see the note above).
      width = root.clientWidth
      height = root.clientHeight
      if (width < 2 || height < 2) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      fluid.resize(canvas.width, canvas.height)
      drawMask(maskCanvas, text, width, height, getComputedStyle(root).fontFamily)
      fluid.setMask(maskCanvas)
      const { size, center } = headline(width, height)
      setContentTop(center + size * 0.62)
      // Reduced motion: the letters, already gathered, and no flow.
      fluid.step(1 / 60, reduceMotion ? 1 : 0)
      fluid.draw()
    }

    // Ink drops land around the letters and the headline pulls them in.
    const bloom = () => {
      const { size, center } = headline(width, height)
      const y = 1 - center / height
      for (let i = 0; i < 9; i++) {
        const x = 0.2 + (0.6 * (i + Math.random() * 0.6)) / 9
        const dy = ((Math.random() - 0.5) * size * 0.6) / height
        fluid.splat(x, y + dy, (Math.random() - 0.5) * 320, (Math.random() - 0.5) * 320, [0.45, 0], DROP_RADIUS * (0.6 + Math.random()))
      }
    }

    const frame = (now) => {
      raf = 0
      if (!visible) return
      const dt = Math.min((now - (last || now - 16)) / 1000, 1 / 30)
      last = now
      if (hand.down || hand.moved > now - 100) active = now
      // Hold off while someone is stirring, then ease the letters back.
      const idle = now - touched
      let gather = 0
      if (idle > GATHER_AFTER) gather = GATHER * Math.min(1, (idle - GATHER_AFTER) / 1500)
      // The first second and a half is the bloom: the letters fill in fast.
      const age = now - born
      if (age < 1500) gather = Math.max(gather, 0.012 + (age / 1500) * GATHER)
      fluid.step(dt, gather)
      fluid.draw()
      if (now - active < SLEEP_AFTER || age < 4000) raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (!raf && visible && !reduceMotion) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    readColors()
    build()
    canvas.style.opacity = '1'
    if (!reduceMotion) {
      bloom()
      start()
    }

    const resizeObserver = new ResizeObserver(() => {
      if (Math.abs(root.clientWidth - width) > 1 || Math.abs(root.clientHeight - height) > 1) {
        build()
        active = performance.now()
        touched = -Number.POSITIVE_INFINITY
        start()
      }
    })
    resizeObserver.observe(root)

    // A tab coming back must not wake a background that's scrolled away.
    let onScreen = true
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      visible = onScreen && document.visibilityState === 'visible'
      start()
    })
    intersection.observe(root)
    const onVisibility = () => {
      visible = onScreen && document.visibilityState === 'visible'
      start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Follow light and dark mode without asking the app for a theme. Only checked while the background is on screen.
    const colorTimer = window.setInterval(() => {
      if (!visible) return
      if (readColors() && !raf) fluid.draw()
    }, 500)

    const local = (event) => {
      const rect = root.getBoundingClientRect()
      return { x: (event.clientX - rect.left) / rect.width, y: 1 - (event.clientY - rect.top) / rect.height }
    }

    const onMove = (event) => {
      const p = local(event)
      if (hand.on) {
        const dx = p.x - hand.x
        const dy = p.y - hand.y
        if (dx || dy) {
          // Hovering stirs the water; dragging also lays down ink.
          fluid.splat(p.x, p.y, dx * STIR_FORCE, dy * STIR_FORCE, hand.down ? [0, 0.08] : [0, 0], STIR_RADIUS)
          touched = performance.now()
          hand.moved = touched
        }
      }
      hand.x = p.x
      hand.y = p.y
      hand.on = true
      start()
    }
    const onLeave = () => { hand.on = false; hand.down = false }
    const onDown = (event) => {
      if (event.target.closest('a, button, input, textarea')) return
      const p = local(event)
      hand.down = true
      hand.on = true
      hand.x = p.x
      hand.y = p.y
      // A drop: a dab of ink pushed out in a ring.
      fluid.splat(p.x, p.y, 0, 0, [0, 0.65], DROP_RADIUS)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const r = 0.012
        fluid.splat(p.x + Math.cos(a) * r * (height / width), p.y + Math.sin(a) * r, Math.cos(a) * 420, Math.sin(a) * 420, [0, 0], STIR_RADIUS * 0.6)
      }
      touched = performance.now()
      active = touched
      start()
    }
    const onUp = () => { hand.down = false }
    if (interactive && !reduceMotion) {
      root.addEventListener('pointermove', onMove)
      root.addEventListener('pointerleave', onLeave)
      root.addEventListener('pointerdown', onDown)
      root.addEventListener('pointerup', onUp)
      root.addEventListener('pointercancel', onUp)
    }

    return () => {
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(colorTimer)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      root.removeEventListener('pointerdown', onDown)
      root.removeEventListener('pointerup', onUp)
      root.removeEventListener('pointercancel', onUp)
      fluid.destroy()
    }
  }, [text, accent, headlineColor, rainbow, interactive])

  return (
    <div className={cn('kib', rainbow && 'kib--rainbow', className)} ref={rootRef}>
      {/* Theme colors for the shader: the paper and the ink. */}
      <span className="kib__paper" ref={paperRef} />
      <span className="kib__ink" ref={inkRef} />
      <div aria-hidden="true" className="kib__layer">
        <canvas className="kib__canvas" ref={canvasRef} />
      </div>
      <h2 className={failed ? 'kib__fallback' : 'sr-only'} style={{ color: headlineColor }}>{text}</h2>
      <div className="kib__content" style={{ top: contentTop ?? '62%' }}>
        {children === undefined ? <DefaultContent /> : children}
      </div>
    </div>
  )
}

function DefaultContent() {
  return (
    <div className="kib__default">
      <p className="kib__default-text">A quiet page for first drafts. Nothing to set up, nothing to sync. Stir the ink and it settles back.</p>
      <div className="kib__default-actions">
        <a className="kib__default-primary" href="#start">Start writing</a>
        <a className="kib__default-secondary" href="#tour">See how it works</a>
      </div>
    </div>
  )
}
