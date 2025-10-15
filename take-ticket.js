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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

const ticketForm = document.getElementById('takeTicketForm');
const emergencyMsg = document.getElementById('emergencyMsg');
const successModal = document.getElementById('successModal');

// Add notification ALWAYS with user name!
async function addNotificationBooking(fullName, userId, appointmentDate, appointmentTime) {
  await db.collection("notifications").add({
    type: "booking",
    userId: userId,
    userName: fullName,
    bookingTime: `${appointmentDate} at ${appointmentTime}`,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

document.getElementsByName('ticketType').forEach(el => {
  el.addEventListener('change', function() {
    emergencyMsg.style.display = (this.value === 'emergency') ? 'block' : 'none';
  });
});

ticketForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  const fullName = ticketForm.fullname.value.trim();
  const mobile = ticketForm.mobile.value.trim();
  const gender = ticketForm.gender.value;
  const age = ticketForm.age.value;
  const ticketType = ticketForm.ticketType.value;
  const appointmentDate = ticketForm.apptDate.value;
  const appointmentTime = ticketForm.apptTime.value;
  const symptoms = ticketForm.symptoms.value.trim();
  const termsAccepted = ticketForm.terms.checked;
  if (!fullName || !mobile || !gender || !age || !ticketType || !appointmentDate || !appointmentTime || !termsAccepted) {
    alert('Please fill all required fields and agree to Terms.');
    return;
  }
  try {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be signed in to take a ticket.');
      return;
    }
    const ticketData = {
      userId: user.uid,
      fullName,
      mobile,
      gender,
      age,
      ticketType,
      appointmentDate,
      appointmentTime,
      symptoms,
      status: ticketType === 'emergency' ? 'Pending' : 'Open',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("tickets").add(ticketData);

    // Always store userName in the notification
    await addNotificationBooking(
      fullName, user.uid, appointmentDate, appointmentTime
    );

    // Only this—no green popups, just your own modal
    showSuccessModal();

  } catch (err) {
    alert("Error booking ticket: " + err.message);
  }
});

window.showSuccessModal = function() {
  successModal.classList.add('active');
};
window.closeSuccessModal = function() {
  successModal.classList.remove('active');
  ticketForm.reset();
};
