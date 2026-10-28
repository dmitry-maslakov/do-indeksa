import { secondMs } from "@/lib/dates";

type Viewport = { width: number; height: number };

type Box = [x: number, y: number, halfWidth: number, halfHeight: number];

type Instance = {
  x: number;
  y: number;
  z: number;
  glyph: number;
  phase: number;
  speed: number;
  size: number;
  stagger: number;
  target?: { x: number; y: number; size: number; glyph: number };
};

type Events = { onReady: () => void; onFallback: () => void };

const glyphs = [
  "∫",
  "∑",
  "π",
  "√",
  "∞",
  "∂",
  "Δ",
  "θ",
  "λ",
  "≤",
  "≠",
  "±",
  "∇",
  "φ",
  "∈",
  "≈",
  "α",
  "β",
  "∮",
  "∀",
  "x²",
  "sin",
  "lim",
  "log",
] as const;

export const formulas = [
  "𝑒 ^𝑖 ^𝜋 + 1 = 0",
  "sin ^2 𝑥 + cos ^2 𝑥 = 1",
  "( 𝑎 + 𝑏 ) ^2 = 𝑎 ^2 + 2 𝑎 𝑏 + 𝑏 ^2",
  "sin 2 𝑥 = 2 sin 𝑥 cos 𝑥",
] as const;

const tokens: string[] = [
  ...new Set([
    ...glyphs,
    ...formulas.flatMap((f) => f.replaceAll("^", "").split(" ")),
  ]),
];

const columns = 8;
const rows = 6;
const blurs = [0, 1.6, 4.5, 9];
const cell = 96;
const font = 54;
const widest = 66;
const middle = 0.54;
const margin = 160;
const period = 12;
const delay = 1.5;
const hold = 0.4;
const epoch = 40;

export const hash = (i: number) => {
  const v = Math.sin(i * 91.7 + 3.1) * 43758.5;
  return v - Math.floor(v);
};

const mod = (v: number, m: number) => v - m * Math.floor(v / m);

const nth = <T>(list: readonly [T, ...T[]], i: number) =>
  list[mod(i, list.length)] ?? list[0];

const planes = [
  { z: 0.06, spread: 0.1, size: 19, range: 6, speed: 6 },
  { z: 0.45, spread: 0.16, size: 28, range: 9, speed: 8 },
  { z: 0.86, spread: 0.2, size: 84, range: 56, speed: 5 },
] as const;

export const envelope = (f: number) =>
  f < 2.4 ? Math.max(f, 0) / 2.4 : f < 5 ? 1 : f < 7.4 ? 1 - (f - 5) / 2.4 : 0;

const curl = (x: number, y: number, t: number) => {
  const a = 1.3 * x + t;
  const b = 1.1 * y - 0.7 * t;
  const c = 0.7 * x + 2.3 * y + 0.6 * t;
  return [
    -1.1 * Math.sin(a) * Math.sin(b) + 1.15 * Math.cos(c),
    -1.3 * Math.cos(a) * Math.cos(b) - 0.35 * Math.cos(c),
  ] as const;
};

const span = ({ width, height }: Viewport) =>
  [width + 2 * margin, height + 2 * margin] as const;

const lift = (instance: Instance, t: number, viewport: Viewport) => {
  const [, height] = span(viewport);
  return mod(instance.y * height - t * instance.speed, height);
};

export function position(instance: Instance, t: number, viewport: Viewport) {
  const [width] = span(viewport);
  const x = mod(
    instance.x * width + Math.sin(t * 0.02 + instance.phase) * 30,
    width,
  );
  const y = lift(instance, t, viewport);
  const [cx, cy] = curl(x / 460, y / 460, t * 0.035 + instance.phase);
  const amount = 18 + 16 * instance.z;
  return [x + cx * amount - margin, y + cy * amount - margin] as const;
}

