import "../shell.js";
import { getLocale, t } from "../i18n.js";
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
  });
}

function frameEl() {
  return slot.querySelector("iframe.figure-frame");
}

function fitChartFrame(iframe) {
  const apply = () => {
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const plot = doc.querySelector(".js-plotly-plot, .plotly-graph-div");
      const h = plot?.getBoundingClientRect().height || doc.body?.scrollHeight || 0;
      if (h > 240) iframe.style.height = `${Math.round(h + 12)}px`;
    } catch {
      /* same-origin figures only */
    }
  };
  iframe.addEventListener("load", () => {
    apply();
    window.setTimeout(apply, 200);
    window.setTimeout(apply, 700);
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
  note.textContent = t(item.xyKey);
  if (item.kind === "file") {
    const src = figureUrl(item.file[locale] || item.file.zh);
    slot.innerHTML = `<div class="figure-well"><iframe class="figure-frame chart" title="${t("chartTitle")}" src="${src}"></iframe></div>`;
    fitChartFrame(frameEl());
    return;
  }
  const frame = frameEl();
  if (frame && applyCh03View(item.view)) return;
  slot.innerHTML = `<div class="figure-well"><iframe class="figure-frame chart" title="${t("chartTitle")}" src="${ch03Src(item.view)}"></iframe></div>`;
  fitChartFrame(frameEl());
}

preset.addEventListener("change", render);
render();
