import "../shell.js?v=sign4";
import { getLocale, t } from "../i18n.js";
import {
  countryName,
  fmtIndex,
  fmtInt,
  fmtPct,
  loadInstitutions,
  profileHref,
} from "../data.js";
import { cityName, uniName } from "../geo-labels.js";

const Plotly = window.Plotly;

const ISO3 = {
  AE: "ARE", AR: "ARG", AT: "AUT", AU: "AUS", AZ: "AZE", BA: "BIH", BD: "BGD",
  BE: "BEL", BG: "BGR", BH: "BHR", BJ: "BEN", BN: "BRN", BR: "BRA", BY: "BLR",
  CA: "CAN", CH: "CHE", CL: "CHL", CM: "CMR", CN: "CHN", CO: "COL", CR: "CRI",
  CY: "CYP", CZ: "CZE", DE: "DEU", DK: "DNK", DZ: "DZA", EC: "ECU", EE: "EST",
  EG: "EGY", ES: "ESP", ET: "ETH", FI: "FIN", FJ: "FJI", FR: "FRA", GB: "GBR",
  GE: "GEO", GH: "GHA", GR: "GRC", HK: "HKG", HR: "HRV", HU: "HUN", ID: "IDN",
  IE: "IRL", IL: "ISR", IN: "IND", IQ: "IRQ", IR: "IRN", IS: "ISL", IT: "ITA",
  JO: "JOR", JP: "JPN", KE: "KEN", KR: "KOR", KW: "KWT", KZ: "KAZ", LB: "LBN",
  LK: "LKA", LT: "LTU", LU: "LUX", LV: "LVA", MA: "MAR", ME: "MNE", MK: "MKD",
  MO: "MAC", MT: "MLT", MX: "MEX", MY: "MYS", NG: "NGA", NL: "NLD", NO: "NOR",
  NP: "NPL", NZ: "NZL", OM: "OMN", PE: "PER", PH: "PHL", PK: "PAK", PL: "POL",
  PR: "PRI", PT: "PRT", QA: "QAT", RO: "ROU", RS: "SRB", RU: "RUS", RW: "RWA",
  SA: "SAU", SE: "SWE", SG: "SGP", SI: "SVN", SK: "SVK", SN: "SEN", TH: "THA",
  TN: "TUN", TR: "TUR", TW: "TWN", UA: "UKR", UG: "UGA", US: "USA", UY: "URY",
  VN: "VNM", ZA: "ZAF",
};

const WORLD_LINKS = 36;
const locale = getLocale();
const thresholdEl = document.getElementById("threshold");
const colorEl = document.getElementById("color");
const qEl = document.getElementById("q");
const qField = document.getElementById("field-q");
const countLine = document.getElementById("count-line");
const noteEl = document.getElementById("map-note");
const plotEl = document.getElementById("map-plot");
const frameEl = document.getElementById("map-frame");
const cardEl = document.getElementById("map-card");
const cardTitle = document.getElementById("card-title");
const cardKpis = document.getElementById("card-kpis");
const cardList = document.getElementById("card-list");
const cardCta = document.getElementById("card-cta");
const backBtn = document.getElementById("map-back");
const titleEl = document.getElementById("map-heading-title");
const ledeEl = document.getElementById("map-heading-lede");
const form = document.getElementById("filters");

const view = { level: "world", country: "" };
let hoverCode = "";
let hideTimer = 0;

function themeVars() {
  const dark = document.documentElement.dataset.theme !== "light";
  return {
    dark,
    paper: dark ? "#141a22" : "#f3f5f8",
    land: dark ? "#1b2430" : "#d9e2ea",
    lake: dark ? "#141a22" : "#f3f5f8",
    line: dark ? "#3a4a5c" : "#b7c6d4",
    ink: dark ? "#eef2f6" : "#1a2330",
    muted: dark ? "#9aa5b4" : "#5c6b7a",
    marker: dark ? "#8ec5e0" : "#1f5a86",
    heatLine: dark ? "rgba(126, 182, 212, 0.32)" : "rgba(31, 90, 134, 0.28)",
    heatLineHi: dark ? "rgba(180, 220, 240, 0.9)" : "rgba(31, 90, 134, 0.85)",
    colorscale: dark
      ? [
          [0, "#1c2a38"],
          [0.25, "#2a4a63"],
          [0.5, "#3d7396"],
          [0.75, "#7eb6d4"],
          [1, "#d7eef8"],
        ]
      : [
          [0, "#e8f1f6"],
          [0.25, "#b7d3e4"],
          [0.5, "#6fa3c2"],
          [0.75, "#2d6e96"],
          [1, "#143d5c"],
        ],
  };
}

