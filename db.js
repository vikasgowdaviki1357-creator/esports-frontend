// simple demo - inject two tournaments (FREE FIRE and BGMI)
// This is a local stub. Replace with Firestore reads later.

const tournaments = [
  {
    id: "ff-1",
    name: "Free Fire Clash - Solo",
    game: "FREEFIRE",
    date: "2025-12-18",
    fee: "₹50"
  },
  {
    id: "bgmi-1",
    name: "BGMI Battlegrounds - Duo",
    game: "BGMI",
    date: "2025-12-20",
    fee: "₹60"
  }
];

function createCard(t){
  const div = document.createElement('div');
  div.className = "t-card";
  div.innerHTML = `
    <h4>${t.name}</h4>
    <div class="meta">
      <span class="badge">${t.game}</span>
      &nbsp; • &nbsp; ${t.date} &nbsp; • &nbsp; ${t.fee}
    </div>
    <p style="color:var(--muted);margin:0;font-size:14px">Slots: 100 • Mode: Online</p>
  `;
  return div;
}

const container = document.getElementById('tournament-container');
tournaments.forEach(t=>{
  container.appendChild(createCard(t));
});

// set next match info
const next = document.getElementById('next-match');
if(next) next.textContent = `${tournaments[0].name} — ${tournaments[0].date}`;
