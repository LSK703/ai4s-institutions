import "../shell.js?v=sign7";
import { getLocale, t } from "../i18n.js?v=ed9";
import {
  countryName,
  displayName,
  formatOrgTypes,
  fmtIndex,
  fmtInt,
  fmtPct,
  fmtShare,
  loadInstitutions,
} from "../data.js";

const locale = getLocale();
const id = new URLSearchParams(location.search).get("id");
const payload = await loadInstitutions();
const row = payload.institutions.find((r) => r.org_id === id);

if (!row) {
  document.getElementById("org-name").textContent = t("notFound");
  document.getElementById("org-meta").textContent = id
    ? `id = ${id} · n_ai4s ≥ 200`
    : t("openFromList");
} else {
  document.getElementById("org-name").textContent = displayName(row, locale);
  document.getElementById("org-meta").textContent = [
    countryName(row.org_country, locale),
    formatOrgTypes(row.org_types, locale),
    row.org_id,
    row.org_ror_id ? `ROR ${row.org_ror_id}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function cards(target, items) {
    document.getElementById(target).innerHTML = items
      .map(([label, value, hint]) => `<div class="kpi"><b>${value}</b>${label}<small>${hint}</small></div>`)
      .join("");
  }

  cards("kpi-scale", [
    [t("kpiNai4s"), fmtInt(row.n_ai4s), "n_ai4s"],
    [t("kpiNall"), fmtInt(row.n_all), "n_all"],
    [t("kpiExp"), fmtInt(row.n_ai4s_exp), "n_ai4s_exp"],
    [t("kpiShare"), fmtShare(row.global_share_ai4s), "global_share_ai4s"],
    [t("kpiIndex"), fmtIndex(row.discipline_adjusted_index), "discipline_adjusted_index"],
    [t("kpiTopRate"), fmtPct(row.top_rate), "top_rate"],
    [t("kpiTopRateAll"), fmtPct(row.top_rate_all), "top_rate_all"],
    [t("kpiRepr"), fmtIndex(row.high_impact_representation), "high_impact_representation"],
  ]);

  document.title = `${displayName(row, locale)} · ${t("brand")}`;
}
