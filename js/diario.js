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

document.addEventListener("DOMContentLoaded", () => {
    const fermentazioniList = document.getElementById("fermentazioni-list");

    // Funzione per creare una card
    function creaCardFermentazione(fermentazione, docId = null) {
        if (!fermentazione || (!fermentazione.nome && !fermentazione.tipoPizza)) {
            console.error("Dati fermentazione non validi:", fermentazione);
            return;
        }
    
        if (!fermentazioniList) {
            console.error("Elemento 'fermentazioni-list' non trovato nel DOM.");
            return;
        }
    
        const card = document.createElement("div");
        card.className = "fermentazione-card";
        card.innerHTML = `
            <h3>${fermentazione.tipoPizza || fermentazione.nome}</h3>
            <p>Metodo: ${fermentazione.metodoImpasto || fermentazione.metodo}</p>
            <button class="btn">Mostra Dettagli</button>
            <div class="details" style="display: none;">
                <h4>Ingredienti:</h4>
                <ul>
                    ${Object.entries(fermentazione.risultatoRicetta || fermentazione.ingredienti)
                        .map(([key, value]) => `<li>${key}: ${value}</li>`)
                        .join("")}
                </ul>
                <h4>Procedura:</h4>
                <p>${fermentazione.procedura || "N/A"}</p>
            </div>
            ${docId ? `<button class="btn delete-btn" data-id="${docId}">Elimina</button>` : ""}
        `;
    
        card.querySelector(".btn").addEventListener("click", () => {
            const details = card.querySelector(".details");
            const isVisible = details.style.display === "block";
            details.style.display = isVisible ? "none" : "block";
            card.classList.toggle("expanded", !isVisible);
        });
    
        if (docId) {
            card.querySelector(".delete-btn").addEventListener("click", () => {
                eliminaFermentazione(docId);
            });
        }
    
        fermentazioniList.appendChild(card);
    }

    export function salvaRicettaNelDiario(tipoPizza, metodoImpasto, risultatoRicetta) {
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
                risultatoRicetta: typeof risultatoRicetta === "object" ? JSON.stringify(risultatoRicetta) : risultatoRicetta,
                dataSalvataggio: new Date().toISOString(),
            });
            alert("Ricetta salvata nel diario!");
        } catch (error) {
            console.error("Errore durante il salvataggio della ricetta:", error);
            alert("Errore durante il salvataggio. Riprova.");
        }
    }


    // Funzione per caricare le fermentazioni da Firebase
    async function caricaFermentazioni(userId) {
        if (!fermentazioniList) {
            console.error("Elemento con ID 'fermentazioni-list' non trovato nel DOM.");
            return;
        }
    
        try {
            const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
            const fermentazioniSnapshot = await getDocs(fermentazioniRef);
    
            fermentazioniList.innerHTML = ""; // Svuota la lista prima di ricaricarla
    
            fermentazioniSnapshot.forEach((doc) => {
                const fermentazione = doc.data();
                try {
                    fermentazione.risultatoRicetta = JSON.parse(
                        fermentazione.risultatoRicetta
                    ); // Parsea il JSON
                } catch (e) {
                    console.error("Errore nel parsing dei risultati:", e);
                }
    
                creaCardFermentazione(fermentazione, doc.id);
            });
        } catch (error) {
            console.error("Errore durante il caricamento delle fermentazioni:", error);
        }
    }


    // Elimina una fermentazione
    async function eliminaFermentazione(docId) {
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
    }

    // Verifica l'utente autenticato e carica le fermentazioni
    onAuthStateChanged(auth, (user) => {
        if (user) {
            caricaFermentazioni(user.uid);
        } else {
            alert("Devi essere autenticato per accedere al diario!");
            window.location.href = "login.html";
        }
    });

    // Esempio di dati statici
    const fermentazioniStatiche = [
        {
            nome: "Pizza Napoletana",
            metodo: "Diretto",
            ingredienti: {
                Farina: "311.11 g",
                Acqua: "248.89 g",
                Lievito: "0.49 g",
                Sale: "6.22 g",
                Zucchero: "4.04 g",
                Olio: "9.96 g",
            },
            procedura: `Sciogliere il sale nell'acqua e aggiungere metà della farina...`,
        },
        {
            nome: "Contemporanea Biga",
            metodo: "Biga",
            ingredienti: {
                Farina: "186.67 g",
                Acqua: "194.13 g",
                Sale: "6.22 g",
                Olio: "9.33 g",
            },
            procedura: `Preparare la biga con il 50% della farina e il 50% dell'acqua...`,
        },
    ];

    // Genera le card per i dati statici
    fermentazioniStatiche.forEach((fermentazione) => creaCardFermentazione(fermentazione));
});
