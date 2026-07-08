document.addEventListener("DOMContentLoaded", () => {
  const breeds = [
    { name: "Cavoodle", group: "Companion", size: "Small", energy: 58, coat: "Curly", match: "Molly-coded", note: "Soft, people-focused, and suspiciously good at looking innocent.", emoji: "🐶" },
    { name: "Maltese", group: "Toy", size: "Small", energy: 42, coat: "Silky", match: "Molly-coded", note: "Lap-sized confidence with deluxe blanket requirements.", emoji: "🤍" },
    { name: "Shih Tzu", group: "Toy", size: "Small", energy: 38, coat: "Long", match: "Molly-coded", note: "A tiny indoor monarch with strong opinions about comfort.", emoji: "👑" },
    { name: "Toy Poodle", group: "Toy", size: "Small", energy: 64, coat: "Curly", match: "Molly-coded", note: "Smart, springy, and always calculating snack distance.", emoji: "🧠" },
    { name: "Australian Kelpie", group: "Working", size: "Medium", energy: 96, coat: "Short", match: "Shaina-coded", note: "Fast decisions, endless stamina, and a job-seeking brain.", emoji: "⚡" },
    { name: "Border Collie", group: "Herding", size: "Medium", energy: 98, coat: "Medium", match: "Shaina-coded", note: "Reads the room, the field, and your next three movements.", emoji: "👀" },
    { name: "Australian Cattle Dog", group: "Working", size: "Medium", energy: 92, coat: "Short", match: "Shaina-coded", note: "Alert, loyal, and built for serious supervision.", emoji: "🛡️" },
    { name: "Australian Shepherd", group: "Herding", size: "Medium", energy: 90, coat: "Medium", match: "Shaina-coded", note: "Beautiful chaos with excellent pattern recognition.", emoji: "✨" },
    { name: "Beagle", group: "Hound", size: "Small", energy: 72, coat: "Short", match: "Snack scholar", note: "A nose with a dog attached. Snack evidence never survives.", emoji: "🍪" },
    { name: "Dachshund", group: "Hound", size: "Small", energy: 55, coat: "Smooth", match: "Drama specialist", note: "Small body, huge hallway presence.", emoji: "🚪" },
    { name: "French Bulldog", group: "Companion", size: "Small", energy: 45, coat: "Short", match: "Couch expert", note: "Compact comedy with premium lounging instincts.", emoji: "🛋️" },
    { name: "Golden Retriever", group: "Sporting", size: "Large", energy: 78, coat: "Long", match: "Sunshine unit", note: "Friendly, enthusiastic, and emotionally waterproof.", emoji: "☀️" },
    { name: "Labrador Retriever", group: "Sporting", size: "Large", energy: 82, coat: "Short", match: "Snack optimist", note: "Believes every hand may contain food. Often correct.", emoji: "🎾" },
    { name: "German Shepherd", group: "Working", size: "Large", energy: 84, coat: "Medium", match: "Guard logic", note: "Intelligent, loyal, and deeply interested in boundaries.", emoji: "🧭" },
    { name: "Jack Russell Terrier", group: "Terrier", size: "Small", energy: 94, coat: "Short", match: "Zoom engine", note: "A compact action sequence with paws.", emoji: "💥" },
    { name: "Whippet", group: "Hound", size: "Medium", energy: 68, coat: "Short", match: "Sprint napper", note: "Lightning outside, blanket sculpture inside.", emoji: "🌙" },
    { name: "Pomeranian", group: "Toy", size: "Small", energy: 62, coat: "Fluffy", match: "Tiny announcement", note: "Small cloud, large public relations department.", emoji: "☁️" },
    { name: "Pug", group: "Toy", size: "Small", energy: 40, coat: "Short", match: "Comedy loaf", note: "Expressive, snack-forward, and shaped for affection.", emoji: "🥨" },
    { name: "Miniature Schnauzer", group: "Terrier", size: "Small", energy: 70, coat: "Wiry", match: "Neighborhood auditor", note: "A mustache with strong security opinions.", emoji: "📋" },
    { name: "Vizsla", group: "Sporting", size: "Large", energy: 88, coat: "Short", match: "Velcro athlete", note: "Runs hard, loves harder, leans constantly.", emoji: "🏃" }
  ];

  const results = document.getElementById("breedResults");
  const menu = document.getElementById("breedMenu");
  const search = document.getElementById("breedSearch");
  const counter = document.getElementById("breedCounter");
  const favoriteToggle = document.getElementById("favoriteToggle");
  const topButton = document.getElementById("breedTop");

  if (!results || !menu || !search || !counter || !favoriteToggle || !topButton) return;

  const storageKey = "favoriteBreeds";
  let favorites = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));
  let favoritesOnly = false;

  function slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function saveFavorites() {
    localStorage.setItem(storageKey, JSON.stringify([...favorites]));
  }

  function cardTemplate(breed) {
    const id = slug(breed.name);
    const active = favorites.has(id) ? " active" : "";
    return `
      <article class="breed-card reveal left" id="${id}" data-name="${breed.name.toLowerCase()}" data-group="${breed.group.toLowerCase()}" data-match="${breed.match.toLowerCase()}">
        <button class="breed-favorite${active}" type="button" aria-label="Favorite ${breed.name}" data-id="${id}">⭐</button>
        <div class="breed-portrait" aria-hidden="true">${breed.emoji}</div>
        <div class="breed-card-copy">
          <p class="breed-kicker">${breed.group} • ${breed.size} • ${breed.coat}</p>
          <h2>${breed.name}</h2>
          <p>${breed.note}</p>
          <div class="breed-meter" aria-label="Energy ${breed.energy} percent">
            <span style="width:${breed.energy}%"></span>
          </div>
          <div class="breed-meta">
            <span>${breed.match}</span>
            <span>${breed.energy}% energy</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderCards() {
    results.innerHTML = breeds.map(cardTemplate).join("");
  }

  function visibleBreeds() {
    const query = search.value.trim().toLowerCase();
    return breeds.filter(breed => {
      const id = slug(breed.name);
      const haystack = `${breed.name} ${breed.group} ${breed.size} ${breed.coat} ${breed.match}`.toLowerCase();
      return (!favoritesOnly || favorites.has(id)) && (!query || haystack.includes(query));
    });
  }

  function applyFilters() {
    const visible = new Set(visibleBreeds().map(breed => slug(breed.name)));
    document.querySelectorAll(".breed-card").forEach(card => {
      card.hidden = !visible.has(card.id);
    });
    counter.textContent = `Showing ${visible.size} of ${breeds.length} breeds`;
    renderMenu(visible);
  }

  function renderMenu(visible) {
    menu.innerHTML = "";
    breeds.forEach(breed => {
      const id = slug(breed.name);
      if (!visible.has(id)) return;
      const link = document.createElement("a");
      link.href = `#${id}`;
      link.textContent = `${favorites.has(id) ? "⭐ " : ""}${breed.name}`;
      link.dataset.target = id;
      link.addEventListener("click", event => {
        event.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      menu.appendChild(link);
    });
  }

  function syncFavorites() {
    document.querySelectorAll(".breed-favorite").forEach(button => {
      button.classList.toggle("active", favorites.has(button.dataset.id));
    });
    applyFilters();
  }

  renderCards();
  applyFilters();

  results.addEventListener("click", event => {
    const favorite = event.target.closest(".breed-favorite");
    if (!favorite) return;
    const id = favorite.dataset.id;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    saveFavorites();
    syncFavorites();
  });

  search.addEventListener("input", applyFilters);

  favoriteToggle.addEventListener("click", () => {
    favoritesOnly = !favoritesOnly;
    favoriteToggle.textContent = favoritesOnly ? "← Show All Breeds" : "⭐ Show Favorites";
    applyFilters();
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      document.querySelectorAll(".breed-menu a").forEach(link => {
        link.classList.toggle("active", link.dataset.target === entry.target.id);
      });
    });
  }, { threshold: 0.45 });

  document.querySelectorAll(".breed-card").forEach(card => observer.observe(card));

  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", () => {
    topButton.classList.toggle("visible", window.scrollY > 500);
  }, { passive: true });
});
