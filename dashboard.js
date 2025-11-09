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
const db = firebase.database();
const auth = firebase.auth();
let USER_ID = null;

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    USER_ID = user.uid;
    updateWelcomeMsg();   // Update the welcome message with current user's name
    renderSection('home'); // Load the home page content for logged in user
  } else {
    // No user signed in, redirect to login
    window.location.href = 'index.html';
  }
});


const navBtns = document.querySelectorAll(".nav-btn");
const contentArea = document.getElementById("dashboardContent");
const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");
const logoutBtn = document.getElementById("logoutBtn");
const notificationBtn = document.getElementById("notificationBtn");
const notifDropdown = document.getElementById("notifDropdown");
const notificationBadge = document.getElementById("notificationBadge");
const modalBackdrop = document.getElementById("modalBackdrop");
const modal = document.getElementById("popupModal");
const welcomeMsg = document.getElementById("welcomeMsg");

function updateWelcomeMsg() {
  if (!USER_ID || !auth.currentUser) return;

  const welcomeEl = document.getElementById("welcomeMsg");
  const user = auth.currentUser;

  db.ref(`users/${USER_ID}`).once("value").then(snapshot => {
    const profile = snapshot.val() || {};
    const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    // Fallback to email prefix if first name is missing
    const fallback = user.email?.split("@")[0] || "User";

    welcomeEl.textContent = `Welcome, ${name || fallback}!`;
  }).catch((err) => {
    console.error("Failed to load welcome name:", err);
    welcomeMsg.textContent = `Welcome, ${auth.currentUser.email || "User"}!`;
  });
}

navBtns.forEach((btn) => (btn.onclick = () => renderSection(btn.dataset.tab)));
function showPopup(icon, message) {
  showModal(`${icon} Info`, `<div style="font-size:1.2em;">${message}</div>`, [
    { label: "OK", onClick: () => {} }
  ]);
}
function showModal(title, content, actions) {
  modal.innerHTML =
    `<div class="modal-title">${title}</div><div>${content}</div>
  <div class="modal-actions">${actions
    .map(
      (btn, idx) =>
        `<button class="modal-btn ${btn.class || ""}" type="button">${btn.label}</button>`
    )
    .join("")}</div>`;
  modalBackdrop.style.display = "block";
  modal.style.display = "block";
  modal.querySelectorAll(".modal-btn").forEach((btn, idx) => {
    btn.onclick = () => {
      modalBackdrop.style.display = "none";
      modal.style.display = "none";
      actions[idx].onClick();
    };
  });
}
modalBackdrop.onclick = () => {
  modalBackdrop.style.display = "none";
  modal.style.display = "none";
};
// Dropdown logic
document.body.addEventListener("click", () => {
  [notifDropdown, profileDropdown].forEach((d) => d.classList.remove("show"));
});
function toggleDropdown(dropdown) {
  const isVisible = dropdown.classList.contains("show");
  [notifDropdown, profileDropdown].forEach((d) => d.classList.remove("show"));
  if (!isVisible) dropdown.classList.add("show");
}
notificationBtn.onclick = (e) => {
  e.stopPropagation();
  toggleDropdown(notifDropdown);
  loadNotifications();
};
profileBtn.onclick = (e) => {
  e.stopPropagation();
  toggleDropdown(profileDropdown);
};
logoutBtn.onclick = (e) => {
  e.stopPropagation();
  showModal("🚪 Logout", "<p>Are you sure you want to logout?</p>", [
    { label: "Cancel", onClick: () => {} },
    {
      label: "Logout",
      onClick: () => {
        firebase.auth().signOut().then(() => {
          window.location.href = "index.html";  // ✅ redirect to login page
        }).catch((error) => {
          console.error("Logout failed:", error.message);
          showPopup("❌", "Logout failed, please try again.");
        });
      }
    }
  ]);
};
// ==========================
// 👤 Profile View
// ==========================
document.getElementById("profileViewBtn").onclick = (e) => {
  e.stopPropagation();
  profileDropdown.classList.remove("show");

  db.ref(`users/${USER_ID}`).once("value").then(snapshot => {
    const user = snapshot.val() || {};
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Not Set";
    const phone = user.phone || "Not Provided";
    const dob = user.dob || "Not Provided";
    const email = user.email || "Not Available";

    showModal("👤 My Profile", `
      <div style="text-align:center;margin-bottom:1rem;">
        <span style="font-size:3rem;">👤</span>
      </div>
      <div style="font-size:1rem;">
        <p><strong>Full Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Date of Birth:</strong> ${dob}</p>
        <p><strong>Email:</strong> ${email}</p>
      </div>
    `, [
      { label: "Close", onClick: () => {} }
    ]);
  });
};


