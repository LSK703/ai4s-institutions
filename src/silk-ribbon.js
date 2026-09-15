/** Sharp particle spiral galaxy. No glow fog, no flicker, no hollow ring. */

const VS = `
attribute vec4 aData;
attribute float aKind;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uDpr;
varying float vB;

mat3 rotX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}
mat3 rotY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}
mat3 rotZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

void main() {
  if (aKind < 0.5) {
    vec2 clip = aData.xy + uMouse * 0.055 * aData.w;
    vB = aData.w * (0.96 + 0.04 * sin(uTime * 0.2 + aData.w * 9.0));
    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = max(1.0, mix(1.0, 1.7, aData.w) * uDpr);
    return;
  }

  float theta = aData.x + uTime * 0.014;
  vec3 p = vec3(aData.y * cos(theta), aData.y * sin(theta), aData.z);
  float yaw = sin(uTime * 0.20) * 0.14 + uMouse.x * 0.34;
  yaw = clamp(yaw, -0.48, 0.48);
  float pitch = 0.72 + uMouse.y * 0.18;
  pitch = clamp(pitch, 0.50, 0.90);
  p = rotY(yaw) * rotX(pitch) * rotZ(-0.32) * p;
  p.x += 0.18 + uMouse.x * 0.10;
  p.y += 0.02 + uMouse.y * 0.08;

  float depth = p.z + 2.05;
  vec2 clip = p.xy * (3.15 / max(0.5, depth));
  clip.x /= uRes.x / max(uRes.y, 1.0);

  vB = aData.w * (0.96 + 0.04 * sin(uTime * 0.18 + aData.w * 10.0));
  vB /= max(0.72, depth * 0.48);

  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = max(1.0, mix(1.05, 2.15, aData.w) * uDpr / max(0.72, depth * 0.46));
}
`;

