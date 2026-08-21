(function () {
  "use strict";

  const products = Array.isArray(window.MSMerchProducts) ? window.MSMerchProducts : [];
  const params = new URLSearchParams(window.location.search);
  const selectedId = params.get("item");
  const product = products.find((item) => item.id === selectedId) || products[0];
  if (!product) return;

  const image = document.getElementById("checkoutProductImage");
  const name = document.getElementById("checkoutProductName");
  const description = document.getElementById("checkoutProductDescription");
  const quantity = document.getElementById("checkoutQuantity");
  const total = document.getElementById("checkoutTotal");

  image.src = product.image;
  image.alt = product.alt || `${product.name} sticker`;
  name.textContent = product.name;
  description.textContent = product.description;
  document.title = `${product.name} - Checkout Preview`;

  function updateTotal() {
    const amount = Math.max(1, Math.min(20, Number.parseInt(quantity.value, 10) || 1));
    quantity.value = amount;
    total.textContent = `$${(amount * 0.5).toFixed(2)}`;
  }

  quantity.addEventListener("input", updateTotal);
  quantity.addEventListener("change", updateTotal);
  updateTotal();
})();