export function createInstances({ width, height }: Viewport) {
  const count = Math.round(
    Math.min(160, Math.max(70, (width * height) / 8000)),
  );
  const scale = width < 640 ? 0.8 : 1;
  return Array.from({ length: count }, (_, i): Instance => {
    const h = (k: number) => hash(i * 9 + k);
    const plane = planes[h(0) < 0.5 ? 0 : h(0) < 0.88 ? 1 : 2];
    return {
      x: h(1),
      y: h(2),
      z: plane.z + (h(3) - 0.5) * plane.spread,
      glyph: Math.floor(h(4) ** 1.5 * glyphs.length),
      phase: h(5) * 6.28,
      speed: plane.speed * (0.7 + 0.6 * h(6)),
      size: (plane.size + plane.range * h(7)) * scale,
      stagger: h(8),
    };
  }).sort((a, b) => a.z - b.z);
}

export function slot(cycle: number, { width }: Viewport) {
  const slots: [[number, number], ...[number, number][]] =
    width <= 640
      ? [
          [0.5, 0.19],
          [0.5, 0.81],
        ]
      : [
          [0.22, 0.24],
          [0.78, 0.76],
          [0.77, 0.23],
          [0.23, 0.77],
        ];
  return nth(slots, cycle);
}

export function layoutFormula(
  formula: string,
  [sx, sy]: [number, number],
  viewport: Viewport,
  measure: (token: string) => number,
) {
  const size = viewport.width <= 640 ? 19 : 26;
  let width = 0;
  const placed = formula.split(" ").map((raw) => {
    const raised = raw.startsWith("^");
    const token = raised ? raw.slice(1) : raw;
    const scaled = size * (raised ? 0.62 : 1);
    const advance = measure(token) * scaled;
    const gap = "+=±".includes(token) ? size * 0.28 : 0;
    width += gap;
    const x = width + advance / 2;
    width += advance + gap + size * 0.05;
    return { token, x, y: raised ? -0.42 * size : 0, size: scaled };
  });
  const cx = sx * viewport.width;
  const cy = sy * viewport.height;
  const quad = cell / font;
  return {
    tokens: placed.map((p) => ({
      glyph: tokens.indexOf(p.token),
      x: cx - width / 2 + p.x,
      y: cy + p.y + (middle - 0.5) * p.size * quad,
      size: p.size * quad,
    })),
    box: [cx, cy, width / 2 + size * 0.3, size * 0.9] as Box,
  };
}

export const fallbackGlyphs = Array.from({ length: 34 }, (_, i) => ({
  glyph: nth(glyphs, i),
  left: `${hash(i * 3 + 1) * 96}%`,
  top: `${10 + hash(i * 3 + 2) * 85}%`,
  fontSize: 13 + (i % 3) * 2,
  delay: `-${(i * 7.43) % 20}s`,
}));

const vertex = `#version 300 es
layout(location=0) in vec2 q;
layout(location=1) in vec4 a;
layout(location=2) in vec4 b;
layout(location=3) in vec4 c;
layout(location=4) in vec4 d;
uniform vec2 R, M;
uniform float T, A, F;
uniform vec4 H, B;
out vec2 u;
out vec4 g;
out float o;
vec2 curl(vec2 p, float t) {
  float x = 1.3 * p.x + t, y = 1.1 * p.y - 0.7 * t, z = 0.7 * p.x + 2.3 * p.y + 0.6 * t;
  return vec2(-1.1 * sin(x) * sin(y) + 1.15 * cos(z), -1.3 * cos(x) * cos(y) - 0.35 * cos(z));
}
void main() {
  float z = a.z, m = ${margin}.;
  vec2 D = R + 2. * m;
  vec2 p = mod(a.xy * D + vec2(sin(T * .02 + b.x) * 30., -T * b.y), D);
  p += curl(p / 460., T * .035 + b.x) * mix(18., 34., z) - m;
  float k = c.x * smoothstep(0., 1., clamp(A * 1.6 - b.w * .6, 0., 1.));
  p += M * (3. + 26. * z) * (1. - k);
  float away = smoothstep(0., 48., length(max(abs(p - B.xy) - B.zw, 0.)));
  float seen = smoothstep(.8, 1.3, length((p - H.xy) / H.zw)) * mix(.3, 1., smoothstep(50., 150., p.y)) * mix(1., away, A * (1. - c.x));
  float base = mix(.3, .2, z) * (1. + smoothstep(.6, .9, z) * .6) * (.72 + .28 * sin(T * .21 + b.x * 5.)) * seen;
  p = mix(p, c.yz, k) + vec2(sin(b.x * 40. + T * .7), cos(b.x * 31. + T * .6)) * k * (1. - k) * 36.;
  float r = .22 * sin(T * .06 + b.x * 7.) * (1. - k);
  vec2 v = mat2(cos(r), sin(r), -sin(r), cos(r)) * ((q - .5) * mix(b.z, c.w, k));
  gl_Position = vec4((p + v) / R * vec2(2, -2) + vec2(-1, 1), 0, 1);
  u = q;
  g = vec4(a.w, d.x, smoothstep(.35, 1., z) * 3. * (1. - k), k);
  o = mix(base, F, k);
}`;

