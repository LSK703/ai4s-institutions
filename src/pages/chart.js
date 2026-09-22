import "../shell.js?v=sign6";
import { getLocale, t } from "../i18n.js?v=ed9";
import { figureUrl } from "../paths.js";

const PRESETS = {
  "scale-quality": {
    kind: "file",
    file: { zh: "ch05_fig2_x2000_zh.html", en: "ch05_fig2_x2000_en.html" },
    xyKey: "chartNoteQuality",
  },
  "scale-eff": {
    kind: "ch03",
    view: "size",
    xyKey: "chartNoteScaleEff",
  },
  "expected-obs": {
    kind: "ch03",
    view: "obs",
    xyKey: "chartNoteExpectedObs",
  },
  "scale-collab": {
    kind: "file",
    file: { zh: "ch04_fig6_1_zh.html", en: "ch04_fig6_1_en.html" },
    xyKey: "chartNoteDiscMulti",
  },
  "disc-intl": {
    kind: "file",
    file: { zh: "ch04_fig6_4_zh.html", en: "ch04_fig6_4_en.html" },
    xyKey: "chartNoteDiscIntl",
  },
};

const preset = document.getElementById("preset");
const note = document.getElementById("preset-note");
const slot = document.getElementById("chart-slot");
const locale = getLocale();

function ch03Src(view) {
  return figureUrl("ch03_institutions.html", {
    embed: "1",
    lang: locale,
    view,
    v: "cr1",
  });
}

function frameEl() {
  return slot.querySelector("iframe.figure-frame");
}

function clipChartFrame(iframe) {
  if (!iframe) return;
  const CLIP = 540;
  const PLOT = 520;
  iframe.style.height = `${CLIP}px`;
  iframe.style.maxHeight = `${CLIP}px`;
  iframe.style.overflow = "hidden";

  const clipDoc = () => {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      let style = doc.getElementById("ai4s-clip");
      if (!style) {
        style = doc.createElement("style");
        style.id = "ai4s-clip";
        doc.head.appendChild(style);
      }
      style.textContent = `
        html, body {
          height: auto !important;
          max-height: ${CLIP}px !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding-bottom: 0 !important;
        }
        .chart-shell,
        .plotly-graph-div,
        .js-plotly-plot,
        .svg-container,
        .plot,
        .plot.scatter {
          height: ${PLOT}px !important;
          max-height: ${PLOT}px !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
      `;
      const Plotly = iframe.contentWindow?.Plotly;
      if (Plotly?.relayout) {
        doc.querySelectorAll(".js-plotly-plot").forEach((gd) => {
          Plotly.relayout(gd, { height: PLOT, autosize: true });
        });
      }
    } catch {
      /* same-origin figures only */
    }
  };

  iframe.addEventListener("load", () => {
    clipDoc();
    window.setTimeout(clipDoc, 50);
    window.setTimeout(clipDoc, 250);
    window.setTimeout(clipDoc, 800);
  });
}

function applyCh03View(view) {
  const api = frameEl()?.contentWindow?.AI4S_CH03;
  if (api) {
    api.setView(view);
    return true;
  }
  return false;
}

function render() {
  const item = PRESETS[preset.value];
  const tight = preset.value === "scale-quality";
  note.textContent = t(item.xyKey);
  if (item.kind === "file") {
    const src = figureUrl(item.file[locale] || item.file.zh);
    slot.innerHTML = tight
      ? `<div class="figure-well tight"><iframe class="figure-frame chart tight" title="${t("chartTitle")}" src="${src}"></iframe></div>`
      : `<div class="figure-well"><iframe class="figure-frame chart" title="${t("chartTitle")}" src="${src}"></iframe></div>`;
    if (tight) clipChartFrame(frameEl());
    return;
  }
  const frame = frameEl();
  if (frame && !frame.classList.contains("tight") && applyCh03View(item.view)) return;
  slot.innerHTML = `<div class="figure-well"><iframe class="figure-frame chart" title="${t("chartTitle")}" src="${ch03Src(item.view)}"></iframe></div>`;
}

preset.addEventListener("change", render);
render();
