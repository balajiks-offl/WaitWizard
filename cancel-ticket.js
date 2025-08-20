// Firebase initialization (keep in sync with your project config)
const firebaseConfig = {
  apiKey: "AIzaSyCsy799iekDizixCe0LEGJWC-msj6MsvIs",
  authDomain: "digitalqueuesystem.firebaseapp.com",
  databaseURL: "https://digitalqueuesystem-default-rtdb.firebaseio.com",
  projectId: "digitalqueuesystem",
  storageBucket: "digitalqueuesystem.appspot.com",
  messagingSenderId: "934641075368",
  appId: "1:934641075368:web:fa23d50116ef2fd92e6e9d",
  measurementId: "G-TJESH8R15H"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const ticketList = document.getElementById('ticketList');
const errorMsg = document.getElementById('errorMsg');

function showTickets(tickets) {
  errorMsg.textContent = "";
  if (tickets.length === 0) {
    ticketList.innerHTML = "<p class='message'>You have no open or pending tickets.</p>";
    return;
  }

  // Build table with header
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Ticket Type</th>
        <th>Date</th>
        <th>Time</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  tickets.forEach(ticket => {
    const data = ticket.data;
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${data.fullName || "(no name)"}</td>
      <td>${data.ticketType || "(no type)"}</td>
      <td>${data.appointmentDate || "---"}</td>
      <td>${data.appointmentTime || "---"}</td>
      <td><button class="cancel-btn" data-id="${ticket.id}">Cancel</button></td>
    `;

    tbody.appendChild(tr);
  });

  ticketList.innerHTML = "";
  ticketList.appendChild(table);

  // Attach cancel handlers
  tbody.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm("Are you sure you want to cancel this ticket?")) return;
      const ticketId = btn.getAttribute('data-id');
      try {
        await db.collection("tickets").doc(ticketId).update({ status: "Cancelled" });
        // Remove row on success
        btn.closest('tr').remove();

        if (tbody.children.length === 0) {
          ticketList.innerHTML = "<p class='message'>You have no open or pending tickets.</p>";
        }
      } catch (err) {
        errorMsg.textContent = "Failed to cancel ticket: " + (err.message || err);
      }
    });
  });
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    ticketList.innerHTML = "<p>You must be logged in to view your tickets.</p>";
    return;
  }
  try {
    const querySnapshot = await db.collection("tickets")
      .where("userId", "==", user.uid)
      .where("status", "in", ["Open", "Pending Approval"])
      .get();

    const tickets = [];
    querySnapshot.forEach(doc => {
      tickets.push({ id: doc.id, data: doc.data() });
    });

    showTickets(tickets);
  } catch (err) {
    ticketList.innerHTML = "<p>Error loading your tickets.</p>";
    errorMsg.textContent = "Details: " + (err.message || err);
  }
});
