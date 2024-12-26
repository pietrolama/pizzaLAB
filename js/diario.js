import { app, auth } from "./login.js";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore(app);

// Attendere che il DOM sia completamente caricato
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("fermentazione-form");

    if (!form) {
        console.error("Modulo con id 'fermentazione-form' non trovato nel DOM.");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            alert("Devi essere autenticato per aggiungere una fermentazione!");
            return;
        }

        const userId = user.uid;

        // Recupera i dati dal modulo, gestendo eventuali valori nulli
        const idratazioneInput = document.getElementById("idratazione");
        const lievitoInput = document.getElementById("lievito");
        const tempoInput = document.getElementById("tempo");
        const dataInput = document.getElementById("data");
        const noteInput = document.getElementById("note");

        if (!idratazioneInput || !lievitoInput || !tempoInput || !dataInput) {
            console.error("Alcuni campi obbligatori non sono stati trovati nel DOM.");
            return;
        }

        const idratazione = parseInt(idratazioneInput.value) || 0;
        const lievito = lievitoInput.value || "N/A";
        const tempo = parseInt(tempoInput.value) || 0;
        const data = dataInput.value || "";
        const note = noteInput?.value || "";

        try {
            const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
            await setDoc(docRef, { idratazione, lievito, tempo, data, note });
            alert("Fermentazione aggiunta o aggiornata con successo!");
            form.reset();
            caricaFermentazioni(userId);
        } catch (error) {
            console.error("Errore durante l'aggiunta della fermentazione:", error);
        }
    });

    // Gestisci lo stato di autenticazione
    onAuthStateChanged(auth, (user) => {
        if (user) {
            caricaFermentazioni(user.uid);
        } else {
            alert("Devi essere autenticato per accedere al diario!");
            window.location.href = "login.html";
        }
    });
});

// Funzione per caricare fermentazioni salvate
async function caricaFermentazioni(userId) {
    try {
        const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
        const fermentazioniSnapshot = await getDocs(fermentazioniRef);

        const list = document.getElementById("fermentazioni-list");
        if (!list) {
            console.error("Elemento con id 'fermentazioni-list' non trovato nel DOM.");
            return;
        }

        list.innerHTML = ""; // Pulisci la lista prima di aggiungere nuovi elementi

        fermentazioniSnapshot.forEach((doc) => {
            const fermentazione = doc.data();
            const li = document.createElement("li");

            li.innerHTML = `
                <strong>${fermentazione.data}</strong>: ${fermentazione.lievito}, ${fermentazione.idratazione}%, ${fermentazione.tempo} ore<br>
                Note: ${fermentazione.note || "Nessuna"}<br>
                <button onclick="modificaFermentazione('${doc.id}')">Modifica</button>
                <button onclick="eliminaFermentazione('${doc.id}')">Elimina</button>
            `;
            list.appendChild(li);
        });
    } catch (error) {
        console.error("Errore durante il caricamento delle fermentazioni:", error);
    }
}

// Funzione per eliminare una fermentazione
window.eliminaFermentazione = async function (docId) {
    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere autenticato per eliminare una fermentazione!");
        return;
    }

    const userId = user.uid;

    try {
        const docRef = doc(db, "fermentazioni", userId, "entries", docId);
        await deleteDoc(docRef);
        alert("Fermentazione eliminata con successo!");
        caricaFermentazioni(userId);
    } catch (error) {
        console.error("Errore durante l'eliminazione della fermentazione:", error);
    }
};

// Funzione per modificare una fermentazione (placeholder per future modifiche)
window.modificaFermentazione = async function (docId) {
    alert("La funzionalità di modifica non è ancora implementata.");
};
