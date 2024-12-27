import { app, auth } from "./login.js";
import {
    getFirestore,
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore(app);

// Salva il risultato della ricetta nel diario
export async function salvaRicettaNelDiario(tipoPizza, metodoImpasto, risultatoRicetta) {
    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere autenticato per salvare una ricetta!");
        return;
    }

    try {
        const docRef = doc(collection(db, "fermentazioni", user.uid, "entries"));
        await setDoc(docRef, {
            tipoPizza,
            metodoImpasto,
            risultatoRicetta: JSON.stringify(risultatoRicetta, null, 2), // Converte in JSON formattato
            dataSalvataggio: new Date().toISOString(),
        });
        alert("Ricetta salvata nel diario!");
    } catch (error) {
        console.error("Errore durante il salvataggio della ricetta:", error);
        alert("Errore durante il salvataggio. Riprova.");
    }
}

// Carica tutte le fermentazioni salvate dall'utente
async function caricaFermentazioni(userId) {
    try {
        const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
        const fermentazioniSnapshot = await getDocs(fermentazioniRef);

        const list = document.getElementById("fermentazioni-list");

        if (!list) {
            console.error("Elemento 'fermentazioni-list' non trovato.");
            return;
        }

        list.innerHTML = ""; // Svuota la lista prima di ricaricarla

        fermentazioniSnapshot.forEach((doc) => {
            const fermentazione = doc.data();

            // Parsea il risultatoRicetta da JSON
            let risultatoHTML = fermentazione.risultatoRicetta;
            try {
                risultatoHTML = JSON.parse(risultatoHTML); // Converte da JSON a oggetto
                risultatoHTML = Object.entries(risultatoHTML)
                    .map(([key, value]) => `<strong>${key}</strong>: ${value}`)
                    .join("<br>");
            } catch (e) {
                console.error("Errore durante il parsing di risultatoRicetta:", e);
            }

            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${fermentazione.tipoPizza}</strong> - ${fermentazione.metodoImpasto}<br>
                <div>${risultatoHTML}</div>
                <button onclick="eliminaFermentazione('${doc.id}')">Elimina</button>
            `;
            list.appendChild(li);
        });
    } catch (error) {
        console.error("Errore durante il caricamento delle fermentazioni:", error);
    }
}



// Elimina una fermentazione salvata
window.eliminaFermentazione = async function (docId) {
    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere autenticato per eliminare una fermentazione!");
        return;
    }

    try {
        const docRef = doc(db, "fermentazioni", user.uid, "entries", docId);
        await deleteDoc(docRef);
        alert("Fermentazione eliminata con successo!");
        caricaFermentazioni(user.uid); // Ricarica la lista aggiornata
    } catch (error) {
        console.error("Errore durante l'eliminazione della fermentazione:", error);
    }
};

// Avvio del caricamento fermentazioni all'accesso
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            caricaFermentazioni(user.uid);
        } else {
            alert("Devi essere autenticato per accedere al diario!");
            window.location.href = "login.html";
        }
    });
});
