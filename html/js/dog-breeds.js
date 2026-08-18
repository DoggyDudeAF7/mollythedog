document.addEventListener("DOMContentLoaded", async () => {
  await (window.MSSystemsReady || Promise.resolve());

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

  const cards = [...results.querySelectorAll(".breed-card")];
  const links = [...menu.querySelectorAll("a")];
  const favouriteAPI = window.MSFavourites;
  let favoritesOnly = false;
  let dailyBreedCard = null;
  let activeFilters = new Set();
  let sortMode = "alphabetical";

  const groupProfiles = {
    companion: { temperament: "affectionate, adaptable, and people-focused", purpose: "close companionship", trainability: "Medium", friendliness: "High", barking: "Medium" },
    herding: { temperament: "intelligent, responsive, and highly aware of movement", purpose: "active homes that enjoy training and structured games", trainability: "High", friendliness: "High", barking: "High" },
    hound: { temperament: "independent, scent-driven, and quietly determined", purpose: "patient homes that enjoy outdoor exploration", trainability: "Medium", friendliness: "High", barking: "Medium" },
    retriever: { temperament: "friendly, cooperative, and enthusiastic", purpose: "families and active first-time owners", trainability: "High", friendliness: "High", barking: "Low" },
    sporting: { temperament: "athletic, attentive, and eager to work", purpose: "outdoorsy homes with time for daily exercise", trainability: "High", friendliness: "High", barking: "Medium" },
    terrier: { temperament: "bold, persistent, and full of opinions", purpose: "engaged owners who enjoy a clever, busy companion", trainability: "Medium", friendliness: "Medium", barking: "High" },
    toy: { temperament: "bright, affectionate, and surprisingly confident", purpose: "smaller homes seeking a close companion", trainability: "Medium", friendliness: "High", barking: "High" },
    working: { temperament: "loyal, capable, and naturally watchful", purpose: "experienced homes able to provide purpose and structure", trainability: "High", friendliness: "Medium", barking: "Medium" }
  };

  const weightOverrides = {
    "chihuahua": "1.5–3 kg", "yorkshire-terrier": "2–3.5 kg", "pomeranian": "1.8–3.5 kg", "papillon": "2.5–5 kg",
    "maltese": "3–4 kg", "toy-poodle": "2–4 kg", "great-dane": "45–80 kg", "mastiff": "54–100 kg",
    "st-bernard": "54–82 kg", "newfoundland": "45–68 kg", "irish-wolfhound": "48–70 kg", "leonberger": "41–77 kg",
    "cane-corso": "40–50 kg", "bernese-mountain-dog": "32–52 kg", "labrador-retriever": "25–36 kg",
    "golden-retriever": "25–34 kg", "german-shepherd": "22–40 kg", "beagle": "9–14 kg", "cavoodle": "5–12 kg",
    "poodle": "18–32 kg", "greyhound": "27–40 kg", "dachshund": "7–15 kg", "pug": "6–8 kg"
  };

  const lifespanOverrides = {
    "chihuahua": "14–17 years", "toy-poodle": "14–18 years", "yorkshire-terrier": "13–16 years", "pomeranian": "12–16 years",
    "great-dane": "7–10 years", "mastiff": "6–10 years", "st-bernard": "8–10 years", "irish-wolfhound": "6–9 years",
    "newfoundland": "9–10 years", "bernese-mountain-dog": "7–10 years", "golden-retriever": "10–12 years", "labrador-retriever": "10–13 years"
  };

  function titleCase(value) {
    return String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function numberFromMeter(card) {
    return Number.parseInt(card.querySelector(".breed-meter span")?.style.width, 10) || 50;
  }

  function levelFromNumber(value) {
    return value < 45 ? "Low" : value < 72 ? "Medium" : "High";
  }

  function hashScore(value, offset) {
    let hash = offset * 31;
    for (const character of value) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
    return 35 + Math.abs(hash % 66);
  }

  function profileFor(card) {
    const name = card.querySelector("h2")?.textContent.trim() || "This breed";
    const slug = card.id;
    const tags = (card.querySelector(".breed-kicker")?.textContent || "Companion • Medium • Medium").split("•").map((tag) => tag.trim());
    const group = (card.dataset.group || tags[0] || "companion").toLowerCase();
    const size = titleCase(tags[1] || "Medium");
    const coat = titleCase(tags[2] || "Medium");
    const energyNumber = numberFromMeter(card);
    const energy = levelFromNumber(energyNumber);
    const base = groupProfiles[group] || groupProfiles.companion;
    const grooming = coat === "Short" ? "Low" : coat === "Medium" || coat === "Wiry" ? "Medium" : "High";
    const exercise = energy === "High" ? "At least 60–90 minutes daily, plus training or enrichment" : energy === "Medium" ? "About 45–60 minutes daily with play and walks" : "Around 30–45 gentle minutes daily";
    const weight = weightOverrides[slug] || (size === "Small" ? "3–10 kg" : size === "Large" ? "25–50 kg" : "10–25 kg");
    const lifespan = lifespanOverrides[slug] || (size === "Small" ? "12–16 years" : size === "Large" ? "9–13 years" : "11–15 years");
    const apartment = size === "Small" && energy !== "High" || energy === "Low";
    const family = base.friendliness === "High";
    const lowShedding = coat === "Curly" || coat === "Wiry";
    const beginner = ["companion", "retriever", "toy"].includes(group) && energy !== "High";
    const match = card.dataset.match || "dog scholar";
    const temperament = base.temperament;
    const description = `${name}s are ${temperament}. This ${size.toLowerCase()} ${group} breed combines ${energy.toLowerCase()} energy with a ${coat.toLowerCase()} coat and is best known for ${base.purpose}.`;
    const consider = energy === "High"
      ? "Without enough physical exercise and problem-solving, boredom can turn into noise, digging, or creative household projects."
      : grooming === "High"
        ? "The coat needs a reliable brushing and professional-grooming routine to prevent uncomfortable mats."
        : base.barking === "High"
          ? "Early training helps keep alert barking useful instead of becoming the household soundtrack."
          : "Consistent socialisation, sensible exercise, and routine health care help this breed thrive.";

    return {
      name, slug, group, size, coat, energy, energyNumber, grooming,
      weight, lifespan, trainability: base.trainability, friendliness: base.friendliness, barking: base.barking,
      exercise, temperament, fit: titleCase(base.purpose), consider, apartment, family, lowShedding, beginner, match,
      description,
      ratings: {
        molly: match.includes("molly") ? 94 : hashScore(slug, 1),
        shaina: match.includes("shaina") ? 94 : hashScore(slug, 2),
        snack: hashScore(slug, 3), nap: Math.max(25, 110 - energyNumber), chaos: hashScore(slug, 4)
      }
    };
  }

  const profiles = new Map(cards.map((card) => [card.id, profileFor(card)]));

  function favouriteItem(card) {
    const profile = profiles.get(card.id);
    const image = card.querySelector("img")?.getAttribute("src") || "";
    return {
      id: `breed:${card.id}`,
      title: profile.name,
      type: "Breed",
      url: `/molly-dog-breeds/#${card.id}`,
      image: image ? new URL(image, location.href).pathname : "",
      description: profile.description,
      icon: ":breeds:"
    };
  }

  function isFavourite(id) {
    return favouriteAPI ? favouriteAPI.has(`breed:${id}`) : false;
  }

  function syncFavoriteButtons() {
    cards.forEach((card) => {
      const button = card.querySelector(".breed-favorite");
      if (!button) return;
      const active = isFavourite(card.id);
      const name = profiles.get(card.id).name;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `${active ? "Remove" : "Favourite"} ${name}`);
      button.title = active ? "Saved favourite" : "Save favourite";
    });
    links.forEach((link) => {
      const label = link.dataset.label || link.textContent.replace(/^⭐\s*/, "");
      link.dataset.label = label;
      link.textContent = isFavourite(link.dataset.target) ? `⭐ ${label}` : label;
    });
  }

  function rating(label, value) {
    return `<div class="breed-rating"><span>${label}</span><div><i style="width:${value}%"></i></div><strong>${value}%</strong></div>`;
  }

  function setupCards() {
    cards.forEach((card) => {
      const profile = profiles.get(card.id);
      const copy = card.querySelector(".breed-card-copy");
      const summary = copy?.querySelector(":scope > p:not(.breed-kicker)");
      if (!copy) return;
      if (summary) summary.textContent = profile.description;
      card.dataset.size = profile.size.toLowerCase();
      card.dataset.energy = profile.energy.toLowerCase();
      card.dataset.grooming = profile.grooming.toLowerCase();
      card.dataset.apartment = String(profile.apartment);
      card.dataset.family = String(profile.family);
      card.dataset.lowShedding = String(profile.lowShedding);
      card.dataset.beginner = String(profile.beginner);
      card.dataset.lifespan = String(Number.parseInt(profile.lifespan, 10) || 0);
      card.dataset.energyScore = String(profile.energyNumber);

      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-expanded", "false");

      const hint = document.createElement("p");
      hint.className = "breed-dropdown-hint";
      hint.textContent = "Open full breed guide";

      const details = document.createElement("div");
      details.className = "breed-details";
      details.innerHTML = `
        <div class="breed-fact-grid">
          <span><small>Size</small><strong>${profile.size}</strong></span>
          <span><small>Weight</small><strong>${profile.weight}</strong></span>
          <span><small>Lifespan</small><strong>${profile.lifespan}</strong></span>
          <span><small>Energy</small><strong>${profile.energy}</strong></span>
          <span><small>Grooming</small><strong>${profile.grooming}</strong></span>
          <span><small>Trainability</small><strong>${profile.trainability}</strong></span>
          <span><small>Friendliness</small><strong>${profile.friendliness}</strong></span>
          <span><small>Barking</small><strong>${profile.barking}</strong></span>
        </div>
        <div class="breed-notes">
          <p><strong>Coat</strong>${profile.coat} coat; ${profile.lowShedding ? "often lower shedding, although no dog is completely hypoallergenic" : "regular shedding should be expected"}.</p>
          <p><strong>Exercise needs</strong>${profile.exercise}.</p>
          <p><strong>Temperament</strong>${titleCase(profile.temperament)}.</p>
          <p><strong>Good fit for</strong>${profile.fit}.</p>
          <p><strong>Things to consider</strong>${profile.consider}</p>
        </div>
        <section class="breed-site-rating" aria-label="Molly and Shaina rating">
          <h3>Molly &amp; Shaina Rating</h3>
          ${rating("Molly similarity", profile.ratings.molly)}
          ${rating("Shaina similarity", profile.ratings.shaina)}
          ${rating("Snack enthusiasm", profile.ratings.snack)}
          ${rating("Nap potential", profile.ratings.nap)}
          ${rating("Chaos level", profile.ratings.chaos)}
        </section>
      `;
      copy.append(hint, details);
    });
  }

  function buildFilterControls() {
    const panel = document.createElement("section");
    panel.className = "breed-filter-panel";
    panel.setAttribute("aria-label", "Breed filters and sorting");
    panel.innerHTML = `
      <details>
        <summary>Filters <span id="activeFilterCount">0 active</span></summary>
        <div class="breed-filter-groups">
          <fieldset><legend>Size</legend><label><input type="checkbox" value="size:small">Small</label><label><input type="checkbox" value="size:medium">Medium</label><label><input type="checkbox" value="size:large">Large</label></fieldset>
          <fieldset><legend>Energy</legend><label><input type="checkbox" value="energy:low">Low</label><label><input type="checkbox" value="energy:medium">Medium</label><label><input type="checkbox" value="energy:high">High</label></fieldset>
          <fieldset><legend>Grooming</legend><label><input type="checkbox" value="grooming:low">Low</label><label><input type="checkbox" value="grooming:medium">Medium</label><label><input type="checkbox" value="grooming:high">High</label></fieldset>
          <fieldset><legend>Good fit</legend><label><input type="checkbox" value="apartment:true">Apartment-friendly</label><label><input type="checkbox" value="family:true">Family-friendly</label><label><input type="checkbox" value="lowShedding:true">Low shedding</label><label><input type="checkbox" value="beginner:true">Beginner-friendly</label></fieldset>
        </div>
        <button type="button" class="breed-clear-filters" id="clearBreedFilters">Clear filters</button>
      </details>
      <label class="breed-sort-label">Sort
        <select id="breedSort"><option value="alphabetical">Alphabetical</option><option value="energy-high">Energy: high to low</option><option value="energy-low">Energy: low to high</option><option value="size">Size</option><option value="grooming">Grooming</option><option value="lifespan">Lifespan</option></select>
      </label>
    `;
    search.after(panel);
    panel.addEventListener("change", (event) => {
      if (event.target.matches("input[type=checkbox]")) {
        activeFilters = new Set([...panel.querySelectorAll("input:checked")].map((input) => input.value));
      }
      if (event.target.id === "breedSort") sortMode = event.target.value;
      applyFilters();
    });
    panel.querySelector("#clearBreedFilters").addEventListener("click", () => {
      panel.querySelectorAll("input:checked").forEach((input) => { input.checked = false; });
      activeFilters.clear();
      applyFilters();
    });
  }

  function matchesFilters(card) {
    const grouped = {};
    activeFilters.forEach((filter) => {
      const [key, value] = filter.split(":");
      (grouped[key] ||= []).push(value);
    });
    return Object.entries(grouped).every(([key, values]) => values.includes(card.dataset[key]));
  }

  function sortCards() {
    const sizeRank = { small: 1, medium: 2, large: 3 };
    const groomingRank = { low: 1, medium: 2, high: 3 };
    const sorted = [...cards].sort((a, b) => {
      const nameCompare = profiles.get(a.id).name.localeCompare(profiles.get(b.id).name);
      if (sortMode === "energy-high") return Number(b.dataset.energyScore) - Number(a.dataset.energyScore) || nameCompare;
      if (sortMode === "energy-low") return Number(a.dataset.energyScore) - Number(b.dataset.energyScore) || nameCompare;
      if (sortMode === "size") return sizeRank[a.dataset.size] - sizeRank[b.dataset.size] || nameCompare;
      if (sortMode === "grooming") return groomingRank[a.dataset.grooming] - groomingRank[b.dataset.grooming] || nameCompare;
      if (sortMode === "lifespan") return Number(b.dataset.lifespan) - Number(a.dataset.lifespan) || nameCompare;
      return nameCompare;
    });
    sorted.forEach((card) => results.appendChild(card));
  }

  function applyFilters() {
    const query = search.value.trim().toLowerCase();
    let visibleCount = 0;
    sortCards();
    cards.forEach((card) => {
      const profile = profiles.get(card.id);
      const haystack = `${profile.name} ${profile.description} ${profile.group} ${profile.size} ${profile.coat} ${profile.temperament}`.toLowerCase();
      const visible = (!favoritesOnly || isFavourite(card.id)) && (!query || haystack.includes(query)) && matchesFilters(card);
      card.hidden = !visible;
      if (visible) visibleCount++;
    });
    links.forEach((link) => {
      const card = document.getElementById(link.dataset.target);
      link.hidden = !card || card.hidden;
    });
    const activeCount = document.getElementById("activeFilterCount");
    if (activeCount) activeCount.textContent = `${activeFilters.size} active`;
    counter.textContent = `Showing ${visibleCount} of ${cards.length} breeds • ${favouriteAPI?.list("Breed").length || 0} saved`;
  }

  function toggleCard(card) {
    const expanded = card.classList.toggle("expanded");
    card.setAttribute("aria-expanded", String(expanded));
    if (expanded) window.MSAchievements?.record("breeds", card.id);
  }

  function getDailyBreedIndex() {
    const today = new Date();
    return Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000) % cards.length;
  }

  function renderBreedOfDay() {
    if (!breedOfDay || !cards.length) return;
    dailyBreedCard = cards[getDailyBreedIndex()];
    const profile = profiles.get(dailyBreedCard.id);
    const image = dailyBreedCard.querySelector(".breed-portrait img");
    breedOfDayImage.innerHTML = image ? `<img src="${image.getAttribute("src")}" alt="${image.getAttribute("alt") || profile.name}">` : "";
    breedOfDayName.textContent = profile.name;
    breedOfDayText.textContent = profile.description;
    breedOfDayMeter.style.width = `${profile.energyNumber}%`;
    breedOfDayMatch.textContent = profile.match;
    breedOfDayEnergy.textContent = `${profile.energyNumber}% energy`;
    breedOfDay.dataset.target = dailyBreedCard.id;
  }

  results.addEventListener("click", (event) => {
    const favorite = event.target.closest(".breed-favorite");
    if (favorite) {
      const card = favorite.closest(".breed-card");
      if (card && favouriteAPI) favouriteAPI.toggle(favouriteItem(card));
      syncFavoriteButtons();
      applyFilters();
      return;
    }
    const card = event.target.closest(".breed-card");
    if (card && !event.target.closest("a, button")) toggleCard(card);
  });

  results.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key) || event.target.closest("button, a")) return;
    const card = event.target.closest(".breed-card");
    if (!card) return;
    event.preventDefault();
    toggleCard(card);
  });

  links.forEach((link) => {
    link.dataset.label = link.textContent;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = document.getElementById(link.dataset.target);
      if (target) {
        target.hidden = false;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.MSAchievements?.record("breeds", target.id);
      }
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
    activeFilters.clear();
    document.querySelectorAll(".breed-filter-panel input:checked").forEach((input) => { input.checked = false; });
    favoriteToggle.textContent = "⭐ Show Favourites";
    applyFilters();
    dailyBreedCard.hidden = false;
    dailyBreedCard.scrollIntoView({ behavior: "smooth", block: "start" });
    window.MSAchievements?.record("breeds", dailyBreedCard.id);
  });
  window.addEventListener("ms:favourites-changed", () => { syncFavoriteButtons(); applyFilters(); });

  setupCards();
  buildFilterControls();
  renderBreedOfDay();
  syncFavoriteButtons();
  applyFilters();

  if (location.hash) {
    const initial = document.getElementById(location.hash.slice(1));
    if (initial?.classList.contains("breed-card")) window.MSAchievements?.record("breeds", initial.id);
  }

  if (!("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      links.forEach((link) => link.classList.toggle("active", link.dataset.target === entry.target.id));
    });
  }, { threshold: 0.35 });
  cards.forEach((card) => observer.observe(card));
});
