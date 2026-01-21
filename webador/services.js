(function () {
  const DATA_URL = "https://isa-phe.github.io/services/services.json";
  const ROOT_ID = "hbe-services";
  const MAX_WAIT_MS = 15000;
  const POLL_MS = 150;

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

  async function loadItems() {
    const bust = (DATA_URL.includes("?") ? "&" : "?") + "v=" + Date.now();
    const res = await fetch(DATA_URL + bust, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  }

  function mount(root) {
    const grid = root.querySelector("#hbeServicesGrid");
    const foot = root.querySelector("#hbeServicesFoot");
    const pills = Array.from(root.querySelectorAll(".hbe-services__pill"));
    if (!grid || !foot || !pills.length) return null;
    return { root, grid, foot, pills };
  }

  function render(m, allItems, activeCat) {
    const filtered = activeCat === "__all"
      ? allItems
      : allItems.filter(x => x.category === activeCat);

    const items = sortItems(filtered);

    if (!items.length) {
      m.grid.innerHTML = '<div class="hbe-services__loading">No items found in this category.</div>';
      m.foot.textContent = "";
      return;
    }

    m.grid.innerHTML = items.map(item => {
      const title = esc(item.title || "");
      const text = esc(item.text || "");
      const cat = esc(item.category || "");
      const date = item.date ? esc(item.date) : "";
      const url = esc(item.url || "#");
      const cta = esc(item.cta || "Details and Booking");
      const target = (function(){ try{ return (new URL(item.url, location.href).hostname !== location.hostname) ? ' target="_blank" rel="noopener noreferrer"' : ''; } catch(e){ return ''; } })();
      const img = item.image ? esc(item.image) : "";
      const duration = item.duration ? esc(item.duration) : "";
      const level = item.level ? esc(item.level) : "";
      const audience = item.audience ? esc(item.audience) : "";
      const startingPrice = item.startingPrice ? esc(item.startingPrice) : "";

      const line1 = [];
      if (duration) line1.push('<span class="hbe-services__fact"><b>Duration</b><span>' + duration + '</span></span>');
      if (level) line1.push('<span class="hbe-services__fact"><b>Level</b><span>' + level + '</span></span>');
      if (startingPrice) line1.push('<span class="hbe-services__fact"><b>From</b><span>' + startingPrice + '</span></span>');

      const line2 = [];
      if (audience) line2.push('<span class="hbe-services__fact"><b>Audience</b><span>' + audience + '</span></span>');

      const factsHtml =
        (line1.length || line2.length)
          ? (
              '<div class="hbe-services__facts">' +
                (line1.length ? '<div class="hbe-services__facts-line">' + line1.join("") + '</div>' : '') +
                (line2.length ? '<div class="hbe-services__facts-line">' + line2.join("") + '</div>' : '') +
              '</div>'
            )
          : '';

      return (
        '<div class="hbe-services__card">' +
          '<div class="hbe-services__meta">' +
            '<div class="hbe-services__cat">' + cat + '</div>' +
            (date ? '<div class="hbe-services__date">' + date + '</div>' : '') +
          '</div>' +

          '<div class="hbe-services__row">' +
            (img ? '<img class="hbe-services__img" src="' + img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'" />' : '') +
            '<div class="hbe-services__body">' +
              '<div class="hbe-services__card-title">' + title + '</div>' +
              '<div class="hbe-services__text">' + text + '</div>' +
            '</div>' +
          '</div>' +

          factsHtml +

          '<a class="hbe-services__cta" href="' + url + '"' + target + '>' + cta + '</a>' +
        '</div>'
      );
    }).join("");

    m.foot.textContent = "Showing " + items.length + " item" + (items.length === 1 ? "" : "s") + ".";
  }

  function setActive(m, allItems, cat) {
    m.pills.forEach(btn => {
      const on = btn.dataset.cat === cat;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    render(m, allItems, cat);
  }

  async function initWhenReady() {
    const start = Date.now();

    while (Date.now() - start < MAX_WAIT_MS) {
      const root = document.getElementById(ROOT_ID);
      if (root) {
        const m = mount(root);
        if (!m) return;

        m.grid.innerHTML = '<div class="hbe-services__loading">Loading…</div>';
        m.foot.textContent = "";

        let allItems = [];
        try {
          allItems = await loadItems();
        } catch (e) {
          m.grid.innerHTML = '<div class="hbe-services__loading">Data unavailable. Please refresh.</div>';
          return;
        }

        m.pills.forEach(btn => {
          btn.addEventListener("click", function () {
            setActive(m, allItems, btn.dataset.cat);
          });
        });

        setActive(m, allItems, "__all");
        return;
      }
      await new Promise(r => setTimeout(r, POLL_MS));
    }
  }

  initWhenReady();
})();
