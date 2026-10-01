(function() {
  "use strict";

  const button = document.getElementById("submitPulse");
  const line = document.getElementById("carterLine");
  const copyButton = document.getElementById("copyCarterLink");

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const url = "https://mollyandshaina.com/carter/";

      try {
        await navigator.clipboard.writeText(url);
        copyButton.textContent = "Copied";
      } catch {
        copyButton.textContent = "Copy failed";
      }

      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1800);
    });
  }

  if (!button || !line) return;

  button.addEventListener("click", () => {
    line.textContent = "Application status: reviewed by Carter? Phone decision pending.";
    line.classList.remove("reviewed");
    void line.offsetWidth;
    line.classList.add("reviewed");
  });
})();
