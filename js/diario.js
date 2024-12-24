import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const auth = getAuth();
const db = getFirestore();

// Controlla se l'utente è autenticato
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Devi essere autenticato per accedere al diario.");
        window.location.href = "login.html";
    } else {
        console.log("Utente autenticato:", user.displayName);
        caricaFermentazioni(user.uid);
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
