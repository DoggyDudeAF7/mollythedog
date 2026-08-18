(function () {
  "use strict";

  const STORAGE_KEY = "msAchievementsV1";
  const definitions = [
    { id: "dog-trio", icon: "🐾", title: "Dog Trio", description: "Visited Molly, Shaina, and Poppy.", target: 3, progress: "dogs" },
    { id: "dog-scholar", icon: "🎓", title: "Dog Scholar", description: "Viewed 20 different dog breeds.", target: 20, progress: "breeds" },
    { id: "breed-expert", icon: "🧠", title: "Breed Expert", description: "Viewed 50 different dog breeds.", target: 50, progress: "breeds" },
    { id: "comic-reader", icon: "📚", title: "Comic Reader", description: "Read 5 different comics.", target: 5, progress: "comics" },
    { id: "comic-addict", icon: "🤓", title: "Comic Addict", description: "Read every current Molly and Shaina comic.", target: 8, progress: "comics" },
    { id: "explorer", icon: "🧭", title: "Explorer", description: "Visited 10 different major pages.", target: 10, progress: "pages" },
    { id: "professional-snooper", icon: "🔎", title: "Professional Snooper", description: "Used site search 10 times.", target: 10, progress: "searches" },
    { id: "collector", icon: "♥", title: "Collector", description: "Saved 5 favourites.", target: 5, progress: "favourites" },
    { id: "ultimate-collector", icon: "💎", title: "Ultimate Collector", description: "Saved 20 favourites.", target: 20, progress: "favourites" },
    { id: "shuffle-master", icon: "🔀", title: "Shuffle Master", description: "Shuffled the homepage photo 5 times.", target: 5, progress: "shuffles" },
    { id: "gallery-hound", icon: "📷", title: "Gallery Hound", description: "Opened 10 different gallery photos.", target: 10, progress: "photos" },
    { id: "regular-visitor", icon: "📅", title: "Regular Visitor", description: "Visited on 3 different days.", target: 3, progress: "days" },
    { id: "blanket-inspector", icon: "🛏️", title: "Blanket Inspector", description: "Visited Molly's habits page.", secret: true },
    { id: "you-found-it", icon: "🕵️", title: "You Found It", description: "Discovered a secret part of the site.", secret: true },
    { id: "very-suspicious", icon: "👀", title: "Very Suspicious", description: "Asked one of the dogs an important question.", secret: true },
    { id: "night-watch", icon: "🌙", title: "Night Watch", description: "Visited dog headquarters after midnight.", secret: true }
  ];

  function emptyState() {
    return { version: 1, unlocked: {}, progress: { dogs: [], breeds: [], comics: [], pages: [], photos: [], days: [], searches: 0, shuffles: 0 } };
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return emptyState();
      const blank = emptyState();
      return {
        version: 1,
        unlocked: parsed.unlocked && typeof parsed.unlocked === "object" ? parsed.unlocked : {},
        progress: { ...blank.progress, ...(parsed.progress || {}) }
      };
    } catch {
      return emptyState();
    }
  }

  let state = readState();

  // Pure state backup wrapper
  function saveStateToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  function progressValue(definition) {
    if (definition.progress === "favourites") return window.MSFavourites?.count() || 0;
    const value = state.progress[definition.progress];
    return Array.isArray(value) ? value.length : Number(value || 0);
  }

  function showToast(definition) {
    const toast = document.createElement("div");
    toast.className = "ms-achievement-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = `<span>${definition.icon}</span><div><small>Achievement Unlocked</small><strong>${definition.title}</strong><p>${definition.description}</p></div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 350);
    }, 4200);
  }

  function unlock(id, quiet = false) {
    if (state.unlocked[id]) return false;
    const definition = definitions.find((item) => item.id === id);
    if (!definition) return false;
    
    state.unlocked[id] = new Date().toISOString();
    saveStateToStorage();
    
    // Announce changes downstream without looping back to validations
    window.dispatchEvent(new CustomEvent("ms:achievements-changed"));
    
    if (!quiet) showToast(definition);
    return true;
  }

  function check() {
    definitions.forEach((definition) => {
      if (definition.target && progressValue(definition) >= definition.target) {
        unlock(definition.id);
      }
    });
  }

  function addUnique(key, value) {
    if (!value) return;
    if (!Array.isArray(state.progress[key])) state.progress[key] = [];
    if (!state.progress[key].includes(value)) {
      state.progress[key].push(value);
      saveStateToStorage();
      check();
    }
  }

  function increment(key, amount = 1) {
    state.progress[key] = Number(state.progress[key] || 0) + amount;
    saveStateToStorage();
    check();
  }

  function record(kind, value) {
    if (["dogs", "breeds", "comics", "pages", "photos", "days"].includes(kind)) addUnique(kind, value);
    else if (["searches", "shuffles"].includes(kind)) increment(kind, Number(value || 1));
    else if (kind === "secret") unlock(value);
  }

  function recordCurrentPage() {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    if (!path.includes("/admin")) addUnique("pages", path);
    const today = new Date().toISOString().slice(0, 10);
    addUnique("days", today);

    if (/^\/molly(?:\/|$)/.test(path)) addUnique("dogs", "molly");
    if (/^\/shaina(?:-home)?(?:\/|$)/.test(path)) addUnique("dogs", "shaina");
    if (/^\/poppy(?:\/|$)/.test(path)) addUnique("dogs", "poppy");
    if (path === "/molly-habits") unlock("blanket-inspector");
    if (["/site-access", "/secret-control-panel", "/samuel-start"].includes(path)) unlock("you-found-it");
    try {
      if (localStorage.getItem("msFoundSecret") === "1") unlock("you-found-it");
    } catch {}
    if (new Date().getHours() < 5) unlock("night-watch");
  }

  function getProgress(definition) {
    const current = definition.target ? Math.min(progressValue(definition), definition.target) : (state.unlocked[definition.id] ? 1 : 0);
    return { current, target: definition.target || 1 };
  }

  function init() {
    recordCurrentPage();
    check();
    window.addEventListener("ms:favourites-changed", check);
    document.addEventListener("click", (event) => {
      const image = event.target.closest(".grid img");
      if (!image) return;
      const pathname = new URL(image.currentSrc || image.src, location.href).pathname;
      record("photos", pathname);
    });
  }

  window.MSAchievements = {
    definitions,
    record,
    unlock,
    isUnlocked: (id) => Boolean(state.unlocked[id]),
    unlockedAt: (id) => state.unlocked[id] || "",
    getProgress,
    getState: () => JSON.parse(JSON.stringify(state)),
    check,
    storageKey: STORAGE_KEY
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
