const comics = {
  kibble: {
    issue: "Comic 1",
    title: "The Great Kibble Incident",
    summary: "One open bag of kibble becomes a feast, a regret, a vet trip, and a very supervised recovery.",
    prefix: "kibble-incident",
    captions: [
      "Molly and Shaina discover the bag has made a terrible security mistake.",
      "They begin cleanup immediately, using their faces.",
      "The kibble field is large, but morale is high.",
      "Both investigators agree the evidence was delicious.",
      "The victory nap arrives sooner than expected.",
      "The feast submits a formal complaint.",
      "They retreat under blankets to consider their choices.",
      "Window time is prescribed by the patients themselves.",
      "A car ride confirms this has become official business.",
      "The vet listens to Molly, who has many opinions.",
      "Shaina waits politely while everyone discusses the kibble situation.",
      "The hallway feels long, especially after bad decisions.",
      "Back home, the recovery team chooses maximum softness.",
      "Medicine appears, disguised badly as a tiny peace offering.",
      "Dinner returns in reasonable, supervised portions.",
      "Molly and Shaina recover fully and learn absolutely nothing."
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
  },
  laundry: {
    issue: "Comic 4",
    title: "The Great Laundry Crisis",
    summary: "Clean laundry enters the room, socks lose all structure, and Molly and Shaina are somehow nearby the entire time.",
    prefix: "laundry-crisis",
    captions: [
      "Molly and Shaina discover a basket of laundry with suspiciously loose supervision.",
      "Shaina tests the towel softness from inside the basket.",
      "Molly selects one sock for immediate relocation.",
      "The sock situation expands across the entire floor.",
      "Shaina drags a towel with the seriousness of a working dog.",
      "Molly disappears into the laundry and calls it strategy.",
      "The clean pile becomes a mountain with no clear building permit.",
      "Both dogs emerge from the fabric zone looking completely necessary.",
      "The owner arrives and finds laundry across several jurisdictions.",
      "Molly and Shaina stand among the socks with legal confidence.",
      "One sock is inspected for clues and possibly bite marks.",
      "The basket becomes a temporary witness protection program.",
      "The owner restores order, one folded towel at a time.",
      "Molly and Shaina pose beside the rebuilt laundry system.",
      "Molly quietly restarts the sock relocation project.",
      "They finish exactly where they began and learn absolutely nothing."
    ]
  },
  garden: {
    issue: "Comic 5",
    title: "The Great Garden Adventure",
    summary: "A peaceful garden visit becomes digging, muddy evidence, bath time, and a suspiciously calm return to the doorway.",
    prefix: "garden-adventure",
    captions: [
      "Molly and Shaina spot the garden and decide nature has requested their help.",
      "They step outside looking innocent, which is usually when the trouble begins.",
      "Shaina inspects the flowers while Molly pretends this is all very educational.",
      "Molly begins digging with the confidence of someone who has no cleanup plan.",
      "Shaina discovers the soil is extremely interesting and unfortunately portable.",
      "Molly confirms the dirt situation with her whole face.",
      "The garden now contains several new design features nobody asked for.",
      "Both dogs pose beside the evidence and somehow look proud.",
      "The mud trail follows them inside like a very honest confession.",
      "The owner finds the footprints and begins connecting several obvious dots.",
      "Molly and Shaina wait by the door, technically available for questioning.",
      "The owner surveys the garden and silently rethinks the meaning of supervision.",
      "Bath time arrives with soap, water, and no respect for artistic mud choices.",
      "The suspects emerge cleaner, wetter, and still emotionally complicated.",
      "Towels are issued, dignity is restored, and nobody admits anything.",
      "Molly and Shaina return to the door, already considering tomorrow's expedition."
    ]
  },
  blanket: {
    issue: "Comic 6",
    title: "The Great Blanket Fortress",
    summary: "A normal couch becomes a layered blanket stronghold, briefly inspected by the owner and immediately reclaimed by the architects.",
    prefix: "blanket-fortress",
    captions: [
      "Molly and Shaina discover loose blankets and recognize a rare construction opportunity.",
      "Molly begins moving materials while Shaina supervises from a legally safe distance.",
      "Shaina tests the first tunnel and confirms the fortress has emotional potential.",
      "Molly adds a pillow, which makes the project feel official.",
      "The blanket stack grows taller than expected and nobody files a permit.",
      "Something inside the fortress blinks, proving the structure is occupied.",
      "Molly guards the entrance like this was always the plan.",
      "Shaina chooses a hidden observation post with excellent warmth.",
      "The owner arrives and finds two architects inside a couch-based landmark.",
      "Molly and Shaina exit just enough to look innocent.",
      "The owner inspects the fortress gently, which the builders consider approval.",
      "Both dogs pose under the roof with serious real-estate confidence.",
      "The owner rebuilds the pile into something suspiciously neat.",
      "Molly and Shaina sit on top like official ribbon-cutting guests.",
      "The fortress collapses slightly, creating new creative possibilities.",
      "They return to the tunnel and immediately begin phase two."
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const slug = comics[params.get("q")] ? params.get("q") : "kibble";
  const comic = comics[slug];
  let current = 0;

  const issue = document.getElementById("viewerIssue");
  const title = document.getElementById("viewerTitle");
  const summary = document.getElementById("viewerSummary");
  const panelGroup = document.getElementById("panelGroup");
  const count = document.getElementById("panelCount");
  const prev = document.getElementById("prevPanel");
  const next = document.getElementById("nextPanel");

  document.title = `Molly and Shaina - ${comic.title}`;
  issue.textContent = comic.issue;
  title.textContent = comic.title;
  summary.textContent = comic.summary;

  function showPanel(index) {
    const groupCount = Math.ceil(comic.captions.length / 4);
    const groupIndex = ((Math.floor(index / 4) % groupCount) + groupCount) % groupCount;
    current = groupIndex * 4;
    const end = Math.min(current + 4, comic.captions.length);
    panelGroup.innerHTML = "";

    for (let panelIndex = current; panelIndex < end; panelIndex++) {
      const figure = document.createElement("figure");
      figure.className = "viewer-panel";
      const panelImage = document.createElement("img");
      panelImage.src = `../images/comics/${comic.prefix}-${String(panelIndex + 1).padStart(2, "0")}.webp`;
      panelImage.alt = `${comic.title}, panel ${panelIndex + 1}`;
      const panelCaption = document.createElement("figcaption");
      panelCaption.textContent = `${panelIndex + 1}. ${comic.captions[panelIndex]}`;
      figure.append(panelImage, panelCaption);
      panelGroup.appendChild(figure);
    }

    count.textContent = `Panels ${current + 1}-${end} of ${comic.captions.length}`;
  }

  prev.addEventListener("click", () => showPanel(current - 4));
  next.addEventListener("click", () => showPanel(current + 4));
  document.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") showPanel(current - 4);
    if (event.key === "ArrowRight") showPanel(current + 4);
  });

  showPanel(0);
});
