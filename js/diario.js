import { app, auth } from "./login.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    setDoc, 
    getDoc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const db = getFirestore(app);

// Funzione per aggiungere o aggiornare una fermentazione
document.getElementById("fermentazione-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere autenticato per aggiungere una fermentazione!");
        return;
    }

    const userId = user.uid;

    // Recupera i valori dal modulo
    const idratazione_attesa = parseInt(document.getElementById("idratazione-attesa").value) || 0;
    const lievito_atteso = document.getElementById("lievito-atteso").value || "N/A";
    const tempo_atteso = parseInt(document.getElementById("tempo-atteso").value) || 0;
    const temperatura_attesa = parseFloat(document.getElementById("temperatura-attesa").value) || 0;

    const idratazione_reale = parseInt(document.getElementById("idratazione-reale").value) || 0;
    const lievito_reale = document.getElementById("lievito-reale").value || "N/A";
    const tempo_reale = parseInt(document.getElementById("tempo-reale").value) || 0;
    const temperatura_reale = parseFloat(document.getElementById("temperatura-reale").value) || 0;

    const note = document.getElementById("note").value || "";

    try {
        const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
        await setDoc(docRef, {
            idratazione_attesa,
            lievito_atteso,
            tempo_atteso,
            temperatura_attesa,
            idratazione_reale,
            lievito_reale,
            tempo_reale,
            temperatura_reale,
            note
        });

        alert("Fermentazione aggiunta o aggiornata con successo!");
        e.target.reset();
        caricaFermentazioni(userId);
    } catch (error) {
        console.error("Errore durante l'aggiunta della fermentazione:", error);
    }
});

// Funzione per caricare le fermentazioni salvate
async function caricaFermentazioni(userId) {
    const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
    const fermentazioniSnapshot = await getDocs(fermentazioniRef);

    const list = document.getElementById("fermentazioni-list");
    list.innerHTML = "";

    const data = []; // Array per salvare tutte le fermentazioni

    fermentazioniSnapshot.forEach((doc) => {
        const fermentazione = doc.data();
        data.push(fermentazione); // Aggiungi fermentazione all'array

        const li = document.createElement("li");
        li.innerHTML = `
            <strong>Attesa:</strong> ${fermentazione.idratazione_attesa}% - ${fermentazione.lievito_atteso} - ${fermentazione.tempo_atteso} ore - ${fermentazione.temperatura_attesa}°C<br>
            <strong>Reale:</strong> ${fermentazione.idratazione_reale}% - ${fermentazione.lievito_reale} - ${fermentazione.tempo_reale} ore - ${fermentazione.temperatura_reale}°C<br>
            <strong>Note:</strong> ${fermentazione.note}<br>
            <button onclick="modificaFermentazione('${doc.id}')">Modifica</button>
            <button onclick="eliminaFermentazione('${doc.id}')">Elimina</button>
        `;
        list.appendChild(li);
    });

    // Genera i grafici
    generaGrafico(data); // Grafico a barre per idratazione attesa e reale
    generaGraficoLieviti(data); // Grafico a torta per distribuzione dei lieviti
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
        document.getElementById("idratazione-attesa").value = data.idratazione_attesa;
        document.getElementById("lievito-atteso").value = data.lievito_atteso;
        document.getElementById("tempo-atteso").value = data.tempo_atteso;
        document.getElementById("temperatura-attesa").value = data.temperatura_attesa;

        document.getElementById("idratazione-reale").value = data.idratazione_reale;
        document.getElementById("lievito-reale").value = data.lievito_reale;
        document.getElementById("tempo-reale").value = data.tempo_reale;
        document.getElementById("temperatura-reale").value = data.temperatura_reale;

        document.getElementById("note").value = data.note;

        alert("Modifica i campi desiderati e premi 'Aggiungi Fermentazione' per salvare.");
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
    const docRef = doc(db, "fermentazioni", userId, "entries", docId);

    if (confirm("Sei sicuro di voler eliminare questa fermentazione?")) {
        try {
            await deleteDoc(docRef);
            alert("Fermentazione eliminata con successo!");
            caricaFermentazioni(userId);
        } catch (error) {
            console.error("Errore durante l'eliminazione:", error);
        }
    }
};

// Inizializza caricamento delle fermentazioni al caricamento della pagina
onAuthStateChanged(auth, (user) => {
    if (user) {
        caricaFermentazioni(user.uid);
    } else {
        alert("Devi essere autenticato per accedere al diario!");
        window.location.href = "login.html";
    }
});

function generaGrafico(data) {
    const ctx = document.getElementById("fermentazioni-chart").getContext("2d");

    // Distruggi il grafico precedente, se esiste
    if (window.myChart) {
        window.myChart.destroy();
    }

    // Prepara i dati
    const labels = data.map((fermentazione, index) => `Fermentazione ${index + 1}`);
    const idratazioneAttesa = data.map((fermentazione) => fermentazione.idratazione_attesa);
    const idratazioneReale = data.map((fermentazione) => fermentazione.idratazione_reale);

    // Crea il nuovo grafico
    window.myChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Idratazione Attesa (%)",
                    data: idratazioneAttesa,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1,
                },
                {
                    label: "Idratazione Reale (%)",
                    data: idratazioneReale,
                    backgroundColor: "rgba(255, 99, 132, 0.6)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
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

function generaGraficoLieviti(data) {
    const ctx = document.getElementById("fermentazioni-chart").getContext("2d");

    const lieviti = data.reduce((acc, fermentazione) => {
        const lievito = fermentazione.lievito_atteso || "Altro";
        acc[lievito] = (acc[lievito] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(lieviti);
    const counts = Object.values(lieviti);

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Distribuzione dei lieviti",
                    data: counts,
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.6)",
                        "rgba(54, 162, 235, 0.6)",
                        "rgba(255, 206, 86, 0.6)",
                        "rgba(75, 192, 192, 0.6)",
                        "rgba(153, 102, 255, 0.6)",
                    ],
                },
            ],
        },
        options: {
            responsive: true,
        },
    });
}

