// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCsy799iekDizixCe0LEGJWC-msj6MsvIs",
  authDomain: "digitalqueuesystem.firebaseapp.com",
  databaseURL: "https://digitalqueuesystem-default-rtdb.firebaseio.com",
  projectId: "digitalqueuesystem",
  storageBucket: "digitalqueuesystem.appspot.com",
  messagingSenderId: "934641075368",
  appId: "1:934641075368:web:fa23d50116ef2fd92e6e9d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

let doctorsMap = {};
let tickets = {};
let doctorTicketCounts = {};

auth.onAuthStateChanged(async user => {
  if (!user) return window.location.href = "login.html"; // not logged in

  // Get user info from Firebase DB
  const uid = user.uid;
  const snapshot = await db.ref("users/" + uid).once("value");
  const userData = snapshot.val();

  // Protect: Only allow admin role
  if (!userData || userData.role !== "admin") {
    alert("⛔ Access denied. You are not an admin!");
    await auth.signOut();
    return window.location.href = "index.html";
  }

  // ✅ Continue loading admin dashboard
  document.getElementById("adminEmail").textContent = user.email;
  loadDoctors(() => {
    populateDoctorFilter();
    loadTickets();
  });
});

function loadDoctors(callback) {
  db.ref("users").on("value", snapshot => {
    const users = snapshot.val() || {};
    doctorsMap = {};
    doctorTicketCounts = {};

    for (let uid in users) {
      const user = users[uid];
      if (user.role === "doctor") {
        doctorsMap[uid] = {
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          email: user.email || "N/A"
        };
        doctorTicketCounts[uid] = { open: 0, closed: 0 };
      }
    }

    document.getElementById("activeDoctors").innerText = `Active Doctors: ${Object.keys(doctorsMap).length}`;
    renderDoctorsTable();
    if (callback) callback();
  });
}

function loadTickets() {
  db.ref("tickets").on("value", snapshot => {
    tickets = snapshot.val() || {};
    applyFilter();
  });
}

function applyFilter() {
  const selectedDoctor = document.getElementById("filterDoctor").value;
  const fromDate = new Date(document.getElementById("filterFromDate").value);
  const toDate = new Date(document.getElementById("filterToDate").value);

  const openBody = document.getElementById("openTicketsTable");
  const closedBody = document.getElementById("completedTicketsTable");
  const pendingBody = document.getElementById("pendingTicketsTable");

  openBody.innerHTML = "";
  closedBody.innerHTML = "";
  pendingBody.innerHTML = "";

  doctorTicketCounts = {};
  Object.keys(doctorsMap).forEach(uid => {
    doctorTicketCounts[uid] = { open: 0, closed: 0 };
  });

  let total = 0,
    closed = 0,
    emergencies = 0;

  for (let id in tickets) {
    const t = tickets[id];
    const ticketId = t.ticketId || id;
    const fullName = t.fullName || "-";
    const type = t.ticketType || "-";
    const status = (t.status || "booked").toLowerCase();
    const doctorUid = t.doctorAssigned || "";
    const apptDate = t.apptDate || t.appointmentDate || "N/A";
    const doctor = doctorsMap[doctorUid];
    const doctorName = doctor ? `Dr. ${doctor.name}` : "Unassigned";

    const ticketDate = apptDate !== "N/A" ? new Date(apptDate) : null;
    if (selectedDoctor && doctorUid !== selectedDoctor) continue;
    if (fromDate.getTime() && ticketDate < fromDate) continue;
    if (toDate.getTime() && ticketDate > toDate) continue;

    total++;
    if (type.toLowerCase() === "emergency") emergencies++;
    if (status === "closed") closed++;
    if (doctor) doctorTicketCounts[doctorUid][status === "closed" ? "closed" : "open"]++;

    const row = document.createElement("tr");

    if (status === "pending") {
      row.innerHTML = `
        <td>${ticketId}</td>
        <td>${fullName}</td>
        <td>${capitalize(type)}</td>
        <td>${capitalize(status)}</td>
        <td>${apptDate}</td>
        <td>
          ${
            doctor
              ? `Dr. ${doctor.name}`
              : `<select onchange="assignDoctorToTicket('${ticketId}', this.value)">
                  <option value="">Select...</option>
                  ${Object.entries(doctorsMap).map(([uid, d]) => `<option value="${uid}">${d.name}</option>`).join("")}
                </select>`
          }
        </td>
        <td>
          <button onclick="updateTicketStatus('${ticketId}', 'booked')">Approve ✅</button>
          <button onclick="updateTicketStatus('${ticketId}', 'rejected')">Reject ❌</button>
        </td>
      `;
      pendingBody.appendChild(row);
    } else if (status === "closed") {
      row.innerHTML = `
        <td>${ticketId}</td>
        <td>${fullName}</td>
        <td>${capitalize(type)}</td>
        <td>${capitalize(status)}</td>
        <td>${apptDate}</td>
        <td>${doctorName}</td>
      `;
      closedBody.appendChild(row);
    } else {
      row.innerHTML = `
        <td>${ticketId}</td>
        <td>${fullName}</td>
        <td>${capitalize(type)}</td>
        <td>${capitalize(status)}</td>
        <td>${apptDate}</td>
        <td>${doctorName}</td>
        <td>${
          doctor
            ? `<span style="color:green;font-weight:bold;">Assigned</span>`
            : `<select onchange="assignDoctorToTicket('${ticketId}', this.value)">
                 <option value="">Select...</option>
                 ${Object.entries(doctorsMap).map(([uid, d]) => `<option value="${uid}">${d.name}</option>`).join("")}
               </select>`
        }</td>
      `;
      openBody.appendChild(row);
    }
  }

  document.getElementById("totalTickets").innerText = `Total Tickets: ${total}`;
  document.getElementById("closedTickets").innerText = `Closed Tickets: ${closed}`;
  document.getElementById("emergencyCount").innerText = `Emergencies: ${emergencies}`;
  renderDoctorsTable();
}

