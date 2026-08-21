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
      if (product.layout === "sheet") article.classList.add("merch-item-sheet");
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.alt || `${product.name} sticker`;
      image.loading = "lazy";
      image.decoding = "async";
      let visual = image;
      if (Array.isArray(product.crop) && product.crop.length === 4) {
        const [x, y, width, height] = product.crop.map(Number);
        const crop = document.createElement("div");
        crop.className = "merch-sticker-crop";
        crop.style.aspectRatio = `${width} / ${height}`;
        image.style.width = `${(1055 / width) * 100}%`;
        image.style.left = `${(-x / width) * 100}%`;
        image.style.top = `${(-y / height) * 100}%`;
        crop.appendChild(image);
        visual = crop;
      }
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
      article.append(visual, copy);
      fragment.appendChild(article);
    });
    grid.appendChild(fragment);
    empty.hidden = true;
  } catch {
    // The page's preparation message remains visible until product data is available.
  }
})();
