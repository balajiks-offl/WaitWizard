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

document.addEventListener('DOMContentLoaded', () => {
  
  const profileIcon = document.getElementById('profileIcon');
  const profilePanel = document.getElementById('profilePanel');
  const closeProfile = document.getElementById('closeProfile');
  const profileContent = document.getElementById('profileContent');
  let currentProfile = {};
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
      try {
        const docSnap = await db.collection("users").doc(user.uid).get();
        if (docSnap.exists) {
          const d = docSnap.data();
          const displayName = (d.firstName || d.lastName)
            ? `${d.firstName || ''} ${d.lastName || ''}`.trim()
            : user.email.split('@')[0];
          document.getElementById('username').textContent = displayName;
        } else {
          document.getElementById('username').textContent = user.email.split('@')[0];
        }
      } catch {
        document.getElementById('username').textContent = user.email.split('@')[0];
      }
    } else {
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
