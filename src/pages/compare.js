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
  });
}

function fitCompareFrame() {
  const COMPARE_H = 980;
  const PLOT_H = 820;
  frame.style.height = `${COMPARE_H}px`;
  frame.style.minHeight = `${COMPARE_H}px`;
  frame.style.maxHeight = "none";
  const grow = () => {
    try {
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
        .plot { height: ${PLOT_H}px !important; max-height: none !important; }
      `;
      const Plotly = frame.contentWindow?.Plotly;
      if (Plotly?.Plots?.resize) {
        doc.querySelectorAll(".js-plotly-plot").forEach((gd) => Plotly.Plots.resize(gd));
      }
    } catch {
      /* same-origin figures only */
    }
  };
  grow();
  window.setTimeout(grow, 80);
  window.setTimeout(grow, 400);
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
