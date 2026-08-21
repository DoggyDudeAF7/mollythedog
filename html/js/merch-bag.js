(function () {
  "use strict";

  const storageKey = "mollyandshaina-merch-bag-v1";

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
      return Object.fromEntries(
        Object.entries(saved)
          .map(([id, quantity]) => [id, Math.max(1, Math.min(20, Number(quantity) || 1))])
          .filter(([id]) => typeof id === "string" && id)
      );
    } catch {
      return {};
    }
  }

  function save(bag) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(bag));
    } catch {
      // The bag still works for this page view if storage is unavailable.
    }
  }

  function count(bag = load()) {
    return Object.values(bag).reduce((total, quantity) => total + Number(quantity || 0), 0);
  }

  function add(id, quantity = 1) {
    const bag = load();
    bag[id] = Math.min(20, (bag[id] || 0) + Math.max(1, Number(quantity) || 1));
    save(bag);
    return bag;
  }

  window.MSMerchBag = Object.freeze({ load, save, count, add });
})();
