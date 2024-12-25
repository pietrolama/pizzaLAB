import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

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

// Esporta app e auth per usarli in altri file
export { app, auth };

// Login con Google
document.addEventListener("DOMContentLoaded", () => {
    // Login con Google
    document.getElementById("login-btn").addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
            alert("Login effettuato con successo!");
            window.location.href = "diario.html";
        } catch (error) {
            console.error("Errore durante il login:", error);
        }
    });

    // Controlla se l'utente è già autenticato
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Utente autenticato:", user.displayName);
            window.location.href = "diario.html";
        }
    });
});
