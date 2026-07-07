document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const searchBox = document.getElementById("searchBox");
  const searchInput = document.getElementById("searchInput");
  const results = document.getElementById("results");

  if (!searchBtn || !searchBox || !searchInput || !results) return;

  const shainaSite = location.pathname.includes("shaina-");
  const commands = shainaSite ? [
    { key: "home", action: () => location.href = "/html/shaina-home/" },
    { key: "traits", action: () => location.href = "/html/shaina-traits/" },
    { key: "habits", action: () => location.href = "/html/shaina-habits/" },
    { key: "mind", action: () => location.href = "/html/shaina-mind/" },
    { key: "gallery", action: () => location.href = "/html/shaina-gallery/" },
    { key: "faq", action: () => location.href = "/html/shaina-faq/" },
    { key: "molly", action: () => location.href = "/html/molly/" }
  ] : [
    { key: "home", action: () => location.href = "/html/molly/" },
    { key: "traits", action: () => location.href = "/html/molly-traits/" },
    { key: "habits", action: () => location.href = "/html/molly-habits/" },
    { key: "mind", action: () => location.href = "/html/molly-mind/" },
    { key: "gallery", action: () => location.href = "/html/molly-gallery/" },
    { key: "faq", action: () => location.href = "/html/molly-faq/" },
    { key: "shaina", action: () => location.href = "/html/shaina/" }
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
