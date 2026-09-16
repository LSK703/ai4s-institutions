/** Join GRID institutions to ROR city coordinates. Resume-safe. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MASTER = path.join(ROOT, "data", "institution_master.json");
const CSV = path.resolve(ROOT, "../outputs/ch05/05_02_institution_top5.csv");
const CSV_FALLBACK = path.resolve(ROOT, "../AI4S-网站交接/源码/outputs/ch05/05_02_institution_top5.csv");
const CACHE = path.join(ROOT, "data", "institution_geo.cache.json");
const OUT = path.join(ROOT, "data", "institution_geo.json");
const OUT_HANDOVER = path.resolve(ROOT, "../AI4S-网站交接/源码/site/data/institution_geo.json");

const UA = "AI4S-institution-map/0.1 (local rebuild; ROR GeoNames join)";
const CONCURRENCY = 6;

function rorByGrid() {
  const file = fs.existsSync(CSV) ? CSV : CSV_FALLBACK;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const map = new Map();
  for (const line of lines.slice(1)) {
    const id = line.slice(0, line.indexOf(","));
    const ror = line.slice(line.lastIndexOf(",") + 1).trim();
    if (id.startsWith("grid.") && ror && ror !== "org_ror_id") map.set(id, ror);
  }
  return map;
}

function loadCache() {
  if (!fs.existsSync(CACHE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE, JSON.stringify(cache), "utf8");
}

async function fetchRor(ror, attempt = 0) {
  const url = `https://api.ror.org/organizations/${encodeURIComponent(ror)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`ROR ${ror} HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
    return fetchRor(ror, attempt + 1);
  }
  if (res.status === 404) return { missing: true };
  if (!res.ok) throw new Error(`ROR ${ror} HTTP ${res.status}`);
  const j = await res.json();
  const loc = j.locations?.[0]?.geonames_details;
  const zh = (j.names || []).find((n) => n.lang === "zh")?.value || "";
  if (loc == null || loc.lat == null || loc.lng == null) return { missing: true, ror, zh };
  return {
    lat: Number(loc.lat),
    lng: Number(loc.lng),
    city: loc.name || "",
    geo_country: loc.country_code || "",
    ror,
    zh,
  };
}

async function pool(items, n, fn) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: n }, worker));
}

const master = JSON.parse(fs.readFileSync(MASTER, "utf8"));
const rors = rorByGrid();
const cache = loadCache();
const jobs = [];
for (const row of master.institutions) {
  const ror = rors.get(row.org_id);
  if (!ror) {
    cache[row.org_id] = cache[row.org_id] || { missing: true };
    continue;
  }
  const prev = cache[row.org_id];
  if (prev && (prev.lat != null || prev.missing)) continue;
  jobs.push({ org_id: row.org_id, ror });
}

console.log("already cached", Object.keys(cache).length, "to fetch", jobs.length);
let done = 0;
let lastSave = Date.now();
await pool(jobs, CONCURRENCY, async (job) => {
  try {
    cache[job.org_id] = await fetchRor(job.ror);
  } catch (err) {
    console.error("fail", job.org_id, job.ror, err.message);
    cache[job.org_id] = { error: String(err.message) };
  }
  done++;
  if (done % 25 === 0 || Date.now() - lastSave > 8000) {
    saveCache(cache);
    lastSave = Date.now();
    process.stdout.write(`\rfetched ${done}/${jobs.length}   `);
  }
});
saveCache(cache);

const coords = {};
let matched = 0;
let missing = 0;
for (const row of master.institutions) {
  const g = cache[row.org_id];
  if (g && g.lat != null && g.lng != null) {
    coords[row.org_id] = {
      lat: g.lat,
      lng: g.lng,
      city: g.city || "",
      ror: g.ror || rors.get(row.org_id) || "",
      zh: g.zh || "",
    };
    matched++;
  } else missing++;
}

const payload = {
  meta: {
    source: "ROR REST API · GeoNames city coordinates",
    n: master.institutions.length,
    matched,
    missing,
  },
  coords,
};
const text = JSON.stringify(payload);
fs.writeFileSync(OUT, text, "utf8");
try {
  fs.mkdirSync(path.dirname(OUT_HANDOVER), { recursive: true });
  fs.writeFileSync(OUT_HANDOVER, text, "utf8");
} catch (err) {
  console.warn("handover copy skipped", err.message);
}
console.log("\nwrote", OUT, "matched", matched, "missing", missing);
