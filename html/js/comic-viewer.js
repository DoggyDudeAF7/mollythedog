const comics = {
  snack: {
    issue: "Comic 1",
    title: "The Great Snack Mystery",
    summary: "A careful investigation into crumbs, cabinets, and the sudden disappearance of evidence.",
    prefix: "snack-mystery",
    captions: [
      "Molly notices a crumb and immediately forms a committee.",
      "The trail is suspiciously snack-shaped.",
      "Shaina confirms the crumb is extremely real.",
      "They decide this mystery requires bravery and probably tasting.",
      "The clues point directly toward the most interesting room.",
      "An open cabinet is basically an invitation, legally speaking.",
      "Shaina performs a careful cabinet investigation.",
      "The mystery becomes much more delicious.",
      "Suddenly there are treats everywhere, which is very concerning.",
      "A noise from the hallway changes the mood instantly.",
      "Molly relocates one clue for science.",
      "Both suspects practice looking uninvolved.",
      "One crumb remains, threatening to tell the whole story.",
      "Shaina proposes the obvious solution without saying a word.",
      "The final clues are handled internally.",
      "The case is closed due to lack of evidence."
    ]
  },
  paint: {
    issue: "Comic 2",
    title: "The Great Paint Disaster",
    summary: "A blank canvas becomes modern art after Molly and Shaina discover paint, panic, and framing.",
    prefix: "paint-disaster",
    captions: [
      "Molly finds a blank canvas and assumes it was left for her.",
      "Shaina investigates the blue paint with alarming seriousness.",
      "Molly adds one careful mark and becomes an artist.",
      "They study the canvas like it owes them an explanation.",
      "Shaina steps in blue and accidentally invents a technique.",
      "The floor receives several limited-edition paw prints.",
      "Molly stops being careful and starts being important.",
      "Somehow, the mess begins looking expensive.",
      "The owner walks in at the exact worst possible second.",
      "The artists withdraw to a secure hiding location.",
      "The owner expects disaster, then pauses suspiciously.",
      "The painting is lifted with unexpected respect.",
      "Cleanup starts while the suspects sit very professionally.",
      "A frame transforms the evidence into culture.",
      "The finished piece gets a wall, an audience, and two creators.",
      "Molly and Shaina accept full credit, quietly."
    ]
  },
  soup: {
    issue: "Comic 3",
    title: "The Great Soup Situation",
    summary: "Dinner prep goes floor-wide when two underqualified chefs discover a soup pot.",
    prefix: "soup-disaster",
    captions: [
      "The kitchen is unattended, which Molly considers permission.",
      "Shaina checks the pot while Molly supervises from above.",
      "Ingredients begin leaving their assigned locations.",
      "Molly investigates the official soup machinery.",
      "The soup exits the pot with dramatic confidence.",
      "Dinner expands to include most of the floor.",
      "Both chefs pause to consider their reviews.",
      "The culinary team relocates under the table.",
      "The owner discovers a room-temperature soup event.",
      "The suspects remain available for questions, technically.",
      "Everyone quietly agrees this was not the recipe.",
      "The pot offers very little useful testimony.",
      "Cleanup begins under close management.",
      "Against all odds, dinner still happens.",
      "The chefs receive towels, bowls, and no consequences.",
      "Molly and Shaina dress for their next shift."
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const slug = comics[params.get("q")] ? params.get("q") : "snack";
  const comic = comics[slug];
  let current = 0;

  const issue = document.getElementById("viewerIssue");
  const title = document.getElementById("viewerTitle");
  const summary = document.getElementById("viewerSummary");
  const image = document.getElementById("panelImage");
  const caption = document.getElementById("panelCaption");
  const count = document.getElementById("panelCount");
  const strip = document.getElementById("panelStrip");
  const picker = document.getElementById("comicPicker");
  const prev = document.getElementById("prevPanel");
  const next = document.getElementById("nextPanel");

  document.title = `Molly and Shaina - ${comic.title}`;
  issue.textContent = comic.issue;
  title.textContent = comic.title;
  summary.textContent = comic.summary;

  Object.entries(comics).forEach(([key, item]) => {
    const link = document.createElement("a");
    link.href = `../comic-viewer/?q=${key}`;
    link.textContent = item.title.replace("The Great ", "");
    if (key === slug) link.classList.add("active");
    picker.appendChild(link);
  });

  comic.captions.forEach((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Open panel ${index + 1}`);
    const thumb = document.createElement("img");
    thumb.src = `../images/comics/${comic.prefix}-${String(index + 1).padStart(2, "0")}.webp`;
    thumb.alt = "";
    button.appendChild(thumb);
    button.addEventListener("click", () => showPanel(index));
    strip.appendChild(button);
  });

  function showPanel(index) {
    current = (index + comic.captions.length) % comic.captions.length;
    image.src = `../images/comics/${comic.prefix}-${String(current + 1).padStart(2, "0")}.webp`;
    image.alt = `${comic.title}, panel ${current + 1}`;
    caption.textContent = `${current + 1}. ${comic.captions[current]}`;
    count.textContent = `Panel ${current + 1} of ${comic.captions.length}`;
    [...strip.children].forEach((button, buttonIndex) => {
      button.classList.toggle("active", buttonIndex === current);
    });
  }

  prev.addEventListener("click", () => showPanel(current - 1));
  next.addEventListener("click", () => showPanel(current + 1));
  document.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") showPanel(current - 1);
    if (event.key === "ArrowRight") showPanel(current + 1);
  });

  showPanel(0);
});
