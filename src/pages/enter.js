import { applyTheme, bindThemeToggle } from "../theme.js";
import { applyI18n, getLocale, setLocale, t } from "../i18n.js?v=ed8";
import { startGlobe } from "../globe.js?v=earth1";

applyTheme();
applyI18n();
document.documentElement.lang = getLocale() === "zh" ? "zh-CN" : "en";
document.title = t("brand");

const themeBtn = document.getElementById("theme-toggle");
if (themeBtn) {
  themeBtn.dataset.labelLight = t("themeLight");
  themeBtn.dataset.labelDark = t("themeDark");
  bindThemeToggle(themeBtn);
}

document.getElementById("lang-toggle")?.addEventListener("click", () => {
  setLocale(getLocale() === "zh" ? "en" : "zh");
  window.location.reload();
});

const canvas = document.getElementById("silk");
if (canvas) startGlobe(canvas);