// =============================
// 👤 PROFILE VIEW
// =============================
document.getElementById("profileViewBtn").onclick = (e) => {
  e.stopPropagation();
  profileDropdown.classList.remove("show");

  db.ref(`users/${USER_ID}`).once("value").then(snapshot => {
    const user = snapshot.val() || {};
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Not Set";
    const phone = user.phone || "Not Provided";
    const dob = user.dob || "Not Provided";
    const email = user.email || "Not Available";

    showModal("👤 My Profile", `
      <div style="text-align:center;margin-bottom:1rem;">
        <div style="font-size:3rem;">👤</div>
      </div>
      <div class="profile-info">
        <p><strong>Full Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Date of Birth:</strong> ${dob}</p>
        <p><strong>Email:</strong> ${email}</p>
      </div>
    `, [
      { label: "Close", onClick: () => {} }
    ]);
  });
};

// PROFILE EDIT

document.getElementById("profileEditBtn").onclick = (e) => {
  e.stopPropagation();
  profileDropdown.classList.remove("show");

  db.ref(`users/${USER_ID}`).once("value").then(snapshot => {
    const user = snapshot.val() || {};

    showModal("✏️ Edit Profile", `
      <form id="editProfileForm" class="edit-profile-modal">

        <label>First Name</label>
        <input type="text" id="editFirstName" value="${user.firstName || ""}" placeholder="Enter your first name" required />

        <label>Last Name</label>
        <input type="text" id="editLastName" value="${user.lastName || ""}" placeholder="Enter your last name"/>

        <label>Phone</label>
        <input type="tel" id="editPhone" maxlength="10" pattern="\\d{10}" value="${user.phone || ""}" placeholder="10-digit phone number" />

        <label>Date of Birth</label>
        <input type="date" id="editDob" value="${user.dob || ""}" />

        <label>Email</label>
        <input type="email" id="editEmail" value="${user.email || ""}" required />

        <button type="submit" class="save-btn">💾 Save Changes</button>
      </form>
    `, [
      { label: "Cancel", onClick: () => {} }
    ]);

    const form = document.getElementById("editProfileForm");

    form.onsubmit = (evt) => {
      evt.preventDefault();

      const updatedProfile = {
        firstName: document.getElementById("editFirstName").value.trim(),
        lastName: document.getElementById("editLastName").value.trim(),
        phone: document.getElementById("editPhone").value.trim(),
        dob: document.getElementById("editDob").value,
        email: document.getElementById("editEmail").value.trim()
      };

      db.ref(`users/${USER_ID}`).update(updatedProfile).then(() => {
        showPopup("✅", "Profile updated successfully!");
        updateWelcomeMsg();
      }).catch((err) => {
        console.error("Update error:", err);
        showPopup("❌", "Failed to update profile.");
      });
    };
  });
};
function loadNotifications() {
  notifDropdown.innerHTML = `<div style="text-align:center;padding:16px;">Loading...</div>`;
  db.ref("tickets").orderByChild("userId").equalTo(USER_ID).once("value").then((snapshot) => {
    let arr = [];
    snapshot.forEach((snap) => {
      const t = snap.val();
      arr.push(`<li>📄 Ticket <b>#${t.ticketId}</b>: <span style="color:#169383;">${t.status}</span> <small>${t.apptDate||""}</small></li>`);
    });
    notifDropdown.innerHTML = arr.length
      ? `<ul>${arr.reverse().join("")}</ul>`
      : `<div style="padding:16px;color:#888;text-align:center;">No notifications</div>`;
    notificationBadge.style.display = arr.length ? "flex" : "none";
    notificationBadge.textContent = arr.length;
  });
}
function activateTab(tab) {
  navBtns.forEach((btn) => btn.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
  if (btn) btn.classList.add("active");
}
function renderSection(tab) {
  activateTab(tab);
  contentArea.innerHTML = "";
  switch (tab) {
    case "home":
      return showHome();
    case "book":
      return showBook();
    case "tickets":
      return showMyTickets();
    case "swap":
      return showSwap();
    case "cancel":
      return showCancel();
    case "history":
      return showHistory();
    case "missed":
      return showMissedAppointments();
    case "faq":
      return showFaq();
    default:
      return showHome();
  }
}
navBtns.forEach((btn) => (btn.onclick = () => renderSection(btn.dataset.tab)));
/// ===== Home Section =====
function showHome() {
  contentArea.innerHTML = `
    <div class="dashboard-grid-main" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;">
      <div>
        <section class="section card-box"><h2 class="section-title">📅 Upcoming Appointments</h2><div id="upcomingAppointmentsList">Loading...</div></section>
        <section class="section card-box"><h2 class="section-title">📢 Announcements</h2><div id="announcementsSection"></div></section>
      </div>
      <div>
        <section class="section card-box"><h2 class="section-title">📊 Statistics</h2><div id="dashboardStatsList"></div></section>
        <section class="section card-box"><h2 class="section-title">🕒 Recent Activity</h2><div id="recentActivityList"></div></section>
      </div>
      <div>
        <section class="section card-box"><h2 class="section-title">💡 Tips</h2>
          <ul style="padding-left: 18px; margin-top: 0;">
            <li>⏰ Arrive early for appointments.</li>
            <li>🩺 Bring medical documents.</li>
            <li>📱 Use this dashboard to track bookings.</li>
            <li>❓ Visit FAQ for help.</li>
          </ul>
        </section>
      </div>
    </div>
  `;
  updateUpcomingAppointments();
  updateAnnouncements();
  updateDashboardStats();
  updateRecentActivity();
}
function updateUpcomingAppointments() {
  db.ref("tickets")
    .orderByChild("userId")
    .equalTo(USER_ID)
    .once("value")
    .then((snapshot) => {
      const today = new Date().toISOString().split("T")[0];
      let appointments = [];

      snapshot.forEach((childSnap) => {
        const t = childSnap.val();
        if (
          (t.status === "Booked" || t.status === "Open") &&
          t.apptDate && t.apptDate >= today
        ) {
          appointments.push(t);
        }
      });

      //  Sort based on ticketIdNum
      appointments.sort((a, b) => {
        return (parseInt(a.ticketIdNum || 9999)) - (parseInt(b.ticketIdNum || 9999));
      });

      const html = appointments.map((t) => `
        <div class="upcoming-item">
          <b>#${t.ticketId} | ${t.apptDate} ${t.apptTime}</b><br />
          Name: ${t.fullName} | Status: ${t.status} | Type: ${t.ticketType}
          ${t.symptoms ? `<br><small>Notes: ${t.symptoms}</small>` : ""}
        </div>
      `).join("");

      document.getElementById("upcomingAppointmentsList").innerHTML =
        html || "<p>No upcoming appointments.</p>";
    });
}
function updateAnnouncements() {
  document.getElementById("announcementsSection").innerHTML = `
    <div class="announcement-item">🔔 Please verify your mobile for contactless check-in.</div>
    <div class="announcement-item">⚙️ Maintenance every Sunday 3-5 AM.</div>
    <div class="announcement-item">🚨 Emergency appointments available online.</div>
  `;
}
function updateDashboardStats() {
  db.ref("tickets")
    .orderByChild("userId")
    .equalTo(USER_ID)
    .once("value")
    .then((snapshot) => {
      let stats = { total: 0, active: 0, completed: 0, upcoming: 0 };
      const today = new Date().toISOString().split("T")[0];
      snapshot.forEach((childSnap) => {
        const t = childSnap.val();
        stats.total++;
        if (t.status === "Booked" || t.status === "Open") stats.active++;
        if (t.status === "Completed") stats.completed++;
        if (t.apptDate && t.apptDate >= today) stats.upcoming++;
      });
      document.getElementById("dashboardStatsList").innerHTML =
        `<div class="dashboard-stat"><span>Total Tickets</span>
        <span class="stat-value">${stats.total}</span></div>
        <div class="dashboard-stat"><span>Active Tickets</span>
        <span class="stat-value">${stats.active}</span></div>
        <div class="dashboard-stat"><span>Completed</span>
        <span class="stat-value">${stats.completed}</span></div>
        <div class="dashboard-stat"><span>Upcoming</span>
        <span class="stat-value">${stats.upcoming}</span></div>`;
    });
}
function updateRecentActivity() {
  db.ref("tickets")
    .orderByChild("userId")
    .equalTo(USER_ID)
    .once("value")
    .then((snapshot) => {
      let activity = [];
      snapshot.forEach((childSnap) => {
        let t = childSnap.val();
        activity.push(t);
      });
      activity.sort((a, b) => {
        if (a.apptDate === b.apptDate) return a.apptTime.localeCompare(b.apptTime);
        return a.apptDate.localeCompare(b.apptDate);
      });
      let html = activity
        .map((t) =>
          `<div class="recent-item">📝 Ticket #${t.ticketId}: <span>${t.status||"booked"}</span> <small>(${t.apptDate||""} ${t.apptTime||""})</small></div>`
        )
        .reverse()
        .slice(0, 8)
        .join("");
      document.getElementById("recentActivityList").innerHTML =
        html || "<p>No recent activity.</p>";
    });
}
function showBook() {
  contentArea.innerHTML = `
    <section class="ticket-form-card">
      <h2>Take a Ticket</h2>
      <form id="takeTicketForm" novalidate autocomplete="off">
        <label>Full Name *</label>
        <input type="text" id="fullname" name="fullname" required />
        <label>Mobile Number *</label>
        <input type="text" id="mobile" name="mobile" maxlength="10" required />
        <label>Gender *</label>
        <select id="gender" name="gender" required>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <label>Age *</label>
        <input type="number" id="age" name="age" required />
        <label>Ticket Type *</label>
        <label><input type="radio" name="ticketType" value="normal" checked /> Normal</label>
        <label><input type="radio" name="ticketType" value="emergency" /> Emergency</label>
        <div id="emergencyMsg" style="display:none;color:red;margin-top:5px;">⚠️ Emergency ticket needs approval</div>
        <label>Appointment Date *</label>
        <input type="date" id="apptDate" name="apptDate" required min="${new Date().toISOString().split("T")[0]}" />
        <label>Appointment Time *</label>
        <input type="time" id="apptTime" name="apptTime" required />
        <label>Reason / Symptoms</label>
        <textarea id="symptoms" name="symptoms"></textarea>
        <label><input type="checkbox" required /> I agree to Terms</label>
        <button type="submit" class="primary-btn">Take Ticket</button>
      </form>
    </section>
  `;

  const form = document.getElementById("takeTicketForm");
  const emergencyMsg = document.getElementById("emergencyMsg");

  form.ticketType.forEach(radio => {
    radio.addEventListener("change", () => {
      emergencyMsg.style.display = radio.value === "emergency" ? "block" : "none";
    });
  });

 form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    // Generate a random 4-digit number
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const ticketIdStr = String(randomId);

    // Make sure this ticketId does not already exist
    const existing = await db.ref("tickets").orderByChild("ticketId").equalTo(ticketIdStr).once("value");

    if (existing.exists()) {
      // Recursively retry — or just show error
      showPopup("⚠️", "Ticket ID already in use. Please try again.");
      return;
    }

    const ticketKey = db.ref("tickets").push().key;

    const ticketData = {
      ticketId: ticketIdStr, // Random
      ticketIdNum: parseInt(ticketIdStr),
      userId: USER_ID,
      fullName: form.fullname.value.trim(),
      mobile: form.mobile.value.trim(),
      gender: form.gender.value,
      age: parseInt(form.age.value, 10),
      ticketType: form.ticketType.value,
      apptDate: form.apptDate.value,
      apptTime: form.apptTime.value,
      symptoms: form.symptoms.value.trim(),
      status: "Booked",
      createdAt: new Date().toISOString()
    };

    await db.ref("tickets/" + ticketKey).set(ticketData);

    form.reset();
    showPopup("✅", `Ticket booked! ID: #${ticketIdStr}`);
    renderSection("home");

  } catch (err) {
    console.error("❌ Booking error:", err);
    showPopup("❌", "Booking failed, please try again.");
  }
});
}
function showMyTickets() {
  contentArea.innerHTML = `
    <section class="section" aria-label="My Tickets">
      <h2 class="section-title">📑 My Tickets</h2>
      <div id="ticketsList">Loading your tickets...</div>
    </section>
  `;

  const ticketsListEl = document.getElementById("ticketsList");

  db.ref("tickets")
    .orderByChild("userId")
    .equalTo(USER_ID)
    .once("value")
    .then(snapshot => {
      const tickets = [];
      snapshot.forEach(childSnap => {
        const t = childSnap.val();
        tickets.push(t);
      });

      if (tickets.length === 0) {
        ticketsListEl.innerHTML = "<p>You have not booked any tickets yet.</p>";
        return;
      }

      // Sort: Newest on top
      tickets.sort((a, b) => {
        const aDate = `${a.apptDate || "3000-01-01"} ${a.apptTime || "23:59"}`;
        const bDate = `${b.apptDate || "3000-01-01"} ${b.apptTime || "23:59"}`;
        return bDate.localeCompare(aDate);
      });

      // Display
      const html = tickets.map(t => `
        <div class="ticket-card" style="background:#f3fdfb; margin-bottom:16px; padding:14px 18px; border-radius:8px;">
          <b>${t.apptDate || "N/A"} ${t.apptTime || ""}</b>
          | Type: ${t.ticketType || "-"}
          | ID: #${t.ticketId || "--"}
          <br>
          ${t.fullName || "N/A"} (${t.mobile || "-"}), ${t.gender || "-"}, ${t.age || "-"} yrs
          <br>
          ${t.symptoms || ""}
          <br>
          <small>Status: <strong>${t.status}</strong></small>
        </div>
      `).join("");

      ticketsListEl.innerHTML = html;
    })
    .catch(err => {
      console.error("Error loading user tickets:", err);
      ticketsListEl.innerHTML = "<p>Could not load your tickets. Please try again later.</p>";
    });
}
// Swap Dashboard Main View
function showSwap() {
  contentArea.innerHTML = `
    <section class="section">
      <h2 class="section-title">🔁 Swap Ticket</h2>
      <p>Request swaps, respond to offers, and view notifications</p>
      
      <h3>Your Open Tickets</h3>
      <div id="openTicketsList">Loading open tickets...</div>

      <h3 style="margin-top:32px;">Incoming Swap Requests</h3>
      <div id="incomingRequests">Checking for incoming requests...</div>

      <h3 style="margin-top:32px;">Swap Notifications</h3>
      <div id="swapNotifications">Loading swap notifications...</div>
    </section>
  `;

  showOpenTicketsForSwap();
  showIncomingSwapRequests();
  showSwapNotifications();
}

