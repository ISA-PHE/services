(function () {
  const DATA_URL = "https://isa-phe.github.io/services/services.json";

  function esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function sortItems(items) {
    return items.slice().sort((a, b) => {
      const af = a.featured ? 1 : 0;
      const bf = b.featured ? 1 : 0;
      if (af !== bf) return bf - af;

      const ad = a.date || "";
      const bd = b.date || "";
      if (ad !== bd) return bd.localeCompare(ad);

      const ao = typeof a.order === "number" ? a.order : 999999;
      const bo = typeof b.order === "number" ? b.order : 999999;
      if (ao !== bo) return ao - bo;

      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }

  function ensureMounted() {
    const root = document.getElementById("hbe-services");
    if (!root) return null;

    const grid = root.querySelector("#hbeServicesGrid");
    const foot = root.querySelector("#hbeServicesFoot");
    const pills = Array.from(root.querySelectorAll(".hbe-services__pill"));

    return { root, grid, foot, pills };
  }

  async function loadData() {
    const bust = (DATA_URL.includes("?") ? "&" : "?") + "v=" + Date.now();
    const res = await fetch(DATA_URL + bust, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  function render(m, allItems, activeCat) {
    const { grid, foot } = m;

    const filtered = activeCat === "__all"
      ? allItems
      : allItems.filter(x => x.category === activeCat);

    const items = sortItems(filtered);

    if (!items.length) {
      grid.innerHTML = '<div class="hbe-services__loading">No items found in this category.</div>';
      foot.textContent = "";
      return;
    }

    grid.innerHTML = items.map(item => {
      const title = esc(item.title || "");
      const text = esc(item.text || "");
      const cat = esc(item.category || "");
      const date = item.date ? esc(item.date) : "";
      const url = esc(item.url || "#");
      const cta = esc(item.cta || "Open");
      const target = item.newTab ? ' target="_blank" rel="noopener noreferrer"' : "";

      return (
        '<div class="hbe-services__card">' +
          '<div class="hbe-services__meta">' +
            '<div class="hbe-services__cat">' + cat + '</div>' +
            (date ? '<div class="hbe-services__date">' + date + '</div>' : '') +
          '</div>' +
          '<div class="hbe-services__card-title">' + title + '</div>' +
          '<div class="hbe-services__text">' + text + '</div>' +
          '<a class="hbe-services__cta" href="' + url + '"' + target + '>' + cta + '</a>' +
        '</div>'
      );
    }).join("");

    foot.textContent = "Showing " + items.length + " item" + (items.length === 1 ? "" : "s") + ".";
  }

  function setActive(m, allItems, cat) {
    m.pills.forEach(btn => {
      const on = btn.dataset.cat === cat;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    render(m, allItems, cat);
  }

  async function init() {
    const m = ensureMounted();
    if (!m) return;

    m.grid.innerHTML = '<div class="hbe-services__loading">Loading…</div>';
    m.foot.textContent = "";

    let allItems = [];
    try {
      const data = await loadData();
      allItems = Array.isArray(data.items) ? data.items : [];
    } catch (e) {
      m.grid.innerHTML = '<div class="hbe-services__loading">Data unavailable. Open the JSON endpoint to verify it exists.</div>';
      return;
    }

    m.pills.forEach(btn => {
      btn.addEventListener("click", function () {
        setActive(m, allItems, btn.dataset.cat);
      });
    });

    setActive(m, allItems, "__all");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
