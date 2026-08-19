import { auth } from "../Firebase/config.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

// Function to process admin login
async function handleLogin(e) {
  if (e) {
    e.preventDefault();
  }

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (!email || !password) {
    showError("Silakan isi email dan password.");
    return;
  }

  hideError();

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = "Memproses...";
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login berhasil!", userCredential.user);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Gagal login:", error);
    let errorMsg = "Email atau password yang Anda masukkan salah.";
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-email"
    ) {
      errorMsg = "Email atau password salah. Silakan periksa kembali.";
    } else if (error.code === "auth/too-many-requests") {
      errorMsg = "Terlalu banyak percobaan gagal. Silakan coba lagi nanti.";
    }
    showError(errorMsg);
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login Admin";
    }
  }
}

// Attach Event Listeners
if (loginBtn) {
  loginBtn.addEventListener("click", handleLogin);
}

if (loginForm) {
  loginForm.addEventListener("submit", handleLogin);
}

if (emailInput) {
  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleLogin(e);
    }
  });
}

if (passwordInput) {
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleLogin(e);
    }
  });
}

function showError(message) {
  if (loginError) {
    loginError.textContent = message;
    loginError.classList.add("show");
  }
}

function hideError() {
  if (loginError) {
    loginError.textContent = "";
    loginError.classList.remove("show");
  }
}
