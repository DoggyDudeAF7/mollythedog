const fields = {
  date: document.getElementById("postDate"),
  title: document.getElementById("postTitle"),
  tag: document.getElementById("postTag"),
  body: document.getElementById("postBody"),
  linkText: document.getElementById("postLinkText"),
  linkUrl: document.getElementById("postLinkUrl")
};

const preview = document.getElementById("postPreview");
const output = document.getElementById("postOutput");
const copyButton = document.getElementById("copyPost");

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));
}

function getPost() {
  return {
    date: fields.date.value.trim(),
    title: fields.title.value.trim() || "Untitled Post",
    tag: fields.tag.value.trim() || "Post",
    body: fields.body.value.trim() || "Write something here.",
    linkText: fields.linkText.value.trim(),
    linkUrl: fields.linkUrl.value.trim()
  };
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

  output.value = JSON.stringify(post, null, 2);
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", updatePreview);
});

copyButton.addEventListener("click", async () => {
  updatePreview();

  try {
    await navigator.clipboard.writeText(output.value);
    copyButton.textContent = "Copied";
    setTimeout(() => {
      copyButton.textContent = "Copy Post JSON";
    }, 1400);
  } catch {
    output.select();
  }
});

updatePreview();
