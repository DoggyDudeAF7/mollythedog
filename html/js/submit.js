document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("submissionForm");
  const type = document.getElementById("submissionType");
  const uploadGroup = document.getElementById("uploadGroup");
  const fileInput = document.getElementById("fanartFile");
  const messageLabel = document.getElementById("messageLabel");
  const message = document.getElementById("submissionMessage");
  const previewTitle = document.getElementById("previewTitle");
  const previewMeta = document.getElementById("previewMeta");
  const previewMessage = document.getElementById("previewMessage");
  const imagePreview = document.getElementById("imagePreview");
  const copyButton = document.getElementById("copySubmission");

  if (!form || !type || !uploadGroup || !fileInput || !messageLabel || !message) return;

  let previewText = "";

  function updateTypeFields() {
    const isFanArt = type.value === "Fan art";
    uploadGroup.classList.toggle("hidden", !isFanArt);
    fileInput.required = isFanArt;

    if (isFanArt) {
      messageLabel.textContent = "Tell Us About The Art";
      message.placeholder = "Write a caption or note about your masterpiece...";
    } else if (type.value === "General message") {
      messageLabel.textContent = "Your Message";
      message.placeholder = "Send general fan mail, a business inquiry, or virtual treats...";
    } else {
      messageLabel.textContent = "The Details";
      message.placeholder = "Describe the comic idea...";
    }
  }

  function updateImagePreview() {
    const file = fileInput.files && fileInput.files[0];
    imagePreview.innerHTML = "";
    imagePreview.classList.add("hidden");

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement("img");
      img.src = reader.result;
      img.alt = "Fan art preview";
      imagePreview.appendChild(img);
      imagePreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("submitName").value.trim();
    const email = document.getElementById("submitEmail").value.trim();
    const file = fileInput.files && fileInput.files[0];
    const fileLine = file ? `\nAttached image: ${file.name}` : "";

    previewTitle.textContent = type.value;
    previewMeta.textContent = `${name} • ${email}${file ? ` • ${file.name}` : ""}`;
    previewMessage.textContent = message.value.trim();
    previewText = `Molly and Shaina Submission\n\nType: ${type.value}\nName: ${name}\nEmail: ${email}${fileLine}\n\nMessage:\n${message.value.trim()}`;
    copyButton.disabled = false;
  });

  copyButton.addEventListener("click", async () => {
    if (!previewText) return;

    try {
      await navigator.clipboard.writeText(previewText);
      copyButton.textContent = "Copied";
      setTimeout(() => {
        copyButton.textContent = "Copy Preview";
      }, 1400);
    } catch {
      copyButton.textContent = "Copy Failed";
      setTimeout(() => {
        copyButton.textContent = "Copy Preview";
      }, 1400);
    }
  });

  type.addEventListener("change", updateTypeFields);
  fileInput.addEventListener("change", updateImagePreview);
  updateTypeFields();
});