function assignDoctorToTicket(ticketId, doctorUid) {
  if (!doctorUid) return;
  db.ref("tickets")
    .orderByChild("ticketId")
    .equalTo(ticketId)
    .once("value", snapshot => {
      const updates = {};
      snapshot.forEach(child => {
        const key = child.key;
        updates[`${key}/doctorAssigned`] = doctorUid;
        updates[`${key}/apptDate`] = new Date().toISOString().split("T")[0];
        if (!child.val().status || child.val().status === "pending") {
          updates[`${key}/status`] = "booked";
        }
      });
      db.ref("tickets").update(updates).then(() => applyFilter());
    });
}

function updateTicketStatus(ticketId, newStatus) {
  db.ref("tickets")
    .orderByChild("ticketId")
    .equalTo(ticketId)
    .once("value", snapshot => {
      const updates = {};
      snapshot.forEach(child => {
        const key = child.key;
        updates[`${key}/status`] = newStatus;
      });
      db.ref("tickets").update(updates).then(() => applyFilter());
    });
}

function renderDoctorsTable() {
  const tbody = document.getElementById("doctorsTable");
  tbody.innerHTML = "";
  Object.entries(doctorsMap).forEach(([uid, doc]) => {
    const count = doctorTicketCounts[uid] || { open: 0, closed: 0 };
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${uid.slice(0, 6)}...</td>
      <td>${doc.name}</td>
      <td>${doc.email}</td>
      <td>${count.open} / ${count.closed}</td>
    `;
    tbody.appendChild(row);
  });
}

function populateDoctorFilter() {
  const select = document.getElementById("filterDoctor");
  select.innerHTML = '<option value="">All Doctors</option>';
  Object.entries(doctorsMap).forEach(([uid, doc]) => {
    const option = document.createElement("option");
    option.value = uid;
    option.textContent = doc.name;
    select.appendChild(option);
  });
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "-";
}

function toggleProfile() {
  document.getElementById("profileDropdown").classList.toggle("show");
}

document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("profileDropdown");
  const avatar = document.getElementById("adminAvatar");
  if (!dropdown.contains(e.target) && !avatar.contains(e.target)) {
    dropdown.classList.remove("show");
  }
});

function logout() {
  auth.signOut().then(() => (window.location.href = "index.html"));
}