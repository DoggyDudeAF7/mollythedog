(function () {
  "use strict";

  const grid = document.getElementById("merchGrid");
  const empty = document.getElementById("merchEmpty");
  const dialog = document.getElementById("merchProductDialog");
  const bagApi = window.MSMerchBag;
  if (!grid || !empty || !dialog || !bagApi) return;

  const products = Array.isArray(window.MSMerchProducts) ? window.MSMerchProducts : [];
  const stickers = products.filter((product) =>
    product && product.category === "Sticker" && product.image && product.name
  );
  if (!stickers.length) return;

  const dialogImage = dialog.querySelector("[data-product-image]");
  const dialogName = dialog.querySelector("[data-product-name]");
  const dialogDescription = dialog.querySelector("[data-product-description]");
  const dialogPrice = dialog.querySelector("[data-product-price]");
  const addButton = dialog.querySelector("[data-add-to-bag]");
  const addStatus = dialog.querySelector("[data-add-status]");
  const closeButton = dialog.querySelector("[data-dialog-close]");
  let selectedProduct = null;

  function updateBagCounts(bag = bagApi.load()) {
    const amount = bagApi.count(bag);
    document.querySelectorAll("[data-bag-count]").forEach((counter) => {
      counter.textContent = amount;
    });
  }

  function openProduct(product) {
    selectedProduct = product;
    dialogImage.src = product.image;
    dialogImage.alt = product.alt || `${product.name} sticker`;
    dialogName.textContent = product.name;
    dialogDescription.textContent = product.description;
    dialogPrice.textContent = "Free by request";
    addButton.disabled = product.available === false;
    addButton.textContent = product.available === false ? "Unavailable" : "Add to selection";
    addStatus.textContent = "";
    dialog.showModal();
  }

  addButton.addEventListener("click", () => {
    if (!selectedProduct || selectedProduct.available === false) return;
    const previousCount = bagApi.count();
    const bag = bagApi.add(selectedProduct.id);
    updateBagCounts(bag);
    if (bagApi.count(bag) === previousCount) {
      addStatus.textContent = "Your selection already has the maximum of 5 stickers.";
      return;
    }
    addStatus.textContent = `${selectedProduct.name} was added to your selection.`;
    addButton.textContent = "Added";
    window.setTimeout(() => {
      if (dialog.open) addButton.textContent = "Add another";
    }, 900);
  });

  const fragment = document.createDocumentFragment();
  stickers.forEach((product) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "merch-item";
    card.setAttribute("aria-label", `View ${product.name}`);

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.alt || `${product.name} sticker`;
    image.loading = "lazy";
    image.decoding = "async";

    const copy = document.createElement("span");
    copy.className = "merch-item-copy";
    const title = document.createElement("strong");
    title.className = "merch-item-title";
    title.textContent = product.name;
    const description = document.createElement("span");
    description.className = "merch-item-description";
    description.textContent = product.description;
    const meta = document.createElement("span");
    meta.className = "merch-item-meta";
    const status = document.createElement("span");
    status.textContent = product.available === false ? "Unavailable" : "View sticker";
    const price = document.createElement("span");
    price.textContent = "Free";
    meta.append(status, price);
    copy.append(title, description, meta);
    card.append(image, copy);
    card.addEventListener("click", () => openProduct(product));
    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
  empty.hidden = true;
  updateBagCounts();

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
