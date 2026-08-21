(function () {
  "use strict";

  const storageKey = "mollyandshaina-merch-bag-v1";
  let memoryBag = {};

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ...memoryBag };
      memoryBag = Object.fromEntries(
        Object.entries(saved)
          .map(([id, quantity]) => [id, Math.max(1, Math.min(5, Number(quantity) || 1))])
          .filter(([id]) => typeof id === "string" && id)
      );
      return { ...memoryBag };
    } catch {
      return { ...memoryBag };
    }
  }

  function save(bag) {
    memoryBag = { ...bag };
    try {
      localStorage.setItem(storageKey, JSON.stringify(bag));
    } catch {
      // memoryBag keeps the bag working for this page view if storage is unavailable.
    }
  }

  function count(bag = load()) {
    return Object.values(bag).reduce((total, quantity) => total + Number(quantity || 0), 0);
  }

  function add(id, quantity = 1) {
    const bag = load();
    const remaining = Math.max(0, 5 - count(bag));
    if (!remaining) return bag;
    bag[id] = Math.min(5, (bag[id] || 0) + Math.min(remaining, Math.max(1, Number(quantity) || 1)));
    save(bag);
    return bag;
  }

  window.MSMerchBag = Object.freeze({ load, save, count, add });
})();
