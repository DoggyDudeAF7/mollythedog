const options = {
  title: [
    "Molly, Duchess of Window Patrol",
    "Shaina, Captain of Snack Detection",
    "Molly, Senior Blanket Architect",
    "Shaina, Director of Doorway Intelligence",
    "Molly, First Chair of Suspicious Leaf Studies",
    "Shaina, Chief Executive of Sudden Running"
  ],
  caption: [
    "A serious investigation is underway.",
    "The snack economy is being monitored closely.",
    "No movement escapes the tiny security department.",
    "Couch occupation has reached historic levels.",
    "This meeting could have been a treat.",
    "Evidence suggests someone opened a cupboard."
  ],
  mission: [
    "Audit one window, ignore one toy, and demand one snack.",
    "Inspect the hallway, report suspicious sounds, then nap dramatically.",
    "Find the warmest blanket and defend it with quiet authority.",
    "Run for no clear reason, then act like nothing happened.",
    "Monitor all humans until dinner conditions improve.",
    "Review every room for snack-related policy violations."
  ],
  certificate: [
    "Awarded for outstanding commitment to charging the MacBook.",
    "Awarded for excellent hallway sprint performance.",
    "Awarded for heroic snack-wrapper identification.",
    "Awarded for superior blanket rearrangement.",
    "Awarded for pretending not to hear but absolutely hearing.",
    "Awarded for making a normal moment weirdly official."
  ]
};

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function generate(type) {
  const output = document.getElementById(`${type}Output`);
  if (!output || !options[type]) return;
  output.textContent = pick(options[type]);
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-generator]");
  if (!button) return;
  generate(button.dataset.generator);
});

Object.keys(options).forEach(generate);

const openPageFile = document.getElementById("openPageFile");
const savePageFile = document.getElementById("savePageFile");
const downloadPageFile = document.getElementById("downloadPageFile");
const refreshPagePreview = document.getElementById("refreshPagePreview");
const pageEditor = document.getElementById("pageEditor");
const pagePreview = document.getElementById("pagePreview");
const pageEditorStatus = document.getElementById("pageEditorStatus");

let pageFileHandle = null;
let pageFileName = "edited-page.html";

function setEditorStatus(message) {
  if (pageEditorStatus) pageEditorStatus.textContent = message;
}

function updatePreview() {
  if (!pagePreview || !pageEditor) return;
  pagePreview.srcdoc = pageEditor.value;
}

function enableEditorActions() {
  if (downloadPageFile) downloadPageFile.disabled = !pageEditor.value;
  if (refreshPagePreview) refreshPagePreview.disabled = !pageEditor.value;
  if (savePageFile) {
    savePageFile.disabled = !pageEditor.value || !pageFileHandle;
  }
}

async function openPageForEditing() {
  if (!window.showOpenFilePicker) {
    setEditorStatus("This browser cannot save files directly. Use Chrome or Edge for direct editing, or paste HTML and download a copy.");
    return;
  }

  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "HTML pages",
          accept: { "text/html": [".html", ".htm"] }
        }
      ],
      excludeAcceptAllOption: false,
      multiple: false
    });

    const file = await handle.getFile();
    pageFileHandle = handle;
    pageFileName = file.name || pageFileName;
    pageEditor.value = await file.text();
    setEditorStatus(`Editing ${pageFileName}. Save writes back to the selected file.`);
    updatePreview();
    enableEditorActions();
  } catch (error) {
    if (error.name !== "AbortError") {
      setEditorStatus("Could not open that file.");
    }
  }
}

async function savePage() {
  if (!pageFileHandle || !pageEditor) return;

  try {
    const writable = await pageFileHandle.createWritable();
    await writable.write(pageEditor.value);
    await writable.close();
    setEditorStatus(`Saved ${pageFileName}.`);
  } catch (error) {
    setEditorStatus("Could not save the file. Try Download Copy instead.");
  }
}

function downloadPageCopy() {
  if (!pageEditor?.value) return;

  const blob = new Blob([pageEditor.value], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = pageFileName;
  link.click();
  URL.revokeObjectURL(link.href);
  setEditorStatus(`Downloaded a copy of ${pageFileName}.`);
}

openPageFile?.addEventListener("click", openPageForEditing);
savePageFile?.addEventListener("click", savePage);
downloadPageFile?.addEventListener("click", downloadPageCopy);
refreshPagePreview?.addEventListener("click", updatePreview);
pageEditor?.addEventListener("input", () => {
  enableEditorActions();
});
