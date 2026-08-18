(function () {
  "use strict";
  if (window.MSSearchBooted) return;
  window.MSSearchBooted = true;

  let indexPromise = null;
  let selectedIndex = 0;

  function normalise(value) {
    return String(value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  }

  function makeBlogItem(post) {
    const title = String(post.title || "Blog post");
    return {
      id: `blog:${window.MSData.slugify(post.id || title)}`,
      title,
      description: String(post.body || "Read this post on the Molly and Shaina blog."),
      type: "Blog",
      icon: ":blog:",
      url: "/blog/",
      image: String(post.image || ""),
      keywords: `${post.tag || ""} ${post.date || ""}`
    };
  }

  async function loadBlogItems() {
    let posts = null;
    try {
      const response = await fetch("/api/posts", { cache: "no-store" });
      if (response.ok) posts = await response.json();
    } catch {}
    if (!Array.isArray(posts)) {
      try {
        const response = await fetch("/blog/posts.json", { cache: "no-store" });
        if (response.ok) posts = await response.json();
      } catch {}
    }
    return Array.isArray(posts) ? posts.map(makeBlogItem) : [];
  }

  async function loadBreedItems() {
    try {
      const response = await fetch("/molly-dog-breeds/", { cache: "force-cache" });
      if (!response.ok) return [];
      const text = await response.text();
      const page = new DOMParser().parseFromString(text, "text/html");
      return [...page.querySelectorAll(".breed-card")].map((card) => {
        const title = card.querySelector("h2")?.textContent.trim() || card.id;
        const description = card.querySelector(".breed-card-copy > p:not(.breed-kicker)")?.textContent.trim() || `Learn about the ${title}.`;
        const image = card.querySelector("img")?.getAttribute("src") || "";
        const guideUrl = new URL("/molly-dog-breeds/", location.href);
        return {
          id: `breed:${card.id}`,
          title,
          description,
          type: "Breed",
          icon: ":breeds:",
          url: `/molly-dog-breeds/#${card.id}`,
          image: image ? new URL(image, guideUrl).pathname : "",
          keywords: `${card.dataset.group || ""} ${card.dataset.match || ""} ${card.querySelector(".breed-kicker")?.textContent || ""}`
        };
      });
    } catch {
      return [];
    }
  }

  async function buildIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = (async () => {
      await (window.MSSystemsReady || Promise.resolve());
      if (!window.MSData) return [];
      const [breeds, blog] = await Promise.all([loadBreedItems(), loadBlogItems()]);
      const items = [...window.MSData.pages, ...window.MSData.comics, ...window.MSData.photos, ...breeds, ...blog];
      const unique = new Map();
      items.forEach((item) => unique.set(item.id, item));
      return [...unique.values()].map((item) => ({
        ...item,
        searchTitle: normalise(item.title),
        searchDescription: normalise(item.description),
        searchType: normalise(item.type),
        searchKeywords: normalise(item.keywords)
      }));
    })();
    return indexPromise;
  }

  function score(item, rawQuery) {
    const query = normalise(rawQuery);
    if (!query) return 0;
    const words = query.split(" ").filter(Boolean);
    let value = 0;
    if (item.searchTitle === query) value += 1000;
    else if (item.searchTitle.startsWith(query)) value += 620;
    else if (item.searchTitle.includes(query)) value += 420;
    if (item.searchType === query) value += 180;
    words.forEach((word) => {
      if (item.searchTitle.split(" ").includes(word)) value += 120;
      else if (item.searchTitle.includes(word)) value += 80;
      if (item.searchKeywords.includes(word)) value += 45;
      if (item.searchDescription.includes(word)) value += 24;
      if (item.searchType.includes(word)) value += 30;
    });
    const haystack = `${item.searchTitle} ${item.searchDescription} ${item.searchKeywords} ${item.searchType}`;
    return words.every((word) => haystack.includes(word)) ? value : 0;
  }

  function createOverlay() {
    let searchBox = document.getElementById("searchBox");
    if (!searchBox) {
      searchBox = document.createElement("div");
      searchBox.id = "searchBox";
      searchBox.className = "hidden";
      searchBox.innerHTML = '<input id="searchInput" type="search" placeholder="Search Molly & Shaina…" autocomplete="off"><p class="ms-search-hint">Press Escape to close</p><div id="results"></div>';
      document.body.appendChild(searchBox);
    }
    searchBox.classList.add("ms-site-search");
    if (!searchBox.querySelector(".ms-search-hint")) {
      const hint = document.createElement("p");
      hint.className = "ms-search-hint";
      hint.textContent = "Press Escape to close";
      searchBox.querySelector("#searchInput")?.after(hint);
    }
    return searchBox;
  }

  function createFallbackButton() {
    let button = document.getElementById("searchBtn");
    if (button) return button;
    button = document.createElement("button");
    button.id = "searchBtn";
    button.className = "ms-search-launch";
    button.type = "button";
    button.textContent = "⌕";
    button.setAttribute("aria-label", "Open site search");
    document.body.appendChild(button);
    return button;
  }

  function renderMessage(results, message) {
    results.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "ms-search-message";
    empty.textContent = message;
    results.appendChild(empty);
  }

  function renderResults(results, matches) {
    results.innerHTML = "";
    selectedIndex = 0;
    if (!matches.length) {
      renderMessage(results, "No matching dog business found. Try another word 🐾");
      return;
    }
    matches.slice(0, 30).forEach((item, index) => {
      const link = document.createElement("a");
      link.className = `ms-search-result${index === 0 ? " active" : ""}`;
      link.href = item.url;
      link.dataset.resultId = item.id;
      const icon = document.createElement("span");
      icon.className = "ms-search-icon";
      icon.textContent = item.icon || "🐾";
      const copy = document.createElement("span");
      copy.className = "ms-search-copy";
      const title = document.createElement("strong");
      title.textContent = item.title;
      const description = document.createElement("span");
      description.textContent = item.description;
      copy.append(title, description);
      const type = document.createElement("span");
      type.className = "ms-search-type";
      type.textContent = item.type;
      link.append(icon, copy, type);
      link.addEventListener("click", () => {
        remember(item.id);
        window.MSAchievements?.record("searches", 1);
      });
      results.appendChild(link);
    });
    window.replaceDogShortcodes?.(results);
  }

  function readRecent() {
    try {
      const recent = JSON.parse(localStorage.getItem("msRecentSearches") || "[]");
      return Array.isArray(recent) ? recent : [];
    } catch {
      return [];
    }
  }

  function remember(id) {
    const recent = [id, ...readRecent().filter((item) => item !== id)].slice(0, 6);
    try { localStorage.setItem("msRecentSearches", JSON.stringify(recent)); } catch {}
  }

  async function boot() {
    await (window.MSSystemsReady || Promise.resolve());
    if (!window.MSData) return;
    const searchBox = createOverlay();
    const searchInput = searchBox.querySelector("#searchInput");
    const results = searchBox.querySelector("#results");
    const searchButton = createFallbackButton();
    let allItems = [];

    async function openSearch() {
      searchBox.classList.remove("hidden");
      document.body.classList.add("ms-search-open");
      searchInput.focus();
      renderMessage(results, "Loading the site index…");
      allItems = await buildIndex();
      if (searchInput.value.trim()) {
        const matches = allItems.map((item) => ({ ...item, rank: score(item, searchInput.value) })).filter((item) => item.rank > 0).sort((a, b) => b.rank - a.rank);
        renderResults(results, matches);
      } else {
        const recent = readRecent().map((id) => allItems.find((item) => item.id === id)).filter(Boolean);
        if (recent.length) renderResults(results, recent);
        else renderMessage(results, "Start typing to search pages, breeds, comics, posts, FAQs, and photos.");
      }
    }

    function closeSearch() {
      searchBox.classList.add("hidden");
      document.body.classList.remove("ms-search-open");
      searchInput.value = "";
      results.innerHTML = "";
    }

    function updateSelection() {
      const links = [...results.querySelectorAll(".ms-search-result")];
      links.forEach((link, index) => link.classList.toggle("active", index === selectedIndex));
      links[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }

    searchButton.addEventListener("click", openSearch);
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();
      if (!query) { renderMessage(results, "Start typing to search the whole site."); return; }
      const matches = allItems
        .map((item) => ({ ...item, rank: score(item, query) }))
        .filter((item) => item.rank > 0)
        .sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title));
      renderResults(results, matches);
    });
    searchInput.addEventListener("keydown", (event) => {
      const links = [...results.querySelectorAll(".ms-search-result")];
      if (event.key === "ArrowDown") { event.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, links.length - 1); updateSelection(); }
      if (event.key === "ArrowUp") { event.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); updateSelection(); }
      if (event.key === "Enter" && links[selectedIndex]) { event.preventDefault(); links[selectedIndex].click(); }
    });
    searchBox.addEventListener("click", (event) => { if (event.target === searchBox) closeSearch(); });
    document.addEventListener("keydown", (event) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if (event.key === "/" && !typing) { event.preventDefault(); openSearch(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openSearch(); }
      if (event.key === "Escape" && !searchBox.classList.contains("hidden")) { event.preventDefault(); closeSearch(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
