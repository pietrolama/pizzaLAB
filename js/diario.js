import { app, auth } from "./login.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { calcolaImpasto } from "./calcolatore_script.js";

const db = getFirestore(app);

// Attendere il caricamento del DOM
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

        // Recupera i dati teorici e reali dal modulo
        const idratazioneTeorica = parseInt(document.getElementById("idratazione-teorica").value) || 0;
        const lievitoTeorico = document.getElementById("lievito-teorico").value || "N/A";
        const tempoTeorico = parseInt(document.getElementById("tempo-teorico").value) || 0;

        const idratazioneReale = parseInt(document.getElementById("idratazione-reale").value) || 0;
        const lievitoReale = document.getElementById("lievito-reale").value || "N/A";
        const tempoReale = parseInt(document.getElementById("tempo-reale").value) || 0;

        const nome = document.getElementById("nome").value || "Ricetta Sconosciuta";
        const note = document.getElementById("note").value || "";

        try {
            const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
            await setDoc(docRef, {
                nome,
                idratazione_teorica: idratazioneTeorica,
                lievito_teorico: lievitoTeorico,
                tempo_teorico: tempoTeorico,
                idratazione_reale: idratazioneReale,
                lievito_reale: lievitoReale,
                tempo_reale: tempoReale,
                note,
            });
            alert("Fermentazione aggiunta o aggiornata con successo!");
            form.reset();
            caricaFermentazioni(userId);
        } catch (error) {
            console.error("Errore durante l'aggiunta della fermentazione:", error);
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            caricaFermentazioni(user.uid);
        } else {
            alert("Devi essere autenticato per accedere al diario!");
            window.location.href = "login.html";
        }
    });
});

// Funzione per caricare fermentazioni
async function caricaFermentazioni(userId) {
    try {
        const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
        const fermentazioniSnapshot = await getDocs(fermentazioniRef);

        const list = document.getElementById("fermentazioni-list");
        if (!list) {
            console.error("Elemento con id 'fermentazioni-list' non trovato nel DOM.");
            return;
        }

        list.innerHTML = ""; // Pulisci la lista
        const dataTeorici = [];
        const dataReali = [];

        fermentazioniSnapshot.forEach((doc) => {
            const fermentazione = doc.data();
            dataTeorici.push({
                idratazione: fermentazione.idratazione_teorica,
                tempo: fermentazione.tempo_teorico,
            });
            dataReali.push({
                idratazione: fermentazione.idratazione_reale,
                tempo: fermentazione.tempo_reale,
            });

            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${fermentazione.nome}</strong><br>
                <strong>Teorico:</strong> ${fermentazione.idratazione_teorica}% - ${fermentazione.lievito_teorico} - ${fermentazione.tempo_teorico} ore<br>
                <strong>Reale:</strong> ${fermentazione.idratazione_reale}% - ${fermentazione.lievito_reale} - ${fermentazione.tempo_reale} ore<br>
                Note: ${fermentazione.note || "Nessuna"}<br>
                <button onclick="modificaFermentazione('${doc.id}')">Modifica</button>
                <button onclick="eliminaFermentazione('${doc.id}')">Elimina</button>
            `;
            list.appendChild(li);
        });

        generaGrafico(dataTeorici, dataReali);
    } catch (error) {
        console.error("Errore durante il caricamento delle fermentazioni:", error);
    }
}

// Funzione per modificare una fermentazione
window.modificaFermentazione = async function (docId) {
    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere autenticato per modificare una fermentazione!");
        return;
    }

    const userId = user.uid;
    const docRef = doc(db, "fermentazioni", userId, "entries", docId);
    const fermentazioneSnapshot = await getDoc(docRef);

    if (fermentazioneSnapshot.exists()) {
        const data = fermentazioneSnapshot.data();
        document.getElementById("idratazione-teorica").value = data.idratazione_teorica;
        document.getElementById("lievito-teorico").value = data.lievito_teorico;
        document.getElementById("tempo-teorico").value = data.tempo_teorico;

        document.getElementById("idratazione-reale").value = data.idratazione_reale;
        document.getElementById("lievito-reale").value = data.lievito_reale;
        document.getElementById("tempo-reale").value = data.tempo_reale;

        document.getElementById("nome").value = data.nome;
        document.getElementById("note").value = data.note;
    } else {
        alert("Errore: fermentazione non trovata.");
    }
};

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

// Funzione per generare un grafico teorico vs reale
function generaGrafico(dataTeorici, dataReali) {
    const ctx = document.getElementById("grafico-teorico-reale").getContext("2d");

    if (window.graficoTeoricoReale) {
        window.graficoTeoricoReale.destroy();
    }

    const labels = dataTeorici.map((_, index) => `Fermentazione ${index + 1}`);
    const datasetTeorico = dataTeorici.map((d) => d.idratazione);
    const datasetReale = dataReali.map((d) => d.idratazione);

    window.graficoTeoricoReale = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Idratazione Teorica",
                    data: datasetTeorico,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                },
                {
                    label: "Idratazione Reale",
                    data: datasetReale,
                    backgroundColor: "rgba(255, 99, 132, 0.6)",
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}
