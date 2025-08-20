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
const db = firebase.firestore();

const totalTicketsElem = document.getElementById("totalTickets");
const emergencyCountElem = document.getElementById("emergencyCount");
const cancelCountElem = document.getElementById("cancelCount");
const doctorCountElem = document.getElementById("doctorCount");

const activeTicketsTableBody = document.getElementById("activeTicketsTableBody");
const closedTicketsTableBody = document.getElementById("closedTicketsTableBody");

let unsubscribeActive = null;

function capitalizeFirstLetter(text) {
  if (!text) return '-';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function loadTickets() {
  if (unsubscribeActive) unsubscribeActive();

  unsubscribeActive = db.collection("tickets")
    .onSnapshot(snapshot => {
      let totalTickets = 0, emergencyCount = 0, cancelCount = 0;
      const activeTickets = [];
      const closedTickets = [];

      snapshot.forEach(doc => {
        const ticket = { id: doc.id, ...doc.data() };
        totalTickets++;
        if (ticket.ticketType === "emergency") emergencyCount++;
        if (ticket.status === "cancelled") cancelCount++;

        const status = ticket.status || (ticket.ticketType === "emergency" ? "Pending Approval" : "Open");

        if (status.toLowerCase() === "closed") {
          closedTickets.push({ ...ticket, status });
        } else {
          activeTickets.push({ ...ticket, status });
        }
      });

      const sortFn = (a, b) => {
        if (a.appointmentDate && a.appointmentTime && b.appointmentDate && b.appointmentTime) {
          const [ay, am, ad] = a.appointmentDate.split('-').map(Number);
          const [ah, amin] = a.appointmentTime.split(':').map(Number);
          const [by, bm, bd] = b.appointmentDate.split('-').map(Number);
          const [bh, bmin] = b.appointmentTime.split(':').map(Number);
          return new Date(ay, am - 1, ad, ah, amin) - new Date(by, bm - 1, bd, bh, bmin);
        }
        return 0;
      };
      activeTickets.sort(sortFn);
      closedTickets.sort(sortFn);

      if (activeTickets.length === 0) {
        activeTicketsTableBody.innerHTML = "<tr><td colspan='9'>No active tickets</td></tr>";
      } else {
        activeTicketsTableBody.innerHTML = "";
        activeTickets.forEach((ticket, index) => {
          let actionButtons = "";
          if (ticket.status === "Pending Approval" && ticket.ticketType === "emergency") {
            actionButtons = `
              <button class="btn btn-accept" onclick="updateTicketStatus('${ticket.id}', 'Open')">Accept</button>
              <button class="btn btn-reject" onclick="updateTicketStatus('${ticket.id}', 'Rejected')">Reject</button>
            `;
          } else if (ticket.status === "Open") {
            actionButtons = `<button class="btn btn-close" onclick="updateTicketStatus('${ticket.id}', 'Closed')">Mark Closed</button>`;
          } else {
            actionButtons = "-";
          }

          activeTicketsTableBody.innerHTML += `
            <tr>
              <td>${index + 1}</td>
              <td>${ticket.fullName || 'N/A'}</td>
              <td>${ticket.status}</td>
              <td>${capitalizeFirstLetter(ticket.ticketType)}</td>
              <td>${ticket.symptoms || '-'}</td>
              <td>${ticket.appointmentDate || '-'}</td>
              <td>${ticket.appointmentTime || '-'}</td>
              <td>${ticket.doctorAssigned || '-'}</td>
              <td>${actionButtons}</td>
            </tr>
          `;
        });
      }

      if (closedTickets.length === 0) {
        closedTicketsTableBody.innerHTML = "<tr><td colspan='8'>No closed tickets</td></tr>";
      } else {
        closedTicketsTableBody.innerHTML = "";
        closedTickets.forEach((ticket, index) => {
          closedTicketsTableBody.innerHTML += `
            <tr>
              <td>${index + 1}</td>
              <td>${ticket.fullName || 'N/A'}</td>
              <td>${ticket.status}</td>
              <td>${capitalizeFirstLetter(ticket.ticketType)}</td>
              <td>${ticket.symptoms || '-'}</td>
              <td>${ticket.appointmentDate || '-'}</td>
              <td>${ticket.appointmentTime || '-'}</td>
              <td>${ticket.doctorAssigned || '-'}</td>
            </tr>
          `;
        });
      }

      totalTicketsElem.textContent = totalTickets;
      emergencyCountElem.textContent = emergencyCount;
      cancelCountElem.textContent = cancelCount;
      doctorCountElem.textContent = 8; // static value as per your code
    }, error => {
      console.error("Error fetching tickets: ", error);
      activeTicketsTableBody.innerHTML = "<tr><td colspan='9'>Error loading active tickets</td></tr>";
      closedTicketsTableBody.innerHTML = "<tr><td colspan='8'>Error loading closed tickets</td></tr>";
    });
}

function updateTicketStatus(ticketId, newStatus) {
  db.collection("tickets").doc(ticketId).update({ status: newStatus })
    .then(() => alert(`Ticket updated to ${newStatus}`))
    .catch(err => console.error("Error updating ticket:", err));
}

loadTickets();
