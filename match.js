import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

/* ======================
   ADMIN: HOST MATCH
====================== */
window.hostMatch = async function () {
  const name = document.getElementById("match-name").value;
  const game = document.getElementById("match-game").value;
  const roomId = document.getElementById("room-id").value;
  const roomPass = document.getElementById("room-pass").value;
  const startTime = document.getElementById("match-time").value;

  if (!name || !game || !roomId || !roomPass || !startTime) {
    alert("Fill all fields");
    return;
  }

  await addDoc(collection(db, "matches"), {
    name,
    game,
    roomId,
    roomPass,
    startTime: new Date(startTime),
    createdAt: serverTimestamp()
  });

  alert("Match hosted successfully");
};

/* ======================
   PLAYER: LOAD MATCHES
====================== */
window.loadMatches = async function () {
  const list = document.getElementById("match-list");
  if (!list) return;

  list.innerHTML = "";
  const q = query(collection(db, "matches"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const now = new Date();

  snap.forEach(d => {
    const m = d.data();
    const showPassword = now >= m.startTime.toDate();

    list.innerHTML += `
      <div class="card">
        <h3>${m.name}</h3>
        <p><strong>Game:</strong> ${m.game}</p>
        <p><strong>Room ID:</strong> ${m.roomId}</p>
        <p><strong>Password:</strong>
          ${showPassword ? m.roomPass : "🔒 Locked"}
        </p>
      </div>
    `;
  });
};

/* ======================
   ADMIN: LOAD MATCHES
====================== */
window.loadAdminMatches = async function () {
  const list = document.getElementById("admin-match-list");
  if (!list) return;

  list.innerHTML = "";
  const snap = await getDocs(collection(db, "matches"));

  snap.forEach(d => {
    const m = d.data();
    list.innerHTML += `
      <div class="card">
        <h3>${m.name}</h3>
        <p>${m.game}</p>

        <button onclick="editMatch('${d.id}')">Edit</button>
        <button onclick="deleteMatch('${d.id}')">Delete</button>
        <button onclick="viewRegistrations('${d.id}')">View Registrations</button>
      </div>
    `;
  });
};

/* ======================
   ADMIN: DELETE MATCH
====================== */
window.deleteMatch = async function (id) {
  if (!confirm("Delete this match?")) return;
  await deleteDoc(doc(db, "matches", id));
  loadAdminMatches();
};

/* ======================
   ADMIN: EDIT MATCH
====================== */
window.editMatch = async function (id) {
  const newRoomId = prompt("Enter new Room ID");
  const newRoomPass = prompt("Enter new Room Password");

  if (!newRoomId || !newRoomPass) return;

  await updateDoc(doc(db, "matches", id), {
    roomId: newRoomId,
    roomPass: newRoomPass
  });

  alert("Match updated");
};

/* ======================
   ADMIN: VIEW REGISTRATIONS
====================== */
window.viewRegistrations = async function (matchId) {
  const snap = await getDocs(collection(db, "registrations"));
  let players = "Players:\n\n";

  snap.forEach(d => {
    const r = d.data();
    if (r.matchId === matchId) {
      players += `${r.playerName} (${r.gameId})\n`;
    }
  });

  alert(players || "No registrations");
};
