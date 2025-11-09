// Using centralized Firebase config from firebase-config.js

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
    db.ref(`users/${user.uid}`).once('value').then(snapshot => {
      const userData = snapshot.val();
      const role = (userData?.role || "").toLowerCase();
      if (role === "admin") {
        window.location.href = "admin.html";
      } else if (role === "doctor") {
        window.location.href = "doctor.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }).catch(() => {
      window.location.href = "dashboard.html";
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

    // Get role from Realtime Database
    const userSnapshot = await db.ref(`users/${user.uid}`).once('value');
    const userData = userSnapshot.val();

    if (!userData) {
      await auth.signOut();
      alert("No user record found.");
      return;
    }

    const role = (userData.role || "").toLowerCase().trim();

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