import "../shell.js?v=ed1";
import { fmtInt, fmtPct, loadInstitutions } from "../data.js";

const payload = await loadInstitutions();
const { meta, institutions } = payload;

const nEl = document.getElementById("stat-n");
const cEl = document.getElementById("stat-c");
if (nEl) nEl.textContent = fmtInt(meta.n_ge_500);
if (cEl) cEl.textContent = fmtInt(meta.n_countries);

const preview = document.getElementById("list-preview-body");
if (preview) {
  const top = institutions.filter((r) => r.n_ai4s >= 500).slice(0, 5);
  preview.innerHTML = top
    .map(
      (r) =>
        `<div class="row"><span>${r.org_name}</span><span>${fmtInt(r.n_ai4s)}</span><span>${fmtPct(r.top_rate)}</span></div>`
    )
    .join("");
}
