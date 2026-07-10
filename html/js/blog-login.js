const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("passwordInput");
const loginStatus = document.getElementById("loginStatus");

function setLoginStatus(message, isError = false) {
  loginStatus.hidden = false;
  loginStatus.textContent = message;
  loginStatus.classList.toggle("error", isError);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoginStatus("Logging in...");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: passwordInput.value })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Login failed.");
    }

    location.href = location.pathname.includes("/blog/admin/login") ? "/blog/admin/" : "/admin/";
  } catch (error) {
    setLoginStatus(error.message, true);
  }
});
