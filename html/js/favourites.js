(function () {
  "use strict";

  const STORAGE_KEY = "msFavouritesV1";
  const LEGACY_KEYS = ["mollyDogBreedFavorites", "favoriteBreeds"];
  let state = readState();

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function readState() {
    let stored = null;
    try {
      stored = safeParse(localStorage.getItem(STORAGE_KEY), null);
    } catch {}

    const next = stored && stored.items && typeof stored.items === "object"
      ? { version: 1, items: stored.items }
      : { version: 1, items: {} };

    LEGACY_KEYS.forEach((key) => {
      let ids = [];
      try {
        const value = safeParse(localStorage.getItem(key), []);
        ids = Array.isArray(value) ? value : [];
      } catch {}

      ids.forEach((slug) => {
        const id = `breed:${slug}`;
        if (next.items[id]) return;
        const title = String(slug).split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
        next.items[id] = {
          id,
          title,
          type: "Breed",
          url: `/molly-dog-breeds/#${slug}`,
          image: `/images/breeds/${slug}.webp`,
          savedAt: new Date().toISOString()
        };
      });
      if (ids.length) {
        try { localStorage.removeItem(key); } catch {}
      }
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    return next;
  }

  function cleanItem(item) {
    const id = String(item?.id || "").trim();
    if (!id || !id.includes(":")) return null;
    const image = String(item.image || "");
    return {
      id,
      title: String(item.title || id.split(":").pop()).slice(0, 160),
      type: String(item.type || id.split(":")[0]).slice(0, 40),
      url: String(item.url || "/").slice(0, 500),
      image: image.startsWith("data:") ? "" : image.slice(0, 500),
      description: String(item.description || "").slice(0, 260),
      icon: String(item.icon || "♥").slice(0, 40),
      savedAt: item.savedAt || new Date().toISOString()
    };
  }

  function writeState(next = state, announce = true) {
    state = next;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
    if (announce) {
      window.dispatchEvent(new CustomEvent("ms:favourites-changed", { detail: { count: count() } }));
    }
  }

  function list(type) {
    const items = Object.values(state.items || {});
    return type ? items.filter((item) => item.type.toLowerCase() === String(type).toLowerCase()) : items;
  }

  function count() {
    return Object.keys(state.items || {}).length;
  }

  function has(id) {
    return Boolean(state.items?.[id]);
  }

  function add(item) {
    const clean = cleanItem(item);
    if (!clean || has(clean.id)) return false;
    state.items[clean.id] = clean;
    writeState();
    return true;
  }

  function remove(id) {
    if (!has(id)) return false;
    delete state.items[id];
    writeState();
    return true;
  }

  function toggle(item) {
    return has(item.id) ? (remove(item.id), false) : (add(item), true);
  }

  function clear() {
    state = { version: 1, items: {} };
    writeState();
  }

  function syncButton(button) {
    const active = has(button.dataset.favouriteId);
    button.classList.toggle("is-favourite", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", `${active ? "Remove" : "Save"} ${button.dataset.favouriteTitle || "favourite"}`);
    button.title = active ? "Remove from favourites" : "Save to favourites";
    const symbol = active ? "♥" : "♡";
    if (button.textContent !== symbol) button.textContent = symbol;
  }

  function makeButton(item, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ms-favourite-button ${className}`.trim();
    button.dataset.favouriteId = item.id;
    button.dataset.favouriteTitle = item.title;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggle(item);
    });
    syncButton(button);
    return button;
  }

  function photoForImage(image) {
    const pathname = new URL(image.currentSrc || image.src, location.href).pathname;
    const knownPhoto = window.MSData?.photos.find((photo) => photo.image === pathname);
    if (knownPhoto) return knownPhoto;
    if (!image.dataset.favouriteId) return null;
    return {
      id: image.dataset.favouriteId,
      title: image.dataset.favouriteTitle || image.alt,
      type: "Gallery",
      url: location.pathname,
      image: pathname,
      description: image.dataset.favouriteDescription || image.alt,
      icon: ":gallery:"
    };
  }

  function enhanceComicShelf(root = document) {
    root.querySelectorAll(".comic-cover-card:not([data-ms-favourite-ready])").forEach((card) => {
      const slug = new URL(card.href, location.href).searchParams.get("q");
      const item = window.MSData?.comics.find((comic) => comic.slug === slug);
      if (!item) return;
      card.dataset.msFavouriteReady = "true";
      const wrapper = document.createElement("div");
      wrapper.className = "ms-favourite-wrap";
      card.parentNode.insertBefore(wrapper, card);
      wrapper.append(card, makeButton(item));
    });
  }

  function enhanceGallery(root = document) {
    root.querySelectorAll(".grid img:not([data-ms-favourite-ready])").forEach((image) => {
      const item = photoForImage(image);
      if (!item) return;
      image.dataset.msFavouriteReady = "true";
      const wrapper = document.createElement("div");
      wrapper.className = "ms-photo-favourite-wrap";
      image.parentNode.insertBefore(wrapper, image);
      wrapper.append(image, makeButton(item));
    });
  }

  function enhanceBlog(root = document) {
    root.querySelectorAll(".blog-post:not([data-ms-favourite-ready])").forEach((post) => {
      const title = post.querySelector("h2")?.textContent.trim();
      if (!title || /getting posts/i.test(title)) return;
      post.dataset.msFavouriteReady = "true";
      const image = post.querySelector("img");
      const item = {
        id: post.dataset.favouriteId || `blog:${window.MSData?.slugify(title) || title.toLowerCase().replace(/\W+/g, "-")}`,
        title,
        type: "Blog",
        url: "/blog/",
        image: image?.getAttribute("src") || "",
        description: post.querySelector("p:not(.blog-date)")?.textContent.trim() || "",
        icon: ":blog:"
      };
      post.appendChild(makeButton(item, "ms-blog-favourite"));
    });
  }

  function enhanceComicViewer() {
    const header = document.querySelector(".viewer-header");
    if (!header || header.dataset.msFavouriteReady) return;
    const slug = new URLSearchParams(location.search).get("q") || "kibble";
    const item = window.MSData?.comics.find((comic) => comic.slug === slug);
    if (!item) return;
    header.dataset.msFavouriteReady = "true";
    header.appendChild(makeButton(item, "ms-viewer-favourite"));
  }

  function updateNavCount() {
    const value = String(count());
    document.querySelectorAll("[data-ms-favourite-count]").forEach((element) => {
      if (element.textContent !== value) element.textContent = value;
    });
  }

  function addGlobalLinks() {
    if (document.querySelector(".ms-global-tools")) return;
    const tools = document.createElement("div");
    tools.className = "ms-global-tools";
    tools.setAttribute("aria-label", "Site tools");
    tools.innerHTML = `
      <a href="/favourites/" aria-label="Open favourites" title="Favourites">♥ <span data-ms-favourite-count>${count()}</span></a>
      <a href="/achievements/" aria-label="Open achievements" title="Achievements">🏆</a>
    `;
    document.body.appendChild(tools);
  }

  function enhance(root = document) {
    enhanceComicShelf(root);
    enhanceGallery(root);
    enhanceBlog(root);
    enhanceComicViewer();
    document.querySelectorAll(".ms-favourite-button").forEach(syncButton);
    updateNavCount();
  }

  function init() {
    addGlobalLinks();
    enhance();
    let enhancementFrame = 0;
    const observer = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.addedNodes.length) || enhancementFrame) return;
      enhancementFrame = requestAnimationFrame(() => {
        enhancementFrame = 0;
        enhance();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("ms:favourites-changed", () => enhance());
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY) return;
      state = readState();
      enhance();
    });
  }

  window.MSFavourites = { add, remove, toggle, has, list, count, clear, makeButton, enhance, storageKey: STORAGE_KEY };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
