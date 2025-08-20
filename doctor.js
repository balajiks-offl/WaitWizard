// Initialize Firebase
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

const ticketsTableBody = document.getElementById("ticketsTableBody");

let currentDoctorId = null;

auth.onAuthStateChanged(user => {
  if (!user) {
    ticketsTableBody.innerHTML = `<tr><td colspan="5">You must be logged in as a doctor to view this page.</td></tr>`;
    return;
  }
  currentDoctorId = user.uid;
  listenToTickets();
});

function listenToTickets() {
  // Listen to all tickets with status 'Open' or 'Accepted' by this doctor
  db.collection("tickets")
    .where("status", "in", ["Open", "Accepted"])
    .onSnapshot(snapshot => {
      let tickets = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        tickets.push(data);
      });

      // Filter tickets:
      // Show only tickets with status 'Open' and with no doctor assigned
      // Or tickets assigned to this doctor with status 'Accepted' (to show Completed button)
      const visibleTickets = tickets.filter(ticket => {
        if (ticket.status === "Open" && !ticket.doctorAssigned) return true;
        if (ticket.status === "Accepted" && ticket.doctorAssigned === currentDoctorId) return true;
        return false;
      });

      renderTickets(visibleTickets);
    }, err => {
      ticketsTableBody.innerHTML = `<tr><td colspan="5">Error loading tickets: ${err.message}</td></tr>`;
    });
}

function renderTickets(tickets) {
  if (tickets.length === 0) {
    ticketsTableBody.innerHTML = `<tr><td colspan="5">No open tickets available.</td></tr>`;
    return;
  }

  ticketsTableBody.innerHTML = "";
  tickets.forEach((ticket, index) => {
    let actionsHTML = "";

    if (ticket.status === "Open" && index === 0) {
      // Only FIRST ticket has Accept / Reject buttons
      actionsHTML = `
        <button class="accept-btn" onclick="acceptTicket('${ticket.id}')">Accept</button>
        <button class="reject-btn" onclick="rejectTicket('${ticket.id}')">Reject</button>
      `;
    } else if (ticket.status === "Open") {
      // Tickets other than first open ticket show no actions
      actionsHTML = `-`;
    } else if (ticket.status === "Accepted" && ticket.doctorAssigned === currentDoctorId) {
      // Show Completed button for ticket accepted by this doctor
      actionsHTML = `
        <button class="completed-btn" onclick="completeTicket('${ticket.id}')">Completed</button>
      `;
    } else {
      actionsHTML = `-`;
    }

    ticketsTableBody.innerHTML += `
      <tr>
        <td>#${ticket.id.substring(0,6)}</td>
        <td>${ticket.fullName || "N/A"}</td>
        <td>${capitalizeFirstLetter(ticket.ticketType)}</td>
        <td>${capitalizeFirstLetter(ticket.status)}</td>
        <td>${actionsHTML}</td>
      </tr>
    `;
  });
}

// Accept a ticket: assign doctor ID and set status to 'Accepted'
// Removes from others' views since it has assigned doctor now
function acceptTicket(ticketId) {
  db.collection("tickets").doc(ticketId).get().then(doc => {
    if (!doc.exists) {
      alert("Ticket not found.");
      return;
    }
    const data = doc.data();
    if (data.status !== "Open" || data.doctorAssigned) {
      alert("Ticket is already assigned or not open.");
      return;
    }
    return db.collection("tickets").doc(ticketId).update({
      status: "Accepted",
      doctorAssigned: currentDoctorId
    });
  }).then(() => {
    alert("Ticket accepted successfully.");
  }).catch(err => {
    console.error("Error accepting ticket", err);
    alert("Error accepting ticket: " + err.message);
  });
}

// Reject ticket: change status to 'Rejected' (optional)
function rejectTicket(ticketId) {
  if (!confirm("Are you sure you want to reject this ticket?")) return;
  db.collection("tickets").doc(ticketId).update({
    status: "Rejected"
  }).then(() => {
    alert("Ticket rejected.");
  }).catch(err => {
    console.error("Error rejecting ticket", err);
    alert("Error rejecting ticket: " + err.message);
  });
}

// Complete ticket: status to 'Closed' with confirmation popup
function completeTicket(ticketId) {
  if (!confirm("Are you sure you want to mark this ticket as completed?")) return;
  db.collection("tickets").doc(ticketId).update({
    status: "Closed"
  }).then(() => {
    alert("Ticket marked as completed.");
  }).catch(err => {
    console.error("Error completing ticket", err);
    alert("Error completing ticket: " + err.message);
  });
}

function capitalizeFirstLetter(string) {
  if (!string) return "-";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function viewHistory() {
  alert("Feature not implemented yet.");
}
