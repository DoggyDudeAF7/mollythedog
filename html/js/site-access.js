const siteAccessForm = document.getElementById("siteAccessForm");
const siteAccessPassword = document.getElementById("siteAccessPassword");
const siteAccessStatus = document.getElementById("siteAccessStatus");

function setSiteAccessStatus(message, isError = false) {
  siteAccessStatus.hidden = false;
  siteAccessStatus.textContent = message;
  siteAccessStatus.classList.toggle("error", isError);
}

siteAccessForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setSiteAccessStatus("Checking password...");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: siteAccessPassword.value })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "That password did not work.");
    }

    try { localStorage.setItem("msFoundSecret", "1"); } catch {}
    location.href = "/home/";
  } catch (error) {
    setSiteAccessStatus(error.message, true);
    siteAccessPassword.select();
  }
});
