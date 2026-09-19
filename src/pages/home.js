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
    src: figureUrl(locale === "zh" ? "ch05_fig2_x2000_zh.html" : "ch05_fig2_x2000_en.html"),
  },
  {
    titleKey: "presetScaleEff",
    src: figureUrl("ch03_institutions.html", { embed: "1", lang: locale, view: "size" }),
  },
  {
    titleKey: "presetExpectedObs",
    src: figureUrl("ch03_institutions.html", { embed: "1", lang: locale, view: "obs" }),
  },
  {
    titleKey: "presetScaleCollab",
    src: figureUrl(locale === "zh" ? "ch04_fig6_1_zh.html" : "ch04_fig6_1_en.html"),
  },
  {
    titleKey: "presetDiscIntl",
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

function showSlide(next) {
  if (!chartFrame || !slides.length) return;
  index = (next + slides.length) % slides.length;
  const slide = slides[index];
  if (chartCaption) chartCaption.textContent = t(slide.titleKey);
  paintDots();
  chartFrame.classList.add("is-wait");
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
  chartFrame.addEventListener("load", () => chartFrame.classList.remove("is-wait"));
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
