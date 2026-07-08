document.addEventListener("DOMContentLoaded", () => {
  const breedFiles = [
    'affenpinscher.png',
    'airedale-terrier.png',
    'akita.png',
    'alaskan-malamute.png',
    'american-bulldog.png',
    'american-cocker-spaniel.png',
    'australian-cattle-dog.png',
    'australian-kelpie.png',
    'australian-shepherd.png',
    'australian-terrier.png',
    'basenji.png',
    'basset-hound.png',
    'beagle.png',
    'bernese-mountain-dog.png',
    'bichon-frise.png',
    'bloodhound.png',
    'border-collie.png',
    'border-terrier.png',
    'boston-terrier.png',
    'boxer.png',
    'brittany-spaniel.png',
    'brussels-griffon.png',
    'bull-terrier.png',
    'bulldog.png',
    'cairn-terrier.png',
    'cane-corso.png',
    'catahoula-leopard-dog.png',
    'cavalier-king-charles-spaniel.png',
    'cavoodle.png',
    'chesapeake-bay-retriever.png',
    'chihuahua.png',
    'chinese-crested.png',
    'chow-chow.png',
    'cocker-spaniel.png',
    'collie.png',
    'coton-de-tulear.png',
    'curly-coated-retriever.png',
    'dachshund.png',
    'dalmatian.png',
    'doberman-pinscher.png',
    'dutch-shepherd.png',
    'english-setter.png',
    'english-springer-spaniel.png',
    'field-spaniel.png',
    'flat-coated-retriever.png',
    'fox-terrier.png',
    'french-bulldog.png',
    'german-shepherd.png',
    'golden-retriever.png',
    'great-dane.png',
    'greyhound.png',
    'havanese.png',
    'irish-setter.png',
    'irish-wolfhound.png',
    'italian-greyhound.png',
    'jack-russell-terrier.png',
    'keeshond.png',
    'kelpie.png',
    'labradoodle.png',
    'labrador-retriever.png',
    'leonberger.png',
    'lhasa-apso.png',
    'maltese.png',
    'maltipoo.png',
    'mastiff.png',
    'miniature-bull-terrier.png',
    'miniature-pinscher.png',
    'miniature-schnauzer.png',
    'newfoundland.png',
    'norwegian-elkhound.png',
    'old-english-sheepdog.png',
    'papillon.png',
    'pekingese.png',
    'pembroke-welsh-corgi.png',
    'pointer.png',
    'pomeranian.png',
    'poodle.png',
    'pug.png',
    'puli.png',
    'rhodesian-ridgeback.png',
    'rottweiler.png',
    'saluki.png',
    'samoyed.png',
    'schipperke.png',
    'scottish-terrier.png',
    'shetland-sheepdog.png',
    'shiba-inu.png',
    'shih-tzu.png',
    'siberian-husky.png',
    'soft-coated-wheaten-terrier.png',
    'st-bernard.png',
    'staffordshire-bull-terrier.png',
    'tibetan-mastiff.png',
    'toy-poodle.png',
    'vizsla.png',
    'weimaraner.png',
    'west-highland-white-terrier.png',
    'whippet.png',
    'xoloitzcuintli.png',
    'yorkshire-terrier.png'
  ];

  const results = document.getElementById("breedResults");
  const menu = document.getElementById("breedMenu");
  const search = document.getElementById("breedSearch");
  const counter = document.getElementById("breedCounter");
  const favoriteToggle = document.getElementById("favoriteToggle");

  if (!results || !menu || !search || !counter || !favoriteToggle) return;

  const storageKey = "favoriteBreeds";
  let storedFavorites = [];
  try {
    storedFavorites = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(storedFavorites)) storedFavorites = [];
  } catch {
    storedFavorites = [];
  }
  let favorites = new Set(storedFavorites);
  let favoritesOnly = false;

  const titleOverrides = {
    "akita": "Akita",
    "basenji": "Basenji",
    "cavoodle": "Cavoodle",
    "chihuahua": "Chihuahua",
    "labradoodle": "Labradoodle",
    "maltipoo": "Maltipoo",
    "pomeranian": "Pomeranian",
    "rottweiler": "Rottweiler",
    "samoyed": "Samoyed",
    "vizsla": "Vizsla",
    "weimaraner": "Weimaraner",
    "xoloitzcuintli": "Xoloitzcuintli"
  };

  const breedGroups = [
    { group: "Retriever", names: ["retriever", "labrador", "golden"] },
    { group: "Herding", names: ["shepherd", "collie", "kelpie", "cattle-dog", "corgi", "sheepdog"] },
    { group: "Terrier", names: ["terrier", "schnauzer"] },
    { group: "Toy", names: ["toy", "chihuahua", "pomeranian", "papillon", "pekingese", "brussels", "affenpinscher", "maltese", "shih-tzu", "havanese", "bichon"] },
    { group: "Hound", names: ["hound", "beagle", "basenji", "dachshund", "greyhound", "saluki", "whippet", "ridgeback"] },
    { group: "Working", names: ["akita", "malamute", "bulldog", "boxer", "cane-corso", "doberman", "great-dane", "mastiff", "newfoundland", "rottweiler", "husky", "st-bernard", "leonberger"] },
    { group: "Sporting", names: ["spaniel", "setter", "pointer", "vizsla", "brittany"] }
  ];

  function slugToName(slug) {
    if (titleOverrides[slug]) return titleOverrides[slug];
    return slug.split("-").map(part => part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  function slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function groupFor(id) {
    const match = breedGroups.find(item => item.names.some(name => id.includes(name)));
    return match ? match.group : "Companion";
  }

  function sizeFor(id) {
    if (/chihuahua|maltese|pug|pomeranian|papillon|pekingese|toy|yorkshire|cairn|bichon|havanese|affenpinscher|brussels|miniature/.test(id)) return "Small";
    if (/great-dane|mastiff|newfoundland|st-bernard|leonberger|wolfhound|malamute|bernese/.test(id)) return "Large";
    return "Medium";
  }

  function coatFor(id) {
    if (/poodle|cavoodle|labradoodle|maltipoo|curly/.test(id)) return "Curly";
    if (/samoyed|pomeranian|keeshond|chow|husky|malamute|newfoundland|sheepdog|collie|shelt|shetland/.test(id)) return "Fluffy";
    if (/terrier|schnauzer|wheaten/.test(id)) return "Wiry";
    if (/greyhound|whippet|vizsla|pointer|boxer|dalmatian|doberman|rottweiler|beagle|pug|bulldog/.test(id)) return "Short";
    return "Medium";
  }

  function energyFor(id, group) {
    let energy = { Working: 82, Herding: 90, Terrier: 76, Hound: 66, Sporting: 80, Retriever: 78, Toy: 48, Companion: 56 }[group] || 60;
    if (/kelpie|border-collie|jack-russell|cattle-dog|vizsla/.test(id)) energy += 8;
    if (/pug|pekingese|basset|bulldog|maltese|shih-tzu/.test(id)) energy -= 12;
    return Math.max(28, Math.min(98, energy));
  }

  function matchFor(id, energy) {
    if (/maltese|shih-tzu|cavoodle|toy-poodle|bichon|havanese|maltipoo/.test(id)) return "Molly-coded";
    if (/kelpie|border-collie|cattle-dog|australian-shepherd|german-shepherd|jack-russell/.test(id)) return "Shaina-coded";
    if (energy >= 82) return "High-alert";
    if (energy <= 48) return "Couch expert";
    return "Dog scholar";
  }

  function noteFor(group, match) {
    if (match === "Molly-coded") return "Soft, watchful, and extremely qualified for comfort-based decision making.";
    if (match === "Shaina-coded") return "Fast-thinking, alert, and always ready for the next important mission.";
    if (match === "High-alert") return "Built for motion, pattern spotting, and highly professional supervision.";
    if (match === "Couch expert") return "A specialist in lounging, snack proximity, and emotional presence.";
    return `A ${group.toLowerCase()} breed with its own particular blend of charm, focus, and mischief.`;
  }

  const breeds = breedFiles.map(file => {
    const id = file.replace(/\.png$/, "");
    const name = slugToName(id);
    const group = groupFor(id);
    const size = sizeFor(id);
    const coat = coatFor(id);
    const energy = energyFor(id, group);
    const match = matchFor(id, energy);
    return { id, name, group, size, coat, energy, match, note: noteFor(group, match), image: `../images/breeds/${file}` };
  });

  function saveFavorites() {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...favorites]));
    } catch {}
  }

  function cardTemplate(breed) {
    const active = favorites.has(breed.id) ? " active" : "";
    return `
      <article class="breed-card reveal left" id="${breed.id}" data-name="${breed.name.toLowerCase()}" data-group="${breed.group.toLowerCase()}" data-match="${breed.match.toLowerCase()}">
        <button class="breed-favorite${active}" type="button" aria-label="Favorite ${breed.name}" data-id="${breed.id}">⭐</button>
        <div class="breed-portrait"><img src="${breed.image}" alt="${breed.name}"></div>
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
      const haystack = `${breed.name} ${breed.group} ${breed.size} ${breed.coat} ${breed.match}`.toLowerCase();
      return (!favoritesOnly || favorites.has(breed.id)) && (!query || haystack.includes(query));
    });
  }

  function applyFilters() {
    const visible = new Set(visibleBreeds().map(breed => breed.id));
    document.querySelectorAll(".breed-card").forEach(card => {
      card.hidden = !visible.has(card.id);
    });
    counter.textContent = `Showing ${visible.size} of ${breeds.length} breeds`;
    renderMenu(visible);
  }

  function renderMenu(visible) {
    menu.innerHTML = "";
    breeds.forEach(breed => {
      if (!visible.has(breed.id)) return;
      const link = document.createElement("a");
      link.href = `#${breed.id}`;
      link.textContent = `${favorites.has(breed.id) ? "⭐ " : ""}${breed.name}`;
      link.dataset.target = breed.id;
      link.addEventListener("click", event => {
        event.preventDefault();
        const target = document.getElementById(breed.id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
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

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".breed-card").forEach(card => card.classList.add("visible"));
    return;
  }

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
});
