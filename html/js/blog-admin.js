const fields = {
  id: document.getElementById("postId"),
  date: document.getElementById("postDate"),
  title: document.getElementById("postTitle"),
  tag: document.getElementById("postTag"),
  body: document.getElementById("postBody"),
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
  fields.linkText.value = post.linkText || "";
  fields.linkUrl.value = post.linkUrl || "";
  updatePreview();
}

function updatePreview() {
  const post = getPost();
  const link = post.linkText && post.linkUrl
    ? `<a href="${escapeHtml(post.linkUrl)}">${escapeHtml(post.linkText)}</a>`
    : "";

  preview.innerHTML = `
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
  field.addEventListener("input", updatePreview);
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
