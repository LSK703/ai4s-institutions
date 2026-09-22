import "../shell.js?v=sign6";
import { getLocale, t } from "../i18n.js?v=ed9";
import { figureUrl } from "../paths.js";

const LIVE = {
  a: { view: "compare", tab: "volume", noteKey: "compareTabANote" },
  b: { view: "compare", tab: "index", noteKey: "compareTabBNote" },
  c: { view: "compare", tab: "oe", noteKey: "compareTabCNote" },
  d: { figure: "ch03_cn_uk_discipline.html", noteKey: "compareTabDNote" },
};

const locale = getLocale();
const tabs = document.querySelectorAll(".tab");
const live = document.getElementById("compare-live");
const frame = document.getElementById("compare-frame");
const tabNote = document.getElementById("compare-tab-note");

function srcFor(spec) {
  if (spec.figure) {
    return figureUrl(spec.figure, { embed: "1", lang: locale, v: "d2" });
  }
  return figureUrl("ch03_institutions.html", {
    embed: "1",
    lang: locale,
    view: spec.view,
    tab: spec.tab,
    v: "cr1",
  });
}

function isMixFrame() {
  return /ch03_cn_uk_discipline/.test(frame.getAttribute("src") || "");
}

function fitCompareFrame() {
  const mix = isMixFrame();
  const PLOT_H = 900;
  const SYS_H = 280;
  const UNI_H = 520;
  const grow = () => {
    try {
      frame.style.height = mix ? "1480px" : "1200px";
      frame.style.minHeight = mix ? "1480px" : "1200px";
      frame.style.maxHeight = "none";
      const doc = frame.contentDocument;
      if (!doc) return;
      let style = doc.getElementById("ai4s-compare-fit");
      if (!style) {
        style = doc.createElement("style");
        style.id = "ai4s-compare-fit";
        doc.head.appendChild(style);
      }
      style.textContent = mix
        ? `
        html, body { overflow: visible !important; height: auto !important; max-height: none !important; }
        #plot-sys { height: ${SYS_H}px !important; max-height: none !important; }
        #plot-cn, #plot-gb { height: ${UNI_H}px !important; max-height: none !important; }
      `
        : `
        html, body { overflow: visible !important; height: auto !important; max-height: none !important; }
        #plot-cn, #plot-gb, .plot { height: ${PLOT_H}px !important; max-height: none !important; }
      `;
      const Plotly = frame.contentWindow?.Plotly;
      const ids = mix
        ? [["plot-sys", SYS_H], ["plot-cn", UNI_H], ["plot-gb", UNI_H]]
        : [["plot-cn", PLOT_H], ["plot-gb", PLOT_H]];
      ids.forEach(([id, h]) => {
        const gd = doc.getElementById(id);
        if (!gd) return;
        gd.style.height = `${h}px`;
        if (Plotly?.relayout) Plotly.relayout(gd, { height: h, autosize: true });
        else if (Plotly?.Plots?.resize) Plotly.Plots.resize(gd);
      });
      const measured = Math.max(
        doc.documentElement?.scrollHeight || 0,
        doc.body?.scrollHeight || 0,
        mix ? SYS_H + UNI_H * 2 + 220 : PLOT_H + 160
      );
      frame.style.height = `${Math.max(mix ? 1480 : 1200, Math.ceil(measured + 24))}px`;
    } catch {
      /* same-origin figures only */
    }
  };
  grow();
  window.setTimeout(grow, 80);
  window.setTimeout(grow, 300);
  window.setTimeout(grow, 900);
}

function showTab(key) {
  tabs.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === key));
  const spec = LIVE[key];
  if (!spec) return;
  live.hidden = false;
  tabNote.textContent = t(spec.noteKey);
  const next = srcFor(spec);
  const api = frame.contentWindow?.AI4S_CH03;
  if (!spec.figure && api && frame.getAttribute("src") && !isMixFrame()) {
    api.setTab(spec.tab);
    fitCompareFrame();
    return;
  }
  if (frame.getAttribute("src") !== next) frame.src = next;
  else fitCompareFrame();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => showTab(tab.dataset.tab));
});
frame.addEventListener("load", fitCompareFrame);
showTab("a");