// Show Open Tickets
function showOpenTicketsForSwap() {
  const el = document.getElementById("openTicketsList");
  db.ref("tickets").orderByChild("userId").equalTo(USER_ID).once("value").then(snapshot => {
    const html = [];
    snapshot.forEach(child => {
      const t = child.val();
      if (t.status === "Open" || t.status === "Booked") {
        html.push(`
          <div class="ticket-card" style="background:#f9f9f9;padding:14px;margin-bottom:8px;border-radius:6px;border:1px solid #ccc;">
            <b>Ticket ID:</b> ${t.ticketId}<br>
            <b>Appointment:</b> ${t.apptDate || "N/A"} at ${t.apptTime || "N/A"}<br>
            <b>Status:</b> ${t.status}<br>
            <button class="requestSwapBtn" data-id="${child.key}" style="margin-top:8px;">Request Swap</button>
          </div>
        `);
      }
    });

    el.innerHTML = html.length ? html.join("") : "<p>No open tickets available for swapping.</p>";

    document.querySelectorAll(".requestSwapBtn").forEach(btn => {
      btn.onclick = () => {
        const fromTicketId = btn.getAttribute("data-id");
        findSwapOptions(fromTicketId);
      };
    });
  });
}
// Find tickets from other users to swap with
function findSwapOptions(fromTicketId) {
  db.ref("tickets").once("value").then(snapshot => {
    const options = [];
    snapshot.forEach(child => {
      const t = child.val();
      if (
        t.userId !== USER_ID &&
        (t.status === "Open" || t.status === "Booked")
      ) {
        options.push({
          id: child.key,
          ticket: t
        });
      }
    });

    if (options.length === 0) {
      showPopup("ℹ️", "No swap options found at this time.");
      return;
    }

    // Generate scrollable content
    const content = `
      <div style="max-height: 60vh; overflow-y: auto; padding-right: 8px;">
        ${options.map(opt => `
          <div class="ticket-card" style="border:1px solid #ddd;border-radius:6px;padding:10px;margin-bottom:10px;">
            <b>Ticket ID:</b> ${opt.ticket.ticketId}<br>
            <b>Appointment:</b> ${opt.ticket.apptDate} at ${opt.ticket.apptTime}<br>
            <b>Name:</b> ${opt.ticket.fullName || "Another User"}<br>
            <button class="confirmSwapBtn" 
              data-from="${fromTicketId}" 
              data-to="${opt.id}" 
              style="margin-top:6px;">Swap with this</button>
          </div>
        `).join("")}
      </div>
    `;

    showModal("🔁 Select a Ticket to Swap With", content, [
      { label: "Close", onClick: () => {} }
    ]);

    setTimeout(() => {
      document.querySelectorAll(".confirmSwapBtn").forEach(btn => {
        btn.onclick = () => {
          const fromId = btn.dataset.from;
          const toId = btn.dataset.to;

          const request = {
            fromUserId: USER_ID,
            fromTicketId: fromId,
            toUserId: null, // To be filled in next step
            toTicketId: toId,
            status: "Pending"
          };

          db.ref("tickets/" + toId).once("value").then(snap => {
            if (!snap.exists()) return;

            request.toUserId = snap.val().userId;

            const requestId = db.ref("swapRequests").push().key;
            db.ref("swapRequests/" + requestId).set(request).then(() => {
              showPopup("✅", "Swap request sent.");
            });
          });
        };
      });
    }, 200);
  });
}
// Show Incoming Swap Requests
function showIncomingSwapRequests() {
  const el = document.getElementById("incomingRequests");
  db.ref("swapRequests").orderByChild("toUserId").equalTo(USER_ID).once("value").then(snapshot => {
    const incoming = [];
    const requests = [];

    snapshot.forEach(snap => {
      const r = snap.val();
      if (r.status === "pending") {
        requests.push({ id: snap.key, ...r });
      }
    });

    if (requests.length === 0) {
      el.innerHTML = "<p>No incoming swap requests.</p>";
      return;
    }

    // Now fetch user names and ticketIds in parallel
    const userPromises = requests.map(r => db.ref(`users/${r.fromUserId}`).once("value"));
    const ticketPromises = requests.map(r => db.ref(`tickets/${r.fromTicketId}`).once("value"));

    Promise.all([...userPromises, ...ticketPromises]).then(results => {
      const total = requests.length;
      const users = results.slice(0, total).map(s => s.val());
      const tickets = results.slice(total).map(s => s.val());

      let html = "";

      for (let i = 0; i < total; i++) {
        const r = requests[i];
        const user = users[i] || {};
        const ticket = tickets[i] || {};
        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";
        const ticketId = ticket.ticketId || r.fromTicketId;

        html += `
          <div class="ticket-card" style="margin-bottom:1rem;">
            <b>From User:</b> ${name}<br>
            <b>Ticket:</b> #${ticketId}<br>
            <button class="acceptSwapBtn" data-id="${r.id}">Accept</button>
            <button class="declineSwapBtn" data-id="${r.id}">Decline</button>
          </div>
        `;
      }

      el.innerHTML = html;

      document.querySelectorAll(".acceptSwapBtn").forEach(btn => {
        btn.onclick = () => handleSwapDecision(btn.getAttribute("data-id"), true);
      });

      document.querySelectorAll(".declineSwapBtn").forEach(btn => {
        btn.onclick = () => handleSwapDecision(btn.getAttribute("data-id"), false);
      });
    });
  });
}
// Accept/Decline Swap
function handleSwapDecision(requestId, accept) {
  db.ref("swapRequests/" + requestId).once("value").then(async (snap) => {
    if (!snap.exists()) return;

    const req = snap.val();

    if (accept) {
      // Swap times between tickets
      const fromRef = db.ref("tickets/" + req.fromTicketId);
      const toRef = db.ref("tickets/" + req.toTicketId);

      const [fromSnap, toSnap] = await Promise.all([fromRef.get(), toRef.get()]);

      const fromTicket = fromSnap.val();
      const toTicket = toSnap.val();

      // Swap apptDate and apptTime between tickets
      await fromRef.update({
        apptDate: toTicket.apptDate,
        apptTime: toTicket.apptTime
      });

      await toRef.update({
        apptDate: fromTicket.apptDate,
        apptTime: fromTicket.apptTime
      });

      // Mark as accepted
      await db.ref("swapRequests/" + requestId).update({
        status: "Accepted"
      });

      // Notification for both users (optional)
      showPopup("✅", "Swap completed successfully");
    } else {
      await db.ref("swapRequests/" + requestId).update({
        status: "Declined"
      });
      showPopup("❌", "Swap declined");
    }

    showSwap(); // Refresh
  });
}

