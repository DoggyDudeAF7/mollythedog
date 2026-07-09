const postsContainer = document.getElementById("blogPosts");

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function renderPosts(posts) {
  if (!postsContainer) return;

  if (!Array.isArray(posts) || posts.length === 0) {
    postsContainer.innerHTML = `
      <article class="blog-post">
        <p class="blog-date">No posts yet</p>
        <h2>Check Back Soon</h2>
        <p>New posts will show up here once they are published.</p>
      </article>
    `;
    return;
  }

  postsContainer.innerHTML = posts.map((post, index) => {
    const image = post.image
      ? `<img class="blog-post-image" src="${post.image}" alt="${escapeHtml(post.imageAlt || post.title)}">`
      : "";
    const link = post.linkUrl && post.linkText
      ? `<a href="${escapeHtml(post.linkUrl)}">${escapeHtml(post.linkText)}</a>`
      : "";

    return `
      <article class="blog-post">
        ${image}
        <p class="blog-date">${escapeHtml(post.date)}</p>
        <span class="blog-tag">${escapeHtml(post.tag || "Post")}</span>
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.body)}</p>
        ${link}
      </article>
    `;
  }).join("");
}

fetch("/api/posts")
  .then((response) => {
    if (!response.ok) throw new Error("Posts could not be loaded.");
    return response.json();
  })
  .then(renderPosts)
  .catch(() => fetch("posts.json")
    .then((response) => {
      if (!response.ok) throw new Error("Fallback posts could not be loaded.");
      return response.json();
    })
    .then(renderPosts)
    .catch(() => {
      renderPosts([]);
    })
  );
