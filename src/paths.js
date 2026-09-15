/** Site root URL, derived from this file at src/paths.js. Works on any host or port. */
export function siteRoot() {
  return new URL("../", import.meta.url);
}

export function pageUrl(path) {
  return new URL(path, siteRoot()).href;
}

export function figureUrl(path, params = {}) {
  const url = new URL(`public/figures/${path}`, siteRoot());
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  });
  url.searchParams.set("v", "clip3");
  return url.href;
}
