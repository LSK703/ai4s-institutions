import "../shell.js?v=sign1";

const SIGNS = ["data", "indicators", "institutions", "use"];

function panel(id) {
  return document.getElementById(`panel-${id}`);
}

function placePeek(id) {
  const peek = document.getElementById("sign-peek");
  const selected = document.querySelector(`.road-sign[data-sign="${id}"]`);
  if (!peek || !selected) return;
  peek.hidden = false;
  peek.dataset.sign = id;
  const right = selected.classList.contains("is-right");
  peek.style.top = `${selected.offsetTop + selected.offsetHeight + 10}px`;
  if (right) {
    peek.style.left = "calc(50% + 1.4rem)";
    peek.style.right = "auto";
  } else {
    peek.style.left = "auto";
    peek.style.right = "calc(50% + 1.4rem)";
  }
}

function selectSign(id) {
  document.querySelectorAll(".road-sign").forEach((btn) => {
    const on = btn.dataset.sign === id;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  placePeek(id);
}

function showPanel(id) {
  SIGNS.forEach((key) => {
    const el = panel(key);
    if (el) el.hidden = key !== id;
  });
  document.getElementById("info-panels")?.classList.add("is-open");
  if (location.hash !== `#${id}`) {
    history.replaceState(null, "", `#${id}`);
  }
  requestAnimationFrame(() => {
    panel(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function hidePanels() {
  SIGNS.forEach((key) => {
    const el = panel(key);
    if (el) el.hidden = true;
  });
  document.getElementById("info-panels")?.classList.remove("is-open");
}

document.querySelectorAll(".road-sign").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectSign(btn.dataset.sign);
    hidePanels();
    history.replaceState(null, "", location.pathname + location.search);
  });
});

document.getElementById("sign-peek")?.addEventListener("click", (event) => {
  const id = event.currentTarget.dataset.sign;
  if (SIGNS.includes(id)) showPanel(id);
});

window.addEventListener("resize", () => {
  const on = document.querySelector(".road-sign.is-on");
  if (on) placePeek(on.dataset.sign);
});

const hash = location.hash.replace("#", "");
if (SIGNS.includes(hash)) {
  selectSign(hash);
  showPanel(hash);
}

window.addEventListener("hashchange", () => {
  const id = location.hash.replace("#", "");
  if (!SIGNS.includes(id)) return;
  selectSign(id);
  showPanel(id);
});
