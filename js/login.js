import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "TUA_API_KEY",
    authDomain: "TUA_AUTH_DOMAIN",
    projectId: "TUA_PROJECT_ID",
    storageBucket: "TUA_STORAGE_BUCKET",
    messagingSenderId: "TUA_MESSAGING_ID",
    appId: "TUA_APP_ID",
    measurementId: "TUA_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

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
