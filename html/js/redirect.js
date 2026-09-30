// Root redirect page: show a short loading animation before opening the main feed.
(function() {
  "use strict";

  const minDelay = 800;
  const maxDelay = 1200;
  const delay = minDelay + Math.random() * (maxDelay - minDelay);

  const loadingFill = document.querySelector(".loading-fill");
  const loadingTrack = document.querySelector(".loading-track");
  const statusText = document.getElementById("statusText");
  const startTime = performance.now();

  loadingFill.style.animationDuration = `${delay}ms`;

  function updateProgress(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(100, (elapsed / delay) * 100);

    loadingTrack.setAttribute("aria-valuenow", Math.round(progress));

    if (progress < 100) {
      requestAnimationFrame(updateProgress);
    }
  }

  requestAnimationFrame(updateProgress);

  setTimeout(() => {
    statusText.textContent = "Almost there…";
  }, delay * 0.65);

  setTimeout(() => {
    statusText.textContent = "Ready";
    window.location.href = "/home/";
  }, delay);
})();
