document.addEventListener("DOMContentLoaded", () => {
  const results = document.getElementById("breedResults");
  const menu = document.getElementById("breedMenu");
  const search = document.getElementById("breedSearch");
  const counter = document.getElementById("breedCounter");
  const favoriteToggle = document.getElementById("favoriteToggle");
  const breedOfDay = document.getElementById("breedOfDay");
  const breedOfDayImage = document.getElementById("breedOfDayImage");
  const breedOfDayName = document.getElementById("breedOfDayName");
  const breedOfDayText = document.getElementById("breedOfDayText");
  const breedOfDayMeter = document.getElementById("breedOfDayMeter");
  const breedOfDayMatch = document.getElementById("breedOfDayMatch");
  const breedOfDayEnergy = document.getElementById("breedOfDayEnergy");
  const breedOfDayJump = document.getElementById("breedOfDayJump");

  if (!results || !menu || !search || !counter || !favoriteToggle) return;

  const cards = Array.from(results.querySelectorAll(".breed-card"));
  const links = Array.from(menu.querySelectorAll("a"));
  const storageKey = "mollyDogBreedFavorites";
  const legacyStorageKey = "favoriteBreeds";
  let favoritesOnly = false;

  function readStoredFavorites(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  let storedFavorites = readStoredFavorites(storageKey);
  if (!storedFavorites.length) {
    storedFavorites = readStoredFavorites(legacyStorageKey);
  }

  const favorites = new Set(storedFavorites);
  let dailyBreedCard = null;

  function saveFavorites() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(favorites)));
    } catch (error) {}
  }

  function syncFavoriteButtons() {
    cards.forEach(card => {
      const button = card.querySelector(".breed-favorite");
      if (!button) return;
      const active = favorites.has(card.id);
      const name = card.querySelector("h2")?.textContent || "breed";
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `${active ? "Remove" : "Favorite"} ${name}`);
      button.title = active ? "Saved favourite" : "Save favourite";
    });
    links.forEach(link => {
      const label = link.dataset.label || link.textContent.replace(/^⭐\s*/, "");
      link.dataset.label = label;
      link.textContent = favorites.has(link.dataset.target) ? `⭐ ${label}` : label;
    });
  }

  function cardMatches(card, query) {
    const haystack = `${card.dataset.name || ""} ${card.dataset.group || ""} ${card.dataset.match || ""} ${card.textContent || ""}`.toLowerCase();
    return !query || haystack.includes(query);
  }

  function buildBreedDetails(card) {
    const name = card.querySelector("h2")?.textContent || "This breed";
    const group = card.dataset.group || "companion";
    const match = card.dataset.match || "personality";
    const kicker = card.querySelector(".breed-kicker")?.textContent.toLowerCase() || "dog breed";
    const energy = card.querySelector(".breed-meta span:last-child")?.textContent || "a flexible energy level";
    const tone = match.includes("molly")
      ? "It has a soft Molly-coded side: people-aware, comfort-loving, and very tuned in to the room."
      : match.includes("shaina")
        ? "It leans Shaina-coded: alert, quick to react, and happiest when there is something interesting to track."
        : `It brings a ${match} style, which makes it feel distinctive without being predictable.`;

    return `${name} is a ${kicker} from the ${group} world with ${energy.toLowerCase()}. ${tone} If this breed fits you, expect a dog with a clear personality, specific routines, and strong opinions about how the day should go.`;
  }

  function setupCardDropdowns() {
    cards.forEach(card => {
      const copy = card.querySelector(".breed-card-copy");
      if (!copy || copy.querySelector(".breed-details")) return;

      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-expanded", "false");

      const hint = document.createElement("p");
      hint.className = "breed-dropdown-hint";
      hint.textContent = "Click for breed notes";

      const details = document.createElement("p");
      details.className = "breed-details";
      details.textContent = buildBreedDetails(card);

      copy.appendChild(hint);
      copy.appendChild(details);
    });
  }

  function toggleCard(card) {
    const expanded = card.classList.toggle("expanded");
    card.setAttribute("aria-expanded", String(expanded));
  }

  function applyFilters() {
    const query = search.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(card => {
      const visible = (!favoritesOnly || favorites.has(card.id)) && cardMatches(card, query);
      card.hidden = !visible;
      if (visible) visibleCount++;
    });

    links.forEach(link => {
      const card = document.getElementById(link.dataset.target);
      link.hidden = !card || card.hidden;
    });

    const savedCount = favorites.size;
    counter.textContent = `Showing ${visibleCount} of ${cards.length} breeds • ${savedCount} saved`;
  }

  function getDailyBreedIndex() {
    const today = new Date();
    const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
    return dayNumber % cards.length;
  }

  function renderBreedOfDay() {
    if (!breedOfDay || !cards.length) return;

    dailyBreedCard = cards[getDailyBreedIndex()];
    const image = dailyBreedCard.querySelector(".breed-portrait img");
    const name = dailyBreedCard.querySelector("h2")?.textContent || "Mystery Breed";
    const text = dailyBreedCard.querySelector(".breed-card-copy > p:not(.breed-kicker)")?.textContent || "Today's excellent dog breed.";
    const match = dailyBreedCard.dataset.match || "Daily pick";
    const meter = dailyBreedCard.querySelector(".breed-meter span")?.style.width || "50%";

    breedOfDayImage.innerHTML = image
      ? `<img src="${image.getAttribute("src")}" alt="${image.getAttribute("alt") || name}">`
      : "";
    breedOfDayName.textContent = name;
    breedOfDayText.textContent = text;
    breedOfDayMeter.style.width = meter;
    breedOfDayMatch.textContent = match;
    breedOfDayEnergy.textContent = `${meter.replace("%", "")}% energy`;
    breedOfDay.dataset.target = dailyBreedCard.id;
  }

  results.addEventListener("click", event => {
    const favorite = event.target.closest(".breed-favorite");
    if (favorite) {
      const id = favorite.dataset.id;
      if (favorites.has(id)) {
        favorites.delete(id);
      } else {
        favorites.add(id);
      }
      saveFavorites();
      syncFavoriteButtons();
      applyFilters();
      return;
    }

    const card = event.target.closest(".breed-card");
    if (card) toggleCard(card);
  });

  results.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target.closest(".breed-favorite")) return;
    const card = event.target.closest(".breed-card");
    if (!card) return;
    event.preventDefault();
    toggleCard(card);
  });

  links.forEach(link => {
    link.dataset.label = link.textContent;
    link.addEventListener("click", event => {
      event.preventDefault();
      const target = document.getElementById(link.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  search.addEventListener("input", applyFilters);

  favoriteToggle.addEventListener("click", () => {
    favoritesOnly = !favoritesOnly;
    favoriteToggle.textContent = favoritesOnly ? "← Show All Breeds" : "⭐ Show Favourites";
    applyFilters();
  });

  breedOfDayJump?.addEventListener("click", () => {
    if (!dailyBreedCard) return;
    search.value = "";
    favoritesOnly = false;
    favoriteToggle.textContent = "⭐ Show Favourites";
    applyFilters();
    dailyBreedCard.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  renderBreedOfDay();
  setupCardDropdowns();
  syncFavoriteButtons();
  applyFilters();

  if (!("IntersectionObserver" in window)) {
    cards.forEach(card => card.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      links.forEach(link => {
        link.classList.toggle("active", link.dataset.target === entry.target.id);
      });
    });
  }, { threshold: 0.35 });

  cards.forEach(card => observer.observe(card));
});
