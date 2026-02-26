const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.message);
    }

    // Save token
    localStorage.setItem("token", data.token);

    alert("Login successful!");

    window.location= "index.html";

  } catch (error) {
    alert("Server error");
  }
});