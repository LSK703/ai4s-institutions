import { applyTheme, bindThemeToggle } from "../theme.js";
import { applyI18n, getLocale, setLocale, t } from "../i18n.js?v=ed7";
import { startSilk } from "../silk-ribbon.js";

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
if (canvas) startSilk(canvas);
