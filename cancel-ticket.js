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
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const ticketList = document.getElementById('ticketList');
const errorMsg = document.getElementById('errorMsg');

// Modal styled to match your booking success modal
function showCancelCenterModal(message) {
  let centerModal = document.getElementById('cancelCenterModal');
  if (!centerModal) {
    centerModal = document.createElement("div");
    centerModal.id = "cancelCenterModal";
    centerModal.style.position = "fixed";
    centerModal.style.top = "0";
    centerModal.style.left = "0";
    centerModal.style.width = "100vw";
    centerModal.style.height = "100vh";
    centerModal.style.background = "rgba(60,80,120,0.08)";
    centerModal.style.display = "flex";
    centerModal.style.justifyContent = "center";
    centerModal.style.alignItems = "center";
    centerModal.style.zIndex = "20000";
    centerModal.innerHTML = `
      <div id="cancelModalBox" style="
        background: #fff;
        color: #365f6b;
        font-size: 1.45rem;
        border-radius: 22px;
        padding: 44px 55px 34px 55px;
        box-shadow: 0 8px 48px rgba(44,78,112,0.10);
        text-align: center;
        min-width: 250px;
        max-width: 93vw;
        font-weight: 700;
        letter-spacing: 0.02em;
      ">
        <div id="cancelModalMsg"></div>
        <button id="cancelModalBtn" style="
          margin-top: 30px;
          font-size: 1.15rem;
          border: none;
          outline: none;
          border-radius: 11px;
          background: linear-gradient(90deg, #b6e0c1, #e0e9b6 90%);
          color: #365f6b;
          padding: 8px 55px;
          font-weight: 700;
          cursor: pointer;
        ">OK</button>
      </div>`;
    document.body.appendChild(centerModal);
    document.getElementById('cancelModalBtn').onclick = function() {
      centerModal.style.display = "none";
    };
  }
  document.getElementById("cancelModalMsg").innerText = message;
  centerModal.style.display = "flex";
}

async function addNotificationCancel(userId, userName, appointmentDate, appointmentTime) {
  await db.collection("notifications").add({
    type: "cancellation",
    userId: userId,
    userName: userName,
    bookingTime: `${appointmentDate} at ${appointmentTime}`,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function cancelTicket(ticketId) {
  try {
    // Get info for notification
    const ticketRef = db.collection("tickets").doc(ticketId);
    const ticketDoc = await ticketRef.get();
    if (!ticketDoc.exists) throw new Error("Ticket not found.");

    const ticket = ticketDoc.data();
    await ticketRef.update({ status: "Cancelled" });

    // Always take name from ticket document!
    const user = auth.currentUser;
    let userName = (ticket && ticket.fullName) ? ticket.fullName : (user && user.displayName ? user.displayName : "Unknown User");

    await addNotificationCancel(
      user ? user.uid : null,
      userName,
      ticket.appointmentDate ? ticket.appointmentDate : "",
      ticket.appointmentTime ? ticket.appointmentTime : ""
    );

    showCancelCenterModal("Ticket canceled successfully!");
    loadTickets();

  } catch(err) {
    alert("Error canceling ticket: " + err.message);
  }
}

function showTickets(tickets) {
  errorMsg.textContent = "";
  if (tickets.length === 0) {
    ticketList.innerHTML = "<p>No tickets found.</p>";
    return;
  }
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr><th>Full Name</th><th>Appointment Date</th><th>Status</th><th>Action</th></tr>
    </thead>
    <tbody>
      ${tickets.map(t => `
        <tr>
          <td>${t.data.fullName}</td>
          <td>${t.data.appointmentDate}</td>
          <td>${t.data.status}</td>
          <td><button class="cancel-btn" onclick="cancelTicket('${t.id}')">Cancel</button></td>
        </tr>
      `).join('')}
    </tbody>
  `;
  ticketList.innerHTML = "";
  ticketList.appendChild(table);
}

async function loadTickets() {
  const user = auth.currentUser;
  if (!user) {
    errorMsg.textContent = "You must be logged in to view tickets.";
    ticketList.innerHTML = "";
    return;
  }
  try {
    const snapshot = await db.collection("tickets")
      .where("userId", "==", user.uid)
      .where("status", "in", ["Open", "Pending Approval"])
      .get();
    const tickets = [];
    snapshot.forEach(doc => tickets.push({ id: doc.id, data: doc.data() }));
    showTickets(tickets);
  } catch (err) {
    ticketList.innerHTML = "<p>Error loading tickets.</p>";
    errorMsg.textContent = "Details: " + (err.message || err);
  }
}

auth.onAuthStateChanged(user => {
  if (user) {
    loadTickets();
  } else {
    ticketList.innerHTML = "<p>Please sign in to view tickets.</p>";
  }
});
