document.addEventListener("DOMContentLoaded", async () => {
  await (window.MSSystemsReady || Promise.resolve());
  const api = window.MSAchievements;
  const grid = document.getElementById("achievementGrid");
  if (!api || !grid) return;

  function formatDate(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
  }

  function render() {
    const definitions = api.definitions;
    const unlocked = definitions.filter((item) => api.isUnlocked(item.id)).length;
    const percent = Math.round(unlocked / definitions.length * 100);
    document.getElementById("achievementUnlocked").textContent = String(unlocked);
    document.getElementById("achievementTotal").textContent = String(definitions.length);
    document.getElementById("achievementPercent").textContent = `${percent}%`;
    document.getElementById("achievementProgressBar").style.width = `${percent}%`;
    document.getElementById("achievementProgressText").textContent = `${unlocked} of ${definitions.length} achievements unlocked`;
    grid.innerHTML = "";

    [...definitions].sort((a, b) => Number(api.isUnlocked(b.id)) - Number(api.isUnlocked(a.id))).forEach((definition) => {
      const isUnlocked = api.isUnlocked(definition.id);
      const secretLocked = definition.secret && !isUnlocked;
      const progress = api.getProgress(definition);
      const card = document.createElement("article");
      card.className = `achievement-card${isUnlocked ? " is-unlocked" : " is-locked"}`;
      const icon = document.createElement("span");
      icon.className = "achievement-icon";
      icon.textContent = secretLocked ? "❔" : definition.icon;
      const title = document.createElement("h2");
      title.textContent = secretLocked ? "???" : definition.title;
      const description = document.createElement("p");
      description.textContent = secretLocked ? "A hidden achievement. Keep exploring." : definition.description;
      card.append(icon, title, description);

      if (isUnlocked) {
        const date = document.createElement("span");
        date.className = "achievement-date";
        date.textContent = `Unlocked ${formatDate(api.unlockedAt(definition.id))}`;
        card.appendChild(date);
      } else if (!secretLocked && definition.target) {
        const track = document.createElement("div");
        track.className = "achievement-mini-track";
        const fill = document.createElement("span");
        fill.style.width = `${Math.min(100, progress.current / progress.target * 100)}%`;
        track.appendChild(fill);
        const count = document.createElement("span");
        count.className = "achievement-count";
        count.textContent = `${progress.current} / ${progress.target}`;
        card.append(track, count);
      }
      grid.appendChild(card);
    });
  }

  window.addEventListener("ms:achievements-changed", render);
  render();
});
