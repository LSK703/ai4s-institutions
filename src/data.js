export function countryName(code, locale) {
  if (!code) return "—";
  try {
    const dn = new Intl.DisplayNames([locale === "zh" ? "zh-CN" : "en"], { type: "region" });
    return dn.of(String(code).toUpperCase()) || code;
  } catch {
    return code;
  }
}

export function formatOrgTypes(s, locale) {
  if (!s) return "";
  const zh = {
    Education: "高等教育",
    Funder: "资助机构",
    Nonprofit: "非营利",
    Government: "政府",
    Healthcare: "医疗卫生",
    Company: "企业",
    Facility: "设施",
    Archive: "档案",
  };
  return String(s)
    .split("|")
    .map((part) => {
      const key = part.trim();
      if (!key) return "";
      return locale === "zh" ? zh[key] || key : key;
    })
    .filter(Boolean)
    .join(" · ");
}

export function displayName(row, locale) {
  if (locale === "zh" && row.org_name_zh) return row.org_name_zh;
  return row.org_name;
}

export function fmtInt(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US");
}

export function fmtPct(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(Number(n) * 100).toFixed(digits)}%`;
}

export function fmtShare(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(Number(n) * 100).toFixed(2)}%`;
}

export function fmtIndex(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return Number(n).toFixed(2);
}

let cache = null;

export async function loadInstitutions() {
  if (cache) return cache;
  const res = await fetch(new URL("../data/institution_master.json", import.meta.url).href);
  if (!res.ok) throw new Error(`Failed to load institution_master.json (${res.status})`);
  cache = await res.json();
  return cache;
}

export function profileHref(orgId) {
  return new URL(`../institution.html?id=${encodeURIComponent(orgId)}`, import.meta.url).href;
}
