      // Random redirect delay: minimum 0.8 seconds, maximum 1.2 seconds.

      const minDelay = 800;
      const maxDelay = 1200;

      const delay = minDelay + Math.random() * (maxDelay - minDelay);

      const loadingFill = document.querySelector(".loading-fill");

      const loadingTrack = document.querySelector(".loading-track");

      const statusText = document.getElementById("statusText");

      loadingFill.style.animationDuration = `${delay}ms`;

      /*
      Optional progress tracking so the ARIA
      progress value changes along with the bar.
      */
      const startTime =
        performance.now();

      function updateProgress(currentTime) {
        const elapsed =
          currentTime - startTime;

        const progress =
          Math.min(
            100,
            (elapsed / delay) * 100
          );

        loadingTrack.setAttribute(
          "aria-valuenow",
          Math.round(progress)
        );

        if (progress < 100) {
          requestAnimationFrame(
            updateProgress
          );
        }
      }

      requestAnimationFrame(
        updateProgress
      );

      /*
      Change the tiny status text near the end.
      */
      setTimeout(() => {
        statusText.textContent =
          "Almost there…";
      }, delay * 0.65);

      /*
      Redirect at the exact end of the randomly
      chosen loading duration.
      */
      setTimeout(() => {
        statusText.textContent =
          "Ready";

        window.location.href =
          "/home/";
      }, delay);
