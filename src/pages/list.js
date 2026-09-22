import "../shell.js?v=sign6";
import { getLocale, t } from "../i18n.js?v=ed9";
import {
  countryName,
  displayName,
  fmtIndex,
  fmtInt,
  fmtPct,
  loadInstitutions,
  profileHref,
} from "../data.js";

const locale = getLocale();
const sortEl = document.getElementById("sort");
const thresholdEl = document.getElementById("threshold");
const countryEl = document.getElementById("country");
const qEl = document.getElementById("q");
const body = document.getElementById("table-body");
const countLine = document.getElementById("count-line");
const form = document.getElementById("filters");

function fillCountries(pool) {
  const counts = new Map();
  for (const r of pool) {
    if (!r.org_country) continue;
    counts.set(r.org_country, (counts.get(r.org_country) || 0) + 1);
  }
  const codes = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const keep = countryEl.value;
  countryEl.innerHTML =
    `<option value="">${t("allCountries")}</option>` +
    codes.map(([code, n]) => `<option value="${code}">${countryName(code, locale)} (${n})</option>`).join("");
  if ([...countryEl.options].some((o) => o.value === keep)) countryEl.value = keep;
  else countryEl.value = "";
}

function matchesQuery(row, q) {
  const hay = [row.org_name, row.org_id, row.org_ror_id].join(" ").toLowerCase();
  return hay.includes(q);
}

function render(rows) {
  const minN = Number(thresholdEl.value);
  const country = countryEl.value;
  const key = sortEl.value;
  const q = (qEl.value || "").trim().toLowerCase();
  const pool = rows.filter((r) => r.n_ai4s >= minN);
  let out = pool;
  if (country) out = out.filter((r) => r.org_country === country);
  if (q) out = out.filter((r) => matchesQuery(r, q));
  out = [...out].sort((a, b) => Number(b[key]) - Number(a[key]));
  countLine.textContent = t("listCount", { n: out.length, min: minN });
  body.innerHTML = out
    .map(
      (r) => `
      <tr>
        <td><a href="${profileHref(r.org_id)}">${displayName(r, locale)}</a></td>
        <td>${countryName(r.org_country, locale)}</td>
        <td class="num">${fmtInt(r.n_ai4s)}</td>
        <td class="num">${fmtIndex(r.discipline_adjusted_index)}</td>
        <td class="num">${fmtPct(r.top_rate)}</td>
        <td class="num">${fmtIndex(r.high_impact_representation)}</td>
      </tr>`
    )
    .join("");
}

const payload = await loadInstitutions();
const rows = payload.institutions;
form?.addEventListener("submit", (e) => e.preventDefault());
thresholdEl.addEventListener("change", () => {
  const minN = Number(thresholdEl.value);
  fillCountries(rows.filter((r) => r.n_ai4s >= minN));
  render(rows);
});
for (const el of [sortEl, countryEl]) {
  el.addEventListener("change", () => render(rows));
}
qEl.addEventListener("input", () => render(rows));
fillCountries(rows.filter((r) => r.n_ai4s >= Number(thresholdEl.value)));
render(rows);