function labelOf(row, geo) {
  return uniName(row, geo, locale);
}

function hash01(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
}

function jitter(id, lat, lng) {
  const a = hash01(id) * Math.PI * 2;
  const r = 0.12 + hash01(`${id}r`) * 0.1;
  return { lat: lat + Math.sin(a) * r * 0.35, lng: lng + Math.cos(a) * r * 0.45 };
}

function countryStats(rows) {
  const by = new Map();
  for (const r of rows) {
    const c = r.org_country;
    if (!c) continue;
    const cur = by.get(c) || { n: 0, papers: 0, top: 0, topN: 0, idx: 0, idxN: 0, rows: [] };
    cur.n += 1;
    cur.papers += Number(r.n_ai4s) || 0;
    cur.rows.push(r);
    if (r.top_rate != null && !Number.isNaN(Number(r.top_rate))) {
      cur.top += Number(r.top_rate);
      cur.topN += 1;
    }
    if (r.discipline_adjusted_index != null && !Number.isNaN(Number(r.discipline_adjusted_index))) {
      cur.idx += Number(r.discipline_adjusted_index);
      cur.idxN += 1;
    }
    by.set(c, cur);
  }
  return by;
}

function countryZ(stat, metric) {
  if (metric === "n_orgs") return stat.n;
  if (metric === "top_rate") return stat.topN ? stat.top / stat.topN : 0;
  return stat.papers;
}

function centroids(rows, coords) {
  const acc = new Map();
  for (const r of rows) {
    const g = coords[r.org_id];
    if (!g || !r.org_country) continue;
    const cur = acc.get(r.org_country) || { lat: 0, lng: 0, w: 0 };
    const w = Math.max(1, Number(r.n_ai4s) || 1);
    cur.lat += g.lat * w;
    cur.lng += g.lng * w;
    cur.w += w;
    acc.set(r.org_country, cur);
  }
  const out = {};
  for (const [code, v] of acc) out[code] = { lat: v.lat / v.w, lng: v.lng / v.w };
  return out;
}

function cityGroups(rows, coords) {
  const by = new Map();
  for (const r of rows) {
    const g = coords[r.org_id];
    if (!g) continue;
    const key = g.city || `${g.lat.toFixed(2)},${g.lng.toFixed(2)}`;
    const cur = by.get(key) || { city: g.city || key, lat: 0, lng: 0, n: 0, papers: 0, w: 0 };
    const w = Math.max(1, Number(r.n_ai4s) || 1);
    cur.lat += g.lat * w;
    cur.lng += g.lng * w;
    cur.w += w;
    cur.n += 1;
    cur.papers += Number(r.n_ai4s) || 0;
    by.set(key, cur);
  }
  return [...by.values()].map((c) => ({ ...c, lat: c.lat / c.w, lng: c.lng / c.w }));
}

function geoBounds(points) {
  if (!points.length) return null;
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  const padLat = Math.max(3.2, (maxLat - minLat) * 0.28);
  const padLng = Math.max(4.5, (maxLng - minLng) * 0.28);
  return {
    lataxis: { range: [Math.max(-80, minLat - padLat), Math.min(90, maxLat + padLat)] },
    lonaxis: { range: [minLng - padLng, maxLng + padLng] },
  };
}

