import { applyTheme, bindThemeToggle } from "./theme.js";
import { applyI18n, getLocale, setLocale, t } from "./i18n.js";
import { pageUrl } from "./paths.js";

applyTheme();

if (!document.querySelector("link[data-ai4s-css]")) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `${new URL("./styles.css", import.meta.url).href}?v=clip5`;
  link.dataset.ai4sCss = "1";
  document.head.appendChild(link);
}

const PAGE = document.body.dataset.page || "home";
const EXPLORE = new Set(["list", "chart", "map", "compare"]);
const INFO = new Set(["data", "indicators", "institutions", "use"]);

const THEME_ICON = `
  <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
  </svg>
  <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16.5 13.5A7 7 0 0 1 10 4.1 7 7 0 1 0 19.9 14a7 7 0 0 1-3.4-.5z"/>
  </svg>`;

function headerHtml() {
  return `
    <div class="header-inner">
      <a class="brand" href="${pageUrl("index.html")}">
        <span class="brand-mark-box">AI4S</span>
        <span class="brand-text">
          <span class="brand-mark" data-i18n="brand"></span>
          <span class="brand-sub" data-i18n="brandSub"></span>
        </span>
      </a>
      <nav class="nav">
        <a href="${pageUrl("home.html")}" data-page="home" data-i18n="navHome"></a>
        <div class="nav-drop ${EXPLORE.has(PAGE) ? "current" : ""}">
          <span data-i18n="navExplore"></span>
          <div class="menu">
            <a href="${pageUrl("explore/list.html")}" data-page="list" data-i18n="navList"></a>
            <a href="${pageUrl("explore/chart.html")}" data-page="chart" data-i18n="navChart"></a>
            <a href="${pageUrl("explore/map.html")}" data-page="map" data-i18n="navMap"></a>
            <a href="${pageUrl("explore/compare.html")}" data-page="compare" data-i18n="navCompare"></a>
          </div>
        </div>
        <div class="nav-drop ${INFO.has(PAGE) ? "current" : ""}">
          <span data-i18n="navInfo"></span>
          <div class="menu">
            <a href="${pageUrl("info/data.html")}" data-page="data" data-i18n="navData"></a>
            <a href="${pageUrl("info/indicators.html")}" data-page="indicators" data-i18n="navIndicators"></a>
            <a href="${pageUrl("info/institutions.html")}" data-page="institutions" data-i18n="navInstitutions"></a>
            <a href="${pageUrl("info/responsible-use.html")}" data-page="use" data-i18n="navUse"></a>
          </div>
        </div>
      </nav>
      <div class="header-tools">
        <button class="icon-btn theme-toggle" type="button" id="theme-toggle">${THEME_ICON}</button>
        <button class="lang-toggle" type="button" id="lang-toggle" data-i18n="langBtn"></button>
      </div>
    </div>
    <div class="banner" data-i18n="banner"></div>
  `;
}

function mount() {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  if (header) {
    header.classList.add("site-header");
    header.innerHTML = headerHtml();
  }
  if (footer) {
    footer.classList.add("site-footer");
    footer.innerHTML = `
      <div class="footer-inner">
        <span data-i18n="footer"></span>
        <a href="${pageUrl("info/responsible-use.html")}" data-i18n="navUse"></a>
      </div>`;
  }

  applyI18n();
  header?.querySelectorAll(".nav a").forEach((a) => {
    if (a.dataset.page === PAGE) a.classList.add("current");
  });

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
}

mount();
if (PAGE === "home") document.title = `${t("brand")} ${t("brandSub")}`;
