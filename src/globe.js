/** Rotating digital earth with flowing network arcs. No cover copy on the globe. */

const EARTH_VS = `
attribute vec3 aPos;
attribute vec3 aN;
attribute vec2 aUv;
uniform mat4 uMVP;
uniform mat4 uModel;
uniform mat3 uNMat;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vW = w.xyz;
  vN = normalize(uNMat * aN);
  vUv = aUv;
  gl_Position = uMVP * vec4(aPos, 1.0);
}
`;

const EARTH_FS = `
precision mediump float;
uniform sampler2D uMap;
uniform vec3 uLight;
uniform vec3 uEye;
varying vec3 vN;
varying vec3 vW;
varying vec2 vUv;
void main() {
  vec3 tex = texture2D(uMap, vUv).rgb;
  float lum = dot(tex, vec3(0.22, 0.62, 0.16));
  float land = smoothstep(0.14, 0.42, lum);
  vec3 ocean = vec3(0.02, 0.09, 0.20);
  vec3 coast = vec3(0.07, 0.32, 0.58);
  vec3 ground = vec3(0.18, 0.62, 0.98);
  vec3 albedo = mix(ocean, mix(coast, ground, land), land);
  vec3 n = normalize(vN);
  vec3 l = normalize(uLight);
  vec3 v = normalize(uEye - vW);
  float ndl = 0.42 + 0.58 * max(dot(n, l), 0.0);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.15);
  vec3 col = albedo * ndl;
  col += vec3(0.22, 0.62, 1.0) * rim * 0.72;
  col += vec3(0.35, 0.75, 1.0) * pow(max(dot(n, l), 0.0), 18.0) * 0.12;
  gl_FragColor = vec4(col, 1.0);
}
`;

const ATM_VS = `
attribute vec3 aPos;
attribute vec3 aN;
uniform mat4 uMVP;
uniform mat4 uModel;
uniform mat3 uNMat;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 p = aPos * 1.085;
  vec4 w = uModel * vec4(p, 1.0);
  vW = w.xyz;
  vN = normalize(uNMat * aN);
  gl_Position = uMVP * vec4(p, 1.0);
}
`;

const ATM_FS = `
precision mediump float;
uniform vec3 uEye;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vW);
  float f = pow(1.0 - abs(dot(n, v)), 3.2);
  gl_FragColor = vec4(0.28, 0.62, 1.0, f * 0.55);
}
`;

const LINE_VS = `
attribute vec3 aPos;
attribute float aT;
attribute float aPhase;
uniform mat4 uMVP;
uniform float uTime;
varying float vGlow;
varying float vFront;
void main() {
  vec4 clip = uMVP * vec4(aPos, 1.0);
  gl_Position = clip;
  float f = fract(aT * 1.35 - uTime * 0.16 - aPhase);
  float head = smoothstep(0.0, 0.05, f) * (1.0 - smoothstep(0.07, 0.42, f));
  vGlow = 0.28 + head * 0.95;
  vFront = clip.z / clip.w;
  gl_PointSize = mix(1.8, 4.6, head);
}
`;

const LINE_FS = `
precision mediump float;
varying float vGlow;
void main() {
  gl_FragColor = vec4(0.55, 0.86, 1.0, vGlow);
}
`;

const POINT_VS = `
attribute vec3 aPos;
attribute float aSize;
uniform mat4 uMVP;
uniform float uTime;
varying float vA;
void main() {
  gl_Position = uMVP * vec4(aPos, 1.0);
  float tw = 0.72 + 0.28 * sin(uTime * 2.2 + aSize * 17.0);
  vA = tw;
  gl_PointSize = aSize * tw;
}
`;

const POINT_FS = `
precision mediump float;
varying float vA;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c);
  if (d2 > 0.25) discard;
  float a = exp(-d2 * 16.0) * vA;
  gl_FragColor = vec4(0.75, 0.93, 1.0, a);
}
`;

