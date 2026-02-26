const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("https://esports-backend-2n67.onrender.com/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    let data;

    try {
      data = await res.json();  // Safe JSON parse
    } catch {
      return alert("Server temporarily unavailable. Try again in 5 seconds.");
    }

    if (!res.ok) {
      return alert(data.message || "Invalid login");
    }

    // Save token
    localStorage.setItem("token", data.token);
    alert("Login successful!");
    window.location = "index.html";

  } catch (err) {
    alert("Network error. Please try again.");
  }
});
