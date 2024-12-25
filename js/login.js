import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDx2udaOvFXoQP-H2lldGXD268yrZHM0aI",
    authDomain: "pizzalab-4b769.firebaseapp.com",
    projectId: "pizzalab-4b769",
    storageBucket: "pizzalab-4b769.firebasestorage.app",
    messagingSenderId: "1051118488916",
    appId: "1:1051118488916:web:b7aeb04695886b1b764cc1",
    measurementId: "G-2VE5X45NER",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { app, auth };

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (!loginBtn) {
        console.error("Elemento con id 'login-btn' non trovato nel DOM!");
        return;
    }

    loginBtn.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
            alert("Login effettuato con successo!");
            window.location.href = "diario.html";
        } catch (error) {
            console.error("Errore durante il login:", error);
        }
    });

    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            alert("Logout effettuato con successo!");
            window.location.href = "login.html";
        } catch (error) {
            console.error("Errore durante il logout:", error);
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Utente autenticato:", user.displayName);
        } else {
            console.log("Nessun utente autenticato.");
        }
    });
});
