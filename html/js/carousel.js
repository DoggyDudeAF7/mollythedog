document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("track");
  const dotsWrap = document.getElementById("dots");

  if (!track || !dotsWrap) return;

  const pageTitle = document.querySelector("h1")?.textContent?.toLowerCase() || "";
  const isShaina = pageTitle.includes("shaina");
  const images = isShaina
    ? [
        ["../images/shaina/shaina0.png", "../images/shaina/shaina.png"],
        ["../images/shaina/shaina1.png", "../images/shaina/shaina1.jpg"],
        ["../images/shaina/shaina2.png", "../images/shaina/shaina2.jpg"],
        ["../images/shaina/shaina3.png", "../images/shaina/shaina3.jpg"],
        ["../images/shaina/shaina4.png", "../images/shaina/shaina4.jpg"],
        ["../images/shaina/shaina5.png", "../images/shaina/shaina5.jpg", "../images/shaina/shaina.png"],
      ]
    : [
        ["../images/molly/molly0.png", "../images/molly/molly.jpg"],
        ["../images/molly/molly1.png", "../images/molly/molly1.jpg"],
        ["../images/molly/molly2.png", "../images/molly/molly2.jpg"],
        ["../images/molly/molly3.png", "../images/molly/molly3.jpg"],
        ["../images/molly/molly4.png", "../images/molly/molly4.jpg"],
        ["../images/molly/molly5.png", "../images/molly/molly5.jpg", "../images/molly/molly.jpg"],
      ];

  function attachFallbacks(img, candidates) {
    let current = 0;
    img.src = candidates[current];
    img.onerror = () => {
      current += 1;
      if (current < candidates.length) {
        img.src = candidates[current];
      }
    };
  }

  function openLightbox(src) {
    let lightbox = document.getElementById("lightbox");
    let lightboxImg = document.getElementById("lightboxImg");
    let closeButton = document.getElementById("lightboxClose");

    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.id = "lightbox";
      document.body.appendChild(lightbox);
    }

    if (!lightboxImg) {
      lightboxImg = document.createElement("img");
      lightboxImg.id = "lightboxImg";
      lightbox.appendChild(lightboxImg);
    }

    if (!closeButton) {
      closeButton = document.createElement("button");
      closeButton.id = "lightboxClose";
      closeButton.type = "button";
      closeButton.setAttribute("aria-label", "Close image");
      closeButton.textContent = "X";
      lightbox.appendChild(closeButton);
    }

    lightboxImg.src = src;
    lightbox.style.display = "flex";
  }

  let slides = [];
  let index = 0;
  let timer;
  const interval = 3000;
  const repeatCount = 20;
  const middleIndex = Math.floor(repeatCount / 2) * images.length;

  for (let r = 0; r < repeatCount; r++) {
    images.forEach(candidates => {
      const div = document.createElement("div");
      div.className = "slide";
      const img = document.createElement("img");
      img.alt = "";
      attachFallbacks(img, candidates);
      img.addEventListener("click", () => {
        openLightbox(img.currentSrc || img.src);
      });
      div.appendChild(img);
      track.appendChild(div);
      slides.push(div);
    });
  }

  const dots = [];

  images.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "dot";
    d.innerHTML = `<div class="fill"></div>`;
    d.onclick = () => goTo(i);
    dotsWrap.appendChild(d);
    dots.push(d);
  });

  index = middleIndex;

  function getSlideStep() {
    const slide = slides[0];
    const styles = window.getComputedStyle(slide);
    const marginLeft = parseFloat(styles.marginLeft) || 0;
    const marginRight = parseFloat(styles.marginRight) || 0;
    return slide.offsetWidth + marginLeft + marginRight;
  }

  function moveTrack(animate = true) {
    if (!slides[index]) return;

    track.style.transition = animate ? "" : "none";

    slides.forEach(s => s.classList.remove("active"));
    dots.forEach(d => {
      d.classList.remove("active");
      const f = d.querySelector(".fill");
      if (f) {
        f.style.transition = "none";
        f.style.width = "0%";
        f.offsetHeight;
      }
    });

    const real = ((index % images.length) + images.length) % images.length;

    slides[index].classList.add("active");
    dots[real].classList.add("active");

    const fill = dots[real]?.querySelector(".fill");
    if (fill) {
      fill.style.transition = `width ${interval}ms linear`;
      fill.style.width = "100%";
    }

    const slideStep = getSlideStep();
    const center = window.innerWidth / 2 - slides[index].offsetWidth / 2;
    track.style.transform = `translateX(${center - index * slideStep}px)`;

    if (!animate) {
      track.offsetHeight;
      track.style.transition = "";
    }
  }

  function normalizeIndex() {
    const real = ((index % images.length) + images.length) % images.length;
    if (index < images.length * 2 || index > slides.length - images.length * 2) {
      index = middleIndex + real;
      moveTrack(false);
    }
  }

  function update() {
    moveTrack(true);
  }

  function next() {
    index++;
    update();
  }

  function goTo(i) {
    index = middleIndex + i;
    update();
  }

  update();
  timer = setInterval(next, interval);
  track.addEventListener("transitionend", normalizeIndex);

  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", () => {
    setTimeout(update, 250);
  });
});
