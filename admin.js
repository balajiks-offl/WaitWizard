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

const totalTicketsElem = document.getElementById("totalTickets");
const emergencyCountElem = document.getElementById("emergencyCount");
const cancelCountElem = document.getElementById("cancelCount");
const doctorCountElem = document.getElementById("doctorCount");

const activeTicketsTableBody = document.getElementById("activeTicketsTableBody");
const closedTicketsTableBody = document.getElementById("closedTicketsTableBody");

const profileIcon = document.getElementById('profileIcon');
const profileDropdown = document.getElementById('profileDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');

let unsubscribeActive = null;

const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

let currentConfirmResolve = null;

function capitalizeFirstLetter(text) {
  if (!text) return '-';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function updateUIForUser(user) {
  if (user) {
    profileIcon.style.display = 'block';
    loginBtn.style.display = 'none';
    profileDropdown.style.display = 'none';

    document.querySelector('.profile-info strong').textContent = user.displayName || 'User';
    document.querySelector('.profile-info p').textContent = user.email || '';
    
    loadTickets();
  } else {
    profileIcon.style.display = 'none';
    profileDropdown.style.display = 'none';
    loginBtn.style.display = 'block';

    activeTicketsTableBody.innerHTML = "<tr><td colspan='9'>Please login to view tickets.</td></tr>";
    closedTicketsTableBody.innerHTML = "<tr><td colspan='8'>Please login to view tickets.</td></tr>";

    totalTicketsElem.textContent = '0';
    emergencyCountElem.textContent = '0';
    cancelCountElem.textContent = '0';
    doctorCountElem.textContent = '0';
  }
}

auth.onAuthStateChanged(user => {
  updateUIForUser(user);
});

function showConfirmation(message) {
  confirmMessage.textContent = message;
  confirmModal.style.display = 'block';

  return new Promise((resolve) => {
    currentConfirmResolve = resolve;
  });
}

confirmYesBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
  if (currentConfirmResolve) {
    currentConfirmResolve(true);
  }
});

confirmNoBtn.addEventListener('click', () => {
  confirmModal.style.display = 'none';
  if (currentConfirmResolve) {
    currentConfirmResolve(false);
  }
});

window.addEventListener('click', (event) => {
  if (event.target === confirmModal) {
    confirmModal.style.display = 'none';
    if (currentConfirmResolve) {
      currentConfirmResolve(false);
    }
  }
});

async function confirmAndUpdateStatus(ticketId, newStatus, buttonElement) {
  const confirmMsg = `Are you sure you want to mark this ticket as "${newStatus}"?`;

  const confirmed = await showConfirmation(confirmMsg);
  if (!confirmed) return;

  try {
    await db.collection("tickets").doc(ticketId).update({ status: newStatus });
    alert(`Ticket status updated to ${newStatus}`);

    const row = buttonElement.closest('tr');
    if (row) {
      const statusCell = row.querySelector('.status-cell');
      const actionsCell = buttonElement.parentElement;
      if (statusCell) statusCell.textContent = newStatus;
      if (actionsCell) actionsCell.innerHTML = '-';
    }
  } catch (err) {
    console.error("Error updating ticket:", err);
    alert("Failed to update ticket status. Please try again.");
  }
}

function loadTickets() {
  if (unsubscribeActive) unsubscribeActive();

  unsubscribeActive = db.collection("tickets")
    .onSnapshot(snapshot => {
      let totalTickets = 0,
          emergencyCount = 0,
          cancelCount = 0;

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
          if (ticket.status === "Open" || ticket.status === "Waiting" || ticket.status === "Not Arrived") {
            actionButtons = `
              <button class="arrived-btn">Arrived</button>
              <button class="not-arrived-btn">Not Arrived</button>
            `;
          } else {
            actionButtons = "-";
          }

          activeTicketsTableBody.innerHTML += `
            <tr data-ticket-id="${ticket.id}">
              <td>${index + 1}</td>
              <td>${ticket.fullName || 'N/A'}</td>
              <td class="status-cell">${ticket.status}</td>
              <td>${capitalizeFirstLetter(ticket.ticketType)}</td>
              <td>${ticket.symptoms || '-'}</td>
              <td>${ticket.appointmentDate || '-'}</td>
              <td>${ticket.appointmentTime || '-'}</td>
              <td>${ticket.doctorAssigned || '-'}</td>
              <td class="actions">${actionButtons}</td>
            </tr>
          `;
        });

        addButtonListeners();
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
      doctorCountElem.textContent = 8; // Static count example
    }, error => {
      console.error("Error fetching tickets: ", error);
      activeTicketsTableBody.innerHTML = "<tr><td colspan='9'>Error loading active tickets</td></tr>";
      closedTicketsTableBody.innerHTML = "<tr><td colspan='8'>Error loading closed tickets</td></tr>";
    });
}

// Add click listeners to the dynamically added buttons
function addButtonListeners() {
  const arrivedButtons = document.querySelectorAll('.arrived-btn');
  const notArrivedButtons = document.querySelectorAll('.not-arrived-btn');

  arrivedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const ticketId = row.getAttribute('data-ticket-id');
      confirmAndUpdateStatus(ticketId, 'Waiting', btn);
    });
  });

  notArrivedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const ticketId = row.getAttribute('data-ticket-id');
      confirmAndUpdateStatus(ticketId, 'Not Arrived', btn);
    });
  });
}

// Profile dropdown toggle
profileIcon.addEventListener('click', () => {
  const isShown = profileDropdown.style.display === 'flex';
  profileDropdown.style.display = isShown ? 'none' : 'flex';
});

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
  if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.style.display = 'none';
  }
});

// Logout handler
logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => alert('Logged out.'));
});

// Login button redirect
loginBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});