const FS = `
precision mediump float;
varying float vB;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c);
  if (d2 > 0.25) discard;
  float a = exp(-d2 * 24.0) * vB;
  gl_FragColor = vec4(1.0, 1.0, 1.0, a);
}
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) || "shader");
  }
  return sh;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) || "program");
  }
  return p;
}

function gauss() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

function makeGalaxy(armN, bulgeN, diskN, fieldN) {
  const n = armN + bulgeN + diskN + fieldN;
  const data = new Float32Array(n * 4);
  const kind = new Float32Array(n);
  let i = 0;

  function push(theta, r, z, bright, k) {
    const o = i * 4;
    data[o] = theta;
    data[o + 1] = r;
    data[o + 2] = z;
    data[o + 3] = bright;
    kind[i] = k;
    i += 1;
  }

  for (let k = 0; k < fieldN; k++) {
    push(
      (Math.random() * 2 - 1) * 1.15,
      (Math.random() * 2 - 1) * 1.12,
      0,
      0.14 + Math.random() * 0.34,
      0,
    );
  }

  for (let k = 0; k < bulgeN; k++) {
    const r = Math.abs(gauss()) * 0.055;
    const theta = Math.random() * Math.PI * 2;
    const z = gauss() * 0.022;
    push(theta, r, z, 0.22 + Math.random() * 0.38, 1);
  }

  for (let k = 0; k < diskN; k++) {
    const r = 0.12 + Math.pow(Math.random(), 0.7) * 1.05;
    const theta = Math.random() * Math.PI * 2;
    const z = gauss() * (0.012 + 0.02 * r);
    push(theta, r, z, 0.08 + 0.16 * Math.random(), 1);
  }

  for (let k = 0; k < armN; k++) {
    const arm = k % 2 === 0 ? 0 : Math.PI;
    const t = 0.22 + Math.pow(Math.random(), 0.55) * 4.55;
    const r = 0.20 * Math.exp(0.31 * t);
    const spread = 0.018 + 0.062 * (r / 1.2);
    const jr = gauss() * spread + ((k % 5) - 2) * 0.013;
    const jz = gauss() * spread * 0.40;
    const tNorm = (t - 0.22) / 4.55;
    const midCurve = Math.exp(-((tNorm - 0.5) * (tNorm - 0.5)) / 0.055);
    const spine = Math.exp(-Math.abs(jr) * 11.0);
    const bright = Math.min(
      1,
      0.32 + 0.32 * spine + 0.22 * midCurve * spine + 0.14 * Math.random(),
    );
    push(t + arm + gauss() * 0.09, r + jr, jz, bright, 1);
  }

  return { n, data, kind };
}

export function startSilk(canvas) {
  const gl =
    canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    }) || canvas.getContext("experimental-webgl");
  if (!gl) return startGalaxy2d(canvas);
  try {
    return startGalaxyGl(canvas, gl);
  } catch (err) {
    console.error(err);
    const next = document.createElement("canvas");
    next.id = canvas.id;
    next.className = canvas.className;
    canvas.replaceWith(next);
    return startGalaxy2d(next);
  }
}

function startGalaxyGl(canvas, gl) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pack = makeGalaxy(
    reduced ? 26000 : 108000,
    reduced ? 1600 : 5000,
    reduced ? 6000 : 22000,
    reduced ? 2200 : 8000,
  );
  const prog = program(gl, VS, FS);

  const dataBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, dataBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pack.data, gl.STATIC_DRAW);
  const kindBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, kindBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pack.kind, gl.STATIC_DRAW);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  function onMove(e) {
    mouse.tx = (e.clientX / (window.innerWidth || 1)) * 2 - 1;
    mouse.ty = -((e.clientY / (window.innerHeight || 1)) * 2 - 1);
  }
  window.addEventListener("pointermove", onMove, { passive: true });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.disable(gl.DEPTH_TEST);

  const locData = gl.getAttribLocation(prog, "aData");
  const locKind = gl.getAttribLocation(prog, "aKind");
  const u = {
    time: gl.getUniformLocation(prog, "uTime"),
    res: gl.getUniformLocation(prog, "uRes"),
    mouse: gl.getUniformLocation(prog, "uMouse"),
    dpr: gl.getUniformLocation(prog, "uDpr"),
  };

  let raf = 0;
  const t0 = performance.now();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    mouse.x += (mouse.tx - mouse.x) * 0.09;
    mouse.y += (mouse.ty - mouse.y) * 0.09;
    const time = reduced ? 0 : (now - t0) / 1000;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuf);
    gl.enableVertexAttribArray(locData);
    gl.vertexAttribPointer(locData, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, kindBuf);
    gl.enableVertexAttribArray(locKind);
    gl.vertexAttribPointer(locKind, 1, gl.FLOAT, false, 0, 0);
    gl.uniform1f(u.time, time);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform2f(u.mouse, mouse.x, mouse.y);
    gl.uniform1f(u.dpr, dpr);
    gl.drawArrays(gl.POINTS, 0, pack.n);
  }
  frame(t0);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("resize", resize);
  };
}

function startGalaxy2d(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};
  const pack = makeGalaxy(8000, 800, 1500, 1200);
  const galaxy = [];
  const field = [];
  for (let i = 0; i < pack.n; i++) {
    const rec = {
      th: pack.data[i * 4],
      r: pack.data[i * 4 + 1],
      z: pack.data[i * 4 + 2],
      b: pack.data[i * 4 + 3],
    };
    if (pack.kind[i] < 0.5) field.push(rec);
    else galaxy.push(rec);
  }
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  function onMove(e) {
    mouse.tx = (e.clientX / (window.innerWidth || 1)) * 2 - 1;
    mouse.ty = -((e.clientY / (window.innerHeight || 1)) * 2 - 1);
  }
  window.addEventListener("pointermove", onMove, { passive: true });
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);
  let raf = 0;
  const t0 = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    mouse.x += (mouse.tx - mouse.x) * 0.09;
    mouse.y += (mouse.ty - mouse.y) * 0.09;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const time = (now - t0) / 1000;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    for (const s of field) {
      ctx.globalAlpha = s.b;
      ctx.fillRect((s.th * 0.5 + 0.5) * w, (-s.r * 0.5 + 0.5) * h, 1, 1);
    }
    let yaw = Math.sin(time * 0.20) * 0.14 + mouse.x * 0.34;
    yaw = Math.max(-0.48, Math.min(0.48, yaw));
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    let pitch = 0.72 + mouse.y * 0.18;
    pitch = Math.max(0.50, Math.min(0.90, pitch));
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cz = Math.cos(-0.28);
    const sz = Math.sin(-0.28);
    for (const s of galaxy) {
      const th = s.th + time * 0.014;
      let x = s.r * Math.cos(th);
      let y = s.r * Math.sin(th);
      let z = s.z;
      const x1 = x * cz - y * sz;
      const y1 = x * sz + y * cz;
      const y2 = y1 * cp - z * sp;
      const z2 = y1 * sp + z * cp;
      const x3 = x1 * cy + z2 * sy;
      const z3 = -x1 * sy + z2 * cy;
      const depth = z3 + 2.05;
      const k = 3.15 / Math.max(0.5, depth);
      const sx = (x3 + 0.18 + mouse.x * 0.10) * k * (h / w) * 0.5 * w + w * 0.5;
      const sy2 = -(y2 + 0.02 + mouse.y * 0.08) * k * 0.5 * h + h * 0.5;
      ctx.globalAlpha = s.b * 0.7;
      ctx.fillRect(sx, sy2, 1.15, 1.15);
    }
    ctx.globalAlpha = 1;
  }
  frame(t0);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("resize", resize);
  };
}
