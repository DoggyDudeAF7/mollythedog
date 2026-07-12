const defaults = {
  certTitle: "Certificate of Excellence",
  certName: "Name",
  certText: "Description",
  certDate: "Date",
  certSigned: "Name",
  certBadge: "Official",
  certTheme: "gold",
  certBorder: "double",
  certSeal: "pill",
  certOrientation: "landscape",
  certPaper: "letter",
  showSignature: false
};

const bindings = {
  certTitle: "previewTitle",
  certName: "previewName",
  certText: "previewText",
  certDate: "previewDate",
  certSigned: "previewSigned",
  certBadge: "previewBadge"
};

function updateCertificate() {
  Object.entries(bindings).forEach(([inputId, previewId]) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    preview.textContent = input.value.trim() || defaults[inputId];
  });

  document.getElementById("signatureStamp").textContent =
    document.getElementById("certSigned").value.trim() || defaults.certSigned;
}

Object.keys(bindings).forEach((inputId) => {
  document.getElementById(inputId).addEventListener("input", updateCertificate);
});

const certificate = document.getElementById("certificate");
const logo = document.getElementById("previewLogo");
const signature = document.getElementById("signatureStamp");
const printPageStyle = document.createElement("style");
document.head.appendChild(printPageStyle);

const classGroups = {
  theme: ["theme-gold", "theme-silver", "theme-blue", "theme-funny", "theme-christmas"],
  border: ["border-double", "border-classic", "border-bold", "border-dotted"],
  seal: ["seal-pill", "seal-ribbon", "seal-medal", "seal-stamp"],
  orientation: ["landscape", "portrait"],
  paper: ["paper-letter", "paper-a4"]
};

function replaceClass(group, nextClass) {
  certificate.classList.remove(...classGroups[group]);
  certificate.classList.add(nextClass);
}

function updatePrintPage() {
  const paper = document.getElementById("certPaper").value;
  const orientation = document.getElementById("certOrientation").value;
  printPageStyle.textContent = `@media print { @page { size: ${paper} ${orientation}; margin: 0; } }`;
}

function updateStyleControls() {
  replaceClass("theme", `theme-${document.getElementById("certTheme").value}`);
  replaceClass("border", `border-${document.getElementById("certBorder").value}`);
  replaceClass("seal", `seal-${document.getElementById("certSeal").value}`);
  replaceClass("orientation", document.getElementById("certOrientation").value);
  replaceClass("paper", `paper-${document.getElementById("certPaper").value}`);
  signature.classList.toggle("visible", document.getElementById("showSignature").checked);
  updatePrintPage();
}

["certTheme", "certBorder", "certSeal", "certOrientation", "certPaper", "showSignature"].forEach((id) => {
  document.getElementById(id).addEventListener("change", updateStyleControls);
});

document.getElementById("certLogo").addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    logo.removeAttribute("src");
    logo.classList.remove("has-logo");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    logo.src = reader.result;
    logo.classList.add("has-logo");
  });
  reader.readAsDataURL(file);
});

document.getElementById("printCertificate").addEventListener("click", () => {
  updateCertificate();
  updateStyleControls();
  window.print();
});

document.getElementById("downloadCertificate").addEventListener("click", () => {
  updateCertificate();
  updateStyleControls();
  window.print();
});

document.getElementById("resetCertificate").addEventListener("click", () => {
  Object.entries(defaults).forEach(([inputId, value]) => {
    const input = document.getElementById(inputId);

    if (input.type === "checkbox") {
      input.checked = value;
    } else {
      input.value = value;
    }
  });

  document.getElementById("certLogo").value = "";
  logo.removeAttribute("src");
  logo.classList.remove("has-logo");
  signature.style.left = "50%";
  signature.style.top = "72%";
  updateCertificate();
  updateStyleControls();
});

signature.addEventListener("pointerdown", (event) => {
  if (!signature.classList.contains("visible")) return;

  event.preventDefault();
  signature.classList.add("dragging");
  signature.setPointerCapture(event.pointerId);
});

signature.addEventListener("pointermove", (event) => {
  if (!signature.classList.contains("dragging")) return;

  const rect = certificate.querySelector(".certificate-border").getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  signature.style.left = `${Math.min(95, Math.max(5, x))}%`;
  signature.style.top = `${Math.min(95, Math.max(5, y))}%`;
});

signature.addEventListener("pointerup", () => {
  signature.classList.remove("dragging");
});

signature.addEventListener("pointercancel", () => {
  signature.classList.remove("dragging");
});

updateCertificate();
updateStyleControls();
