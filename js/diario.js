// Importa Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "TUA_API_KEY",
    authDomain: "TUA_AUTH_DOMAIN",
    projectId: "TUA_PROJECT_ID",
    storageBucket: "TUA_STORAGE_BUCKET",
    messagingSenderId: "TUA_MESSAGING_ID",
    appId: "TUA_APP_ID",
    measurementId: "TUA_MEASUREMENT_ID"
};

// Inizializzazione Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementi DOM
const form = document.getElementById("fermentazione-form");
const list = document.getElementById("fermentazioni-list");

// Funzione per aggiungere una nuova fermentazione
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("Devi essere autenticato per aggiungere fermentazioni!");
            return;
        }

        const userId = user.uid;
        const nome = document.getElementById("nome").value;
        const data = document.getElementById("data").value;
        const idratazione = document.getElementById("idratazione").value;
        const lievito = document.getElementById("lievito").value;
        const tempo = document.getElementById("tempo").value;

        try {
            const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
            await setDoc(docRef, {
                nome,
                data,
                idratazione: parseInt(idratazione),
                lievito,
                tempo: parseInt(tempo)
            });

            alert("Fermentazione aggiunta con successo!");
            form.reset();
            caricaFermentazioni();
        } catch (error) {
            console.error("Errore durante l'aggiunta della fermentazione:", error);
        }
    });
});

// Funzione per caricare le fermentazioni esistenti
async function caricaFermentazioni() {
    const user = auth.currentUser;
    if (!user) return;

    const userId = user.uid;
    const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
    const fermentazioniSnapshot = await getDocs(fermentazioniRef);

    list.innerHTML = "";
    fermentazioniSnapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.textContent = `${data.nome} - ${data.data} - ${data.idratazione}% - ${data.lievito} - ${data.tempo} ore`;
        list.appendChild(li);
    });
}

// Controlla lo stato dell'utente e carica le fermentazioni
onAuthStateChanged(auth, (user) => {
    if (user) {
        caricaFermentazioni();
    } else {
        list.innerHTML = "<li>Devi accedere per vedere le tue fermentazioni.</li>";
    }
});
