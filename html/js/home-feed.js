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
  { src: "images/molly/molly0.webp", alt: "Molly looking toward the camera", href: "molly-gallery/" },
  { src: "images/molly/molly1.webp", alt: "Close-up portrait of Molly", href: "molly-gallery/" },
  { src: "images/molly/molly2.webp", alt: "Molly curled up on folded towels", href: "molly-gallery/" },
  { src: "images/molly/molly3.webp", alt: "Molly resting on a patterned rug", href: "molly-gallery/" },
  { src: "images/molly/molly4.webp", alt: "Molly sitting beside a phone", href: "molly-gallery/" },
  { src: "images/molly/both1.webp", alt: "Molly and Shaina together", href: "molly-gallery/" },
  { src: "images/molly/both2.webp", alt: "Molly and Shaina sharing a quiet moment", href: "molly-gallery/" },
  { src: "images/molly/both3.webp", alt: "Molly and Shaina relaxing together", href: "molly-gallery/" },
  { src: "images/molly/both4.webp", alt: "Molly and Shaina side by side", href: "molly-gallery/" },
  { src: "images/shaina/shaina1.webp", alt: "Shaina lying on a patterned rug with a tennis ball", href: "shaina-gallery/" },
  { src: "images/shaina/shaina2.webp", alt: "Shaina relaxing in sunlight by the back door", href: "shaina-gallery/" },
  { src: "images/shaina/shaina3.webp", alt: "Shaina peeking from beneath an orange towel", href: "shaina-gallery/" },
  { src: "images/shaina/shaina4.webp", alt: "Shaina carrying a plush toy", href: "shaina-gallery/" },
  { src: "images/poppy/poppy-meadow-v2.webp", alt: "Poppy outdoors in an open meadow", href: "poppy-gallery/" },
  { src: "images/poppy/poppy-home-v2.webp", alt: "Poppy relaxing at home", href: "poppy-gallery/" },
  { src: "images/poppy/poppy-home-v3.webp", alt: "Poppy resting on a charcoal sofa", href: "poppy-gallery/" }
];

const dogs = [
  {
    name: "Molly",
    title: "Chief Blanket Architect",
    description: "An experienced nap planner with a strong commitment to snack detection.",
    image: "images/emoji/molly-emoji.webp",
    href: "molly/"
  },
  {
    name: "Shaina",
    title: "Head of Investigations",
    description: "Fast, alert, and ready to examine every noise that might involve food.",
    image: "images/emoji/shaina-emoji.webp",
    href: "shaina-home/"
  },
  {
    name: "Poppy",
    title: "Senior Room Observer",
    description: "Independent, thoughtful, and always willing to assess a situation before joining it.",
    image: "images/emoji/poppy-emoji.webp",
    href: "poppy/"
  }
];

function showBlogPost(post) {
  latestPostTag.textContent = post.tag || "Post";
  latestPostDate.textContent = post.date || "Latest";
  latestPostTitle.textContent = post.title || "New from the blog";
  latestPostBody.textContent = post.body || "Open the blog to read the latest update.";
}

async function loadLatestPost() {
  try {
    let response = await fetch("/api/posts");
    if (!response.ok) response = await fetch("/blog/posts.json");
    const posts = await response.json();
    if (!Array.isArray(posts) || !posts.length) throw new Error("No posts");
    showBlogPost(posts[0]);
  } catch {
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
    const response = await fetch("/comics/");
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
    latestComicLink.href = new URL(newest.getAttribute("href"), new URL("/comics/", location.href)).href;
    latestComicImage.src = new URL(image.getAttribute("src"), new URL("/comics/", location.href)).href;
    latestComicImage.alt = image.alt || `Front cover for ${title}`;
  } catch {
    // The HTML already contains a complete current-comic fallback.
  }
}

function choosePhoto(forceDifferent = true) {
  let previous = -1;
  try {
    previous = Number(localStorage.getItem("homeFeedPhoto"));
  } catch {}

  let next = Math.floor(Math.random() * photos.length);
  if (forceDifferent && photos.length > 1 && next === previous) {
    next = (next + 1 + Math.floor(Math.random() * (photos.length - 1))) % photos.length;
  }

  const photo = photos[next];
  randomPhoto.src = photo.src;
  randomPhoto.alt = photo.alt;
  randomPhotoLink.href = photo.href;
  randomPhotoLink.setAttribute("aria-label", `Open gallery: ${photo.alt}`);
  randomPhotoCaption.textContent = `${photo.alt}.`;

  try {
    localStorage.setItem("homeFeedPhoto", String(next));
  } catch {}
}

function showDogOfTheDay() {
  const now = new Date();
  const localDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayNumber = Math.floor(localDay.getTime() / 86400000);
  const dog = dogs[((dayNumber % dogs.length) + dogs.length) % dogs.length];

  document.getElementById("dogDate").textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(now);
  document.getElementById("dogName").textContent = dog.name;
  document.getElementById("dogTitle").textContent = dog.title;
  document.getElementById("dogDescription").textContent = dog.description;
  document.getElementById("dogImage").src = dog.image;
  document.getElementById("dogImage").alt = dog.name;
  document.getElementById("dogLink").href = dog.href;
}

shufflePhoto.addEventListener("click", () => choosePhoto(true));
choosePhoto(true);
showDogOfTheDay();
loadLatestPost();
loadLatestComic();
