import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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

// Esporta l'istanza di app, auth e provider
export { app, auth, provider };

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const userInfo = document.getElementById("user-info");
    const username = document.getElementById("username");

    // Assicurati che gli elementi siano presenti nel DOM
    if (!loginBtn || !logoutBtn || !userInfo || !username) {
        console.error("Uno o più elementi mancanti nel DOM!");
        return;
    }

    // Login
    loginBtn.addEventListener("click", async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            alert(`Login effettuato con successo! Bentornato, ${user.displayName}`);
            username.textContent = user.displayName;
            userInfo.style.display = "block";
            loginBtn.style.display = "none";
            logoutBtn.style.display = "inline-block";
        } catch (error) {
            console.error("Errore durante il login:", error);
            alert("Si è verificato un errore durante il login. Riprova.");
        }
    });

    // Logout
    logoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            alert("Logout effettuato con successo!");
            userInfo.style.display = "none";
            loginBtn.style.display = "inline-block";
            logoutBtn.style.display = "none";
        } catch (error) {
            console.error("Errore durante il logout:", error);
            alert("Si è verificato un errore durante il logout. Riprova.");
        }
    });

    // Controllo dello stato di autenticazione
    onAuthStateChanged(auth, (user) => {
        if (user) {
            username.textContent = user.displayName;
            userInfo.style.display = "block";
            loginBtn.style.display = "none";
            logoutBtn.style.display = "inline-block";
            console.log("Utente autenticato:", user.displayName);
        } else {
            userInfo.style.display = "none";
            loginBtn.style.display = "inline-block";
            logoutBtn.style.display = "none";
            console.log("Nessun utente autenticato.");
        }
    });
});
