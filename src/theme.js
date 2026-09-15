const KEY = "ai4s-theme";

export function getTheme() {
  return localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

export function applyTheme(theme = getTheme()) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  localStorage.setItem(KEY, next);
  applyTheme(next);
  return next;
}

export function bindThemeToggle(btn) {
  if (!btn) return;
  const sync = () => {
    const dark = getTheme() === "dark";
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.title = dark ? btn.dataset.labelLight || "Light" : btn.dataset.labelDark || "Dark";
    btn.setAttribute("aria-label", btn.title);
  };
  sync();
  btn.addEventListener("click", () => {
    toggleTheme();
    sync();
  });
}

applyTheme();
