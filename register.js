const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("rname").value;
  const email = document.getElementById("remail").value;
  const password = document.getElementById("rpassword").value;

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    alert(data.message);

    if (res.ok) {
      window.location.href = "login.html"; // ✅ IMPORTANT
    }

  } catch (error) {
    alert("Error connecting to server");
  }
}); 