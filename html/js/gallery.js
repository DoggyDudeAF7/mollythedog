(async function () {
  "use strict";

  const grids = [...document.querySelectorAll(".grid[data-gallery], .grid.gallery-grid")];
  if (!grids.length) return;

  await Promise.all(grids.filter((grid) => grid.dataset.manifest).map(async (grid) => {
    try {
      const response = await fetch(grid.dataset.manifest, { cache: "force-cache" });
      const photos = response.ok ? await response.json() : [];
      if (!Array.isArray(photos)) return;
      photos.filter((photo) => photo?.src && photo?.alt).forEach((photo, index) => {
        const image = document.createElement("img");
        image.src = photo.src;
        image.alt = photo.alt;
        image.loading = "lazy";
        image.decoding = "async";
        if (photo.date) image.dataset.date = photo.date;
        if (photo.category) image.dataset.category = photo.category;
        image.dataset.favouriteId = photo.id || `photo:poppy-${index + 1}`;
        image.dataset.favouriteTitle = photo.title || photo.alt;
        image.dataset.favouriteDescription = photo.caption || photo.alt;
        grid.appendChild(image);
      });
      if (grid.children.length) grid.parentElement?.querySelector(".gallery-empty")?.setAttribute("hidden", "");
    } catch {}
  }));

  function detailsFor(image) {
    const text = `${image.alt} ${image.src}`.toLowerCase();
    const dog = text.includes("molly") && text.includes("shaina") || text.includes("both")
      ? "Together"
      : text.includes("shaina") ? "Shaina" : text.includes("poppy") ? "Poppy" : "Molly";
    let category = image.dataset.category || "Portraits";
    if (/outside|outdoor|lead|meadow|garden/.test(text)) category = "Outdoors";
    else if (/rest|curled|towel|sunlight|sleep|couch/.test(text)) category = "Sleepy";
    else if (/toy|tennis|phone|play|carrying/.test(text)) category = "Playful";
    else if (dog === "Together") category = "Together";
    return { dog, category };
  }

  function prepareItem(image) {
    if (image.closest(".gallery-item")) return image.closest(".gallery-item");
    const { dog, category } = detailsFor(image);
    const figure = document.createElement("figure");
    figure.className = "gallery-item";
    figure.dataset.dog = dog;
    figure.dataset.category = category;
    image.parentNode.insertBefore(figure, image);
    figure.appendChild(image);
    const caption = document.createElement("figcaption");
    const description = document.createElement("span");
    description.textContent = image.alt;
    const details = document.createElement("small");
    const dogName = document.createElement("b");
    dogName.textContent = dog;
    details.append(dogName, ` · ${category} · ${image.dataset.date || "Date not recorded"}`);
    caption.append(description, details);
    figure.appendChild(caption);
    return figure;
  }

  const items = grids.flatMap((grid) => [...grid.querySelectorAll(":scope > img")].map(prepareItem));
  if (!items.length) return;

  const availableDogs = ["Molly", "Shaina", "Together", "Poppy"].filter((name) => items.some((item) => item.dataset.dog === name));
  const availableCategories = ["Portraits", "Outdoors", "Sleepy", "Playful", "Together"].filter((name) => items.some((item) => item.dataset.category === name));
  const toolbar = document.createElement("section");
  toolbar.className = "gallery-toolbar";
  toolbar.setAttribute("aria-label", "Photo gallery controls");
  toolbar.innerHTML = `
    <div class="gallery-filter-group" aria-label="Filter by dog">
      <button type="button" class="active" data-filter-kind="all" data-filter-value="all">All photos</button>
      ${availableDogs.map((name) => `<button type="button" data-filter-kind="dog" data-filter-value="${name}">${name}</button>`).join("")}
    </div>
    <div class="gallery-filter-group" aria-label="Filter by category">
      ${availableCategories.map((name) => `<button type="button" data-filter-kind="category" data-filter-value="${name}">${name}</button>`).join("")}
    </div>
    <button type="button" class="gallery-shuffle">↻ Shuffle photos</button>`;

  const firstSection = grids[0].closest("section");
  firstSection?.parentNode.insertBefore(toolbar, firstSection);

  toolbar.addEventListener("click", (event) => {
    const filter = event.target.closest("[data-filter-kind]");
    if (filter) {
      toolbar.querySelectorAll("[data-filter-kind]").forEach((button) => button.classList.toggle("active", button === filter));
      const kind = filter.dataset.filterKind;
      const value = filter.dataset.filterValue;
      items.forEach((item) => { item.hidden = kind !== "all" && item.dataset[kind] !== value; });
      return;
    }
    if (!event.target.closest(".gallery-shuffle")) return;
    grids.forEach((grid) => {
      [...grid.querySelectorAll(":scope > .gallery-item")]
        .sort(() => Math.random() - 0.5)
        .forEach((item) => grid.appendChild(item));
    });
    window.MSAchievements?.record("shuffles", 1);
  });
})();
