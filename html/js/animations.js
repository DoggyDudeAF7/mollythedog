document.addEventListener("DOMContentLoaded", () => {
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

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");

  if (lightbox && lightboxImg) {
    document.querySelectorAll(".grid img").forEach(img => {
      img.addEventListener("click", () => {
        lightbox.style.display = "flex";
        lightboxImg.src = img.src;
      });
    });

    lightbox.addEventListener("click", () => {
      lightbox.style.display = "none";
    });
  }

  const habitIds = ["naps", "windows", "blankets", "patrols", "sighs"];
  if (habitIds.every(id => document.getElementById(id))) {
    let data = { naps: 3, windows: 4, blankets: 2, patrols: 2, sighs: 3 };

    try {
      data = JSON.parse(localStorage.getItem("mollyHabits")) || data;
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
        localStorage.setItem("mollyHabits", JSON.stringify(data));
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
    const dogName = isShainaAI ? "Shaina" : "Molly";
    const dogIcon = isShainaAI ? "🐕" : "🐕";

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

      answer.textContent = `${dogIcon} ${dogName} is thinking...`;
      await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 1200));
      typeText(`${dogIcon} ${dogName} says: ` + getDogResponse(q));
    });
  }
});
