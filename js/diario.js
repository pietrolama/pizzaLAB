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
import { calcolaDiretto, calcolaBiga, calcolaPoolish, calcolaLievitoMadre, calcolaBigaPoolish } from "./calcolatore_script.js";

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

        const tipoPizza = document.getElementById("tipo_pizza").value;
        const metodoImpasto = document.getElementById("tipo_impasto").value;

        let datiTeorici;
        switch (metodoImpasto) {
            case "diretto":
                datiTeorici = calcolaDiretto();
                break;
            case "biga":
                datiTeorici = calcolaBiga();
                break;
            case "poolish":
                datiTeorici = calcolaPoolish();
                break;
            case "lievito_madre":
                datiTeorici = calcolaLievitoMadre();
                break;
            case "biga_poolish":
                datiTeorici = calcolaBigaPoolish();
                break;
            default:
                alert("Metodo di impasto non riconosciuto.");
                return;
        }

        const idratazioneReale = parseFloat(document.getElementById("idratazione-reale").value) || 0;
        const tempoReale = parseFloat(document.getElementById("tempo-reale").value) || 0;
        const note = document.getElementById("note").value || "";

        try {
            const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
            await setDoc(docRef, {
                tipoPizza,
                metodoImpasto,
                datiTeorici,
                idratazioneReale,
                tempoReale,
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

// Carica le fermentazioni salvate
async function caricaFermentazioni(userId) {
    try {
        const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
        const fermentazioniSnapshot = await getDocs(fermentazioniRef);

        const list = document.getElementById("fermentazioni-list");
        if (!list) {
            console.error("Elemento con id 'fermentazioni-list' non trovato.");
            return;
        }

        list.innerHTML = ""; // Pulisci la lista precedente

        fermentazioniSnapshot.forEach((doc) => {
            const fermentazione = doc.data();

            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${fermentazione.tipoPizza}</strong> - ${fermentazione.metodoImpasto}<br>
                <strong>Teorico:</strong> ${JSON.stringify(fermentazione.datiTeorici)}<br>
                <strong>Reale:</strong> ${fermentazione.idratazioneReale || "N/A"}%, ${fermentazione.tempoReale || "N/A"} ore<br>
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

// Modifica una fermentazione
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

        // Popola i campi del modulo
        document.getElementById("idratazione-reale").value = data.idratazioneReale || "";
        document.getElementById("tempo-reale").value = data.tempoReale || "";
        document.getElementById("note").value = data.note || "";
    } else {
        alert("Errore: fermentazione non trovata.");
    }
};

// Elimina una fermentazione
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

// Grafico teorico vs reale
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

// Funzione per salvare una ricetta nel diario
async function salvaRicettaNelDiario(tipoPizza, metodoImpasto, datiTeorici) {
    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere autenticato per salvare una ricetta!");
        return;
    }

    const userId = user.uid;

    try {
        const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
        await setDoc(docRef, {
            tipoPizza,
            metodoImpasto,
            datiTeorici,
            idratazioneReale: null, // Puoi aggiungere valori reali se necessario
            tempoReale: null,       // Puoi aggiungere valori reali se necessario
            note: null,             // Puoi aggiungere valori reali se necessario
        });
        alert("Ricetta salvata nel diario!");
    } catch (error) {
        console.error("Errore durante il salvataggio della ricetta:", error);
        alert("Errore durante il salvataggio della ricetta. Riprova.");
    }
}

// Evento per salvare nel diario
document.getElementById('salva-diario-btn').addEventListener('click', () => {
    const tipoPizza = document.getElementById('tipo_pizza').value;
    const metodoImpasto = document.getElementById('tipo_impasto').value;

    let datiTeorici;
    switch (metodoImpasto) {
        case 'diretto':
            datiTeorici = calcolaDiretto();
            break;
        case 'biga':
            datiTeorici = calcolaBiga();
            break;
        case 'poolish':
            datiTeorici = calcolaPoolish();
            break;
        case 'lievito_madre':
            datiTeorici = calcolaLievitoMadre();
            break;
        case 'biga_poolish':
            datiTeorici = calcolaBigaPoolish();
            break;
        default:
            alert('Metodo di impasto non riconosciuto.');
            return;
    }

    salvaRicettaNelDiario(tipoPizza, metodoImpasto, datiTeorici);
});
