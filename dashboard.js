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

let currentUser = null;
let notificationListener = null;

document.addEventListener('DOMContentLoaded', () => {
  
  const profileIcon = document.getElementById('profileIcon');
  const profilePanel = document.getElementById('profilePanel');
  const closeProfile = document.getElementById('closeProfile');
  const profileContent = document.getElementById('profileContent');
  
  // Notification elements
  const notificationBell = document.getElementById('notificationBell');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const notificationBadge = document.getElementById('notificationBadge');
  const notificationList = document.getElementById('notificationList');
  const clearAllNotifications = document.getElementById('clearAllNotifications');
  
  let currentProfile = {};
  
  // Notification functionality
  function loadNotifications() {
    if (!currentUser || notificationListener) return;
    
    notificationListener = db.collection("notifications")
      .where("userId", "==", currentUser.uid)
      .orderBy("timestamp", "desc")
      .limit(20)
      .onSnapshot(snapshot => {
        const notifications = [];
        snapshot.forEach(doc => {
          notifications.push({ id: doc.id, ...doc.data() });
        });
        
        renderNotifications(notifications);
        updateNotificationBadge(notifications);
      });
  }
  
  function renderNotifications(notifications) {
    if (notifications.length === 0) {
      notificationList.innerHTML = '<div class="no-notifications">No new notifications</div>';
      return;
    }
    
    const notificationHTML = notifications.map(notification => {
      const isUnread = !notification.read;
      const timeAgo = getTimeAgo(notification.timestamp);
      
      return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="markAsRead('${notification.id}')">
          <div class="notification-message">${notification.message || getNotificationMessage(notification)}</div>
          <div class="notification-time">${timeAgo}</div>
        </div>
      `;
    }).join('');
    
    notificationList.innerHTML = notificationHTML;
  }
  
  function getNotificationMessage(notification) {
    switch(notification.type) {
      case 'booking':
        return `New appointment booked for ${notification.bookingTime}`;
      case 'cancellation':
        return `Appointment cancelled for ${notification.bookingTime}`;
      case 'swap':
        return `Ticket swap completed`;
      case 'queue_update':
        return `Your queue position has been updated`;
      case 'doctor_emergency':
        return `Doctor emergency - your appointment may be delayed`;
      default:
        return notification.message || 'New notification';
    }
  }
  
  function getTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
  
  function updateNotificationBadge(notifications) {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
      notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      notificationBadge.style.display = 'flex';
    } else {
      notificationBadge.style.display = 'none';
    }
  }
  
  window.markAsRead = async function(notificationId) {
    try {
      await db.collection("notifications").doc(notificationId).update({
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  // Toggle notification dropdown
  notificationBell.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = notificationDropdown.style.display === 'block';
    notificationDropdown.style.display = isVisible ? 'none' : 'block';
  });
  
  // Clear all notifications
  clearAllNotifications.addEventListener('click', async () => {
    if (!currentUser) return;
    
    if (confirm('Are you sure you want to clear all notifications?')) {
      try {
        const snapshot = await db.collection("notifications")
          .where("userId", "==", currentUser.uid)
          .get();
        
        const batch = db.batch();
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        notificationDropdown.style.display = 'none';
      } catch (error) {
        console.error("Error clearing notifications:", error);
        alert("Error clearing notifications. Please try again.");
      }
    }
  });
  
  // Close notification dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!notificationBell.contains(e.target)) {
      notificationDropdown.style.display = 'none';
    }
  });
  
  function renderProfileView(data) {
    let dob = data.dob;
    let dobFormatted = '';
    if(dob && dob.toDate) dobFormatted = dob.toDate().toISOString().split("T")[0];
    else if(dob) dobFormatted = dob;
    else dobFormatted = "Not provided";
    profileContent.innerHTML = `
      <div class="profile-detail">
        <span class="detail-label">First Name:</span>
        <div class="profile-value">${data.firstName || '-'}</div>
      </div>
      <div class="profile-detail">
        <span class="detail-label">Last Name:</span>
        <div class="profile-value">${data.lastName || '-'}</div>
      </div>
      <div class="profile-detail">
        <span class="detail-label">Phone:</span>
        <div class="profile-value">${data.phone || '-'}</div>
      </div>
      <div class="profile-detail">
        <span class="detail-label">Date of Birth:</span>
        <div class="profile-value">${dobFormatted}</div>
      </div>
      <button id="editProfileBtn">Edit</button>
      <div id="profileSaveMsg"></div>
    `;
    document.getElementById('editProfileBtn').onclick = renderProfileEdit;
  }
  function renderProfileEdit() {
    let data = currentProfile;
    let dob = data.dob;
    let dobFormatted = '';
    if(dob && dob.toDate) dobFormatted = dob.toDate().toISOString().split("T")[0];
    else if(dob) dobFormatted = dob;
    else dobFormatted = "";
    profileContent.innerHTML = `
      <form id="profileEditForm">
        <div class="profile-detail">
          <span class="detail-label">First Name:</span>
          <input class="profile-input-edit" type="text" name="firstName" value="${data.firstName||''}" required />
        </div>
        <div class="profile-detail">
          <span class="detail-label">Last Name:</span>
          <input class="profile-input-edit" type="text" name="lastName" value="${data.lastName||''}" required />
        </div>
        <div class="profile-detail">
          <span class="detail-label">Phone:</span>
          <input class="profile-input-edit" type="tel" name="phone" value="${data.phone||''}" required pattern="\\d{10}" maxlength="10"/>
        </div>
        <div class="profile-detail">
          <span class="detail-label">Date of Birth:</span>
          <input class="profile-input-edit" type="date" name="dob" value="${dobFormatted}" required />
        </div>
        <button type="submit" id="saveProfileBtn">Save</button>
        <div id="profileSaveMsg"></div>
      </form>
    `;
    document.getElementById('profileEditForm').onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const updatedData = {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        phone: form.phone.value.trim(),
        dob: form.dob.value
      };
      const msg = document.getElementById('profileSaveMsg');
      try {
        const user = firebase.auth().currentUser;
        if(!user) throw new Error('Not logged in');
        await firebase.firestore().collection("users").doc(user.uid).update(updatedData);
        msg.style.color = "#1bc98e";
        msg.textContent = "Profile updated successfully!";
        setTimeout(() => fetchAndShowProfile(), 850);
      } catch (err) {
        msg.style.color = "#e74c3c";
        msg.textContent = "Error updating profile.";
      }
    };
  }
  async function fetchAndShowProfile() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const docSnap = await firebase.firestore().collection("users").doc(user.uid).get();
      if (docSnap.exists) {
        currentProfile = docSnap.data();
        renderProfileView(currentProfile);
      } else {
        profileContent.innerHTML = "<div>No profile data found.</div>";
      }
    } catch {
      profileContent.innerHTML = "<div>Error loading profile.</div>";
    }
  }
  profileIcon.addEventListener('click', () => {
    profilePanel.classList.add('open');
    profilePanel.setAttribute('aria-hidden', 'false');
    fetchAndShowProfile();
  });
  closeProfile.addEventListener('click', () => {
    profilePanel.classList.remove('open');
    profilePanel.setAttribute('aria-hidden', 'true');
  });

  const logoutIcon = document.getElementById('logoutIcon');
  const overlay = document.getElementById('logoutDialogOverlay');
  const okBtn = document.getElementById('logoutOk');
  const cancelBtn = document.getElementById('logoutCancel');
  logoutIcon.addEventListener('click', () => { overlay.style.display = 'flex'; });
  cancelBtn && cancelBtn.addEventListener('click', () => { overlay.style.display = 'none'; });
  okBtn && okBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
    auth.signOut().then(() => { window.location.href = "index.html"; });
  });
  window.addEventListener('keydown', (e) => {
    if (overlay.style.display === 'flex' && e.key === 'Escape') { overlay.style.display = 'none'; }
  });

  auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    loadNotifications();
    
    try {
      const docSnap = await db.collection("users").doc(user.uid).get();
      if (docSnap.exists) {
        const d = docSnap.data();
        // Show lastName first, then firstName, no fallback to email prefix
        const displayName = `${d.firstname} ${d.lastname}`.trim();
        document.getElementById('username').textContent = displayName;
      } else {
        // No profile found - you can choose what to do here, e.g., clear username
        document.getElementById('username').textContent = '';
      }
    } catch {
      document.getElementById('username').textContent = '';
    }
  } else {
    currentUser = null;
    if (notificationListener) {
      notificationListener();
      notificationListener = null;
    }
    window.location.href = "index.html";
  }
});

  const dashboardMain = document.getElementById('dashboardMain');
  document.querySelectorAll('.card[data-link]').forEach(card => {
    card.addEventListener('click', () => {
      dashboardMain.style.opacity = '0';
      setTimeout(() => { window.location.href = card.getAttribute('data-link'); }, 550);
    });
    card.addEventListener('keydown', e => {
      if (e.key === "Enter" || e.key === " ") {
        dashboardMain.style.opacity = '0';
        setTimeout(() => { window.location.href = card.getAttribute('data-link'); }, 550);
      }
    });
  });
});
