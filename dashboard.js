const registration = JSON.parse(localStorage.getItem("registration"));

if (!registration) {
  document.getElementById("pendingBox").innerText = "No registration found";
}

if (registration && registration.status === "approved") {
  document.getElementById("pendingBox").style.display = "none";
  document.getElementById("roomBox").style.display = "block";

  document.getElementById("roomId").innerText = registration.roomId;
  document.getElementById("roomPass").innerText = registration.roomPassword;
}
