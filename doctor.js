// ===== Firebase Configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyCsy799iekDizixCe0LEGJWC-msj6MsvIs",
  authDomain: "digitalqueuesystem.firebaseapp.com",
  databaseURL: "https://digitalqueuesystem-default-rtdb.firebaseio.com",
  projectId: "digitalqueuesystem",
  storageBucket: "digitalqueuesystem.appspot.com",
  messagingSenderId: "934641075368",
  appId: "1:934641075368:web:fa23d50116ef2fd92e6e9d"
};

// ===== Initialize Firebase =====
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const ticketsTableBody = document.getElementById("ticketsTableBody");
const completedTicketsBody = document.getElementById("completedTicketsBody");

let currentDoctorId = null;

// ===== On Auth State Changed =====
auth.onAuthStateChanged(async user => {
  if (!user) {
    ticketsTableBody.innerHTML = `<tr><td colspan="6">Login required.</td></tr>`;
    return;
  }

  const uid = user.uid;
  const snapshot = await db.ref("users/" + uid).once("value");
  const userData = snapshot.val();

  // Protect: Only allow doctor role
  if (!userData || userData.role !== "doctor") {
    alert("⛔ Access denied. You are not a doctor!");
    await auth.signOut();
    return window.location.href = "index.html";
  }

  // ✅ Allow access to tickets
  currentDoctorId = uid;
  loadTickets();
});

// ===== Load Tickets Assigned to Doctor =====
function loadTickets() {
  db.ref("tickets").on("value", snapshot => {
    const allTickets = snapshot.val() || {};

    ticketsTableBody.innerHTML = "";
    completedTicketsBody.innerHTML = "";

    const openTickets = [];
    const completedTickets = [];

    for (const [id, ticket] of Object.entries(allTickets)) {
      if (ticket.doctorAssigned === currentDoctorId) {
        const status = (ticket.status || "").toLowerCase();

        // ✅ Show only booked, ongoing, accepted as open tickets
        if (["booked", "ongoing", "accepted"].includes(status)) {
          openTickets.push([id, ticket]);
        } else if (status === "closed") {
          completedTickets.push([id, ticket]);
        }
        // ❌ Skip pending and rejected statuses on doctor side
      }
    }

    // ===== Open Tickets Render =====
    if (openTickets.length === 0) {
      ticketsTableBody.innerHTML = `<tr><td colspan="6">No active tickets.</td></tr>`;
    } else {
      openTickets.forEach(([id, ticket]) => {
        ticketsTableBody.appendChild(renderTicketRow(id, ticket, false));
      });
    }

    // ===== Completed Tickets Render =====
    if (completedTickets.length === 0) {
      completedTicketsBody.innerHTML = `<tr><td colspan="6">No completed tickets.</td></tr>`;
    } else {
      completedTickets.forEach(([id, ticket]) => {
        completedTicketsBody.appendChild(renderTicketRow(id, ticket, true));
      });
    }
  });
}

// ===== Render Ticket Row =====
function renderTicketRow(id, ticket, isCompleted = false) {
  const row = document.createElement("tr");

  const ticketId = ticket.ticketId || id;
  const name = ticket.fullName || "-";
  const type = capitalize(ticket.ticketType || "-");
  const status = capitalize(ticket.status || "-");
  const apptDate = ticket.appointmentDate || ticket.apptDate || "N/A";

  row.innerHTML = `
    <td>#${ticketId}</td>
    <td>${name}</td>
    <td>${type}</td>
    <td>${status}</td>
    <td>${apptDate}</td>
  `;

  const actionCell = document.createElement("td");

  if (!isCompleted) {
    const lowerStatus = (ticket.status || "").toLowerCase();

    if (lowerStatus === "booked") {
      const btn = document.createElement("button");
      btn.textContent = "Accept";
      btn.className = "accept-btn";
      btn.onclick = () => {
        if (confirm("Accept this ticket?")) {
          db.ref(`tickets/${id}`).update({ status: "ongoing" });
        }
      };
      actionCell.appendChild(btn);
    } else if (lowerStatus === "ongoing" || lowerStatus === "accepted") {
      const btn = document.createElement("button");
      btn.textContent = "Finish";
      btn.className = "finish-btn";
      btn.onclick = () => {
        if (confirm("Mark as completed?")) {
          db.ref(`tickets/${id}`).update({ status: "closed" });
        }
      };
      actionCell.appendChild(btn);
    } else {
      actionCell.textContent = "-";
    }
  } else {
    // Completed ticket
    actionCell.textContent = "Completed";
    actionCell.style.color = "green";
    actionCell.style.fontWeight = "bold";
  }

  row.appendChild(actionCell);
  return row;
}

// ===== Capitalize Helper =====
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "-";
}