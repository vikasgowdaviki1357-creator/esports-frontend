const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("https://esports-backend-2n67.onrender.com/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Invalid credentials");
      return;
    }

    // Save token
    localStorage.setItem("token", data.token);

    alert("Login successful!");

    // Redirect to home page
    window.location = "index.html";

  } catch (error) {
    alert("Server error. Please try again.");
  }
});
