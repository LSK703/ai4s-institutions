import "../shell.js?v=sign8";
import { fmtInt, loadInstitutions } from "../data.js";
import { getLocale, t } from "../i18n.js?v=ed9";
import { figureUrl, pageUrl } from "../paths.js";

const payload = await loadInstitutions();
const { meta } = payload;

const nEl = document.getElementById("stat-n");
const cEl = document.getElementById("stat-c");
if (nEl) nEl.textContent = fmtInt(meta.n_ge_500);
if (cEl) cEl.textContent = fmtInt(meta.n_countries);

const locale = getLocale();
const chartLive = document.getElementById("home-chart-live");
const chartSlides = document.getElementById("home-chart-slides");
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
    src: figureUrl("ch03_institutions.html", { embed: "1", lang: locale, view: "size", v: "font1" }),
  },
  {
    titleKey: "presetExpectedObs",
    fit: "plot",
    src: figureUrl("ch03_institutions.html", { embed: "1", lang: locale, view: "obs", v: "font1" }),
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

function fitChart(iframe, fit) {
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc?.documentElement || !win) return;
  const box = iframe.parentElement || iframe;
  const w = Math.max(160, Math.round(iframe.clientWidth || box.clientWidth));
  const h = Math.max(110, Math.round(iframe.clientHeight || box.clientHeight));
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

function watchIframe(iframe) {
  const run = () => {
    fitChart(iframe, iframe.dataset.fit || "plot");
  };
  iframe.addEventListener("load", () => {
    run();
    window.setTimeout(run, 80);
    window.setTimeout(() => {
      run();
      iframe.classList.remove("is-wait");
    }, 280);
    window.setTimeout(run, 900);
  });
}

function loadSlide(i) {
  const slide = slides[i];
  const iframe = chartSlides?.querySelector(`iframe[data-i="${i}"]`);
  if (!slide || !iframe || iframe.dataset.ready === "1") return;
  iframe.dataset.ready = "1";
  iframe.src = slide.src;
}

function setCaption(i) {
  if (chartCaption && slides[i]) chartCaption.textContent = t(slides[i].titleKey);
}

function fitActive(i) {
  const iframe = chartSlides?.querySelector(`iframe[data-i="${i}"]`);
  if (!iframe) return;
  fitChart(iframe, iframe.dataset.fit || "plot");
}

if (chartLive && chartSlides && window.Swiper) {
  chartSlides.innerHTML = slides
    .map(
      (slide, i) =>
        `<div class="swiper-slide"><iframe data-i="${i}" data-fit="${slide.fit}" class="is-wait" title="AI4S chart"></iframe></div>`
    )
    .join("");
  chartSlides.querySelectorAll("iframe").forEach(watchIframe);
  setCaption(2);

  const swiper = new window.Swiper(chartLive, {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    initialSlide: 2,
    spaceBetween: 18,
    speed: 700,
    rewind: true,
    coverflowEffect: {
      rotate: 22,
      stretch: 0,
      depth: 180,
      modifier: 1.15,
      slideShadows: true,
    },
    autoplay: {
      delay: 8000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    pagination: {
      el: "#home-chart-dots",
      clickable: true,
    },
    navigation: {
      nextEl: "#home-chart-live .swiper-button-next",
      prevEl: "#home-chart-live .swiper-button-prev",
    },
    on: {
      slideChange() {
        const i = this.realIndex;
        setCaption(i);
        loadSlide(i);
        loadSlide((i + 1) % slides.length);
        loadSlide((i + slides.length - 1) % slides.length);
      },
      slideChangeTransitionEnd() {
        fitActive(this.realIndex);
      },
      resize() {
        slides.forEach((_, i) => fitActive(i));
      },
    },
  });
  slides.forEach((_, i) => loadSlide(i));
  chartLive.addEventListener("mouseenter", () => swiper.autoplay?.stop());
  chartLive.addEventListener("mouseleave", () => swiper.autoplay?.start());
}

if (mapFrame) {
  const url = new URL(pageUrl("explore/map.html"));
  url.searchParams.set("embed", "1");
  mapFrame.src = url.href;
}

document.querySelectorAll(".stats-orbs .stat").forEach((el) => {
  el.addEventListener("mousemove", (ev) => {
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--tilt-x", `${(-y * 18).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${(x * 20).toFixed(2)}deg`);
  });
  el.addEventListener("mouseleave", () => {
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  });
});

const prinCube = document.getElementById("prin-cube");
const prinPag = document.getElementById("prin-3d-pag");
const prinStage = prinCube?.parentElement;
if (prinCube && prinPag && prinStage) {
  const count = prinCube.querySelectorAll(".prin-jelly-side").length;
  const buttons = [];
  let index = 0;
  let timer = 0;

  for (let i = 0; i < count; i += 1) {
    const label = String(i + 1).padStart(2, "0");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", label);
    if (i === 0) btn.classList.add("is-on");
    btn.innerHTML = `<span class="prin-3d-box"><span class="prin-3d-face front">${label}</span><span class="prin-3d-face bottom">${label}</span></span>`;
    prinPag.appendChild(btn);
    buttons.push(btn);
  }

  const layout = () => {
    const r = Math.max(140, Math.round(prinStage.clientWidth * 0.5));
    prinCube.style.setProperty("--r", `${r}px`);
    prinCube.style.transform = `rotateY(${-index * 120}deg)`;
    buttons.forEach((btn, i) => btn.classList.toggle("is-on", i === index));
  };

  const go = (next) => {
    index = (next + count) % count;
    layout();
  };

  const play = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => go(index + 1), 4800);
  };

  buttons.forEach((btn, i) => btn.addEventListener("click", () => go(i)));
  prinStage.addEventListener("mouseenter", () => window.clearInterval(timer));
  prinStage.addEventListener("mouseleave", play);
  window.addEventListener("resize", layout);
  layout();
  play();
}

function revealOnScroll() {
  const nodes = [
    ...document.querySelectorAll(".ed-reveal"),
    document.querySelector(".site-footer"),
  ].filter(Boolean);
  nodes.forEach((el) => {
    if (!el.classList.contains("ed-reveal")) {
      el.classList.add("ed-reveal", "ed-reveal-fade");
    }
  });
  if (!document.documentElement.classList.contains("ed-motion")) {
    nodes.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
  );
  nodes.forEach((el) => io.observe(el));
}
revealOnScroll();