// Show Swap Notifications
function showSwapNotifications() {
  const el = document.getElementById("swapNotifications");

  db.ref("swapRequests").once("value").then(async snapshot => {
    const swapNotes = [];

    const allRequests = [];
    snapshot.forEach(snap => {
      const n = snap.val();
      n.id = snap.key;
      if (
        n.status === "Accepted" &&
        (n.fromUserId === USER_ID || n.toUserId === USER_ID)
      ) {
        allRequests.push(n);
      }
    });

    if (allRequests.length === 0) {
      el.innerHTML = "<p>No swap notifications yet.</p>";
      return;
    }

    // Fetch both tickets for each request
    const fromTicketPromises = allRequests.map(r => db.ref(`tickets/${r.fromTicketId}`).once("value"));
    const toTicketPromises = allRequests.map(r => db.ref(`tickets/${r.toTicketId}`).once("value"));

    const results = await Promise.all([...fromTicketPromises, ...toTicketPromises]);
    const middle = allRequests.length;
    const fromTickets = results.slice(0, middle).map(s => s.val());
    const toTickets = results.slice(middle).map(s => s.val());

    for (let i = 0; i < allRequests.length; i++) {
      const r = allRequests[i];
      const fromTicket = fromTickets[i];
      const toTicket = toTickets[i];
      const fromTicketId = fromTicket?.ticketId || r.fromTicketId;
      const toTicketId = toTicket?.ticketId || r.toTicketId;

      swapNotes.push(`
        <div class="notif-card">
          Swap Accepted: Your ticket <b>#${fromTicketId}</b> was swapped with ticket <b>#${toTicketId}</b>.
        </div>
      `);
    }

    el.innerHTML = swapNotes.join("");
  });
}
function showCancel() {
  contentArea.innerHTML = `
    <section class="section" aria-label="Cancel Ticket">
      <h2 class="section-title">❌ Cancel Ticket</h2>
      <table class="styled-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Appointment Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="cancelTableBody">
          <tr><td colspan="4" style="text-align:center;">Loading...</td></tr>
        </tbody>
      </table>
    </section>
  `;

  const tbody = document.getElementById("cancelTableBody");

  db.ref("tickets").orderByChild("userId").equalTo(USER_ID).once("value").then(snapshot => {
    const rows = [];
    snapshot.forEach(child => {
      const t = child.val();
      if (t.status === "Open" || t.status === "Booked") {
        rows.push(`
          <tr>
            <td>${t.fullName || "N/A"}</td>
            <td>${t.apptDate || "-"}</td>
            <td>${t.status}</td>
            <td><button class="cancel-btn" data-id="${child.key}">Cancel</button></td>
          </tr>
        `);
      }
    });

    tbody.innerHTML = rows.length ? rows.join("") : `<tr><td colspan="4" style="text-align:center;">No active tickets to cancel.</td></tr>`;

    // Add event listeners
    document.querySelectorAll(".cancel-btn").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        db.ref("tickets/" + id).update({ status: "Cancelled" }).then(() => {
          showPopup("✅", "Ticket cancelled.");
          showCancel(); // Refresh list
        }).catch(() => {
          showPopup("❌", "Cancellation failed.");
        });
      };
    });
  });
}
function showHistory() {
  contentArea.innerHTML = `
    <section class="section" aria-label="Appointment History">
      <h2 class="section-title">📜 History</h2>
      <p>View your full ticket history (Open, Completed, Cancelled)</p>
      <table class="styled-table">
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Appointment Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Type</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="historyTableBody">
          <tr><td colspan="6" style="text-align:center;">Loading...</td></tr>
        </tbody>
      </table>
    </section>
  `;

  const tbody = document.getElementById("historyTableBody");

  db.ref("tickets").orderByChild("userId").equalTo(USER_ID).once("value").then(snapshot => {
    const rows = [];
    snapshot.forEach(child => {
      const t = child.val();
      rows.push(`
        <tr>
          <td><b>${t.ticketId}</b></td>
          <td>${t.apptDate || "-"}</td>
          <td>${t.apptTime || "-"}</td>
          <td>${t.status}</td>
          <td>${t.ticketType || "-"}</td>
          <td><button class="details-btn" data-id="${child.key}">View Details</button></td>
        </tr>
      `);
    });

    tbody.innerHTML = rows.length ? rows.join("") : `<tr><td colspan="6" style="text-align:center;">No ticket history found.</td></tr>`;

    document.querySelectorAll(".details-btn").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        db.ref("tickets/" + id).once("value").then(snap => {
          const d = snap.val();
          showModal("📄 Ticket Details", `
            <b>ID:</b> ${d.ticketId}<br>
            <b>Name:</b> ${d.fullName}<br>
            <b>Status:</b> ${d.status}<br>
            <b>Type:</b> ${d.ticketType}<br>
            <b>Date & Time:</b> ${d.apptDate} ${d.apptTime}<br>
            <b>Symptoms:</b> ${d.symptoms || "-"}
          `, [{ label: "Close" }]);
        });
      };
    });
  });
}
function showMissedAppointments() {
  contentArea.innerHTML = `
    <section class="section" aria-label="Missed Appointments">
      <h2 class="section-title">⏰ Missed Appointments</h2>
      <p>Below are your appointments that were missed (date has passed & not completed).</p>
      <div id="missedAppointmentsList">Loading...</div>
    </section>
  `;

  const listEL = document.getElementById("missedAppointmentsList");
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date();

  db.ref("tickets").orderByChild("userId").equalTo(USER_ID).once("value").then(snapshot => {
    const missed = [];
    snapshot.forEach(child => {
      const t = child.val();
      const fullDate = `${t.apptDate}T${t.apptTime}`;
      const apptDateTime = new Date(fullDate);

      if (
        (t.status === "Booked" || t.status === "Open") &&
        t.apptDate &&
        apptDateTime < nowTime
      ) {
        missed.push(t);
      }
    });

    if (!missed.length) {
      listEL.innerHTML = '<p>No missed appointments found. 🎉</p>';
      return;
    }

    // Sort by most recent first
    missed.sort((a, b) => new Date(`${b.apptDate}T${b.apptTime}`) - new Date(`${a.apptDate}T${a.apptTime}`));

    const html = missed.map(t => `
      <div class="ticket-card" style="background:#fff8f8;padding:14px;margin-bottom:12px;border-left:4px solid red;border-radius:6px;">
        <b>#${t.ticketId}</b> | ${t.apptDate} at ${t.apptTime}<br>
        Name: ${t.fullName || "N/A"} |
        Status: ${t.status} |
        Type: ${t.ticketType}<br>
        ${t.symptoms ? `<small>Notes: ${t.symptoms}</small>` : ""}
      </div>
    `).join("");

    listEL.innerHTML = html;
  }).catch(err => {
    console.error("Error loading missed appointments:", err);
    listEL.innerHTML = `<p>Error loading missed appointments. Please try again.</p>`;
  });
}
function showFaq() {
  contentArea.innerHTML = `
    <section class="section" aria-label="Help & FAQ">
      <h2 class="section-title">❓ Help & FAQ</h2>
      <div id="faqList" tabindex="0" role="region" aria-live="polite"></div>
    </section>
  `;
  const faqs = [
    { q: "How do I book an appointment?", a: "Go to the 'Book Appointment' tab, choose a date/time, then submit your booking." },
    { q: "Can I cancel my appointment?", a: "Yes, use the 'Cancel Appointment' tab and ticket ID." },
    { q: "How do I swap my appointment?", a: "Use the 'Swap Appointment' tab to select your current ticket and desired date/time." },
    { q: "Where can I see my tickets?", a: "The 'My Tickets' tab shows all your current appointments." },
    { q: "Who can I contact for support?", a: "Contact support@waitwizard.com for help." }
  ];
  let html = "";
  faqs.forEach((faq) => {
    html += `<div class="faq-item"><strong>Q:</strong> ${faq.q}<br/><strong>A:</strong> ${faq.a}</div><hr>`;
  });
  document.getElementById("faqList").innerHTML = html;
}
renderSection("home");
