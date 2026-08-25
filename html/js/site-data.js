(function () {
  "use strict";

  function slugify(value) {
    return String(value || "item")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const pages = [
    ["page:home", "The Daily Dog Feed", "Latest comics, blog posts, photos, and the Breed of the Day.", "Page", ":home:", "/home/", "homepage latest daily"],
    ["molly:home", "Molly", "Skittish, sleepy, helicopter-tailed, and powered by naps and suspicion.", "Molly", ":molly:", "/molly/", "dog home"],
    ["molly:traits", "Molly's Traits", "Molly's personality, behaviour, confidence, and unmistakable habits.", "Traits", ":traits:", "/molly-traits/", "molly personality"],
    ["molly:habits", "Molly's Habits", "Blanket architecture, snack detection, sleeping, and daily Molly rituals.", "Habits", ":habits:", "/molly-habits/", "blanket inspector naps"],
    ["molly:mind", "Inside Molly's Mind", "Molly's thoughts, theories, worries, and careful observations.", "Molly", ":mind:", "/molly-mind/", "thoughts questions"],
    ["molly:faq", "Molly FAQ", "Answers about Molly's fears, favourites, routines, food, and personality.", "FAQ", ":faq:", "/molly-faq/", "questions answers scared food"],
    ["molly:gallery", "Molly Gallery", "Photos of Molly's quiet chaos, couch energy, naps, and close-up investigations.", "Gallery", ":gallery:", "/molly-gallery/", "photos pictures"],
    ["shaina:home", "Shaina", "Alert, expressive, fast-moving, and always ready to investigate.", "Shaina", ":shaina:", "/shaina-home/", "dog home energy"],
    ["shaina:traits", "Shaina's Traits", "Shaina's energetic, curious, focused, and snack-motivated personality.", "Traits", ":traits:", "/shaina-traits/", "shaina personality"],
    ["shaina:habits", "Shaina's Habits", "Shaina's patrols, play, toy carrying, and high-speed routines.", "Habits", ":habits:", "/shaina-habits/", "shaina routines toys"],
    ["shaina:mind", "Inside Shaina's Mind", "Questions, observations, and rapid investigations from Shaina's perspective.", "Shaina", ":mind:", "/shaina-mind/", "thoughts questions"],
    ["shaina:faq", "Shaina FAQ", "Answers about Shaina's energy, toys, walks, food, and friendship with Molly.", "FAQ", ":faq:", "/shaina-faq/", "questions answers"],
    ["shaina:gallery", "Shaina Gallery", "Photos of Shaina in motion, sunlight, towel caves, and Molly moments.", "Gallery", ":gallery:", "/shaina-gallery/", "photos pictures"],
    ["poppy:home", "Poppy", "Poppy's own corner of the Molly and Shaina website.", "Poppy", ":poppy:", "/poppy/", "dog home toy poodle"],
    ["poppy:traits", "Poppy's Traits", "Poppy's personality and characteristic toy-poodle behaviour.", "Traits", ":traits:", "/poppy-traits/", "poppy personality"],
    ["poppy:habits", "Poppy's Habits", "Poppy's routines, favourite activities, and daily observations.", "Habits", ":habits:", "/poppy-habits/", "poppy routines"],
    ["poppy:mind", "Inside Poppy's Mind", "Poppy's thoughts and careful assessment of the world.", "Poppy", ":mind:", "/poppy-mind/", "poppy thoughts"],
    ["poppy:faq", "Poppy FAQ", "Questions and answers about Poppy.", "FAQ", ":faq:", "/poppy-faq/", "poppy questions answers"],
    ["poppy:gallery", "Poppy Gallery", "Poppy's photo gallery.", "Gallery", ":gallery:", "/poppy-gallery/", "poppy photos pictures"],
    ["page:breeds", "Dog Breed Guide", "Search, compare, filter, sort, and favourite more than 100 dog breeds.", "Breed", ":breeds:", "/molly-dog-breeds/", "dogs guide size energy grooming"],
    ["page:breed-quiz", "Breed Match Quiz", "Find the dog breed that best matches your personality and lifestyle.", "Page", ":search:", "/breed-quiz/", "quiz match dog"],
    ["page:comics", "Molly and Shaina Comics", "Dog-hosted disasters involving kibble, paint, soup, laundry, gardens, blankets, packages, and video calls.", "Comic", ":comics:", "/comics/", "stories read"],
    ["page:blog", "Molly and Shaina Blog", "Updates, field notes, stories, and reports from dog headquarters.", "Blog", ":blog:", "/blog/", "posts news updates"],
    ["page:about", "About the Human", "Meet the person behind the Molly and Shaina website.", "Page", ":about:", "/about-me/", "creator human"],
    ["page:about-molly", "About Molly", "A closer look at Molly and her story.", "Molly", ":molly:", "/about-molly/", "book story"],
    ["page:about-shaina", "About Shaina", "A closer look at Shaina and her story.", "Shaina", ":shaina:", "/about-shaina/", "book story"],
    ["page:about-poppy", "About Poppy", "A closer look at Poppy and her story.", "Poppy", ":poppy:", "/about-poppy/", "story"],
    ["page:submit", "Submit an Idea", "Send a comic idea, fan art, feedback, or a general message.", "Page", "✉️", "/submit/", "contact message fan art"],
    ["page:freebies", "The Freebie Den", "Molly and Shaina downloads, wallpapers, and printable surprises.", "Page", "🎁", "/freebie-den/", "downloads wallpaper printable"],
    ["page:merch", "Molly and Shaina Merch", "The current collection of handmade Molly and Shaina stickers.", "Page", "🏷️", "/merch/", "stickers shop handmade collection"],
    ["page:privacy", "Privacy Policy", "How the Molly and Shaina website collects, uses, stores, and shares information.", "Policy", "🔒", "/privacy-policy/", "privacy data cookies analytics information"],
    ["page:terms", "Terms of Use & Request Policies", "Rules for using the site, sending submissions, downloads, and requesting free stickers.", "Policy", "📄", "/terms-of-use/", "terms conditions rules sticker requests policy"],
    ["page:favourites", "Your Favourites", "All your saved breeds, comics, photos, and blog posts.", "Page", "♥", "/favourites/", "saved collection"],
    ["page:achievements", "Achievements", "Explore your unlocked and hidden Molly and Shaina achievements.", "Page", "🏆", "/achievements/", "progress trophies" ]
  ].map(([id, title, description, type, icon, url, keywords]) => ({ id, title, description, type, icon, url, keywords }));

  const comics = [
    ["kibble", "The Great Kibble Incident", "One open bag becomes a feast, a regret, and a very supervised recovery.", "kibble-cover.webp"],
    ["paint", "The Great Paint Disaster", "A blank canvas becomes modern art after paint, panic, and framing.", "paint-cover.webp"],
    ["soup", "The Great Soup Situation", "Two underqualified chefs turn dinner preparation into a floor-wide event.", "soup-cover.webp"],
    ["laundry", "The Great Laundry Crisis", "Clean laundry arrives and socks immediately lose all structure.", "laundry-cover.webp"],
    ["garden", "The Great Garden Adventure", "A peaceful garden visit becomes digging, mud, and bath time.", "garden-cover.webp"],
    ["blanket", "The Great Blanket Fortress", "A normal couch becomes a carefully defended blanket stronghold.", "blanket-cover.webp"],
    ["package", "The Great Package Emergency", "A mysterious delivery receives a full security investigation.", "package-cover.webp"],
    ["zoom", "The Great Zoom Meeting", "A laptop call changes leadership after Molly and Shaina find the webcam.", "zoom-cover.webp"]
  ].map(([slug, title, description, image]) => ({
    id: `comic:${slug}`,
    slug,
    title,
    description,
    type: "Comic",
    icon: ":comics:",
    url: `/comic-viewer/?q=${slug}`,
    image: `/images/comics/${image}`,
    keywords: "molly shaina story panels"
  }));

  const photos = [
    ["molly-0", "Molly looking toward the camera", "/images/molly/molly0.webp", "/molly-gallery/"],
    ["molly-1", "Close-up portrait of Molly", "/images/molly/molly1.webp", "/molly-gallery/"],
    ["molly-2", "Molly curled up on folded towels", "/images/molly/molly2.webp", "/molly-gallery/"],
    ["molly-3", "Molly resting on a patterned rug", "/images/molly/molly3.webp", "/molly-gallery/"],
    ["molly-4", "Molly sitting beside a phone", "/images/molly/molly4.webp", "/molly-gallery/"],
    ["molly-portrait", "Portrait of Molly", "/images/molly/molly.webp", "/molly-gallery/"],
    ["molly-portrait-900", "Molly looking calmly toward the camera", "/images/molly/molly-900.webp", "/molly-gallery/"],
    ["molly-shaina-1", "Molly and Shaina lying together", "/images/molly/both1.webp", "/shaina-gallery/"],
    ["molly-shaina-2", "Molly and Shaina outside together", "/images/molly/both2.webp", "/shaina-gallery/"],
    ["molly-shaina-3", "Molly and Shaina standing side by side", "/images/molly/both3.webp", "/shaina-gallery/"],
    ["molly-shaina-4", "Molly and Shaina looking toward the camera", "/images/molly/both4.webp", "/shaina-gallery/"],
    ["shaina-portrait", "Portrait of Shaina", "/images/shaina/shaina.webp", "/shaina-gallery/"],
    ["shaina-1", "Shaina with a tennis ball", "/images/shaina/shaina1.webp", "/shaina-gallery/"],
    ["shaina-2", "Shaina relaxing in sunlight", "/images/shaina/shaina2.webp", "/shaina-gallery/"],
    ["shaina-3", "Shaina beneath an orange towel", "/images/shaina/shaina3.webp", "/shaina-gallery/"],
    ["shaina-4", "Shaina carrying a plush toy", "/images/shaina/shaina4.webp", "/shaina-gallery/"]
  ].map(([slug, title, image, url]) => ({
    id: `photo:${slug}`,
    slug,
    title,
    description: title,
    type: "Gallery",
    icon: ":gallery:",
    url,
    image,
    keywords: "photo picture dog molly shaina"
  }));

  window.MSData = Object.freeze({ pages, comics, photos, slugify });
})();