const fragment = `#version 300 es
precision mediump float;
uniform sampler2D S;
uniform vec3 C;
in vec2 u;
in vec4 g;
in float o;
out vec4 f;
float cell(float i, float l) {
  return texture(S, (vec2(mod(i, ${columns}.), floor(i / ${columns}.) + l * ${rows}.) + u) / vec2(${columns}, ${rows * blurs.length})).r;
}
float blurred(float i) {
  float l = floor(g.z);
  return mix(cell(i, l), cell(i, min(l + 1., ${blurs.length - 1}.)), g.z - l);
}
void main() {
  float v = mix(blurred(g.x), blurred(g.y), g.w) * o;
  f = vec4(C * v, v);
}`;

function drawAtlas(family: string) {
  const canvas = document.createElement("canvas");
  canvas.width = columns * cell;
  canvas.height = rows * blurs.length * cell;
  const ctx = canvas.getContext("2d");
  const widths = new Map<string, number>();
  if (!ctx) return { canvas, widths };
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  blurs.forEach((blur, level) => {
    ctx.filter = blur ? `blur(${blur}px)` : "none";
    tokens.forEach((token, i) => {
      ctx.font = `${font}px ${family}`;
      const width = ctx.measureText(token).width;
      const fitted = width > widest ? (font * widest) / width : font;
      ctx.font = `${fitted}px ${family}`;
      widths.set(token, Math.min(width, widest) / font);
      ctx.fillText(
        token,
        ((i % columns) + 0.5) * cell,
        (level * rows + Math.floor(i / columns) + middle) * cell,
      );
    });
  });
  return { canvas, widths };
}

function compile(gl: WebGL2RenderingContext, atlas: HTMLCanvasElement) {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) return;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  gl.bindVertexArray(gl.createVertexArray());
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  for (let i = 1; i <= 4; i++) {
    gl.enableVertexAttribArray(i);
    gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 64, (i - 1) * 16);
    gl.vertexAttribDivisor(i, 1);
  }

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, atlas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  return {
    buffer,
    R: uniform("R"),
    M: uniform("M"),
    T: uniform("T"),
    A: uniform("A"),
    F: uniform("F"),
    H: uniform("H"),
    B: uniform("B"),
    C: uniform("C"),
  };
}

const rgb = (color: string) =>
  (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => Number(v) / 255);

export function startField(
  canvas: HTMLCanvasElement,
  text: HTMLElement,
  events: Events,
) {
  let stop = () => {};
  let stopped = false;
  const style = getComputedStyle(canvas);
  Promise.race([
    document.fonts.load(`${font}px ${style.fontFamily}`, tokens.join("")),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ])
    .catch(() => {})
    .then(() => {
      if (!stopped) stop = test(canvas, text, events, style);
    });
  return () => {
    stopped = true;
    stop();
  };
}

