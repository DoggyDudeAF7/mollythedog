(function () {
  "use strict";

  function mountChat() {
    const mount = document.getElementById("chat-widget-mount");
    const container = document.getElementById("chat-container");
    const bubble = document.getElementById("chat-bubble");
    if (!mount || !container || !bubble) return;

    mount.appendChild(container);
    bubble.setAttribute("role", "button");
    bubble.setAttribute("tabindex", "0");
    bubble.setAttribute("aria-label", "Open Molly and Shaina chat");
    bubble.setAttribute("title", "Ask Molly and Shaina");
    bubble.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        bubble.click();
      }
    });
    bubble.addEventListener("click", () => {
      window.MSAchievements?.unlock("very-suspicious");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountChat, { once: true });
  } else {
    mountChat();
  }
})();
