const defaults = {
  certTitle: "Certificate of Excellence",
  certName: "Molly",
  certText: "For outstanding achievement in comfort, cuteness, dramatic sighing, and excellent couch presence.",
  certDate: "July 9, 2026",
  certSigned: "Molly & Shaina HQ",
  certBadge: "Official"
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
}

Object.keys(bindings).forEach((inputId) => {
  document.getElementById(inputId).addEventListener("input", updateCertificate);
});

document.getElementById("printCertificate").addEventListener("click", () => {
  updateCertificate();
  window.print();
});

document.getElementById("resetCertificate").addEventListener("click", () => {
  Object.entries(defaults).forEach(([inputId, value]) => {
    document.getElementById(inputId).value = value;
  });

  updateCertificate();
});

updateCertificate();
