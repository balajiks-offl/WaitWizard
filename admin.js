const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://attbrskgcueofvcnfgwn.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dGJyc2tnY3Vlb2Z2Y25mZ3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MjQ2NTYsImV4cCI6MjA3NzIwMDY1Nn0.hxPxmC2a3Uv5X9yCVXz_AFE5FBj5fkyKsyAsTbzQKSI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const totalTicketsElem = document.getElementById("totalTickets");
const pendingCountElem = document.getElementById("pendingCount");
const ongoingCountElem = document.getElementById("ongoingCount");
const rejectedCountElem = document.getElementById("rejectedCount");

const pendingTicketsTableBody = document.getElementById("pendingTicketsTableBody");
const ongoingTicketsTableBody = document.getElementById("ongoingTicketsTableBody");
const rejectedTicketsTableBody = document.getElementById("rejectedTicketsTableBody");

const profileIcon = document.getElementById('profileIcon');
const profileDropdown = document.getElementById('profileDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');

const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

let currentConfirmResolve = null;
let ticketsSubscription = null;

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

async function acceptTicket(ticketId) {
  const confirmed = await showConfirmation('Are you sure you want to accept this ticket?');
  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'accepted' })
      .eq('id', ticketId);

    if (error) throw error;
    alert('Ticket accepted successfully');
  } catch (err) {
    console.error('Error accepting ticket:', err);
    alert('Failed to accept ticket. Please try again.');
  }
}

async function rejectTicket(ticketId) {
  const confirmed = await showConfirmation('Are you sure you want to reject this ticket?');
  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'rejected' })
      .eq('id', ticketId);

    if (error) throw error;
    alert('Ticket rejected successfully');
  } catch (err) {
    console.error('Error rejecting ticket:', err);
    alert('Failed to reject ticket. Please try again.');
  }
}

function loadTickets() {
  if (ticketsSubscription) {
    ticketsSubscription.unsubscribe();
  }

  ticketsSubscription = supabase
    .channel('tickets-channel')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'tickets' },
      () => {
        fetchAndRenderTickets();
      }
    )
    .subscribe();

  fetchAndRenderTickets();
}

async function fetchAndRenderTickets() {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const pendingTickets = tickets.filter(t => t.status === 'pending');
    const ongoingTickets = tickets.filter(t => t.status === 'accepted');
    const rejectedTickets = tickets.filter(t => t.status === 'rejected');

    totalTicketsElem.textContent = tickets.length;
    pendingCountElem.textContent = pendingTickets.length;
    ongoingCountElem.textContent = ongoingTickets.length;
    rejectedCountElem.textContent = rejectedTickets.length;

    renderPendingTickets(pendingTickets);
    renderOngoingTickets(ongoingTickets);
    renderRejectedTickets(rejectedTickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    pendingTicketsTableBody.innerHTML = "<tr><td colspan='6'>Error loading tickets</td></tr>";
  }
}

function renderPendingTickets(tickets) {
  if (tickets.length === 0) {
    pendingTicketsTableBody.innerHTML = "<tr><td colspan='6'>No pending tickets</td></tr>";
    return;
  }

  pendingTicketsTableBody.innerHTML = "";
  tickets.forEach((ticket) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>#${ticket.id.substring(0, 8)}</td>
      <td>${ticket.full_name || 'N/A'}</td>
      <td>${ticket.symptoms || '-'}</td>
      <td>${ticket.appointment_date || '-'}</td>
      <td>${ticket.appointment_time || '-'}</td>
      <td class="actions">
        <button class="arrived-btn" onclick="acceptTicket('${ticket.id}')">Accept</button>
        <button class="not-arrived-btn" onclick="rejectTicket('${ticket.id}')">Reject</button>
      </td>
    `;
    pendingTicketsTableBody.appendChild(row);
  });
}

function renderOngoingTickets(tickets) {
  if (tickets.length === 0) {
    ongoingTicketsTableBody.innerHTML = "<tr><td colspan='6'>No ongoing tickets</td></tr>";
    return;
  }

  ongoingTicketsTableBody.innerHTML = "";
  tickets.forEach((ticket) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>#${ticket.id.substring(0, 8)}</td>
      <td>${ticket.full_name || 'N/A'}</td>
      <td>${ticket.symptoms || '-'}</td>
      <td>${ticket.appointment_date || '-'}</td>
      <td>${ticket.appointment_time || '-'}</td>
      <td>${ticket.doctor_assigned || '-'}</td>
    `;
    ongoingTicketsTableBody.appendChild(row);
  });
}

function renderRejectedTickets(tickets) {
  if (tickets.length === 0) {
    rejectedTicketsTableBody.innerHTML = "<tr><td colspan='5'>No rejected tickets</td></tr>";
    return;
  }

  rejectedTicketsTableBody.innerHTML = "";
  tickets.forEach((ticket) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>#${ticket.id.substring(0, 8)}</td>
      <td>${ticket.full_name || 'N/A'}</td>
      <td>${ticket.symptoms || '-'}</td>
      <td>${ticket.appointment_date || '-'}</td>
      <td>${ticket.appointment_time || '-'}</td>
    `;
    rejectedTicketsTableBody.appendChild(row);
  });
}

profileIcon.addEventListener('click', () => {
  const isShown = profileDropdown.style.display === 'flex';
  profileDropdown.style.display = isShown ? 'none' : 'flex';
});

window.addEventListener('click', (e) => {
  if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.style.display = 'none';
  }
});

logoutBtn.addEventListener('click', () => {
  alert('Logged out.');
});

loginBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

loadTickets();