const BG_VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const BG_FS = `
precision mediump float;
uniform sampler2D uMap;
uniform vec2 uRes;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  uv.x = (uv.x - 0.5) * 1.18 + 0.5;
  uv.y = (uv.y - 0.5) * 1.12 + 0.52;
  vec3 tex = texture2D(uMap, uv).rgb;
  float lum = dot(tex, vec3(0.22, 0.62, 0.16));
  float land = smoothstep(0.14, 0.40, lum);
  vec3 ocean = vec3(0.015, 0.05, 0.12);
  vec3 ground = vec3(0.08, 0.28, 0.48);
  vec3 col = mix(ocean, ground, land * 0.85);
  vec2 p = vUv * 2.0 - 1.0;
  float vig = smoothstep(1.55, 0.22, length(p * vec2(1.05, 1.0)));
  col *= 0.55 * vig;
  gl_FragColor = vec4(col, 1.0);
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

function mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

function perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  const o = new Float32Array(16);
  o[0] = f / aspect;
  o[5] = f;
  o[10] = (far + near) * nf;
  o[11] = -1;
  o[14] = 2 * far * near * nf;
  return o;
}

function rotateY(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
}

function rotateZ(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function rotateX(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

function translate(x, y, z) {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

function mat3FromMat4(m) {
  const a = m[0];
  const b = m[1];
  const c = m[2];
  const d = m[4];
  const e = m[5];
  const f = m[6];
  const g = m[8];
  const h = m[9];
  const i = m[10];
  const A = e * i - f * h;
  const B = f * g - d * i;
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  const id = det !== 0 ? 1 / det : 1;
  return new Float32Array([
    A * id,
    (c * h - b * i) * id,
    (b * f - c * e) * id,
    B * id,
    (a * i - c * g) * id,
    (c * d - a * f) * id,
    C * id,
    (b * g - a * h) * id,
    (a * e - b * d) * id,
  ]);
}

function latLonToVec(lat, lon) {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  const cl = Math.cos(la);
  return [cl * Math.sin(lo), Math.sin(la), cl * Math.cos(lo)];
}

function slerp(a, b, t) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.max(-1, Math.min(1, dot));
  const w = Math.acos(dot);
  if (w < 1e-4) return a.slice();
  const s = Math.sin(w);
  const wa = Math.sin((1 - t) * w) / s;
  const wb = Math.sin(t * w) / s;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
}

function makeSphere(nx, ny) {
  const vs = [];
  const ns = [];
  const uvs = [];
  const idx = [];
  for (let iy = 0; iy <= ny; iy++) {
    const v = iy / ny;
    const lat = (0.5 - v) * Math.PI;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    for (let ix = 0; ix <= nx; ix++) {
      const u = ix / nx;
      const lon = (u - 0.5) * Math.PI * 2;
      const x = cl * Math.sin(lon);
      const y = sl;
      const z = cl * Math.cos(lon);
      vs.push(x, y, z);
      ns.push(x, y, z);
      uvs.push(u, v);
    }
  }
  const stride = nx + 1;
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = iy * stride + ix;
      const b = a + stride;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return {
    pos: new Float32Array(vs),
    nrm: new Float32Array(ns),
    uv: new Float32Array(uvs),
    idx: new Uint16Array(idx),
  };
}

const HUBS = [
  [39.9, 116.4],
  [31.2, 121.5],
  [22.3, 114.2],
  [1.35, 103.8],
  [35.7, 139.7],
  [37.6, 127.0],
  [51.5, -0.12],
  [48.9, 2.35],
  [52.5, 13.4],
  [47.4, 8.54],
  [55.8, 37.6],
  [40.7, -74.0],
  [42.4, -71.1],
  [37.8, -122.4],
  [34.0, -118.2],
  [43.7, -79.4],
  [-33.9, 151.2],
  [-37.8, 145.0],
  [19.4, -99.1],
  [-23.6, -46.6],
  [-34.6, -58.4],
  [28.6, 77.2],
  [19.1, 72.9],
  [30.0, 31.2],
  [-1.3, 36.8],
  [-26.2, 28.0],
  [25.2, 55.3],
  [41.0, 29.0],
  [59.3, 18.1],
  [60.2, 24.9],
];

function makeArcs(count, segs) {
  const linePos = [];
  const lineT = [];
  const linePhase = [];
  const ptPos = [];
  const ptSize = [];
  const used = new Set();
  for (const [lat, lon] of HUBS) {
    const p = latLonToVec(lat, lon);
    ptPos.push(p[0] * 1.012, p[1] * 1.012, p[2] * 1.012);
    ptSize.push(4.2);
  }
  let n = 0;
  while (n < count) {
    const i = (n * 7 + 3) % HUBS.length;
    const j = (n * 13 + 11) % HUBS.length;
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (i === j || used.has(key)) {
      n += 1;
      continue;
    }
    used.add(key);
    const a = latLonToVec(HUBS[i][0], HUBS[i][1]);
    const b = latLonToVec(HUBS[j][0], HUBS[j][1]);
    let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    dot = Math.max(-1, Math.min(1, dot));
    const dist = Math.acos(dot);
    if (dist < 0.22 || dist > 2.85) {
      n += 1;
      continue;
    }
    const lift = 1.018 + dist * 0.085;
    const phase = (n * 0.173) % 1;
    for (let s = 0; s < segs; s++) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;
      const p0 = slerp(a, b, t0);
      const p1 = slerp(a, b, t1);
      const h0 = 1 + (lift - 1) * Math.sin(t0 * Math.PI);
      const h1 = 1 + (lift - 1) * Math.sin(t1 * Math.PI);
      linePos.push(p0[0] * h0, p0[1] * h0, p0[2] * h0, p1[0] * h1, p1[1] * h1, p1[2] * h1);
      lineT.push(t0, t1);
      linePhase.push(phase, phase);
    }
    n += 1;
  }
  return {
    linePos: new Float32Array(linePos),
    lineT: new Float32Array(lineT),
    linePhase: new Float32Array(linePhase),
    lineN: linePos.length / 3,
    ptPos: new Float32Array(ptPos),
    ptSize: new Float32Array(ptSize),
    ptN: ptPos.length / 3,
  };
}

function buf(gl, data) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return b;
}

function ibo(gl, data) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return b;
}

function stylizeEarth(img) {
  const c = document.createElement("canvas");
  const maxW = 2048;
  const scale = Math.min(1, maxW / Math.max(img.width, 1));
  c.width = Math.max(2, Math.round(img.width * scale));
  c.height = Math.max(2, Math.round(img.height * scale));
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const im = ctx.getImageData(0, 0, c.width, c.height);
  const d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.2 * d[i] + 0.55 * d[i + 1] + 0.25 * d[i + 2]) / 255;
    const land = lum > 0.15 ? Math.min(1, (lum - 0.1) / 0.48) : 0;
    if (land < 0.06) {
      d[i] = 6;
      d[i + 1] = 24;
      d[i + 2] = 52;
    } else {
      d[i] = 18 + 85 * land;
      d[i + 1] = 95 + 120 * land;
      d[i + 2] = 175 + 70 * land;
    }
    d[i + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
  return c;
}

function loadTexture(gl, source) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
  return tex;
}

function attrib(gl, prog, name, buffer, size) {
  const loc = gl.getAttribLocation(prog, name);
  if (loc < 0) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
}

function disableAttribs(gl) {
  const n = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  for (let i = 0; i < n; i++) gl.disableVertexAttribArray(i);
}

export function startGlobe(canvas) {
  const gl =
    canvas.getContext("webgl", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    }) || canvas.getContext("experimental-webgl");
  if (!gl) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const img = new Image();
  img.decoding = "async";
  img.src = new URL("../public/globe/earth.jpg", import.meta.url).href;

  let stop = () => {};
  img.onload = () => {
    stop = run(canvas, gl, img, reduced);
  };
  img.onerror = () => {
    stop = run(canvas, gl, null, reduced);
  };
  return () => stop();
}

function run(canvas, gl, img, reduced) {
  const earthProg = program(gl, EARTH_VS, EARTH_FS);
  const atmProg = program(gl, ATM_VS, ATM_FS);
  const lineProg = program(gl, LINE_VS, LINE_FS);
  const pointProg = program(gl, POINT_VS, POINT_FS);
  const bgProg = program(gl, BG_VS, BG_FS);

  const sphere = makeSphere(96, 64);
  const arcs = makeArcs(72, 64);
  const posB = buf(gl, sphere.pos);
  const nrmB = buf(gl, sphere.nrm);
  const uvB = buf(gl, sphere.uv);
  const idxB = ibo(gl, sphere.idx);
  const linePosB = buf(gl, arcs.linePos);
  const lineTB = buf(gl, arcs.lineT);
  const linePhB = buf(gl, arcs.linePhase);
  const ptPosB = buf(gl, arcs.ptPos);
  const ptSizeB = buf(gl, arcs.ptSize);
  const quadB = buf(gl, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));

  let earthTex = null;
  if (img) earthTex = loadTexture(gl, stylizeEarth(img));

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

  const uEarth = {
    mvp: gl.getUniformLocation(earthProg, "uMVP"),
    model: gl.getUniformLocation(earthProg, "uModel"),
    nmat: gl.getUniformLocation(earthProg, "uNMat"),
    map: gl.getUniformLocation(earthProg, "uMap"),
    light: gl.getUniformLocation(earthProg, "uLight"),
    eye: gl.getUniformLocation(earthProg, "uEye"),
  };
  const uAtm = {
    mvp: gl.getUniformLocation(atmProg, "uMVP"),
    model: gl.getUniformLocation(atmProg, "uModel"),
    nmat: gl.getUniformLocation(atmProg, "uNMat"),
    eye: gl.getUniformLocation(atmProg, "uEye"),
  };
  const uLine = {
    mvp: gl.getUniformLocation(lineProg, "uMVP"),
    time: gl.getUniformLocation(lineProg, "uTime"),
  };
  const uPoint = {
    mvp: gl.getUniformLocation(pointProg, "uMVP"),
    time: gl.getUniformLocation(pointProg, "uTime"),
  };
  const uBg = {
    map: gl.getUniformLocation(bgProg, "uMap"),
    res: gl.getUniformLocation(bgProg, "uRes"),
  };

  let raf = 0;
  const t0 = performance.now();
  const eye = [0, 0.02, 3.92];
  const tilt = 0.28;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    const time = reduced ? 0 : (now - t0) / 1000;
    const spin = -0.42 + time * 0.055 + mouse.x * 0.18;
    const extraX = -0.08 + mouse.y * 0.10;
    const model = mul(rotateX(extraX), mul(rotateZ(tilt), rotateY(spin)));
    const aspect = canvas.width / Math.max(canvas.height, 1);
    const proj = perspective((30 * Math.PI) / 180, aspect, 0.1, 20);
    const view = translate(-eye[0], -eye[1], -eye[2]);
    const mvp = mul(proj, mul(view, model));
    const nmat = mat3FromMat4(model);
    const light = [0.55, 0.35, 1.0];

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.01, 0.03, 0.07, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.useProgram(bgProg);
    disableAttribs(gl);
    attrib(gl, bgProg, "aPos", quadB, 2);
    gl.uniform2f(uBg.res, canvas.width, canvas.height);
    if (earthTex) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, earthTex);
      gl.uniform1i(uBg.map, 0);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.useProgram(earthProg);
    disableAttribs(gl);
    attrib(gl, earthProg, "aPos", posB, 3);
    attrib(gl, earthProg, "aN", nrmB, 3);
    attrib(gl, earthProg, "aUv", uvB, 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxB);
    gl.uniformMatrix4fv(uEarth.mvp, false, mvp);
    gl.uniformMatrix4fv(uEarth.model, false, model);
    gl.uniformMatrix3fv(uEarth.nmat, false, nmat);
    gl.uniform3fv(uEarth.light, light);
    gl.uniform3fv(uEarth.eye, eye);
    if (earthTex) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, earthTex);
      gl.uniform1i(uEarth.map, 0);
    }
    gl.drawElements(gl.TRIANGLES, sphere.idx.length, gl.UNSIGNED_SHORT, 0);

    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.cullFace(gl.FRONT);
    gl.useProgram(atmProg);
    disableAttribs(gl);
    attrib(gl, atmProg, "aPos", posB, 3);
    attrib(gl, atmProg, "aN", nrmB, 3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxB);
    gl.uniformMatrix4fv(uAtm.mvp, false, mvp);
    gl.uniformMatrix4fv(uAtm.model, false, model);
    gl.uniformMatrix3fv(uAtm.nmat, false, nmat);
    gl.uniform3fv(uAtm.eye, eye);
    gl.drawElements(gl.TRIANGLES, sphere.idx.length, gl.UNSIGNED_SHORT, 0);

    gl.disable(gl.CULL_FACE);
    gl.useProgram(lineProg);
    disableAttribs(gl);
    attrib(gl, lineProg, "aPos", linePosB, 3);
    attrib(gl, lineProg, "aT", lineTB, 1);
    attrib(gl, lineProg, "aPhase", linePhB, 1);
    gl.uniformMatrix4fv(uLine.mvp, false, mvp);
    gl.uniform1f(uLine.time, time);
    gl.drawArrays(gl.LINES, 0, arcs.lineN);
    gl.drawArrays(gl.POINTS, 0, arcs.lineN);

    gl.useProgram(pointProg);
    disableAttribs(gl);
    attrib(gl, pointProg, "aPos", ptPosB, 3);
    attrib(gl, pointProg, "aSize", ptSizeB, 1);
    gl.uniformMatrix4fv(uPoint.mvp, false, mvp);
    gl.uniform1f(uPoint.time, time);
    gl.drawArrays(gl.POINTS, 0, arcs.ptN);

    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
  frame(t0);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("resize", resize);
  };
}
