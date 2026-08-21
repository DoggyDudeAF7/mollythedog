(async function () {
  "use strict";

  const grid = document.getElementById("merchGrid");
  const empty = document.getElementById("merchEmpty");
  if (!grid || !empty) return;

  try {
    const response = await fetch("/data/merch.json", { cache: "force-cache" });
    const products = response.ok ? await response.json() : [];
    const stickers = Array.isArray(products)
      ? products.filter((product) => product?.category === "Sticker" && product.image && product.name)
      : [];
    if (!stickers.length) return;

    const fragment = document.createDocumentFragment();
    stickers.forEach((product) => {
      const article = document.createElement("article");
      article.className = "merch-item";
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.alt || `${product.name} sticker`;
      image.loading = "lazy";
      image.decoding = "async";
      const copy = document.createElement("div");
      copy.className = "merch-item-copy";
      const title = document.createElement("h3");
      title.textContent = product.name;
      const description = document.createElement("p");
      description.textContent = product.description || "Homemade Molly & Shaina sticker.";
      const meta = document.createElement("div");
      meta.className = "merch-item-meta";
      const status = document.createElement("span");
      status.textContent = product.available === false ? "Unavailable" : "Available";
      const price = document.createElement("span");
      price.textContent = product.price || "50¢";
      meta.append(status, price);
      copy.append(title, description, meta);
      article.append(image, copy);
      fragment.appendChild(article);
    });
    grid.appendChild(fragment);
    empty.hidden = true;
  } catch {
    // The page's preparation message remains visible until product data is available.
  }
})();
