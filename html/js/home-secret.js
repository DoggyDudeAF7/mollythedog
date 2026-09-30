(() => {
  const trigger = document.getElementById("homeSecretTrigger");
  const dialog = document.getElementById("homeSecretDialog");
  const close = document.getElementById("homeSecretClose");

  if (!trigger || !dialog || !close) return;

  function openDialog() {
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog() {
    if (dialog.close) dialog.close();
    else dialog.removeAttribute("open");
  }

  trigger.addEventListener("click", openDialog);
  close.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
})();
