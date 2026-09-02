(function () {
  "use strict";

  function dogForPage() {
    if (location.pathname.includes("shaina")) return "Shaina";
    if (location.pathname.includes("poppy")) return "Poppy";
    return "Molly";
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
    const context = pageContext(mount);
    const messages = [];

    mount.innerHTML = `
      <section class="faq-ai" aria-label="Ask the ${dog} FAQ assistant">
        <div class="faq-ai-header">
          <span class="faq-ai-avatar" aria-hidden="true">:faq:</span>
          <div><strong>${dog} FAQ Assistant</strong><small>Powered by Ollama</small></div>
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

    function addMessage(role, text, pending = false) {
      const message = document.createElement("div");
      message.className = `faq-ai-message ${role}${pending ? " pending" : ""}`;
      message.textContent = text;
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