function matchesQuery(row, geo, q) {
  const hay = [
    row.org_name,
    row.org_name_zh,
    geo?.zh,
    uniName(row, geo, locale),
    cityName(geo?.city, locale),
    geo?.city,
    row.org_id,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function heatColor(t, theme) {
  const stops = theme.colorscale;
  const x = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < stops.length - 2 && x > stops[i + 1][0]) i += 1;
  const a = stops[i];
  const b = stops[i + 1];
  const u = (x - a[0]) / Math.max(1e-6, b[0] - a[0]);
  const hex = (c) => parseInt(c.slice(1), 16);
  const mix = (p, q, k) => Math.round(p + (q - p) * k);
  const pa = hex(a[1]);
  const pb = hex(b[1]);
  const r = mix((pa >> 16) & 255, (pb >> 16) & 255, u);
  const g = mix((pa >> 8) & 255, (pb >> 8) & 255, u);
  const bl = mix(pa & 255, pb & 255, u);
  return `rgb(${r},${g},${bl})`;
}

function lineTrace(links, cents, theme, highlight) {
  const lat = [];
  const lon = [];
  const maxW = Math.max(1, ...links.map((l) => l.w));
  const widths = [];
  for (const l of links) {
    const a = cents[l.a];
    const b = cents[l.b];
    if (!a || !b) continue;
    const midLat = (a.lat + b.lat) / 2 + Math.abs(a.lng - b.lng) * 0.06;
    const midLng = (a.lng + b.lng) / 2;
    lat.push(a.lat, midLat, b.lat, null);
    lon.push(a.lng, midLng, b.lng, null);
    widths.push(0.6 + 3.2 * Math.sqrt(l.w / maxW));
  }
  return {
    type: "scattergeo",
    lat,
    lon,
    mode: "lines",
    hoverinfo: "skip",
    line: {
      color: highlight ? theme.heatLineHi : theme.heatLine,
      width: highlight ? 1.6 : 0.9,
    },
    opacity: highlight ? 0.95 : 1,
    name: t("mapCollab"),
  };
}

function showCard(code, stat, coords, ev) {
  hoverCode = code;
  cardTitle.textContent = countryName(code, locale);
  const meanTop = stat.topN ? fmtPct(stat.top / stat.topN) : "—";
  const meanIdx = stat.idxN ? fmtIndex(stat.idx / stat.idxN) : "—";
  cardKpis.innerHTML = `
    <div><b>${fmtInt(stat.n)}</b><span>${t("mapHoverOrgs")}</span></div>
    <div><b>${fmtInt(stat.papers)}</b><span>${t("mapHoverN")}</span></div>
    <div><b>${meanIdx}</b><span>${t("mapKpiIndex")}</span></div>
    <div><b>${meanTop}</b><span>${t("mapHoverTop")}</span></div>`;
  const top = [...stat.rows].sort((a, b) => b.n_ai4s - a.n_ai4s).slice(0, 5);
  cardList.innerHTML = top
    .map((r) => `<li><span>${labelOf(r, coords[r.org_id])}</span><em>${fmtInt(r.n_ai4s)}</em></li>`)
    .join("");
  cardCta.dataset.country = code;
  cardEl.hidden = false;

  const rect = frameEl.getBoundingClientRect();
  const x = ev?.event?.clientX ?? rect.left + rect.width * 0.62;
  const y = ev?.event?.clientY ?? rect.top + 80;
  const cardW = cardEl.offsetWidth || 280;
  const cardH = cardEl.offsetHeight || 320;
  let left = x - rect.left + 14;
  let topPx = y - rect.top - 20;
  if (left + cardW > rect.width - 8) left = x - rect.left - cardW - 14;
  if (left < 8) left = 8;
  if (topPx + cardH > rect.height - 8) topPx = rect.height - cardH - 8;
  if (topPx < 8) topPx = 8;
  cardEl.style.left = `${left}px`;
  cardEl.style.top = `${topPx}px`;
}

function hideCardSoon() {
  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    if (cardEl.matches(":hover")) return;
    cardEl.hidden = true;
    hoverCode = "";
  }, 180);
}

