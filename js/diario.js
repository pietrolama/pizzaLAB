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

document.addEventListener('DOMContentLoaded', () => {
    const fermentazioniList = document.getElementById('fermentazioni-list');

    // Esempio di dati ricetta
    const fermentazioni = [
        {
            nome: "Pizza Napoletana",
            metodo: "Diretto",
            ingredienti: {
                Farina: "311.11 g",
                Acqua: "248.89 g",
                Lievito: "0.49 g",
                Sale: "6.22 g",
                Zucchero: "4.04 g",
                Olio: "9.96 g"
            },
            procedura: `Sciogliere il sale nell'acqua e aggiungere metà della farina...`
        },
        {
            nome: "Contemporanea Biga",
            metodo: "Biga",
            ingredienti: {
                Farina: "186.67 g",
                Acqua: "194.13 g",
                Sale: "6.22 g",
                Olio: "9.33 g"
            },
            procedura: `Preparare la biga con il 50% della farina e il 50% dell'acqua...`
        }
    ];

    // Genera le card dinamicamente
    fermentazioni.forEach(fermentazione => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${fermentazione.nome}</h3>
            <p>Metodo: ${fermentazione.metodo}</p>
            <button class="btn">Mostra Dettagli</button>
            <div class="details" style="display: none;">
                <h4>Ingredienti:</h4>
                <ul>
                    ${Object.entries(fermentazione.ingredienti)
                        .map(([key, value]) => `<li>${key}: ${value}</li>`)
                        .join('')}
                </ul>
                <h4>Procedura:</h4>
                <p>${fermentazione.procedura}</p>
            </div>
        `;
        card.querySelector('.btn').addEventListener('click', () => {
            const details = card.querySelector('.details');
            const isVisible = details.style.display === 'block';
            details.style.display = isVisible ? 'none' : 'block';
            card.classList.toggle('expanded', !isVisible);
        });
        fermentazioniList.appendChild(card);
    });
});

