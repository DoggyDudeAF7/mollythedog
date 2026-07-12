document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const searchBox = document.getElementById("searchBox");
  const searchInput = document.getElementById("searchInput");
  const results = document.getElementById("results");

  if (!searchBtn || !searchBox || !searchInput || !results) return;

  const shainaSite = location.pathname.includes("shaina-") || location.pathname.includes("/shaina/");
  const commands = shainaSite ? [
    { key: "home", action: () => location.href = "../shaina-home/" },
    { key: "traits", action: () => location.href = "../shaina-traits/" },
    { key: "habits", action: () => location.href = "../shaina-habits/" },
    { key: "mind", action: () => location.href = "../shaina-mind/" },
    { key: "gallery", action: () => location.href = "../shaina-gallery/" },
    { key: "faq", action: () => location.href = "../shaina-faq/" },
    { key: "breeds", action: () => location.href = "../molly-dog-breeds/" },
    { key: "dogs", action: () => location.href = "../molly-dog-breeds/" },
    { key: "comics", action: () => location.href = "../comics/" },
    { key: "comic", action: () => location.href = "../comics/" },
    { key: "kibble comic", action: () => location.href = "../comic-viewer/?q=kibble" },
    { key: "snack comic", action: () => location.href = "../comic-viewer/?q=kibble" },
    { key: "paint comic", action: () => location.href = "../comic-viewer/?q=paint" },
    { key: "soup comic", action: () => location.href = "../comic-viewer/?q=soup" },
    { key: "laundry comic", action: () => location.href = "../comic-viewer/?q=laundry" },
    { key: "garden comic", action: () => location.href = "../comic-viewer/?q=garden" },
    { key: "garden adventure", action: () => location.href = "../comic-viewer/?q=garden" },
    { key: "blanket comic", action: () => location.href = "../comic-viewer/?q=blanket" },
    { key: "blanket fortress", action: () => location.href = "../comic-viewer/?q=blanket" },
    { key: "package comic", action: () => location.href = "../comic-viewer/?q=package" },
    { key: "package emergency", action: () => location.href = "../comic-viewer/?q=package" },
    { key: "about", action: () => location.href = "../about-me/" },
    { key: "about me", action: () => location.href = "../about-me/" },
    { key: "quiz", action: () => location.href = "../breed-quiz/" },
    { key: "breed quiz", action: () => location.href = "../breed-quiz/" },
    { key: "blog", action: () => location.href = "../blog/" },
    { key: "molly", action: () => location.href = "../molly/" }
  ] : [
    { key: "home", action: () => location.href = "../molly/" },
    { key: "traits", action: () => location.href = "../molly-traits/" },
    { key: "habits", action: () => location.href = "../molly-habits/" },
    { key: "mind", action: () => location.href = "../molly-mind/" },
    { key: "gallery", action: () => location.href = "../molly-gallery/" },
    { key: "faq", action: () => location.href = "../molly-faq/" },
    { key: "breeds", action: () => location.href = "../molly-dog-breeds/" },
    { key: "dogs", action: () => location.href = "../molly-dog-breeds/" },
    { key: "comics", action: () => location.href = "../comics/" },
    { key: "comic", action: () => location.href = "../comics/" },
    { key: "kibble comic", action: () => location.href = "../comic-viewer/?q=kibble" },
    { key: "snack comic", action: () => location.href = "../comic-viewer/?q=kibble" },
    { key: "paint comic", action: () => location.href = "../comic-viewer/?q=paint" },
    { key: "soup comic", action: () => location.href = "../comic-viewer/?q=soup" },
    { key: "laundry comic", action: () => location.href = "../comic-viewer/?q=laundry" },
    { key: "garden comic", action: () => location.href = "../comic-viewer/?q=garden" },
    { key: "garden adventure", action: () => location.href = "../comic-viewer/?q=garden" },
    { key: "blanket comic", action: () => location.href = "../comic-viewer/?q=blanket" },
    { key: "blanket fortress", action: () => location.href = "../comic-viewer/?q=blanket" },
    { key: "package comic", action: () => location.href = "../comic-viewer/?q=package" },
    { key: "package emergency", action: () => location.href = "../comic-viewer/?q=package" },
    { key: "about", action: () => location.href = "../about-me/" },
    { key: "about me", action: () => location.href = "../about-me/" },
    { key: "quiz", action: () => location.href = "../breed-quiz/" },
    { key: "breed quiz", action: () => location.href = "../breed-quiz/" },
    { key: "blog", action: () => location.href = "../blog/" },
    { key: "shaina", action: () => location.href = "../shaina/" }
  ];

  let selectedIndex = 0;
  let recent = [];

  try {
    recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    if (!Array.isArray(recent)) recent = [];
  } catch {
    recent = [];
  }

  function openSearch() {
    searchBox.classList.remove("hidden");
    searchInput.focus();
    renderResults(searchInput.value || "");
  }

  function closeSearch() {
    searchBox.classList.add("hidden");
    searchInput.value = "";
    results.innerHTML = "";
  }

  function scoreMatch(text, query) {
    text = text.toLowerCase();
    query = query.toLowerCase();
    if (text === query) return 100;
    if (text.startsWith(query)) return 80;
    if (text.includes(query)) return 50;
    return 0;
  }

  function renderResults(query) {
    results.innerHTML = "";

    if (!query) {
      showRecent();
      return;
    }

    const matches = commands
      .map(cmd => ({ ...cmd, score: scoreMatch(cmd.key, query) }))
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
      results.innerHTML = `<div class="resultItem">No results 🐾</div>`;
      return;
    }

    selectedIndex = 0;

    matches.forEach((cmd, i) => {
      const div = document.createElement("div");
      div.className = "resultItem";
      div.textContent = cmd.key;
      if (i === 0) div.classList.add("active");
      div.onclick = () => selectCommand(cmd);
      results.appendChild(div);
    });
  }

  function showRecent() {
    if (recent.length === 0) {
      results.innerHTML = `<div class="resultItem">Start typing…</div>`;
      return;
    }

    results.innerHTML = `<div style="opacity:0.6;padding:6px 10px;">Recent</div>`;

    recent.slice().reverse().forEach(cmdKey => {
      const div = document.createElement("div");
      div.className = "resultItem";
      div.textContent = cmdKey;
      div.onclick = () => {
        const cmd = commands.find(c => c.key === cmdKey);
        if (cmd) selectCommand(cmd);
      };
      results.appendChild(div);
    });
  }

  function selectCommand(cmd) {
    recent.push(cmd.key);
    recent = [...new Set(recent)].slice(-5);
    try {
      localStorage.setItem("recentSearches", JSON.stringify(recent));
    } catch {}
    cmd.action();
    closeSearch();
  }

  function updateActive(items) {
    items.forEach((el, i) => {
      el.style.background = i === selectedIndex
        ? "rgba(255,255,255,0.18)"
        : "rgba(255,255,255,0.05)";
    });
  }

  searchInput.addEventListener("keydown", e => {
    const items = [...results.querySelectorAll(".resultItem")];

    if (e.key === "ArrowDown") {
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
    }

    if (e.key === "ArrowUp") {
      selectedIndex = Math.max(selectedIndex - 1, 0);
    }

    if (e.key === "Enter") {
      items[selectedIndex]?.click();
    }

    updateActive(items);
  });

  searchInput.addEventListener("input", e => {
    renderResults(e.target.value);
  });

  searchBtn.addEventListener("click", openSearch);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !searchBox.classList.contains("hidden")) {
      e.preventDefault();
      e.stopPropagation();
      closeSearch();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearch();
    }
  });
});
