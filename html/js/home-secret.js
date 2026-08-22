(() => {
  const trigger = document.getElementById("homeSecretTrigger");
  const dialog = document.getElementById("homeSecretDialog");
  const close = document.getElementById("homeSecretClose");

  if (!trigger || !dialog || !close) return;

  trigger.addEventListener("click", () => dialog.showModal());
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
