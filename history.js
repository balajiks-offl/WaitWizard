const db = firebase.firestore();

function ticketIdToFiveDigit(ticketId) {
  let hash = 0;
  for(let i=0; i<ticketId.length; i++){
    hash = ((hash << 5) - hash) + ticketId.charCodeAt(i);
    hash |= 0;
  }
  const num = Math.abs(hash % 100000);
  return num.toString().padStart(5, '0');
}

function renderHistory(tickets) {
  const historyBody = document.getElementById('historyBody');
  const noHistory = document.getElementById('noHistory');
  if (tickets.length === 0) {
    historyBody.style.display = 'none';
    noHistory.style.display = 'block';
    return;
  }
  noHistory.style.display = 'none';
  historyBody.style.display = '';
  historyBody.innerHTML = '';
  tickets.forEach(t => {
    const ticketNum = ticketIdToFiveDigit(t.id);
    historyBody.innerHTML += `
      <tr>
        <td class="ticket-id">${ticketNum}</td>
        <td>${t.appointmentDate || '-'}</td>
        <td>${t.appointmentTime || '-'}</td>
        <td>${t.status || '-'}</td>
        <td>${t.ticketType || '-'}</td>
        <td><button class="action-btn" onclick="viewTicketDetails('${t.id}')">View Details</button></td>
      </tr>
    `;
  });
}

async function fetchHistory(userId) {
  try {
    const statuses = ["Closed", "Cancelled", "Swapped"];
    const ticketsMap = new Map();

    for (const status of statuses) {
      const snapshot = await db.collection("tickets")
        .where("userId", "==", userId)
        .where("status", "==", status)
        .get();
      snapshot.forEach(doc => {
        if (!ticketsMap.has(doc.id)) {
          ticketsMap.set(doc.id, { id: doc.id, ...doc.data() });
        }
      });
    }

    const tickets = Array.from(ticketsMap.values());
    tickets.sort((a,b) => {
      if (!a.appointmentDate) return 1;
      if (!b.appointmentDate) return -1;
      return new Date(b.appointmentDate) - new Date(a.appointmentDate);
    });

    renderHistory(tickets);
  } catch (error) {
    console.error("Error fetching history: ", error);
    const historyBody = document.getElementById('historyBody');
    historyBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Failed to load history.</td></tr>`;
  }
}

async function viewTicketDetails(ticketId) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = 'Loading details...';
  modalOverlay.classList.add('show');
  try {
    const doc = await db.collection("tickets").doc(ticketId).get();
    if (!doc.exists) {
      modalContent.innerHTML = `<div style="color:red;">Ticket not found.</div>`;
      return;
    }
    const t = doc.data();
    const ticketNum = ticketIdToFiveDigit(ticketId);
    modalContent.innerHTML = `
      <div><b>Ticket ID:</b> <span style="font-family:monospace;font-size:1.3rem;">${ticketNum}</span></div>
      <div><b>Appointment Date:</b> ${t.appointmentDate || '-'}</div>
      <div><b>Appointment Time:</b> ${t.appointmentTime || '-'}</div>
      <div><b>Status:</b> ${t.status || '-'}</div>
      <div><b>Type:</b> ${t.ticketType || '-'}</div>
      <div><b>Full Name:</b> ${t.fullName || '-'}</div>
      <div><b>Gender:</b> ${t.gender || '-'}</div>
      <div><b>Mobile:</b> ${t.mobile || '-'}</div>
    `;
  } catch (err) {
    modalContent.innerHTML = `<div style="color:red;">Failed to load details.</div>`;
  }
}

function closeModal(){
  const modalOverlay = document.getElementById('modalOverlay');
  modalOverlay.classList.remove('show');
}

// Usage example: call fetchHistory(user.uid) once user is authenticated
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    fetchHistory(user.uid);
  } else {
    window.location.href = "index.html";
  }
});
