// Using centralized Firebase config from firebase-config.js

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
