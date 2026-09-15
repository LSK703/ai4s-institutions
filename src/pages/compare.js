import "../shell.js";
import { getLocale, t } from "../i18n.js";
import { figureUrl } from "../paths.js";

const LIVE = {
  a: { view: "compare", tab: "volume", noteKey: "compareTabANote" },
  b: { view: "compare", tab: "index", noteKey: "compareTabBNote" },
  c: { view: "compare", tab: "oe", noteKey: "compareTabCNote" },
};

const locale = getLocale();
const tabs = document.querySelectorAll(".tab");
const live = document.getElementById("compare-live");
const frame = document.getElementById("compare-frame");
const tabNote = document.getElementById("compare-tab-note");
const pendingD = document.getElementById("compare-pending-d");

function srcFor(spec) {
  return figureUrl("ch03_institutions.html", {
    embed: "1",
    lang: locale,
    view: spec.view,
    tab: spec.tab,
    v: "clip6",
  });
}

function fitCompareFrame() {
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
      style.textContent = `
        html, body { overflow: visible !important; height: auto !important; max-height: none !important; }
        #plot-cn, #plot-gb, .plot { height: ${PLOT_H}px !important; max-height: none !important; }
      `;
      const Plotly = frame.contentWindow?.Plotly;
      ["plot-cn", "plot-gb"].forEach((id) => {
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
  if (spec) {
    live.hidden = false;
    pendingD.hidden = true;
    tabNote.textContent = t(spec.noteKey);
    const api = frame.contentWindow?.AI4S_CH03;
    if (api) {
      api.setTab(spec.tab);
      fitCompareFrame();
      return;
    }
    if (frame.getAttribute("src") !== srcFor(spec)) frame.src = srcFor(spec);
    else fitCompareFrame();
    return;
  }
  live.hidden = true;
  pendingD.hidden = key !== "d";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => showTab(tab.dataset.tab));
});
frame.addEventListener("load", fitCompareFrame);
showTab("a");
