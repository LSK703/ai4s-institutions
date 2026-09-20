import "../shell.js?v=ed1";
import { fmtInt, loadInstitutions } from "../data.js";
import { getLocale, t } from "../i18n.js?v=ed2";
import { figureUrl, pageUrl } from "../paths.js";

const payload = await loadInstitutions();
const { meta } = payload;

const nEl = document.getElementById("stat-n");
const cEl = document.getElementById("stat-c");
if (nEl) nEl.textContent = fmtInt(meta.n_ge_500);
if (cEl) cEl.textContent = fmtInt(meta.n_countries);

const locale = getLocale();
const chartFrame = document.getElementById("home-chart-frame");
const chartDots = document.getElementById("home-chart-dots");
const chartLive = document.getElementById("home-chart-live");
const chartCaption = document.querySelector("[data-i18n='ed02Caption']");
const mapFrame = document.getElementById("home-map-frame");

const slides = [
  {
    titleKey: "presetScaleQuality",
    fit: "axes",
    src: figureUrl(locale === "zh" ? "ch05_fig2_x2000_zh.html" : "ch05_fig2_x2000_en.html"),
  },
  {
    titleKey: "presetScaleEff",
    fit: "plot",
    src: figureUrl("ch03_institutions.html", { embed: "1", lang: locale, view: "size" }),
  },
  {
    titleKey: "presetExpectedObs",
    fit: "plot",
    src: figureUrl("ch03_institutions.html", { embed: "1", lang: locale, view: "obs" }),
  },
  {
    titleKey: "presetScaleCollab",
    fit: "plot",
    src: figureUrl(locale === "zh" ? "ch04_fig6_1_zh.html" : "ch04_fig6_1_en.html"),
  },
  {
    titleKey: "presetDiscIntl",
    fit: "plot",
    src: figureUrl(locale === "zh" ? "ch04_fig6_4_zh.html" : "ch04_fig6_4_en.html"),
  },
];

let index = 0;
let timer = 0;

function paintDots() {
  if (!chartDots) return;
  chartDots.innerHTML = slides
    .map((_, i) => `<button type="button" data-i="${i}"${i === index ? ' class="on"' : ""}></button>`)
    .join("");
}

function fitChart(iframe, fit) {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc?.documentElement || !win) return;
  const w = Math.max(160, Math.round(iframe.clientWidth));
  const h = Math.max(110, Math.round(iframe.clientHeight));
  let style = doc.getElementById("home-fit");
  if (!style) {
    style = doc.createElement("style");
    style.id = "home-fit";
    doc.head.appendChild(style);
  }
  style.textContent = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      width: ${w}px !important;
      height: ${h}px !important;
      background: #fff !important;
    }
    header, nav, .lang, .sub, .hint, .toolbar, table, .pager, .tabs,
    .notes, #view-notes, #view-compare, #boot-error {
      display: none !important;
    }
    main {
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
    }
    .chart-shell,
    .plotly-graph-div,
    .js-plotly-plot,
    .svg-container,
    .plot,
    .plot.scatter,
    body > div {
      width: ${w}px !important;
      height: ${h}px !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-height: none !important;
      margin: 0 !important;
    }
    .modebar, .modebar-container { display: none !important; }
  `;
  const Plotly = win.Plotly;
  if (!Plotly?.relayout) return;
  const scale = 0.62;
  const shrink = (v, min) => (typeof v === "number" ? Math.max(min, v * scale) : v);
  const copySize = (s) => {
    if (Array.isArray(s)) return s.slice();
    if (typeof s === "number") return s;
    return 6;
  };
  const scaleSize = (s) => {
    const one = (n) => Math.max(3.2, Number(n) * scale);
    return Array.isArray(s) ? s.map(one) : one(s);
  };
  const margin = fit === "axes" ? { l: 42, r: 8, t: 8, b: 36 } : { l: 34, r: 8, t: 6, b: 28 };
  doc.querySelectorAll(".js-plotly-plot").forEach((gd) => {
    const traces = gd.data || [];
    if (!traces.length) return;
    if (!gd._homeOrig) {
      gd._homeOrig = {
        sizes: traces.map((tr, i) => copySize(tr.marker?.size ?? gd._fullData?.[i]?.marker?.size)),
        lineW: traces.map((tr, i) => tr.marker?.line?.width ?? gd._fullData?.[i]?.marker?.line?.width),
        font: gd.layout?.font?.size,
        tick: gd.layout?.xaxis?.tickfont?.size || gd.layout?.font?.size,
        title: gd.layout?.xaxis?.title?.font?.size,
        anns: (gd.layout?.annotations || []).map((a) => a.font?.size),
      };
    }
    const orig = gd._homeOrig;
    traces.forEach((tr, i) => {
      if (!tr.marker) tr.marker = {};
      tr.marker.size = scaleSize(orig.sizes[i]);
      if (typeof orig.lineW[i] === "number") {
        tr.marker.line = Object.assign({}, tr.marker.line, {
          width: Math.max(0.2, orig.lineW[i] * scale),
        });
      }
    });
    const patch = {
      autosize: false,
      width: w,
      height: h,
      margin,
      showlegend: false,
      "font.size": shrink(orig.font || 11, 8),
      "xaxis.tickfont.size": shrink(orig.tick || 10, 8),
      "yaxis.tickfont.size": shrink(orig.tick || 10, 8),
      "xaxis.title.font.size": shrink(orig.title || 11, 9),
      "yaxis.title.font.size": shrink(orig.title || 11, 9),
    };
    orig.anns.forEach((sz, i) => {
      patch[`annotations[${i}].font.size`] = shrink(sz || 10, 8);
    });
    const sizes = orig.sizes.map(scaleSize);
    Plotly.relayout(gd, patch)
      .then(() => {
        traces.forEach((tr, i) => {
          if (!tr.marker) tr.marker = {};
          tr.marker.size = sizes[i];
          if (typeof orig.lineW[i] === "number") {
            tr.marker.line = Object.assign({}, tr.marker.line, {
              width: Math.max(0.2, orig.lineW[i] * scale),
            });
          }
        });
        return Plotly.restyle(gd, { "marker.size": sizes });
      })
      .catch(() => {});
  });
}

function showSlide(next) {
  if (!chartFrame || !slides.length) return;
  index = (next + slides.length) % slides.length;
  const slide = slides[index];
  if (chartCaption) chartCaption.textContent = t(slide.titleKey);
  paintDots();
  chartFrame.classList.add("is-wait");
  chartFrame.dataset.fit = slide.fit;
  chartFrame.src = slide.src;
}

function play() {
  stop();
  timer = window.setInterval(() => showSlide(index + 1), 8000);
}

function stop() {
  window.clearInterval(timer);
}

if (chartFrame) {
  const afterLoad = () => {
    const fit = chartFrame.dataset.fit || "plot";
    fitChart(chartFrame, fit);
    window.setTimeout(() => fitChart(chartFrame, fit), 80);
    window.setTimeout(() => {
      fitChart(chartFrame, fit);
      chartFrame.classList.remove("is-wait");
    }, 280);
    window.setTimeout(() => fitChart(chartFrame, fit), 900);
  };
  chartFrame.addEventListener("load", afterLoad);
  chartDots?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-i]");
    if (!btn) return;
    showSlide(Number(btn.dataset.i));
    play();
  });
  chartLive?.addEventListener("mouseenter", stop);
  chartLive?.addEventListener("mouseleave", play);
  showSlide(0);
  play();
}

if (mapFrame) {
  const url = new URL(pageUrl("explore/map.html"));
  url.searchParams.set("embed", "1");
  mapFrame.src = url.href;
}
