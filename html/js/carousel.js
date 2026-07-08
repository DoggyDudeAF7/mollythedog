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
      ]
    : [
        ["../images/molly/molly0.png", "../images/molly/molly.jpg"],
        ["../images/molly/molly1.png", "../images/molly/molly1.jpg"],
        ["../images/molly/molly2.png", "../images/molly/molly2.jpg"],
        ["../images/molly/molly3.png", "../images/molly/molly3.jpg"],
        ["../images/molly/molly4.png", "../images/molly/molly4.jpg"],
        ["../images/molly/molly5.png", "../images/molly/molly0.jpg"],
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

  let slides = [];
  let index = 0;
  let timer;
  const interval = 3000;

  for (let r = 0; r < 20; r++) {
    images.forEach(candidates => {
      const div = document.createElement("div");
      div.className = "slide";
      const img = document.createElement("img");
      img.alt = "";
      attachFallbacks(img, candidates);
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

  index = Math.floor(slides.length / 2);

  function getSlideStep() {
    const slide = slides[0];
    const styles = window.getComputedStyle(slide);
    const marginLeft = parseFloat(styles.marginLeft) || 0;
    const marginRight = parseFloat(styles.marginRight) || 0;
    return slide.offsetWidth + marginLeft + marginRight;
  }

  function update() {
    if (!slides[index]) return;

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
  }

  function next() {
    index++;
    update();
  }

  function goTo(i) {
    index = Math.floor(index / images.length) * images.length + i;
    update();
  }

  update();
  timer = setInterval(next, interval);

  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", () => {
    setTimeout(update, 250);
  });
});
