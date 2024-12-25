import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDx2udaOvFXoQP-H2lldGXD268yrZHM0aI",
    authDomain: "pizzalab-4b769.firebaseapp.com",
    projectId: "pizzalab-4b769",
    storageBucket: "pizzalab-4b769.firebasestorage.app",
    messagingSenderId: "1051118488916",
    appId: "1:1051118488916:web:b7aeb04695886b1b764cc1",
    measurementId: "G-2VE5X45NER"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Aspetta che il DOM sia pronto
document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("login-btn");
    const logoutButton = document.getElementById("logout-btn");
    const userInfo = document.getElementById("user-info");
    const usernameSpan = document.getElementById("username");

    if (!loginButton) {
        console.error("Elemento con id 'login-btn' non trovato nel DOM!");
        return;
    }

    // Login con Google
    loginButton.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
            alert("Login effettuato con successo!");
            window.location.href = "diario.html";
        } catch (error) {
            console.error("Errore durante il login:", error);
        }
    });

    // Logout
    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            alert("Logout effettuato con successo!");
            loginButton.style.display = "block";
            logoutButton.style.display = "none";
            userInfo.style.display = "none";
        } catch (error) {
            console.error("Errore durante il logout:", error);
        }
    });

    // Controlla lo stato dell'utente
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Utente autenticato:", user.displayName);
            loginButton.style.display = "none";
            logoutButton.style.display = "block";
            userInfo.style.display = "block";
            usernameSpan.textContent = user.displayName || "Utente";
        } else {
            console.log("Nessun utente autenticato.");
            loginButton.style.display = "block";
            logoutButton.style.display = "none";
            userInfo.style.display = "none";
        }
    });
});
