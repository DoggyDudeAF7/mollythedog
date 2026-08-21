const latestPostTag = document.getElementById("latestPostTag");
const latestPostDate = document.getElementById("latestPostDate");
const latestPostTitle = document.getElementById("latestPostTitle");
const latestPostBody = document.getElementById("latestPostBody");
const latestComicTitle = document.getElementById("latestComicTitle");
const latestComicText = document.getElementById("latestComicText");
const latestComicLink = document.getElementById("latestComicLink");
const latestComicImage = document.getElementById("latestComicImage");
const randomPhoto = document.getElementById("randomPhoto");
const randomPhotoLink = document.getElementById("randomPhotoLink");
const randomPhotoCaption = document.getElementById("randomPhotoCaption");
const shufflePhoto = document.getElementById("shufflePhoto");

const photos = [
  { src: "/images/molly/molly0.webp", alt: "Molly looking toward the camera", href: "/molly-gallery/" },
  { src: "/images/molly/molly1.webp", alt: "Close-up portrait of Molly", href: "/molly-gallery/" },
  { src: "/images/molly/molly2.webp", alt: "Molly curled up on folded towels", href: "/molly-gallery/" },
  { src: "/images/molly/molly3.webp", alt: "Molly resting on a patterned rug", href: "/molly-gallery/" },
  { src: "/images/molly/molly4.webp", alt: "Molly sitting beside a phone", href: "/molly-gallery/" },
  { src: "/images/molly/both1.webp", alt: "Molly and Shaina together", href: "/molly-gallery/" },
  { src: "/images/molly/both2.webp", alt: "Molly and Shaina sharing a quiet moment", href: "/molly-gallery/" },
  { src: "/images/molly/both3.webp", alt: "Molly and Shaina relaxing together", href: "/molly-gallery/" },
  { src: "/images/molly/both4.webp", alt: "Molly and Shaina side by side", href: "/molly-gallery/" },
  { src: "/images/molly/molly.webp", alt: "Portrait of Molly", href: "/molly-gallery/" },
  { src: "/images/molly/molly-900.webp", alt: "Molly looking calmly toward the camera", href: "/molly-gallery/" },
  { src: "/images/shaina/shaina.webp", alt: "Portrait of Shaina", href: "/shaina-gallery/" },
  { src: "/images/shaina/shaina1.webp", alt: "Shaina lying on a patterned rug with a tennis ball", href: "/shaina-gallery/" },
  { src: "/images/shaina/shaina2.webp", alt: "Shaina relaxing in sunlight by the back door", href: "/shaina-gallery/" },
  { src: "/images/shaina/shaina3.webp", alt: "Shaina peeking from beneath an orange towel", href: "/shaina-gallery/" },
  { src: "/images/shaina/shaina4.webp", alt: "Shaina carrying a plush toy", href: "/shaina-gallery/" }
];

function showBlogPost(post) {
  latestPostTag.textContent = post.tag || "Post";
  latestPostDate.textContent = post.date || "Latest";
  latestPostTitle.textContent = post.title || "New from the blog";
  latestPostBody.textContent = post.body || "Open the blog to read the latest update.";
}

async function loadLatestPost() {
  let posts = null;

  try {
    const response = await fetch("/api/posts", { cache: "no-store" });
    if (response.ok) posts = await response.json();
  } catch {}

  if (!Array.isArray(posts) || !posts.length) {
    try {
      const response = await fetch("/blog/posts.json", { cache: "no-store" });
      if (response.ok) posts = await response.json();
    } catch {}
  }

  if (Array.isArray(posts) && posts.length) {
    showBlogPost(posts[0]);
  } else {
    showBlogPost({
      tag: "Blog",
      date: "Latest notes",
      title: "Visit the Molly & Shaina Blog",
      body: "Field notes, updates, and important reports from dog headquarters."
    });
  }
}

