(function () {
  var scriptElement = document.currentScript;
  var scriptElements;
  var scriptIndex;

  if (!scriptElement) {
    scriptElements = document.getElementsByTagName("script");
    for (scriptIndex = scriptElements.length - 1; scriptIndex >= 0; scriptIndex -= 1) {
      if (/\/js\/animations\.js(?:[?#].*)?$/.test(scriptElements[scriptIndex].src)) {
        scriptElement = scriptElements[scriptIndex];
        break;
      }
    }
  }

  var siteRoot = scriptElement && scriptElement.src
    ? scriptElement.src.replace(/js\/animations\.js(?:[?#].*)?$/, "")
    : "/";
  var emojiRoot = siteRoot + "images/emoji/";

  if (!window.MSSystemsReady) {
    var systemsDisabled = /\/blog\/admin(?:\/|$)|\/preview(?:\/|$)|\/site-access(?:\/|$)/.test(location.pathname);

    function loadSystemScript(filename) {
      return new Promise(function (resolve) {
        var alreadyLoaded = Array.prototype.some.call(document.scripts, function (item) {
          return item.src && item.src.split(/[?#]/)[0].endsWith("/js/" + filename);
        });
        if (alreadyLoaded) {
          resolve();
          return;
        }
        var script = document.createElement("script");
        script.src = siteRoot + "js/" + filename;
        script.dataset.msSystem = filename;
        script.onload = resolve;
        script.onerror = resolve;
        document.head.appendChild(script);
      });
    }

    if (!systemsDisabled) {
      if (!document.querySelector('link[data-ms-system="styles"]')) {
        var systemsStyles = document.createElement("link");
        systemsStyles.rel = "stylesheet";
        systemsStyles.href = siteRoot + "css/systems.css";
        systemsStyles.dataset.msSystem = "styles";
        document.head.appendChild(systemsStyles);
      }

      window.MSSystemsReady = loadSystemScript("site-data.js")
        .then(function () { return loadSystemScript("favourites.js"); })
        .then(function () { return loadSystemScript("achievements.js"); });
      window.MSSystemsReady.then(function () { return loadSystemScript("search.js"); });
    } else {
      window.MSSystemsReady = Promise.resolve();
    }
  }

  var dogEmojiData = {
    molly: { alt: "Molly", file: "molly-emoji" },
    poppy: { alt: "Poppy", file: "poppy-emoji" },
    shaina: { alt: "Shaina", file: "shaina-emoji" },
    breeds: { alt: "Dog Breeds", file: "breeds-emoji" },
    comics: { alt: "Comics", file: "comics-emoji" },
    blog: { alt: "Blog", file: "blog-emoji" },
    home: { alt: "Home", file: "home-emoji" },
    traits: { alt: "Traits", file: "traits-emoji" },
    habits: { alt: "Habits", file: "habits-emoji" },
    mind: { alt: "Mind", file: "mind-emoji" },
    gallery: { alt: "Gallery", file: "gallery-emoji" },
    faq: { alt: "FAQ", file: "faq-emoji" },
    about: { alt: "About", file: "about-emoji" },
    search: { alt: "Search", file: "search-emoji" }
  };
  var dogTextPattern = /:(molly|poppy|shaina|breeds|comics|blog|home|traits|habits|mind|gallery|faq|about|search):|(🐶|🐕|🐩|📚)/gi;
  var excludedTags = {
    CODE: true,
    PRE: true,
    SCRIPT: true,
    STYLE: true,
    INPUT: true,
    TEXTAREA: true,
    SELECT: true,
    OPTION: true,
    HEAD: true,
    TITLE: true,
    NOSCRIPT: true,
    TEMPLATE: true
  };

  function isExcluded(node, boundary) {
    var parent = node.parentNode;
    while (parent) {
      if (parent.nodeType === 1 && (excludedTags[parent.tagName] || parent.isContentEditable)) {
        return true;
      }
      if (parent === boundary) break;
      parent = parent.parentNode;
    }
    return false;
  }

  function createDogEmoji(name) {
    var data = dogEmojiData[name];
    var picture = document.createElement("picture");
    var source = document.createElement("source");
    var image = document.createElement("img");

    picture.className = "dog-emoji-picture";
    source.type = "image/webp";
    source.srcset = emojiRoot + data.file + ".webp";
    image.className = "dog-emoji";
    image.src = emojiRoot + data.file + ".webp";
    image.alt = data.alt;
    image.width = 256;
    image.height = 256;
    image.decoding = "async";

    picture.appendChild(source);
    picture.appendChild(image);
    return picture;
  }

  function nameFromContext(node, symbol) {
    var text = node.nodeValue || "";
    var named = text.match(/\b(molly|poppy|shaina)\b/i);
    var parent = node.parentNode;
    var context = "";

    if (symbol === "🐕") return "breeds";
    if (symbol === "📚") return "comics";
    if (named) return named[1].toLowerCase();

    while (parent && parent.nodeType === 1) {
      context += " " + (parent.getAttribute("title") || "");
      context += " " + (parent.getAttribute("aria-label") || "");
      context += " " + (parent.getAttribute("href") || "");
      if (parent.tagName === "A") break;
      parent = parent.parentNode;
    }

    if (/poppy/i.test(context)) return "poppy";
    if (/shaina/i.test(context)) return "shaina";
    if (/molly/i.test(context)) return "molly";
    if (symbol === "🐩") return "poppy";

    if (/\/poppy(?:-|\/)/i.test(location.pathname)) return "poppy";
    if (/\/shaina(?:-|\/)/i.test(location.pathname)) return "shaina";
    return "molly";
  }

  function replaceShortcodesInTextNode(node) {
    var text = node.nodeValue;
    var match;
    var lastIndex = 0;
    var fragment = document.createDocumentFragment();

    dogTextPattern.lastIndex = 0;
    while ((match = dogTextPattern.exec(text)) !== null) {
      if (match.index > lastIndex) fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      var name = (match[1] || "").toLowerCase();
      fragment.appendChild(createDogEmoji(name || nameFromContext(node, match[2])));
      lastIndex = dogTextPattern.lastIndex;
    }

    if (lastIndex === 0) return;
    if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    node.parentNode.replaceChild(fragment, node);
  }

  function renderDogEmojis(root) {
    root = root || document;
    var nodes = [];
    var i;

    if (root.nodeType === 3) {
      dogTextPattern.lastIndex = 0;
      if (!isExcluded(root, root) && dogTextPattern.test(root.nodeValue)) nodes.push(root);
    } else {
      var walker = document.createTreeWalker(root, 4, null, false);
      var current;
      while ((current = walker.nextNode())) {
        dogTextPattern.lastIndex = 0;
        if (!isExcluded(current, root) && dogTextPattern.test(current.nodeValue)) nodes.push(current);
      }
    }

    for (i = 0; i < nodes.length; i += 1) replaceShortcodesInTextNode(nodes[i]);
  }

  window.renderDogEmojis = renderDogEmojis;
}());

document.addEventListener("DOMContentLoaded", () => {
  window.renderDogEmojis(document);
  if (window.MutationObserver && document.body) {
    const dogEmojiObserver = new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === "characterData") {
          window.renderDogEmojis(record.target);
        } else {
          Array.prototype.forEach.call(record.addedNodes, node => {
            window.renderDogEmojis(node);
          });
        }
      });
    });
    dogEmojiObserver.observe(document.body, { childList: true, characterData: true, subtree: true });
  }
  try {
    if (!location.pathname.startsWith("/404/")) {
      localStorage.setItem("lastMollyShainaPage", location.pathname + location.search + location.hash);
    }
  } catch {}

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        } else if (document.body.classList.contains("page-faq") || document.title.includes("FAQ") || document.title.includes("Traits")) {
          entry.target.classList.remove("visible");
        }
      });
    }, { threshold: 0.2 });

    revealEls.forEach(el => observer.observe(el));
  }

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  if (toggle && links) {
    toggle.addEventListener("click", event => {
      event.stopPropagation();
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(anchor => {
      anchor.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", event => {
      if (!links.contains(event.target) && event.target !== toggle) {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (document.querySelector(".grid, .carousel")) {
    let lightbox = document.getElementById("lightbox");
    let lightboxImg = document.getElementById("lightboxImg");

    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.id = "lightbox";
      document.body.appendChild(lightbox);
    }

    if (!lightboxImg) {
      lightboxImg = document.createElement("img");
      lightboxImg.id = "lightboxImg";
      lightboxImg.alt = "Enlarged gallery image";
      lightbox.appendChild(lightboxImg);
    }

    let closeButton = document.getElementById("lightboxClose");
    if (!closeButton) {
      closeButton = document.createElement("button");
      closeButton.id = "lightboxClose";
      closeButton.type = "button";
      closeButton.setAttribute("aria-label", "Close image");
      closeButton.textContent = "X";
      lightbox.appendChild(closeButton);
    }

    function closeLightbox() {
      lightbox.style.display = "none";
      lightboxImg.removeAttribute("src");
    }

    document.addEventListener("click", event => {
      const img = event.target.closest(".grid img, .slide img");
      if (!img) return;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt ? `Enlarged view: ${img.alt}` : "Enlarged gallery image";
      lightbox.style.display = "flex";
    });

    lightbox.addEventListener("click", event => {
      if (event.target === lightbox || event.target === closeButton) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeLightbox();
    });
  }

  const habitIds = ["naps", "windows", "blankets", "patrols", "sighs"];
  if (habitIds.every(id => document.getElementById(id))) {
    let data = { naps: 3, windows: 4, blankets: 2, patrols: 2, sighs: 3 };

    const habitStorageKey = location.pathname.includes("poppy") ? "poppyHabits" : "mollyHabits";

    try {
      data = JSON.parse(localStorage.getItem(habitStorageKey)) || data;
    } catch {}

    function setBar(id, val) {
      const bar = document.getElementById("bar-" + id);
      if (bar) bar.style.width = Math.min(val * 10, 100) + "%";
    }

    function update() {
      habitIds.forEach(id => {
        document.getElementById(id).textContent = data[id];
        setBar(id, data[id]);
      });

      const time = document.getElementById("time");
      if (time) time.textContent = "Last updated: " + new Date().toLocaleTimeString();

      try {
        localStorage.setItem(habitStorageKey, JSON.stringify(data));
      } catch {}
    }

    update();

    const today = new Date().getDay();
    const index = (today + 6) % 7;
    const todayValues = [
      data.patrols * 12,
      data.sighs * 12,
      data.windows * 12,
      (data.naps + data.blankets) * 6
    ];

    document.querySelectorAll(".day").forEach((day, i) => {
      const bars = day.querySelectorAll(".vbar");
      bars.forEach((bar, j) => {
        bar.style.height = i === index ? todayValues[j] + "%" : "0%";
      });
    });
  }

  const questionInput = document.getElementById("questionInput");
  const askBtn = document.getElementById("askBtn");
  const answer = document.getElementById("answer");

  if (questionInput && askBtn && answer) {
    const isShainaAI =
      document.title.toLowerCase().includes("shaina") ||
      askBtn.textContent.toLowerCase().includes("shaina");
    const isPoppyAI =
      document.title.toLowerCase().includes("poppy") ||
      askBtn.textContent.toLowerCase().includes("poppy");
    const dogName = isPoppyAI ? "Poppy" : isShainaAI ? "Shaina" : "Molly";
    const dogIcon = isPoppyAI ? "🐩" : "🐕";

    function includesAny(text, words) {
      return words.some(word => text.includes(word));
    }

    function getDogResponse(question) {
      const q = question.toLowerCase();
      const compact = q.replace(/[^\w\s]/g, " ");

      if (isShainaAI) {
        if (includesAny(compact, ["favourite food", "favorite food", "best food", "fav food"])) {
          return "My favourite food is whatever snack is currently being opened. If I must choose: cheese, chicken, or anything earned after excellent listening.";
        }
        if (includesAny(compact, ["food", "eat", "snack", "treat", "cheese", "chicken"])) {
          return "Food is a serious subject. I prefer high-value treats: cheese, chicken, crunchy snacks, and anything that arrives with praise.";
        }
        if (includesAny(compact, ["who are you", "your name", "what are you"])) {
          return "I am Shaina: alert, fast, snack-driven, and usually correct about suspicious sounds.";
        }
        if (includesAny(compact, ["molly", "friend", "best friend"])) {
          return "Molly is my sleepy best friend. She handles deep thoughts and window surveillance; I handle motion, alerts, and snack investigations.";
        }
        if (includesAny(compact, ["walk", "outside", "park", "run"])) {
          return "Walks are excellent. Running is even better. Outside is basically a live puzzle made of smells, routes, and important updates.";
        }
        if (includesAny(compact, ["toy", "ball", "play", "game"])) {
          return "Games are best when they involve movement, focus, and winning. I enjoy a task with a clear reward structure.";
        }
        if (includesAny(compact, ["rain", "storm", "weather", "wind"])) {
          return "Weather changes require monitoring. Rain is inconvenient, wind is information, and calm weather is best for efficient patrols.";
        }
        if (includesAny(compact, ["sleep", "nap", "tired", "bed"])) {
          return "Sleep is recovery mode. I rest so I can return to full-speed observation later.";
        }
        if (includesAny(compact, ["scared", "fear", "afraid", "nervous"])) {
          return "I prefer prepared, not scared. If something is strange, I listen, assess, and decide whether snacks or backup are required.";
        }
        if (includesAny(compact, ["love", "like me", "best"])) {
          return "Yes. I show love through attention, loyalty, quick check-ins, and appearing instantly when something interesting happens.";
        }
        if (includesAny(compact, ["smart", "clever", "intelligent"])) {
          return "Obviously. I track patterns, people, doors, snacks, and suspicious audio events. That is a lot of data.";
        }
        if (includesAny(compact, ["help", "advice", "should i"])) {
          return "My advice: listen carefully, move with purpose, accept rewards, and investigate only after deciding where the exits are.";
        }
        if (includesAny(compact, ["hello", "hi", "hey"])) {
          return "Hello. I noticed you immediately. Do you have a question, a snack, or both?";
        }

        const shainaResponses = [
          "I have reviewed the situation quickly and with excellent posture. My answer is: investigate, then request a snack.",
          "That sounds like a pattern. I would track it for three more seconds, then make a confident decision.",
          "Important question. I am listening with both ears and most of my snack radar.",
          "My official response is: stay alert, move fast, and do not ignore wrapper sounds.",
          "I think the answer depends on whether treats are involved. Most things do.",
          "I would solve this by checking the door, the people, the floor, and the snack zone in that order.",
          "That question has movement energy. I approve."
        ];
        return shainaResponses[Math.floor(Math.random() * shainaResponses.length)];
      }

      if (isPoppyAI) {
        if (includesAny(compact, ["who are you", "your name", "what are you"])) return "I am Poppy, a four-year-old chocolate brown toy poodle living in Melbourne.";
        if (includesAny(compact, ["breed", "poodle", "toy poodle"])) return "I am a toy poodle. The name describes my size variety; the attention, intelligence, and curly coat are thoroughly poodle.";
        if (includesAny(compact, ["coat", "fur", "hair", "groom"])) return "My coat is dense, curly, and continuously growing. It needs regular brushing and trimming, especially where the longer curls gather across my head.";
        if (includesAny(compact, ["walk", "outside", "park", "run"])) return "I prefer to understand a route as I move through it. Distance matters less than having time to notice what has changed.";
        if (includesAny(compact, ["sleep", "nap", "rest", "bed"])) return "Rest is part of the structure of the day. The best place is comfortable, quiet, and positioned where I can still see the room.";
        if (includesAny(compact, ["smart", "clever", "intelligent", "mind"])) return "I remember routes and routines, notice small changes, and read more from tone and posture than people sometimes realise.";
        if (includesAny(compact, ["home", "melbourne", "live"])) return "I live in Melbourne. Home is a collection of known rooms, familiar people, and reliable sequences.";
        if (includesAny(compact, ["hello", "hi", "hey"])) return "Hello. I’m listening.";

        const poppyResponses = [
          "I would take a moment to observe before deciding.",
          "The answer may be in the pattern rather than the single event.",
          "I have noticed the change. I am still deciding whether it matters.",
          "A clear view of the room usually improves the situation.",
          "That deserves careful attention, followed by an unhurried response."
        ];
        return poppyResponses[Math.floor(Math.random() * poppyResponses.length)];
      }

      if (includesAny(compact, ["favourite food", "favorite food", "best food", "fav food"])) {
        return "My favourite food is cheese, followed closely by any snack I was not technically offered but clearly noticed.";
      }
      if (includesAny(compact, ["shaina"])) return "Shaina is my best friend 🐕 I trust her opinions on everything, even when she is moving too fast.";
      if (includesAny(compact, ["food", "eat", "snack", "cheese"])) return "If it involves food, I approve immediately. Especially cheese. Cheese is truth.";
      if (includesAny(compact, ["rain"])) return "Rain is suspicious, loud, and wet. I recommend avoiding it forever if possible.";
      if (includesAny(compact, ["walk"])) return "Walks are acceptable. Especially when I am pretending I do not want them.";
      if (includesAny(compact, ["toy"])) return "Toys are decorative emotional objects. I inspect them, then abandon them dramatically.";
      if (includesAny(compact, ["who are you"])) return "I am Molly. I am responsible for monitoring windows, naps, and snack security.";
      if (includesAny(compact, ["help"])) return "I can help emotionally, but I may get distracted by a distant sound mid-sentence.";
      if (includesAny(compact, ["love"])) return "Love is acceptable. Especially when it comes with snacks or soft blankets.";
      if (includesAny(compact, ["sad"])) return "That sounds emotionally complicated. I recommend lying down until it passes.";
      if (includesAny(compact, ["angry"])) return "Anger is too high-energy. Please convert it into a nap immediately.";
      if (includesAny(compact, ["school"])) return "School sounds like a long indoor walk without snacks. I am unsure about it.";
      if (includesAny(compact, ["home"])) return "Home is the safest place for thinking, sleeping, and snack negotiations.";
      if (includesAny(compact, ["night"])) return "Night is for mysterious sounds and strategic sleeping positions.";

      const mollyResponses = [
        "I have carefully considered this and decided to lie down instead 🐶",
        "That question is above my current nap level of understanding.",
        "Molly is processing this... slowly... like a warm blanket.",
        "I believe the answer is hidden somewhere behind the couch.",
        "I think the answer is yes. Or no. Or possibly cheese.",
        "Let me get back to you after my next scheduled nap.",
        "Molly has filed this question under 'confusing but important'.",
        "I recommend asking again after 3-5 business naps.",
        "I have no idea, but I am confident about it.",
        "I think the answer is hiding under the blanket."
      ];
      return mollyResponses[Math.floor(Math.random() * mollyResponses.length)];
    }

    function typeText(text) {
      answer.textContent = "";
      let i = 0;
      const interval = setInterval(() => {
        answer.textContent += text[i];
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 18);
    }

    questionInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        askBtn.click();
      }
    });

    askBtn.addEventListener("click", async () => {
      const q = questionInput.value.trim();

      if (!q) {
        typeText(`${dogName} is waiting for a question...`);
        return;
      }

      (window.MSSystemsReady || Promise.resolve()).then(function () {
        window.MSAchievements?.unlock("very-suspicious");
      });

      answer.textContent = `${dogIcon} ${dogName} is thinking...`;
      await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 1200));
      typeText(`${dogIcon} ${dogName} says: ` + getDogResponse(q));
    });
  }
});
