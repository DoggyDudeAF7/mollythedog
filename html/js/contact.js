document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const subject = document.getElementById("contactSubject");
  const message = document.getElementById("contactMessage");
  const sendButton = document.getElementById("sendContact");
  const status = document.getElementById("contactStatus");

  if (!form || !subject || !message || !sendButton || !status) return;

  const params = new URLSearchParams(location.search);
  const question = params.get("question");
  if (question) message.value = question.slice(0, 5000);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    formData.set("message", `Topic: ${subject.value.trim()}\n\nQuestion:\n${message.value.trim()}`);
    sendButton.disabled = true;
    sendButton.textContent = "Sending…";
    status.textContent = "Emailing your question…";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Your question could not be sent.");
      }

      form.reset();
      sendButton.textContent = "Question Sent";
      status.textContent = "Sent successfully. The site owner can now reply by email.";
    } catch (error) {
      sendButton.disabled = false;
      sendButton.textContent = "Send Question";
      status.textContent = error.message || "Your question could not be sent.";
    }
  });
});
