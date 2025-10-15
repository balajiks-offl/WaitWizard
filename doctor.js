// doctor.js

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
const historyTableBody = document.getElementById("historyTableBody");
const openTicketsCountElem = document.getElementById("openTicketsCount");
const historyCountBadge = document.getElementById("historyCountBadge");
const viewHistoryBtn = document.getElementById("viewHistoryBtn");

let currentDoctorId = null;
let currentOpenTickets = [];
let currentHistoryTickets = [];
let openTicketsSortIndex = 0;
let openTicketsSortAsc = true;
let historyTicketsSortIndex = 0;
let historyTicketsSortAsc = true;

auth.onAuthStateChanged(user => {
  if (!user) {
    ticketsTableBody.innerHTML = `<tr><td colspan="5">You must be logged in as a doctor to view this page.</td></tr>`;
    clearProfile();
    return;
  }
  currentDoctorId = user.uid;
  setProfile(user);
  listenToTickets();
});

function listenToTickets() {
  db.collection("tickets")
    .onSnapshot(snapshot => {
      let tickets = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        tickets.push(data);
      });
      currentOpenTickets = tickets.filter(t => t.status === "Open" && !t.doctorAssigned);
      currentHistoryTickets = tickets.filter(t => t.status !== "Open");
      updateOpenTickets();
      updateHistoryCount();
    }, err => {
      ticketsTableBody.innerHTML = `<tr><td colspan="5">Error loading tickets: ${err.message}</td></tr>`;
    });
}

function updateOpenTickets() {
  renderTickets(currentOpenTickets, ticketsTableBody, true);
  openTicketsCountElem.textContent = currentOpenTickets.length;
}

function updateHistoryCount() {
  historyCountBadge.textContent = currentHistoryTickets.length > 0 ? currentHistoryTickets.length : "";
}

function renderTickets(tickets, tableBody, showActions = false) {
  if (tickets.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${showActions ? 5 : 4}">No tickets found.</td></tr>`;
    return;
  }
  tableBody.innerHTML = "";
  tickets.forEach(ticket => {
    let actionsHTML = "-";
    if (showActions && ticket.status === "Open" && !ticket.doctorAssigned) {
      actionsHTML = `<button class="accept-btn" onclick="acceptTicket('${ticket.id}')">Accept</button>`;
    }
    tableBody.innerHTML += `
      <tr tabindex="0" title="Ticket #${ticket.id.substring(0,6)}, Patient: ${ticket.fullName || "N/A"}, Status: ${capitalizeFirstLetter(ticket.status)}">
        <td>#${ticket.id.substring(0,6)} <button onclick="copyTicketId('${ticket.id}')" aria-label="Copy ticket number #${ticket.id.substring(0,6)}" class="copy-btn" title="Copy Ticket #">📋</button></td>
        <td>${ticket.fullName || "N/A"}</td>
        <td>${capitalizeFirstLetter(ticket.ticketType)}</td>
        <td><span class="status-badge status-${ticket.status.toLowerCase()}">${capitalizeFirstLetter(ticket.status)}</span></td>
        <td>${actionsHTML}</td>
      </tr>`;
  });
}

function copyTicketId(ticketId) {
  navigator.clipboard.writeText("#" + ticketId.substring(0,6))
    .then(() => alert("Ticket number copied: #" + ticketId.substring(0,6)))
    .catch(() => alert("Failed to copy ticket number."));
}

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

function capitalizeFirstLetter(string) {
  if (!string) return "-";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function viewHistory() {
  const historySection = document.getElementById("historySection");
  if (historySection.style.display === "block") {
    historySection.style.display = "none";
    viewHistoryBtn.setAttribute("aria-expanded", "false");
    return;
  }

  renderTickets(currentHistoryTickets, historyTableBody, false);
  historySection.style.display = "block";
  viewHistoryBtn.setAttribute("aria-expanded", "true");
  document.getElementById("historyTicketsSearch").value = "";
}

function setProfile(user) {
  const profileNameElem = document.getElementById("profileName");
  const doctorFullNameElem = document.getElementById("doctorFullName");
  const doctorEmailElem = document.getElementById("doctorEmail");

  db.collection("users").doc(user.uid).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      const displayName = (data.firstname || "") + " " + (data.lastname || "");
      profileNameElem.textContent = displayName.trim() || "Doctor";
      doctorFullNameElem.textContent = displayName.trim() || "N/A";
      doctorEmailElem.textContent = data.email || user.email || "N/A";
    } else {
      profileNameElem.textContent = user.displayName || "Doctor";
      doctorFullNameElem.textContent = user.displayName || "N/A";
      doctorEmailElem.textContent = user.email || "N/A";
    }
  }).catch(() => {
    profileNameElem.textContent = user.displayName || "Doctor";
    doctorFullNameElem.textContent = user.displayName || "N/A";
    doctorEmailElem.textContent = user.email || "N/A";
  });
}

