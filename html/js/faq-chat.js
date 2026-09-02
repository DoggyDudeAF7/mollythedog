(function () {
  "use strict";

  const escapeHTML = value => String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  function safeURL(value) {
    const url = String(value || "").trim();
    return /^(?:https?:\/\/|mailto:|\/(?!\/)|\.\.?\/|#)/i.test(url) ? escapeHTML(url) : "#";
  }

  function renderInline(value) {
    const tokens = [];
    const stash = html => `\u0000${tokens.push(html) - 1}\u0000`;
    let text = String(value || "")
      .replace(/`\[([^\]]+)\]`\(\[[^\]]*\]\((https?:\/\/[^)\s]+)\)\)/gi, "[$1]($2)")
      .replace(/\[([^\]]+)\]\(\[[^\]]*\]\((https?:\/\/[^)\s]+)\)\)/gi, "[$1]($2)");

    text = text.replace(/`([^`\n]+)`/g, (_, code) => stash(`<code>${escapeHTML(code)}</code>`));
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, url) => {
      const href = safeURL(url);
      const external = /^https?:\/\//i.test(url);
      return stash(`<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${renderInline(label)}</a>`);
    });

    text = escapeHTML(text)
      .replace(/\*\*\*([^*\n]+)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/___([^_\n]+)___/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
      .replace(/~~([^~\n]+)~~/g, "<del>$1</del>")
      .replace(/(^|[^\w])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>")
      .replace(/&lt;br\s*\/?&gt;/gi, "<br>")
      .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, "<u>$1</u>");

    return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
  }

  function splitTableRow(value) {
    let row = String(value || "").trim().replace(/^\\(?=\|)/, "").replace(/\\\s*$/, "");
    if (row.startsWith("|")) row = row.slice(1);
    if (row.endsWith("|")) row = row.slice(0, -1);
    return row.split(/(?<!\\)\|/).map(cell => cell.replace(/\\\|/g, "|").trim());
  }

  function renderMarkdown(value) {
    const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
    const output = [];
    let paragraph = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      output.push(`<p>${renderInline(paragraph.join("\n")).replace(/\n/g, "<br>")}</p>`);
      paragraph = [];
    };

    for (let index = 0; index < lines.length;) {
      const line = lines[index];
      if (!line.trim()) {
        flushParagraph();
        index += 1;
        continue;
      }

      if (index + 1 < lines.length && line.includes("|")) {
        const headers = splitTableRow(line);
        const separators = splitTableRow(lines[index + 1]);
        if (headers.length === separators.length && separators.every(cell => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))) {
          flushParagraph();
          const rows = [];
          index += 2;
          while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
            const cells = splitTableRow(lines[index]);
            while (cells.length < headers.length) cells.push("");
            rows.push(cells.slice(0, headers.length));
            index += 1;
          }
          output.push(`<div class="faq-table-wrap"><table><thead><tr>${headers.map(cell => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
          continue;
        }
      }

      const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        const level = heading[1].length;
        output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
        index += 1;
        continue;
      }

      const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
      if (unordered) {
        flushParagraph();
        const items = [];
        while (index < lines.length) {
          const item = lines[index].match(/^\s*[-+*]\s+(.+)$/);
          if (!item) break;
          items.push(`<li>${renderInline(item[1])}</li>`);
          index += 1;
        }
        output.push(`<ul>${items.join("")}</ul>`);
        continue;
      }

      paragraph.push(line);
      index += 1;
    }

    flushParagraph();
    return output.join("");
  }

  function dogForPage() {
    if (location.pathname.includes("shaina")) return "Shaina";
    if (location.pathname.includes("poppy")) return "Poppy";
    return "Molly";
  }

  const siteRoutes = [
    "/molly/", "/about-molly/", "/molly-traits/", "/molly-habits/", "/molly-mind/", "/molly-gallery/", "/molly-faq/",
    "/shaina/", "/shaina-home/", "/about-shaina/", "/shaina-traits/", "/shaina-habits/", "/shaina-mind/", "/shaina-gallery/", "/shaina-faq/",
    "/poppy/", "/about-poppy/", "/poppy-traits/", "/poppy-habits/", "/poppy-mind/", "/poppy-gallery/", "/poppy-faq/",
    "/about-me/", "/comics/", "/molly-dog-breeds/", "/blog/", "/home/"
  ];

  async function loadSitePage(path) {
    try {
      const response = await fetch(path, { cache: "force-cache" });
      if (!response.ok) return null;
      const documentCopy = new DOMParser().parseFromString(await response.text(), "text/html");
      documentCopy.querySelectorAll("nav, footer, script, style, form, button, #searchBox").forEach(element => element.remove());
      const root = documentCopy.querySelector("main") || documentCopy.body;
      const text = root.textContent.replace(/\s+/g, " ").trim();
      const title = (documentCopy.querySelector("h1")?.textContent || documentCopy.title || path).trim();
      return { path, title, text: text.slice(0, 10000) };
    } catch {
      return null;
    }
  }

  async function loadSiteIndex() {
    const pages = await Promise.all(siteRoutes.map(loadSitePage));
    return pages.filter(Boolean);
  }

  function relevantSiteContext(pages, question, dog, fallbackContext) {
    const stopWords = new Set(["about", "what", "when", "where", "which", "with", "that", "this", "from", "have", "does", "tell", "give", "would", "could", "there", "their"]);
    const words = (question.toLowerCase().match(/[a-z0-9]+/g) || [])
      .filter(word => word.length > 2 && !stopWords.has(word));
    const dogName = dog.toLowerCase();

    const ranked = pages.map(page => {
      const title = page.title.toLowerCase();
      const text = page.text.toLowerCase();
      let score = page.path.includes(dogName) ? 3 : 0;
      for (const word of words) {
        if (title.includes(word)) score += 12;
        if (page.path.includes(word)) score += 8;
        if (text.includes(word)) score += 2;
      }
      return { ...page, score };
    }).sort((a, b) => b.score - a.score);

    const selected = ranked.slice(0, 7);
    const siteContext = selected.map(page => `PAGE: ${page.title}\nURL: ${page.path}\n${page.text.slice(0, 3600)}`).join("\n\n---\n\n");
    return (siteContext || `CURRENT FAQ PAGE:\n${fallbackContext}`).slice(0, 24000);
  }

  function pageContext(mount) {
    return Array.from(document.querySelectorAll(".section .card"))
      .filter(card => !card.contains(mount))
      .map(card => card.innerText.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 14000);
  }

  function mountChat() {
    const mount = document.getElementById("chat-widget-mount");
    if (!mount) return;

    const dog = dogForPage();
    const currentPageContext = pageContext(mount);
    const siteIndexPromise = loadSiteIndex();
    const messages = [];

    mount.innerHTML = `
      <section class="faq-ai" aria-label="Ask the ${dog} FAQ assistant">
        <div class="faq-ai-header">
          <span class="faq-ai-avatar" aria-hidden="true">:faq:</span>
          <div><strong>${dog} FAQ Assistant</strong><small>Indexing the whole site…</small></div>
          <button class="faq-ai-reset" type="button">New chat</button>
        </div>
        <div class="faq-ai-messages" aria-live="polite" aria-relevant="additions"></div>
        <form class="faq-ai-form">
          <label class="sr-only" for="faqAiPrompt">Ask a question</label>
          <textarea id="faqAiPrompt" rows="1" maxlength="2000" placeholder="Ask about ${dog}…" required></textarea>
          <button type="submit" aria-label="Send question">➜</button>
        </form>
        <p class="faq-ai-note">AI can make mistakes. For anything it cannot answer, <a href="/contact/">ask the human</a>.</p>
      </section>`;

    window.renderDogEmojis?.(mount);

    const transcript = mount.querySelector(".faq-ai-messages");
    const form = mount.querySelector(".faq-ai-form");
    const input = mount.querySelector("textarea");
    const sendButton = form.querySelector("button");
    const resetButton = mount.querySelector(".faq-ai-reset");
    const connectionStatus = mount.querySelector(".faq-ai-header small");

    siteIndexPromise.then(pages => {
      connectionStatus.textContent = pages.length
        ? `Ollama · ${pages.length} site pages connected`
        : "Ollama · current FAQ page connected";
    });

    function addMessage(role, text, pending = false) {
      const message = document.createElement("div");
      message.className = `faq-ai-message ${role}${pending ? " pending" : ""}`;
      if (role === "assistant" && !pending) message.innerHTML = renderMarkdown(text);
      else message.textContent = text;
      transcript.appendChild(message);
      transcript.scrollTop = transcript.scrollHeight;
      return message;
    }

    function resetChat() {
      messages.length = 0;
      transcript.innerHTML = "";
      addMessage("assistant", `Hi! Ask me a question about ${dog} or this FAQ page.`);
      input.value = "";
      input.style.height = "auto";
      input.focus();
    }

    async function sendQuestion(question) {
      question = question.trim();
      if (!question) return;

      addMessage("user", question);
      messages.push({ role: "user", content: question });
      input.value = "";
      input.style.height = "auto";
      input.disabled = true;
      sendButton.disabled = true;
      const pending = addMessage("assistant", "Thinking…", true);

      try {
        const sitePages = await siteIndexPromise;
        const context = relevantSiteContext(sitePages, question, dog, currentPageContext);
        const response = await fetch("/api/faq-chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ dog, context, messages }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "The FAQ assistant could not answer.");

        pending.remove();
        addMessage("assistant", result.answer);
        messages.push({ role: "assistant", content: result.answer });
        window.MSAchievements?.unlock("very-suspicious");
      } catch (error) {
        pending.remove();
        addMessage("assistant", `${error.message || "Something went wrong."} You can also ask Geoff or contact the human.`);
      } finally {
        input.disabled = false;
        sendButton.disabled = false;
        input.focus();
      }
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      sendQuestion(input.value);
    });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendQuestion(input.value);
      }
    });
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    });
    resetButton.addEventListener("click", resetChat);

    resetChat();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountChat, { once: true });
  } else {
    mountChat();
  }
})();
