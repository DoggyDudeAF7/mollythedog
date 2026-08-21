(function () {
  "use strict";

  const products = Array.isArray(window.MSMerchProducts) ? window.MSMerchProducts : [];
  const bagApi = window.MSMerchBag;
  const items = document.getElementById("checkoutItems");
  const empty = document.getElementById("checkoutEmpty");
  const total = document.getElementById("checkoutTotal");
  if (!bagApi || !items || !empty || !total) return;

  function render() {
    const bag = bagApi.load();
    const bagProducts = Object.entries(bag)
      .map(([id, quantity]) => ({ product: products.find((item) => item.id === id), quantity }))
      .filter((item) => item.product);

    items.replaceChildren();
    empty.hidden = bagProducts.length > 0;
    let itemCount = 0;

    bagProducts.forEach(({ product, quantity }) => {
      itemCount += quantity;
      const row = document.createElement("article");
      row.className = "checkout-item";

      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.alt || `${product.name} sticker`;

      const copy = document.createElement("div");
      copy.className = "checkout-item-copy";
      const name = document.createElement("h2");
      name.textContent = product.name;
      const price = document.createElement("p");
      price.textContent = "50¢ each";
      copy.append(name, price);

      const controls = document.createElement("div");
      controls.className = "checkout-item-controls";
      const label = document.createElement("label");
      label.textContent = "Quantity";
      label.setAttribute("for", `quantity-${product.id}`);
      const input = document.createElement("input");
      input.id = `quantity-${product.id}`;
      input.type = "number";
      input.min = "1";
      input.max = "20";
      input.inputMode = "numeric";
      input.value = quantity;
      input.addEventListener("change", () => {
        const nextBag = bagApi.load();
        nextBag[product.id] = Math.max(1, Math.min(20, Number.parseInt(input.value, 10) || 1));
        bagApi.save(nextBag);
        render();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        const nextBag = bagApi.load();
        delete nextBag[product.id];
        bagApi.save(nextBag);
        render();
      });
      controls.append(label, input, remove);
      row.append(image, copy, controls);
      items.appendChild(row);
    });

    total.textContent = `$${(itemCount * 0.5).toFixed(2)}`;
  }

  render();
})();