async function loadLatestComic() {
  try {
    const response = await fetch("/comics/", { cache: "no-store" });
    if (!response.ok) throw new Error("Comic shelf unavailable");
    const documentText = await response.text();
    const comicDocument = new DOMParser().parseFromString(documentText, "text/html");
    const comicCards = [...comicDocument.querySelectorAll(".comic-cover-card")];
    const newest = comicCards.at(-1);
    if (!newest) throw new Error("No comics");
    const image = newest.querySelector("img");
    const label = newest.querySelector("span")?.textContent.trim() || "Read the latest comic";
    const title = label.replace(/^Read\s+/i, "");
    latestComicTitle.textContent = title;
    latestComicText.textContent = image?.alt || "The latest Molly and Shaina adventure is ready to read.";
    const comicShelfUrl = new URL("/comics/", location.href);
    latestComicLink.href = new URL(newest.getAttribute("href"), comicShelfUrl).href;
    latestComicImage.src = new URL(image.getAttribute("src"), comicShelfUrl).href;
    latestComicImage.alt = image.alt || `Front cover for ${title}`;
  } catch {
    // The HTML already contains a complete current-comic fallback.
  }
}

function showPhotoAt(index, shuffled = false) {
  const photo = photos[index];
  if (!photo) return;
  randomPhoto.src = photo.src;
  randomPhoto.alt = photo.alt;
  randomPhotoLink.href = photo.href;
  randomPhotoLink.setAttribute("aria-label", `Open gallery: ${photo.alt}`);
  randomPhotoCaption.textContent = `${photo.alt}.${shuffled ? " Shuffled just now." : " Photo of the Day."}`;
  randomPhoto.dataset.photoIndex = String(index);
}

function chooseDailyPhoto() {
  const today = new Date();
  const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
  showPhotoAt(dayNumber % photos.length);
}

function choosePhoto() {
  const previous = Number(randomPhoto.dataset.photoIndex || -1);
  let next = Math.floor(Math.random() * photos.length);
  if (photos.length > 1 && next === previous) {
    next = (next + 1 + Math.floor(Math.random() * (photos.length - 1))) % photos.length;
  }
  showPhotoAt(next, true);
}

async function loadRealPoppyPhotos() {
  try {
    const response = await fetch("/data/poppy-photos.json", { cache: "force-cache" });
    const poppyPhotos = response.ok ? await response.json() : [];
    if (Array.isArray(poppyPhotos)) {
      poppyPhotos.filter((photo) => photo?.src && photo?.alt).forEach((photo) => {
        photos.push({ src: photo.src, alt: photo.alt, href: "/poppy-gallery/" });
      });
    }
  } catch {}
  chooseDailyPhoto();
}

async function loadBreedOfTheDay() {
  try {
    const response = await fetch("/data/breeds.json", { cache: "force-cache" });
    if (!response.ok) throw new Error("Breed guide unavailable");
    const breedCards = await response.json();
    if (!Array.isArray(breedCards) || !breedCards.length) throw new Error("No breeds found");

    // This is deliberately identical to getDailyBreedIndex() in dog-breeds.js.
    const now = new Date();
    const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    const breed = breedCards[dayNumber % breedCards.length];
    const name = breed.title || "Today’s breed";
    const description = breed.description || "Today’s excellent dog breed.";
    const match = breed.match || "Daily pick";
    const meter = `${breed.energy || 50}%`;

    document.getElementById("dogName").textContent = name;
    document.getElementById("dogDescription").textContent = description;
    document.getElementById("dogMeter").style.width = meter;
    document.getElementById("dogMatch").textContent = match;
    document.getElementById("dogEnergy").textContent = `${meter.replace("%", "")}% energy`;
    document.getElementById("dogLink").href = breed.url || `/molly-dog-breeds/#${breed.slug}`;

    if (breed.image) {
      document.getElementById("dogImage").src = breed.image;
      document.getElementById("dogImage").alt = breed.alt || name;
    }
  } catch {
    // The card keeps its useful link to the full breed guide if it cannot be loaded.
  }
}

shufflePhoto.addEventListener("click", () => {
  choosePhoto();
  (window.MSSystemsReady || Promise.resolve()).then(() => window.MSAchievements?.record("shuffles", 1));
});
loadRealPoppyPhotos();
loadBreedOfTheDay();
loadLatestPost();
loadLatestComic();
