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