function setChrome() {
  const countryView = view.level === "country";
  backBtn.hidden = !countryView;
  qField.hidden = !countryView;
  titleEl.textContent = countryView ? countryName(view.country, locale) : t("mapTitle");
  ledeEl.textContent = countryView ? t("mapLedeCountry") : t("mapLede");
  noteEl.textContent = countryView ? t("mapNoteCountry") : t("mapNoteWorld");
}

function render(rows, geo, collab) {
  if (!Plotly) return;
  const minN = Number(thresholdEl.value);
  const metric = colorEl.value;
  const theme = themeVars();
  const coords = geo.coords || {};
  const pool = rows.filter((r) => r.n_ai4s >= minN && coords[r.org_id]);
  const stats = countryStats(pool);
  const cents = centroids(pool, coords);
  setChrome();

  const traces = [];
  let bounds = null;

  if (view.level === "world") {
    const codes = [...stats.keys()].filter((c) => ISO3[c]);
    traces.push({
      type: "choropleth",
      locationmode: "ISO-3",
      locations: codes.map((c) => ISO3[c]),
      z: codes.map((c) => countryZ(stats.get(c), metric)),
      customdata: codes,
      hoverinfo: "none",
      colorscale: theme.colorscale,
      marker: { line: { color: theme.line, width: 0.45 } },
      colorbar: {
        thickness: 12,
        len: 0.52,
        y: 0.5,
        tickfont: { color: theme.muted, size: 11 },
        outlinewidth: 0,
        bgcolor: "rgba(0,0,0,0)",
      },
      autocolorscale: false,
    });
    const skeleton = (collab.links || [])
      .filter((l) => cents[l.a] && cents[l.b])
      .slice(0, WORLD_LINKS);
    traces.push(lineTrace(skeleton, cents, theme, false));
    countLine.textContent = t("mapCountWorld", { n: codes.length, min: minN });
  } else {
    const q = (qEl.value || "").trim().toLowerCase();
    let points = pool.filter((r) => r.org_country === view.country);
    if (q) points = points.filter((r) => matchesQuery(r, coords[r.org_id], q));
    const cities = cityGroups(points, coords);
    const maxCity = Math.max(1, ...cities.map((c) => c.papers));
    traces.push({
      type: "choropleth",
      locationmode: "ISO-3",
      locations: ISO3[view.country] ? [ISO3[view.country]] : [],
      z: [1],
      hoverinfo: "skip",
      colorscale: [
        [0, theme.land],
        [1, theme.dark ? "#2a3a4c" : "#cfdbe6"],
      ],
      showscale: false,
      marker: { line: { color: theme.line, width: 0.6 } },
    });
    traces.push({
      type: "scattergeo",
      lat: cities.map((c) => c.lat),
      lon: cities.map((c) => c.lng),
      text: cities.map((c) => {
        const place = cityName(c.city, locale) || (locale === "zh" ? "" : c.city);
        const title = place || t("mapRegions");
        return `<b>${title}</b><br>${t("mapHoverOrgs")}: ${fmtInt(c.n)}<br>${t("mapHoverN")}: ${fmtInt(c.papers)}`;
      }),
      hoverinfo: "text",
      mode: "markers",
      marker: {
        size: cities.map((c) => 14 + 28 * Math.sqrt(c.papers / maxCity)),
        color: cities.map((c) => heatColor(Math.sqrt(c.papers / maxCity), theme)),
        opacity: 0.38,
        line: { width: 0 },
      },
      name: t("mapRegions"),
    });
    const maxN = Math.max(1, ...points.map((r) => r.n_ai4s));
    traces.push({
      type: "scattergeo",
      lat: points.map((r) => jitter(r.org_id, coords[r.org_id].lat, coords[r.org_id].lng).lat),
      lon: points.map((r) => jitter(r.org_id, coords[r.org_id].lat, coords[r.org_id].lng).lng),
      text: points.map((r) => {
        const g = coords[r.org_id];
        const place = cityName(g.city, locale);
        const locLine = place ? `<br>${place}` : "";
        return `<b>${labelOf(r, g)}</b>${locLine}<br>${t("mapHoverN")}: ${fmtInt(r.n_ai4s)}`;
      }),
      customdata: points.map((r) => r.org_id),
      hoverinfo: "text",
      mode: "markers",
      marker: {
        size: points.map((r) => 3.2 + 3.4 * Math.sqrt(r.n_ai4s / maxN)),
        color: theme.marker,
        opacity: 0.9,
        line: { width: 0.4, color: theme.dark ? "#0d141c" : "#fff" },
      },
      name: t("mapPoints"),
    });
    bounds = geoBounds(points.map((r) => coords[r.org_id]));
    countLine.textContent = t("mapCountCountry", {
      name: countryName(view.country, locale),
      n: points.length,
      cities: cities.length,
    });
  }

  const layout = {
    margin: { t: 8, r: 8, b: 8, l: 8 },
    paper_bgcolor: theme.paper,
    plot_bgcolor: theme.paper,
    showlegend: false,
    geo: {
      bgcolor: theme.paper,
      landcolor: theme.land,
      lakecolor: theme.lake,
      oceancolor: theme.paper,
      subunitcolor: theme.line,
      countrycolor: theme.line,
      coastlinecolor: theme.line,
      showframe: false,
      showcoastlines: true,
      showlakes: true,
      showland: true,
      showcountries: view.level === "world",
      projection: { type: "natural earth" },
      lataxis: bounds?.lataxis || { range: [-56, 84] },
      lonaxis: bounds?.lonaxis || { range: [-170, 190] },
    },
    hoverlabel: {
      bgcolor: theme.dark ? "#1c2430" : "#fff",
      bordercolor: theme.line,
      font: { color: theme.ink, family: "Source Sans 3, Noto Sans SC, sans-serif", size: 12 },
      align: "left",
    },
  };
  Plotly.react(plotEl, traces, layout, { displayModeBar: false, responsive: true });
}

