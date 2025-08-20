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

const loginForm = document.getElementById('loginForm');
const email = document.getElementById('email');
const password = document.getElementById('password');

loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!email.value.trim() || !password.value) {
    alert('Please enter both email and password.');
    return;
  }

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email.value.trim(), password.value);
    const user = userCredential.user;
    console.log("Signed in:", user.email, "UID:", user.uid);

    const docRef = db.collection("users").doc(user.uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      alert("No Firestore record found for this account.");
      await auth.signOut();
      return;
    }

    const role = (docSnap.data().role || "").toLowerCase().trim();
    console.log("Fetched role from Firestore:", role);

    if (role === "admin") {
      window.location.href = "admin.html";
    } else if (role === "doctor") {
      window.location.href = "doctor.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (error) {
    console.error("Login error:", error.message);
    alert("Sign in failed: " + error.message);
    password.value = '';
  }

  submitBtn.disabled = false;
  submitBtn.textContent = originalBtnText;
});

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('registered') === 'true') {
    alert("Account created successfully! Please sign in.");
    history.replaceState(null, '', window.location.pathname);
  }
});
