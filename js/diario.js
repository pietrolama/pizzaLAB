import { app } from "./login.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// Verifica stato di autenticazione e imposta automaticamente il nome dell'utente
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Devi essere autenticato per accedere al diario.");
        window.location.href = "login.html";
    } else {
        console.log("Utente autenticato:", user.displayName);
        document.getElementById("nome").value = user.displayName || "Utente"; // Imposta il nome dell'utente nel form
        caricaFermentazioni(user.uid);
    }
});

// Aggiungi una nuova fermentazione
document.getElementById("fermentazione-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Controlla che l'utente sia autenticato
    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere autenticato per aggiungere una fermentazione!");
        return;
    }

    const userId = user.uid; // Prendi l'UID dell'utente autenticato
    const nome = document.getElementById("nome").value || "Utente sconosciuto";
    const data = document.getElementById("data").value || "Data non specificata";
    const idratazione = document.getElementById("idratazione").value || 0;
    const lievito = document.getElementById("lievito").value || "Nessun lievito";
    const tempo = document.getElementById("tempo").value || 0;

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
        e.target.reset();
        caricaFermentazioni(userId);
    } catch (error) {
        console.error("Errore durante l'aggiunta della fermentazione:", error);
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