function test(
  canvas: HTMLCanvasElement,
  text: HTMLElement,
  { onReady, onFallback }: Events,
  style: CSSStyleDeclaration,
) {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  const atlas = drawAtlas(style.fontFamily);
  let program = gl && compile(gl, atlas.canvas);
  if (!gl || !program) {
    onFallback();
    return () => {};
  }

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const color = rgb(style.color);
  const viewport = { width: canvas.clientWidth, height: canvas.clientHeight };
  const instances = createInstances(viewport);
  const measure = (token: string) => atlas.widths.get(token) ?? 0.6;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let mask = [0, 0, 1, 1];
  let box: Box = [0, 0, 0, 0];
  let cycle = -1;
  let elapsed = 0;
  let last = 0;
  let frame = 0;
  let resizing = 0;
  let shown = false;

  const upload = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, program?.buffer ?? null);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        instances.flatMap((i) => [
          i.x,
          i.y,
          i.z,
          i.glyph,
          i.phase,
          i.speed,
          i.size,
          i.stagger,
          i.target ? 1 : 0,
          i.target?.x ?? 0,
          i.target?.y ?? 0,
          i.target?.size ?? 0,
          i.target?.glyph ?? i.glyph,
          0,
          0,
          0,
        ]),
      ),
      gl.DYNAMIC_DRAW,
    );
  };

  const plan = (c: number) => {
    const time = epoch + delay + c * period;
    const layout = layoutFormula(
      nth(formulas, c),
      slot(c, viewport),
      viewport,
      measure,
    );
    box = layout.box;
    for (const i of instances) i.target = undefined;
    const free = instances
      .filter((i) => i.z < 0.7 && lift(i, time, viewport) > i.speed * 8)
      .map((i) => ({ i, at: position(i, time, viewport) }));
    for (const token of layout.tokens) {
      let best: (typeof free)[number] | undefined;
      let distance = Infinity;
      for (const f of free) {
        if (f.i.target) continue;
        const d = (f.at[0] - token.x) ** 2 + (f.at[1] - token.y) ** 2;
        if (d < distance) [best, distance] = [f, d];
      }
      if (best) best.i.target = token;
    }
    upload();
  };

  const draw = () => {
    if (!program) return;
    const h = elapsed - delay;
    const c = Math.floor(h / period);
    if (h >= 0 && c !== cycle) {
      cycle = c;
      plan(c);
    }
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    gl.uniform2f(program.R, viewport.width, viewport.height);
    gl.uniform2f(program.M, pointer.x, pointer.y);
    gl.uniform1f(program.T, epoch + elapsed);
    gl.uniform1f(program.A, h < 0 ? 0 : envelope(h - c * period));
    gl.uniform1f(program.F, hold);
    gl.uniform4fv(program.H, mask);
    gl.uniform4fv(program.B, box);
    gl.uniform3fv(program.C, color);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instances.length);
    if (!shown) {
      shown = true;
      onReady();
    }
  };

  const loop = (now: number) => {
    elapsed += Math.min(now - (last || now), 50) / secondMs;
    last = now;
    draw();
    frame = requestAnimationFrame(loop);
  };

  const go = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (document.hidden || gl.isContextLost()) return;
    if (motion.matches) {
      elapsed = delay + 3.5;
      draw();
      return;
    }
    last = 0;
    frame = requestAnimationFrame(loop);
  };

  const size = () => {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    viewport.width = canvas.clientWidth;
    viewport.height = canvas.clientHeight;
    canvas.width = Math.round(viewport.width * ratio);
    canvas.height = Math.round(viewport.height * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const rect = text.getBoundingClientRect();
    mask = [
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      rect.width / 2 + viewport.width * 0.05,
      rect.height / 2 + viewport.height * 0.06,
    ];
    if (cycle >= 0) plan(cycle);
    if (!frame) draw();
  };

  const resize = () => {
    clearTimeout(resizing);
    resizing = window.setTimeout(size, 120);
  };

  const move = (e: PointerEvent) => {
    if (motion.matches) return;
    pointer.tx = (e.clientX / viewport.width) * 2 - 1;
    pointer.ty = (e.clientY / viewport.height) * 2 - 1;
  };

  const lost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(frame);
    frame = 0;
  };

  const restored = () => {
    program = compile(gl, atlas.canvas);
    if (!program) {
      onFallback();
      return;
    }
    upload();
    size();
    go();
  };

  const observer = new ResizeObserver(resize);
  observer.observe(document.documentElement);
  addEventListener("pointermove", move, { passive: true });
  document.addEventListener("visibilitychange", go);
  motion.addEventListener("change", go);
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  upload();
  size();
  go();

  return () => {
    cancelAnimationFrame(frame);
    clearTimeout(resizing);
    observer.disconnect();
    removeEventListener("pointermove", move);
    document.removeEventListener("visibilitychange", go);
    motion.removeEventListener("change", go);
    canvas.removeEventListener("webglcontextlost", lost);
    canvas.removeEventListener("webglcontextrestored", restored);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
