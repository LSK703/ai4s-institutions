import "../shell.js?v=sign3";
import { getLocale, t } from "../i18n.js?v=ed5";
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
    return figureUrl(spec.figure, { embed: "1", lang: locale, v: "d1" });
  }
  return figureUrl("ch03_institutions.html", {
    embed: "1",
    lang: locale,
    view: spec.view,
    tab: spec.tab,
    v: "clip6",
  });
}

function isMixFrame() {
  return /ch03_cn_uk_discipline/.test(frame.getAttribute("src") || "");
}

function fitCompareFrame() {
  const mix = isMixFrame();
  const PLOT_H = 900;
  const grow = () => {
    try {
      frame.style.height = "1200px";
      frame.style.minHeight = "1200px";
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
        #plot { height: ${PLOT_H}px !important; max-height: none !important; }
      `
        : `
        html, body { overflow: visible !important; height: auto !important; max-height: none !important; }
        #plot-cn, #plot-gb, .plot { height: ${PLOT_H}px !important; max-height: none !important; }
      `;
      const Plotly = frame.contentWindow?.Plotly;
      const ids = mix ? ["plot"] : ["plot-cn", "plot-gb"];
      ids.forEach((id) => {
        const gd = doc.getElementById(id);
        if (!gd) return;
        gd.style.height = `${PLOT_H}px`;
        if (Plotly?.relayout) Plotly.relayout(gd, { height: PLOT_H, autosize: true });
        else if (Plotly?.Plots?.resize) Plotly.Plots.resize(gd);
      });
      const measured = Math.max(
        doc.documentElement?.scrollHeight || 0,
        doc.body?.scrollHeight || 0,
        PLOT_H + 160
      );
      frame.style.height = `${Math.max(1200, Math.ceil(measured + 24))}px`;
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
