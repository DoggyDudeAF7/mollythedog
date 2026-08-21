(function () {
  "use strict";

  const products = Array.isArray(window.MSMerchProducts) ? window.MSMerchProducts : [];
  const bagApi = window.MSMerchBag;
  const items = document.getElementById("checkoutItems");
  const empty = document.getElementById("checkoutEmpty");
  const form = document.getElementById("stickerRequestForm");
  const submitButton = document.getElementById("sendStickerRequest");
  const status = document.getElementById("stickerRequestStatus");
  if (!bagApi || !items || !empty || !form || !submitButton || !status) return;

  function getSelectedProducts() {
    return Object.entries(bagApi.load())
      .map(([id, quantity]) => ({
        product: products.find((item) => item.id === id),
        quantity: Math.max(1, Math.min(5, Number(quantity) || 1)),
      }))
      .filter((item) => item.product);
  }

  function render() {
    const selected = getSelectedProducts();
    items.replaceChildren();
    empty.hidden = selected.length > 0;
    submitButton.disabled = selected.length === 0;

    selected.forEach(({ product, quantity }) => {
      const row = document.createElement("article");
      row.className = "checkout-item";

      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.alt || `${product.name} sticker`;

      const copy = document.createElement("div");
      copy.className = "checkout-item-copy";
      const name = document.createElement("h2");
      name.textContent = product.name;
      const availability = document.createElement("p");
      availability.textContent = "Free by request";
      copy.append(name, availability);

      const controls = document.createElement("div");
      controls.className = "checkout-item-controls";
      const label = document.createElement("label");
      label.textContent = "Quantity";
      label.setAttribute("for", `quantity-${product.id}`);
      const input = document.createElement("input");
      input.id = `quantity-${product.id}`;
      input.type = "number";
      input.min = "1";
      input.max = "5";
      input.inputMode = "numeric";
      input.value = quantity;
      input.addEventListener("change", () => {
        const nextBag = bagApi.load();
        const requested = Math.max(1, Math.min(5, Number.parseInt(input.value, 10) || 1));
        const otherTotal = Object.entries(nextBag)
          .filter(([id]) => id !== product.id)
          .reduce((sum, [, amount]) => sum + Number(amount || 0), 0);
        nextBag[product.id] = Math.min(requested, Math.max(1, 5 - otherTotal));
        bagApi.save(nextBag);
        status.textContent = requested + otherTotal > 5
          ? "A request can contain no more than 5 stickers."
          : "Your selection is saved on this device.";
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
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const selected = getSelectedProducts();
    const total = selected.reduce((sum, item) => sum + item.quantity, 0);
    if (!selected.length || total > 5) {
      status.textContent = "Choose between 1 and 5 stickers before sending your request.";
      return;
    }

    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      address1: formData.get("address1"),
      address2: formData.get("address2"),
      suburb: formData.get("suburb"),
      state: formData.get("state"),
      postcode: formData.get("postcode"),
      website: formData.get("website"),
      permission: formData.get("permission") === "on",
      items: selected.map(({ product, quantity }) => ({ id: product.id, quantity })),
    };

    submitButton.disabled = true;
    submitButton.textContent = "Sending request…";
    status.textContent = "Sending your sticker request for review…";

    try {
      const response = await fetch("/api/sticker-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "The request could not be sent.");

      bagApi.save({});
      form.reset();
      render();
      submitButton.textContent = "Request sent";
      status.textContent = "Request received. It will be reviewed before anything is mailed.";
    } catch (error) {
      submitButton.disabled = false;
      submitButton.textContent = "Send free sticker request";
      status.textContent = error.message || "The request could not be sent.";
    }
  });

  render();
})();