function clearProfile() {
  document.getElementById("profileName").textContent = "";
  document.getElementById("doctorFullName").textContent = "";
  document.getElementById("doctorEmail").textContent = "";
}

function toggleProfileDetails() {
  const details = document.getElementById("profileDetails");
  details.style.display = details.style.display === "block" ? "none" : "block";
}

function logout() {
  auth.signOut().then(() => {
    alert("Logged out successfully.");
    window.location.reload();
  }).catch(err => {
    alert("Logout failed: " + err.message);
  });
}

// Sorting functions for open and history tables
function sortTable(type, columnIndex) {
  let tickets, ascending, setSort;

  if (type === 'open') {
    tickets = currentOpenTickets;
    ascending = openTicketsSortAsc;
    setSort = (asc) => { openTicketsSortAsc = asc; };
  } else {
    tickets = currentHistoryTickets;
    ascending = historyTicketsSortAsc;
    setSort = (asc) => { historyTicketsSortAsc = asc; };
  }

  // Toggle ascending/descending if same column
  if ((type === 'open' && openTicketsSortIndex === columnIndex) || (type === 'history' && historyTicketsSortIndex === columnIndex)) {
    ascending = !ascending;
    setSort(ascending);
  } else {
    setSort(true);
  }

  if(type === 'open') openTicketsSortIndex = columnIndex;
  else historyTicketsSortIndex = columnIndex;

  tickets.sort((a, b) => {
    let valA, valB;
    switch (columnIndex) {
      case 0:
        valA = a.id;
        valB = b.id;
        break;
      case 1:
        valA = a.fullName ? a.fullName.toLowerCase() : "";
        valB = b.fullName ? b.fullName.toLowerCase() : "";
        break;
      case 2:
        valA = a.ticketType ? a.ticketType.toLowerCase() : "";
        valB = b.ticketType ? b.ticketType.toLowerCase() : "";
        break;
      case 3:
        valA = a.status ? a.status.toLowerCase() : "";
        valB = b.status ? b.status.toLowerCase() : "";
        break;
      default:
        valA = "";
        valB = "";
    }
    if (valA < valB) return ascending ? -1 : 1;
    if (valA > valB) return ascending ? 1 : -1;
    return 0;
  });

  if(type === 'open') updateOpenTickets();
  else renderTickets(currentHistoryTickets, historyTableBody, false);
}

// Filtering tickets search
function filterTickets() {
  const searchVal = document.getElementById('openTicketsSearch').value.toLowerCase();
  const filtered = currentOpenTickets.filter(t => {
    return t.id.toLowerCase().includes(searchVal) ||
           (t.fullName && t.fullName.toLowerCase().includes(searchVal));
  });
  renderTickets(filtered, ticketsTableBody, true);
}

// Filtering history tickets search
function filterHistory() {
  const searchVal = document.getElementById('historyTicketsSearch').value.toLowerCase();
  const filtered = currentHistoryTickets.filter(t => {
    return t.id.toLowerCase().includes(searchVal) ||
           (t.fullName && t.fullName.toLowerCase().includes(searchVal));
  });
  renderTickets(filtered, historyTableBody, false);
}

// Close profile popup if click outside
document.addEventListener('click', (evt) => {
  const profileContainer = document.querySelector('.profile-container');
  const profileDetails = document.getElementById('profileDetails');
  if (!profileContainer.contains(evt.target) && !profileDetails.contains(evt.target)) {
    profileDetails.style.display = 'none';
  }
});
