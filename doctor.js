const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://attbrskgcueofvcnfgwn.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dGJyc2tnY3Vlb2Z2Y25mZ3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MjQ2NTYsImV4cCI6MjA3NzIwMDY1Nn0.hxPxmC2a3Uv5X9yCVXz_AFE5FBj5fkyKsyAsTbzQKSI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const pendingTicketsTableBody = document.getElementById("pendingTicketsTableBody");
const ongoingTicketsTableBody = document.getElementById("ongoingTicketsTableBody");
const pendingTicketsCountElem = document.getElementById("pendingTicketsCount");
const ongoingTicketsCountElem = document.getElementById("ongoingTicketsCount");

const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

let currentConfirmResolve = null;
let ticketsSubscription = null;
let currentDoctorId = 'doctor-1';

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
      .update({
        status: 'accepted',
        doctor_assigned: currentDoctorId
      })
      .eq('id', ticketId);

    if (error) throw error;
    alert('Ticket accepted successfully');
  } catch (err) {
    console.error('Error accepting ticket:', err);
    alert('Failed to accept ticket. Please try again.');
  }
}

function loadTickets() {
  if (ticketsSubscription) {
    ticketsSubscription.unsubscribe();
  }

  ticketsSubscription = supabase
    .channel('doctor-tickets-channel')
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
    const ongoingTickets = tickets.filter(t =>
      t.status === 'accepted' && t.doctor_assigned === currentDoctorId
    );

    pendingTicketsCountElem.textContent = pendingTickets.length;
    ongoingTicketsCountElem.textContent = ongoingTickets.length;

    renderPendingTickets(pendingTickets);
    renderOngoingTickets(ongoingTickets);
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
        <button class="accept-btn" onclick="acceptTicket('${ticket.id}')">Accept</button>
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
      <td><span class="status-badge">${ticket.status}</span></td>
    `;
    ongoingTicketsTableBody.appendChild(row);
  });
}

function toggleProfileDetails() {
  const details = document.getElementById("profileDetails");
  details.style.display = details.style.display === "block" ? "none" : "block";
}

function logout() {
  alert("Logged out successfully.");
  window.location.reload();
}

document.addEventListener("click", evt => {
  const container = document.querySelector(".profile-container");
  const details = document.getElementById("profileDetails");
  if (!container.contains(evt.target) && !details.contains(evt.target)) {
    details.style.display = "none";
  }
});

loadTickets();