async function loadJson(rel) {
  const res = await fetch(new URL(rel, import.meta.url).href);
  if (!res.ok) return null;
  return res.json();
}

const [payload, geo, collab] = await Promise.all([
  loadInstitutions(),
  loadJson("../../data/institution_geo.json"),
  loadJson("../../data/country_collab.json"),
]);
const rows = payload.institutions;
const geoData = geo || { coords: {} };
const collabData = collab || { links: [] };

function redraw() {
  render(rows, geoData, collabData);
}

function enterCountry(code) {
  if (!code) return;
  view.level = "country";
  view.country = code;
  cardEl.hidden = true;
  hoverCode = "";
  qEl.value = "";
  redraw();
}

function exitCountry() {
  view.level = "world";
  view.country = "";
  qEl.value = "";
  redraw();
}

form?.addEventListener("submit", (e) => e.preventDefault());
thresholdEl.addEventListener("change", redraw);
colorEl.addEventListener("change", redraw);
qEl.addEventListener("input", redraw);
backBtn.addEventListener("click", exitCountry);
cardCta.addEventListener("click", () => enterCountry(cardCta.dataset.country));
cardEl.addEventListener("mouseenter", () => clearTimeout(hideTimer));
cardEl.addEventListener("mouseleave", hideCardSoon);
new MutationObserver(redraw).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

redraw();
if (typeof plotEl.on === "function") {
  plotEl.on("plotly_hover", (ev) => {
    if (view.level !== "world") return;
    const pt = ev.points?.[0];
    if (!pt || pt.data?.type !== "choropleth") return;
    const code = pt.customdata;
    const minN = Number(thresholdEl.value);
    const pool = rows.filter((r) => r.n_ai4s >= minN);
    const stat = countryStats(pool).get(code);
    if (!stat) return;
    showCard(code, stat, geoData.coords, ev);
  });
  plotEl.on("plotly_unhover", () => {
    if (view.level !== "world") return;
    hideCardSoon();
  });
  plotEl.on("plotly_click", (ev) => {
    const pt = ev.points?.[0];
    if (view.level === "world") {
      if (pt?.data?.type === "choropleth" && pt.customdata) enterCountry(pt.customdata);
      return;
    }
    if (pt?.data?.name === t("mapPoints") && pt.customdata) {
      window.location.href = profileHref(pt.customdata);
    }
  });
}
