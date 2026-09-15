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
      return;
    }
    if (frame.getAttribute("src") !== srcFor(spec)) frame.src = srcFor(spec);
    return;
  }
  live.hidden = true;
  pendingD.hidden = key !== "d";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => showTab(tab.dataset.tab));
});
showTab("a");
