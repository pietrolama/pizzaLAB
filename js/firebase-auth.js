// firebase-auth.js
// Modulo di autenticazione Firebase per PizzaLab Admin Dashboard

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export const ADMIN_EMAIL = "pietrolama@gmail.com";

const firebaseConfig = {
    apiKey: "AIzaSyDx2udaOvFXoQP-H2lldGXD268yrZHM0aI",
    authDomain: "pizzalab-4b769.firebaseapp.com",
    projectId: "pizzalab-4b769",
    storageBucket: "pizzalab-4b769.firebasestorage.app",
    messagingSenderId: "1051118488916",
    appId: "1:1051118488916:web:b7aeb04695886b1b764cc1",
    measurementId: "G-2VE5X45NER",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

/**
 * Avvia il login con popup Google.
 */
export async function loginWithGoogle() {
    return await signInWithPopup(auth, provider);
}

/**
 * Disconnette l'utente corrente.
 */
export async function logoutUser() {
    return await signOut(auth);
}

/**
 * Ascolta i cambiamenti di stato autenticazione.
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
        const isAdmin = user && user.email === ADMIN_EMAIL;
        callback(user, isAdmin);
    });
}
