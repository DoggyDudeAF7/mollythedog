(function() {
  "use strict";

  const button = document.getElementById("submitPulse");
  const line = document.getElementById("carterLine");

  if (!button || !line) return;

  button.addEventListener("click", () => {
    line.textContent = "Application status: reviewed by Carter? Phone decision pending.";
    line.classList.remove("reviewed");
    void line.offsetWidth;
    line.classList.add("reviewed");
  });
})();
