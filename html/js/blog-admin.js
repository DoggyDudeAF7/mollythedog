const fields = {
  id: document.getElementById("postId"),
  date: document.getElementById("postDate"),
  title: document.getElementById("postTitle"),
  tag: document.getElementById("postTag"),
  body: document.getElementById("postBody"),
  image: document.getElementById("postImage"),
  imageFile: document.getElementById("postImageFile"),
  imageAlt: document.getElementById("postImageAlt"),
  linkText: document.getElementById("postLinkText"),
  linkUrl: document.getElementById("postLinkUrl")
};

const form = document.getElementById("postForm");
const preview = document.getElementById("postPreview");
const postList = document.getElementById("postList");
const statusBox = document.getElementById("adminStatus");
const newButton = document.getElementById("newPost");
const deleteButton = document.getElementById("deletePost");
const logoutButton = document.getElementById("logoutButton");
const removeImageButton = document.getElementById("removeImage");

let posts = [];

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function slugify(value) {
  return String(value || "post")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `post-${Date.now()}`;
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("error", isError);
}

function getPost() {
  const title = fields.title.value.trim() || "Untitled Post";

  return {
    id: fields.id.value || slugify(`${title}-${Date.now()}`),
    date: fields.date.value.trim(),
    title,
    tag: fields.tag.value.trim() || "Post",
    body: fields.body.value.trim() || "Write something here.",
    image: fields.image.value,
    imageAlt: fields.imageAlt.value.trim(),
    linkText: fields.linkText.value.trim(),
    linkUrl: fields.linkUrl.value.trim()
  };
}

function fillForm(post = {}) {
  fields.id.value = post.id || "";
  fields.date.value = post.date || "July 8, 2026";
  fields.title.value = post.title || "";
  fields.tag.value = post.tag || "";
  fields.body.value = post.body || "";
  fields.image.value = post.image || "";
  fields.imageFile.value = "";
  fields.imageAlt.value = post.imageAlt || "";
  fields.linkText.value = post.linkText || "";
  fields.linkUrl.value = post.linkUrl || "";
  updatePreview();
}

function updatePreview() {
  const post = getPost();
  const image = post.image
    ? `<img class="blog-post-image" src="${post.image}" alt="${escapeHtml(post.imageAlt || post.title)}">`
    : "";
  const link = post.linkText && post.linkUrl
    ? `<a href="${escapeHtml(post.linkUrl)}">${escapeHtml(post.linkText)}</a>`
    : "";

  preview.innerHTML = `
    ${image}
    <p class="blog-date">${escapeHtml(post.date || "Draft")}</p>
    <span class="blog-tag">${escapeHtml(post.tag)}</span>
    <h2>${escapeHtml(post.title)}</h2>
    <p>${escapeHtml(post.body)}</p>
    ${link}
  `;
}

function renderPostList() {
  if (!posts.length) {
    postList.innerHTML = `<p class="empty-list">No posts yet.</p>`;
    return;
  }

  postList.innerHTML = posts.map((post) => `
    <button type="button" class="${post.id === fields.id.value ? "active" : ""}" data-id="${escapeHtml(post.id)}">
      <strong>${escapeHtml(post.title)}</strong>
      <span>${escapeHtml(post.date || "Draft")} • ${escapeHtml(post.tag || "Post")}</span>
    </button>
  `).join("");
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImage(file) {
  const image = await loadImage(file);
  const maxWidth = 1400;
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.82);
}

async function loadPosts() {
  setStatus("Loading posts...");

  try {
    const response = await fetch("/api/posts", { credentials: "same-origin" });
    if (!response.ok) throw new Error("Could not load posts.");

    posts = await response.json();
    renderPostList();
    fillForm(posts[0] || {});
    setStatus(`${posts.length} post${posts.length === 1 ? "" : "s"} loaded.`);
  } catch {
    try {
      const fallbackResponse = await fetch("../posts.json");
      if (!fallbackResponse.ok) throw new Error("No fallback posts.");

      posts = await fallbackResponse.json();
      renderPostList();
      fillForm(posts[0] || {});
      setStatus("Local preview mode. Saving needs Cloudflare.", true);
    } catch {
      posts = [];
      renderPostList();
      fillForm();
      setStatus("Could not load posts. Check the Cloudflare KV binding.", true);
    }
  }
}

async function savePosts(nextPosts) {
  const response = await fetch("/api/posts", {
    method: "PUT",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(nextPosts)
  });

  if (response.status === 401) {
    location.href = location.pathname.includes("/blog/admin/") ? "login/" : "/admin/login/";
    throw new Error("Login required.");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Save failed.");
  }

  posts = await response.json();
}

Object.values(fields).forEach((field) => {
  if (field !== fields.imageFile) {
    field.addEventListener("input", updatePreview);
  }
});

fields.imageFile.addEventListener("change", async () => {
  const file = fields.imageFile.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", true);
    fields.imageFile.value = "";
    return;
  }

  setStatus("Preparing image...");

  try {
    fields.image.value = await compressImage(file);
    if (!fields.imageAlt.value.trim()) {
      fields.imageAlt.value = fields.title.value.trim() || file.name.replace(/\.[^.]+$/, "");
    }
    updatePreview();
    setStatus("Image attached. Save the post to publish it.");
  } catch {
    fields.imageFile.value = "";
    setStatus("Could not attach that image.", true);
  }
});

removeImageButton.addEventListener("click", () => {
  fields.image.value = "";
  fields.imageFile.value = "";
  fields.imageAlt.value = "";
  updatePreview();
  setStatus("Image removed. Save the post to publish this change.");
});

postList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;

  const post = posts.find((item) => item.id === button.dataset.id);
  if (!post) return;

  fillForm(post);
  renderPostList();
});

newButton.addEventListener("click", () => {
  fillForm();
  renderPostList();
  fields.title.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const post = getPost();
  const existingIndex = posts.findIndex((item) => item.id === post.id);
  const nextPosts = [...posts];

  if (existingIndex >= 0) {
    nextPosts[existingIndex] = post;
  } else {
    nextPosts.unshift(post);
  }

  setStatus("Saving...");

  try {
    await savePosts(nextPosts);
    fillForm(post);
    renderPostList();
    setStatus("Saved and published.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

deleteButton.addEventListener("click", async () => {
  const id = fields.id.value;
  if (!id) {
    fillForm();
    return;
  }

  const post = posts.find((item) => item.id === id);
  const title = post ? post.title : "this post";

  if (!confirm(`Delete "${title}"?`)) return;

  setStatus("Deleting...");

  try {
    await savePosts(posts.filter((item) => item.id !== id));
    renderPostList();
    fillForm(posts[0] || {});
    setStatus("Deleted.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

logoutButton.addEventListener("click", async () => {
  setStatus("Logging out...");

  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } finally {
    location.href = location.pathname.includes("/blog/admin/") ? "login/" : "/admin/login/";
  }
});

loadPosts();
