document.addEventListener("DOMContentLoaded", () => {
  const questionsWrap = document.getElementById("quizQuestions");
  const progress = document.getElementById("quizProgress");
  const savedResult = document.getElementById("quizSavedResult");
  const result = document.getElementById("quizResult");
  const submit = document.getElementById("quizSubmit");
  const restart = document.getElementById("quizRestart");

  if (!questionsWrap || !progress || !result || !submit || !restart) return;

  const storageKey = "breedQuizAnswers";
  const resultKey = "breedQuizResult";

  const quizData = [
    { q: "What is your energy level?", key: "energy", options: [["High, I need movement", 3], ["Medium, walks are enough", 2], ["Low, couch life please", 1]] },
    { q: "How much grooming patience do you have?", key: "grooming", options: [["Very little", 1], ["A normal brushing routine", 2], ["I can handle fancy fur", 3]] },
    { q: "What size dog feels right?", key: "size", options: [["Small", 1], ["Medium", 2], ["Large", 3]] },
    { q: "How busy is your home?", key: "family", options: [["Lots of people or pets", 3], ["Some activity", 2], ["Quiet and predictable", 1]] },
    { q: "How much space do you have?", key: "space", options: [["Big yard or farm", 3], ["House or apartment with walks", 2], ["Small flat or studio", 1]] },
    { q: "What temperament do you prefer?", key: "temperament", options: [["Playful and active", 3], ["Balanced", 2], ["Calm and quiet", 1]] },
    { q: "How do you feel about barking?", key: "bark", options: [["Fine with an alert dog", 3], ["Some barking is okay", 2], ["Prefer quiet", 1]] },
    { q: "How much daily walking can you do?", key: "walk", options: [["Over an hour", 3], ["30 to 60 minutes", 2], ["Less than 30 minutes", 1]] },
    { q: "How much shedding is okay?", key: "shed", options: [["I do not mind", 1], ["A little is okay", 2], ["Minimal shedding only", 3]] },
    { q: "How social should your dog be?", key: "social", options: [["Very social", 3], ["Friendly but selective", 2], ["Mostly attached to me", 1]] },
    { q: "How trainable should your dog be?", key: "train", options: [["Very easy to train", 3], ["Some patience is fine", 2], ["Independent is okay", 1]] },
    { q: "What kind of play style sounds best?", key: "play", options: [["Games, toys, and action", 3], ["Sometimes playful", 2], ["Gentle and relaxed", 1]] },
  ];

  const breeds = {
    "Siberian Husky": { slug: "siberian-husky", energy: 3, grooming: 2, size: 3, family: 2, space: 3, temperament: 3, bark: 3, walk: 3, shed: 1, social: 3, train: 2, play: 3, note: "big movement, big opinions, and serious outdoor energy" },
    "Labrador Retriever": { slug: "labrador-retriever", energy: 3, grooming: 2, size: 3, family: 3, space: 2, temperament: 3, bark: 2, walk: 3, shed: 2, social: 3, train: 3, play: 3, note: "friendly, trainable, active, and always ready for a job or snack" },
    "Golden Retriever": { slug: "golden-retriever", energy: 2, grooming: 2, size: 3, family: 3, space: 2, temperament: 2, bark: 2, walk: 2, shed: 2, social: 3, train: 3, play: 2, note: "warm, loyal, easygoing, and built for family chaos" },
    "Beagle": { slug: "beagle", energy: 2, grooming: 2, size: 2, family: 2, space: 2, temperament: 2, bark: 3, walk: 2, shed: 2, social: 3, train: 2, play: 2, note: "curious, vocal, social, and extremely committed to sniffing" },
    "Cavoodle": { slug: "cavoodle", energy: 2, grooming: 3, size: 2, family: 2, space: 2, temperament: 2, bark: 1, walk: 2, shed: 3, social: 2, train: 2, play: 2, note: "soft, people-focused, clever, and very Molly-adjacent" },
    "Shih Tzu": { slug: "shih-tzu", energy: 1, grooming: 3, size: 1, family: 1, space: 1, temperament: 1, bark: 1, walk: 1, shed: 3, social: 1, train: 1, play: 1, note: "small, cozy, low-speed, and strongly committed to comfort" },
    "Maltese": { slug: "maltese", energy: 1, grooming: 3, size: 1, family: 1, space: 1, temperament: 1, bark: 1, walk: 1, shed: 3, social: 1, train: 1, play: 1, note: "tiny, affectionate, polished, and suspiciously powerful emotionally" },
    "French Bulldog": { slug: "french-bulldog", energy: 1, grooming: 2, size: 1, family: 2, space: 1, temperament: 1, bark: 2, walk: 1, shed: 2, social: 2, train: 1, play: 1, note: "compact, funny, relaxed, and built for short bursts" },
    "Chihuahua": { slug: "chihuahua", energy: 1, grooming: 1, size: 1, family: 1, space: 1, temperament: 1, bark: 1, walk: 1, shed: 1, social: 1, train: 1, play: 1, note: "tiny, alert, attached, and convinced it is in charge" },
    "Pomeranian": { slug: "pomeranian", energy: 1, grooming: 3, size: 1, family: 1, space: 1, temperament: 1, bark: 2, walk: 1, shed: 3, social: 1, train: 1, play: 1, note: "fluffy, confident, dramatic, and extremely portable" },
  };

  let answers = {};

  try {
    answers = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!answers || typeof answers !== "object") answers = {};
  } catch (error) {
    answers = {};
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch (error) {}
  }

  function updateProgress() {
    const count = Object.keys(answers).length;
    progress.textContent = `${count} of ${quizData.length} answered`;
    const last = localStorage.getItem(resultKey);
    savedResult.textContent = last ? `Last match: ${last}` : "";
  }

  function renderQuestions() {
    questionsWrap.innerHTML = "";
    quizData.forEach((question, index) => {
      const section = document.createElement("section");
      section.className = "quiz-question";

      const title = document.createElement("h2");
      title.textContent = `${index + 1}. ${question.q}`;
      section.appendChild(title);

      const options = document.createElement("div");
      options.className = "quiz-options";

      question.options.forEach(([label, value]) => {
        const button = document.createElement("button");
        button.className = "quiz-option";
        button.type = "button";
        button.textContent = label;
        button.classList.toggle("active", answers[question.key] === value);
        button.addEventListener("click", () => {
          answers[question.key] = value;
          save();
          renderQuestions();
          updateProgress();
        });
        options.appendChild(button);
      });

      section.appendChild(options);
      questionsWrap.appendChild(section);
    });
  }

  function getBestBreed() {
    let bestName = "";
    let bestScore = -Infinity;

    Object.entries(breeds).forEach(([name, breed]) => {
      const score = quizData.reduce((total, question) => {
        return total + (3 - Math.abs(breed[question.key] - answers[question.key]));
      }, 0);

      if (score > bestScore) {
        bestName = name;
        bestScore = score;
      }
    });

    return { name: bestName, ...breeds[bestName] };
  }

  function showResult() {
    if (Object.keys(answers).length !== quizData.length) {
      result.innerHTML = `<div class="quiz-warning">Answer every question first, then I can match you properly.</div>`;
      return;
    }

    const breed = getBestBreed();
    try {
      localStorage.setItem(resultKey, breed.name);
    } catch (error) {}
    updateProgress();

    result.innerHTML = `
      <div class="quiz-result-card">
        <img src="../images/breeds/${breed.slug}.webp" alt="${breed.name}">
        <div>
          <p class="quiz-kicker">Your Match</p>
          <h2>${breed.name}</h2>
          <p>${breed.note}.</p>
          <a href="../molly-dog-breeds/#${breed.slug}">View Breed Card</a>
        </div>
      </div>
    `;
    result.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function restartQuiz() {
    answers = {};
    result.innerHTML = "";
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(resultKey);
    } catch (error) {}
    renderQuestions();
    updateProgress();
  }

  submit.addEventListener("click", showResult);
  restart.addEventListener("click", restartQuiz);

  renderQuestions();
  updateProgress();
});
