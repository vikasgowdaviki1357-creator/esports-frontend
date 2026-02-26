// js/admin.js
const { auth, db, onSnapshot, collection, query, orderBy, doc, updateDoc } = window.FB;
const adminEmail = "vikasgowdaviki1357@gmail.com"; // your admin email

// redirect non-admins
auth.onAuthStateChanged((user) => {
  if (!user) {
    // not logged in -> go to admin login
    if (!location.pathname.endsWith('admin-login.html')) {
      location = 'admin-login.html';
    }
    return;
  }
  if (user.email !== adminEmail) {
    alert('Not an admin user.');
    auth.signOut();
    location = 'login.html';
  } else {
    // if here and on admin-login page, redirect to dashboard
    if (location.pathname.endsWith('admin-login.html')) location = 'admin-dashboard.html';
    setupAdminListeners();
  }
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut().then(()=>location='admin-login.html'));

// helper to show popup
function showNotify(text) {
  const el = document.getElementById('notify');
  el.innerText = text;
  el.style.display = 'block';
  setTimeout(()=> el.style.display = 'none', 6000);
}

// render single pending item
function renderPendingItem(docSnap, container) {
  const data = docSnap.data();
  const id = docSnap.id;
  const div = document.createElement('div');
  div.className = 'item';
  div.innerHTML = `
    <div>
      <strong>${data.name}</strong> (${data.ingameId}) <br>
      ${data.phone} — ${data.paymentStatus}
      <div><a href="${data.screenshotURL}" target="_blank">View screenshot</a></div>
    </div>
    <div>
      <button class="btn small approve">Approve</button>
      <button class="btn small" style="background:#666" data-id="${id}">Reject</button>
    </div>
  `;
  container.appendChild(div);

  div.querySelector('.approve').addEventListener('click', async () => {
    try {
      await updateDoc(doc(db, container.dataset.collection, id), {
        paymentStatus: 'approved',
        approvedBy: auth.currentUser.email,
        approvedAt: new Date()
      });
      showNotify('Payment approved: ' + data.name);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}

// setup listeners
function setupAdminListeners() {
  const pendingList = document.getElementById('pendingList');
  const playersList = document.getElementById('playersList');

  // listen to freefire
  const listenFor = ['freefirePlayers','bgmiPlayers'];
  listenFor.forEach(colName => {
    const q = query(collection(db, colName), orderBy('createdAt','desc'));
    onSnapshot(q, (snap) => {
      // clear lists
      if (pendingList) pendingList.innerHTML = '';
      if (playersList) playersList.innerHTML = '';

      snap.forEach(docSnap=>{
        const d = docSnap.data();
        // add to players list
        const pdiv = document.createElement('div');
        pdiv.className = 'item';
        pdiv.innerHTML = `<div><strong>${d.name}</strong> (${colName.replace('Players','')})<br>${d.ingameId} | ${d.paymentStatus}</div>`;
        playersList.appendChild(pdiv);

        // show pending separately
        if (d.paymentStatus === 'pending') {
          // create separate node per collection
          const container = document.createElement('div');
          container.dataset.collection = colName;
          // reuse render logic
          renderPendingItem(docSnap, container);
          if (pendingList) pendingList.appendChild(container);
          // alert popup
          showNotify(`New pending: ${d.name} (${colName.replace('Players','')})`);
        }
      });
    });
  });

  // notifications collection listener (optional extra)
  const qn = query(collection(db,'notifications'), orderBy('createdAt','desc'));
  onSnapshot(qn, (snap)=>{
    snap.docChanges().forEach(change=>{
      if (change.type === 'added') {
        const n = change.doc.data();
        if (!n.seen) {
          showNotify(n.message || 'New event');
        }
      }
    });
  });
}
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// SIGN UP
window.signup = function () {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
};

// LOGIN
window.login = function () {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
};

// PROTECT DASHBOARD
onAuthStateChanged(auth, user => {
  if (window.location.pathname.includes("dashboard")) {
    if (!user) {
      window.location.href = "login.html";
    }
  }
});

// LOGOUT
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};




