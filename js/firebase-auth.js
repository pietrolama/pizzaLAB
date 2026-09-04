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

import {
    getFirestore,
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const ADMIN_EMAILS = ["pietrolama1@gmail.com"];
export const ADMIN_EMAIL = "pietrolama1@gmail.com";

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
export const db = getFirestore(app);
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
        const isAdmin = user && ADMIN_EMAILS.includes(user.email);
        callback(user, isAdmin);
    });
}

/**
 * Salva una fermentazione nel diario cloud dell'utente.
 */
export async function salvaDiarioCloud(entry) {
    const user = auth.currentUser;
    if (!user) return null;
    const docId = entry.id || `ferm_${Date.now()}`;
    const docRef = doc(db, "fermentazioni", user.uid, "entries", docId);
    await setDoc(docRef, {
        ...entry,
        id: docId,
        updatedAt: new Date().toISOString()
    });
    return docId;
}

/**
 * Carica le fermentazioni salvate nel cloud per l'utente loggato.
 */
export async function caricaDiarioCloud() {
    const user = auth.currentUser;
    if (!user) return [];
    const q = query(collection(db, "fermentazioni", user.uid, "entries"));
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((d) => results.push({ id: d.id, ...d.data() }));
    return results;
}

/**
 * Elimina una fermentazione dal cloud.
 */
export async function eliminaDiarioCloud(docId) {
    const user = auth.currentUser;
    if (!user || !docId) return;
    await deleteDoc(doc(db, "fermentazioni", user.uid, "entries", docId));
}

