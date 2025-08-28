const form = document.getElementById("registerForm");

const emailInput = document.getElementById("emailInput");
const emailError = document.getElementById("emailError");

const phoneInput = document.getElementById("phoneInput");
const altphoneInput = document.getElementById("altphoneInput");

const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const confirmPasswordError = document.getElementById("confirmPasswordError");

// Input: Accept only digits, limit to 10
function setupDigitOnlyInput(input) {
  input.addEventListener("input", () => {
    let cleaned = input.value.replace(/\D/g, "");
    input.value = cleaned.slice(0, 10);
  });
}

setupDigitOnlyInput(phoneInput);
if (altphoneInput) setupDigitOnlyInput(altphoneInput);

// Email validation
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

// Shake animation helper
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

  // Validation flags
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

  // Proceed with registration logic here (e.g., Firebase auth)
  alert("Form submitted successfully!");
});
