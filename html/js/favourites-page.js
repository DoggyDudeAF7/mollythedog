document.addEventListener("DOMContentLoaded", async () => {
  await (window.MSSystemsReady || Promise.resolve());
  const api = window.MSFavourites;
  const content = document.getElementById("favouritesContent");
  const total = document.getElementById("favouriteTotal");
  const clearButton = document.getElementById("clearFavourites");
  if (!api || !content) return;

  const categoryOrder = ["Breed", "Comic", "Gallery", "Blog"];
  const categoryLabels = { Breed: "Breeds", Comic: "Comics", Gallery: "Photos", Blog: "Blog Posts" };

  function itemCard(item) {
    const article = document.createElement("article");
    article.className = "favourite-item";
    if (item.image) {
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = item.title;
      image.loading = "lazy";
      article.appendChild(image);
    }
    const copy = document.createElement("div");
    copy.className = "favourite-item-copy";
    const type = document.createElement("span");
    type.className = "favourite-type";
    type.textContent = item.type;
    const title = document.createElement("h3");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.textContent = item.description || "Saved on this device.";
    const actions = document.createElement("div");
    actions.className = "favourite-actions";
    const open = document.createElement("a");
    open.href = item.url;
    open.textContent = "Open";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => api.remove(item.id));
    actions.append(open, remove);
    copy.append(type, title, description, actions);
    article.appendChild(copy);
    return article;
  }

  function render() {
    const items = api.list();
    total.textContent = String(items.length);
    clearButton.hidden = items.length === 0;
    content.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "system-empty";
      empty.innerHTML = "<strong>No favourites yet</strong>Use the heart buttons on breeds, comics, photos, and blog posts to build your collection.";
      content.appendChild(empty);
      return;
    }

    categoryOrder.forEach((category) => {
      const categoryItems = items.filter((item) => item.type === category);
      if (!categoryItems.length) return;
      const section = document.createElement("section");
      section.className = "favourite-group";
      const heading = document.createElement("h2");
      heading.textContent = `${categoryLabels[category]} (${categoryItems.length})`;
      const grid = document.createElement("div");
      grid.className = "favourite-grid";
      categoryItems.sort((a, b) => a.title.localeCompare(b.title)).forEach((item) => grid.appendChild(itemCard(item)));
      section.append(heading, grid);
      content.appendChild(section);
    });
  }

  clearButton.addEventListener("click", () => {
    if (confirm("Clear every saved favourite from this device?")) api.clear();
  });
  window.addEventListener("ms:favourites-changed", render);
  render();
});
