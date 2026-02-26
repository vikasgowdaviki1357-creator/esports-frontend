import { db, getDocs, collection } from "./firebase.js";

// redirect if not logged in
if (!localStorage.getItem("user")) {
  window.location.href = "login.html";
}

document.getElementById("user-email").innerText =
  localStorage.getItem("user");

// Fetch user’s registration status
async function loadUserStatus() {
  const snap = await getDocs(collection(db, "registrations"));

  snap.forEach(docu => {
    let d = docu.data();
    if (d.leader === localStorage.getItem("user")) {
      document.getElementById("team-id").innerText = d.teamID;
      document.getElementById("payment-status").innerText = d.payment.toUpperCase();
    }
  });
}

loadUserStatus();
// dashboard.js
const registration = JSON.parse(localStorage.getItem("registration"));

if (!registration) {
  document.getElementById("pendingBox").innerText = "No registration found";
}

if (registration.status === "approved") {
  document.getElementById("pendingBox").style.display = "none";
  document.getElementById("roomBox").style.display = "block";

  document.getElementById("roomId").innerText = registration.roomId;
  document.getElementById("roomPass").innerText = registration.roomPassword;
}