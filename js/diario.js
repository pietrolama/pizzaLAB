// Importa Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDx2udaOvFXoQP-H2lldGXD268yrZHM0aI",
    authDomain: "pizzalab-4b769.firebaseapp.com",
    projectId: "pizzalab-4b769",
    storageBucket: "pizzalab-4b769.firebasestorage.app",
    messagingSenderId: "1051118488916",
    appId: "1:1051118488916:web:b7aeb04695886b1b764cc1",
    measurementId: "G-2VE5X45NER"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Firebase Auth e Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Controlla se l'utente è autenticato
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Utente autenticato:", user.displayName, user.email, user.uid);
        caricaFermentazioni(user.uid);
    } else {
        console.error("Nessun utente autenticato. Reindirizzamento al login...");
        alert("Devi essere autenticato per accedere al diario.");
        window.location.href = "login.html";
    }
});


// Aggiungi una nuova fermentazione
document.getElementById("fermentazione-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = auth.currentUser.uid;
    const nome = document.getElementById("nome").value;
    const data = document.getElementById("data").value;
    const idratazione = document.getElementById("idratazione").value;
    const lievito = document.getElementById("lievito").value;
    const tempo = document.getElementById("tempo").value;

    try {
        const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
        await setDoc(docRef, { nome, data, idratazione: parseInt(idratazione), lievito, tempo: parseInt(tempo) });

        alert("Fermentazione aggiunta con successo!");
        e.target.reset();
        caricaFermentazioni(userId);
    } catch (error) {
        console.error("Errore durante l'aggiunta:", error);
    }
});

// Carica fermentazioni
async function caricaFermentazioni(userId) {
    const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
    const fermentazioniSnapshot = await getDocs(fermentazioniRef);

    const list = document.getElementById("fermentazioni-list");
    list.innerHTML = "";

    fermentazioniSnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.textContent = `${data.nome} - ${data.data} - ${data.idratazione}% - ${data.lievito} - ${data.tempo} ore`;
        list.appendChild(li);
    });
}
