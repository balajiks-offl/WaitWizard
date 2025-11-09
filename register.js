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
const db = firebase.database();

const form = document.getElementById("registerForm");
const emailInput = document.getElementById("emailInput");
const emailError = document.getElementById("emailError");
const phoneInput = document.getElementById("phoneInput");
const altphoneInput = document.getElementById("altphoneInput");
const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const confirmPasswordError = document.getElementById("confirmPasswordError");

function setupDigitOnlyInput(input) {
  input.addEventListener("input", () => {
    let cleaned = input.value.replace(/\D/g, "");
    input.value = cleaned.slice(0, 10);
  });
}

setupDigitOnlyInput(phoneInput);
if (altphoneInput) setupDigitOnlyInput(altphoneInput);

emailInput.addEventListener("input", () => {
  const value = emailInput.value;
  if (value.includes("@") && value.includes(".")) {
    emailError.style.display = "none";
    emailInput.setCustomValidity("");
  } else {
    emailError.style.display = "block";
    emailInput.setCustomValidity("Invalid email address");
  }
});

function shakeField(field) {
  field.classList.add("shake");
  setTimeout(() => {
    field.classList.remove("shake");
  }, 400);
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  emailInput.dispatchEvent(new Event("input"));

  const phoneRegex = /^\d{10}$/;
  let valid = true;

  if (!phoneRegex.test(phoneInput.value)) {
    phoneInput.setCustomValidity("Please enter a valid 10-digit phone number.");
    shakeField(phoneInput);
    valid = false;
  } else {
    phoneInput.setCustomValidity("");
  }

  if (altphoneInput.value && !phoneRegex.test(altphoneInput.value)) {
    altphoneInput.setCustomValidity("Please enter a valid 10-digit alternate phone number.");
    shakeField(altphoneInput);
    valid = false;
  } else {
    altphoneInput.setCustomValidity("");
  }

  if (passwordInput.value !== confirmPasswordInput.value) {
    confirmPasswordInput.setCustomValidity("Passwords do not match!");
    confirmPasswordError.textContent = "Passwords do not match!";
    confirmPasswordError.style.opacity = "1";
    shakeField(confirmPasswordInput);
    valid = false;
  } else {
    confirmPasswordInput.setCustomValidity("");
    confirmPasswordError.textContent = "";
    confirmPasswordError.style.opacity = "0";
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  if (!valid) return;

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
    const user = userCredential.user;

    await db.ref(`users/${user.uid}`).set({
      firstName: form.firstname.value,
      lastName: form.lastname.value,
      gender: form.gender.value,
      phone: phoneInput.value,
      altphone: altphoneInput.value,
      dob: form.dob.value,
      address: form.address.value,
      email: emailInput.value,
      role: "user",
      createdAt: new Date().toISOString()
    });

    alert("Registration successful!");
    form.reset();
    window.location.href = "index.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
});