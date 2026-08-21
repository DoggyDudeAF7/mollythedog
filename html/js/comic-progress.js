(function () {
  "use strict";

  const STORAGE_KEY = "msComicProgressV1";

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  function write(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    window.dispatchEvent(new CustomEvent("ms:comic-progress"));
  }

  function get(slug) {
    return read()[slug] || null;
  }

  function save(slug, panel, total, completed = false) {
    const state = read();
    state[slug] = { panel, total, completed, updatedAt: new Date().toISOString() };
    write(state);
    return state[slug];
  }

  function reset(slug) {
    const state = read();
    delete state[slug];
    write(state);
  }

  function latestUnfinished() {
    return Object.entries(read())
      .filter(([, item]) => item && !item.completed)
      .sort((a, b) => String(b[1].updatedAt).localeCompare(String(a[1].updatedAt)))[0] || null;
  }

  function enhanceShelf() {
    const shelf = document.querySelector(".comic-shelf");
    if (!shelf) return;
    const state = read();
    shelf.querySelectorAll(".comic-cover-card").forEach((card) => {
      const slug = new URL(card.href, location.href).searchParams.get("q");
      const progress = state[slug];
      card.querySelector(".comic-cover-progress")?.remove();
      if (!progress) return;
      const percent = progress.completed ? 100 : Math.min(100, Math.round(((progress.panel + 4) / progress.total) * 100));
      const marker = document.createElement("span");
      marker.className = "comic-cover-progress";
      marker.innerHTML = `<small>${progress.completed ? "✓ Completed" : `${percent}% read`}</small><i><b style="width:${percent}%"></b></i>`;
      card.appendChild(marker);
    });

    document.querySelector(".comic-continue")?.remove();
    const latest = latestUnfinished();
    if (!latest) return;
    const [slug, progress] = latest;
    const card = [...shelf.querySelectorAll(".comic-cover-card")].find((item) => new URL(item.href, location.href).searchParams.get("q") === slug);
    if (!card) return;
    const title = card.querySelector(":scope > span:not(.comic-cover-progress)")?.textContent.replace(/^Read\s+/i, "") || "your comic";
    const banner = document.createElement("a");
    banner.className = "comic-continue";
    banner.href = card.href;
    banner.innerHTML = `<span>Continue reading</span><strong>${title}</strong><small>Resume at panel ${progress.panel + 1} →</small>`;
    shelf.before(banner);
  }

  window.MSComicProgress = { storageKey: STORAGE_KEY, read, get, save, reset, latestUnfinished };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhanceShelf, { once: true });
  else enhanceShelf();
  window.addEventListener("ms:comic-progress", enhanceShelf);
})();
