// ✅ login.js ✅
const firebaseConfig = {
  apiKey: "AIzaSyCsy799iekDizixCe0LEGJWC-msj6MsvIs",
  authDomain: "digitalqueuesystem.firebaseapp.com",
  databaseURL: "https://digitalqueuesystem-default-rtdb.firebaseio.com",
  projectId: "digitalqueuesystem",
  storageBucket: "digitalqueuesystem.appspot.com",
  messagingSenderId: "934641075368",
  appId: "1:934641075368:web:fa23d50116ef2fd92e6e9d",
  measurementId: "G-TJESH8R15H",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const submitBtn = loginForm.querySelector('button[type="submit"]');
const btnText = document.getElementById('login-btn-text');
const btnSpinner = document.getElementById('login-btn-spinner');
const togglePwd = document.getElementById("togglePwd");

// Toggle password visibility
togglePwd.addEventListener("click", () => {
  password.type = password.type === "password" ? "text" : "password";
  togglePwd.textContent = password.type === "password" ? "🔒" : "🔍";
});

// Redirect to dashboard if already logged in
auth.onAuthStateChanged((user) => {
  if (user && user.emailVerified !== false) {
    // Check role and redirect
    db.collection("users").doc(user.uid).get().then(docSnap => {
      const role = (docSnap.data()?.role || "").toLowerCase();
      if (role === "admin") {
        window.location.href = "admin.html";
      } else if (role === "doctor") {
        window.location.href = "doctor.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }).catch(() => {
      window.location.href = "dashboard.html"; // fallback
    });
  }
});

// Handle login form submit
loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!email.value.trim() || !password.value) {
    alert("Please enter both email and password.");
    return;
  }

  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnSpinner.style.display = "inline-block";

  try {
    const userCredential = await auth.signInWithEmailAndPassword(
      email.value.trim(),
      password.value
    );
    const user = userCredential.user;
    console.log("Logged in:", user.email);

    // Get role from Firestore
    const docRef = db.collection("users").doc(user.uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      await auth.signOut();
      alert("No Firestore user record found.");
      return;
    }

    const role = (docSnap.data().role || "").toLowerCase().trim();

    if (role === "admin") {
      window.location.href = "admin.html";
    } else if (role === "doctor") {
      window.location.href = "doctor.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (error) {
    console.error("Login error:", error.message);
    alert("Sign-in failed: " + error.message);
    password.value = "";
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnSpinner.style.display = "none";
  }
});