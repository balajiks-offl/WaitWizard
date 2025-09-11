// swap-ticket.js

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

function showPopup(message) {
  const popup = document.createElement("div");
  popup.innerText = message;
  popup.style.position = "fixed";
  popup.style.bottom = "20px";
  popup.style.right = "20px";
  popup.style.padding = "15px";
  popup.style.backgroundColor = "#4CAF50";
  popup.style.color = "white";
  popup.style.borderRadius = "6px";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
  popup.style.zIndex = "10000";
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 3500);
}

async function addNotification(message, userId = null, type = "general") {
  try {
    await db.collection("notifications").add({
      message,
      userId,
      type,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Add notification failed:", error);
  }
}

async function swapTicket(oldTicketId, newTicketData) {
  try {
    // Custom logic to swap tickets
    // Example: mark old ticket as swapped/canceled
    await db.collection("tickets").doc(oldTicketId).update({ status: "Swapped" });

    // Add new ticket data
    await db.collection("tickets").add(newTicketData);

    showPopup("Ticket swapped successfully!");
    await addNotification(
      `Ticket swapped by user.`,
      auth.currentUser ? auth.currentUser.uid : null,
      "swap"
    );

  } catch (err) {
    alert("Error swapping ticket: " + err.message);
  }
}
