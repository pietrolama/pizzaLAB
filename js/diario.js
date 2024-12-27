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

document.addEventListener("DOMContentLoaded", () => {
    const fermentazioneForm = document.getElementById("fermentazione-form");
    const confrontaButton = document.getElementById("confronta-button");

    if (fermentazioneForm) {
        fermentazioneForm.addEventListener("submit", aggiungiFermentazione);
    }

    if (confrontaButton) {
        confrontaButton.addEventListener("click", confrontaFermentazioni);
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            caricaFermentazioni(user.uid);
        } else {
            alert("Devi essere autenticato per accedere al diario!");
            window.location.href = "login.html";
        }
    });
});

// Aggiungi una fermentazione
async function aggiungiFermentazione(e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere autenticato per aggiungere una fermentazione!");
        return;
    }

    const userId = user.uid;
    const nome = document.getElementById("nome").value;
    const data = document.getElementById("data").value;
    const idratazione = parseFloat(document.getElementById("idratazione").value);
    const lievito = document.getElementById("lievito").value;
    const tempo = parseFloat(document.getElementById("tempo").value);

    try {
        const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
        await setDoc(docRef, {
            nome,
            data,
            idratazione,
            lievito,
            tempo,
        });
        alert("Fermentazione aggiunta con successo!");
        e.target.reset();
        caricaFermentazioni(userId);
    } catch (error) {
        console.error("Errore durante l'aggiunta della fermentazione:", error);
    }
}

// Carica fermentazioni salvate
async function caricaFermentazioni(userId) {
    try {
        const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
        const fermentazioniSnapshot = await getDocs(fermentazioniRef);

        const list = document.getElementById("fermentazioni-list");
        const select = document.getElementById("seleziona-fermentazioni");

        if (!list || !select) {
            console.error("Elementi 'fermentazioni-list' o 'seleziona-fermentazioni' non trovati.");
            return;
        }

        list.innerHTML = "";
        select.innerHTML = "";

        fermentazioniSnapshot.forEach((doc) => {
            const fermentazione = doc.data();

            // Aggiungi fermentazione alla lista
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${fermentazione.nome}</strong> - ${fermentazione.data}<br>
                Idratazione: ${fermentazione.idratazione}% - Lievito: ${fermentazione.lievito}<br>
                Tempo: ${fermentazione.tempo} ore
                <button onclick="modificaFermentazione('${doc.id}')">Modifica</button>
                <button onclick="eliminaFermentazione('${doc.id}')">Elimina</button>
            `;
            list.appendChild(li);

            // Aggiungi fermentazione al selettore
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = `${fermentazione.nome} - ${fermentazione.data}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Errore durante il caricamento delle fermentazioni:", error);
    }
}

// Confronta fermentazioni
async function confrontaFermentazioni() {
    const select = document.getElementById("seleziona-fermentazioni");
    const selectedIds = Array.from(select.selectedOptions).map(option => option.value);

    if (selectedIds.length < 2) {
        alert("Seleziona almeno due fermentazioni per confrontare.");
        return;
    }

    try {
        const userId = auth.currentUser.uid;
        const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");

        const datiTeorici = [];
        const datiReali = [];

        for (const id of selectedIds) {
            const docRef = doc(fermentazioniRef, id);
            const snapshot = await getDoc(docRef);

            if (snapshot.exists()) {
                const data = snapshot.data();
                datiTeorici.push(data.idratazione);
                datiReali.push(data.tempo);
            }
        }

        generaGrafico(datiTeorici, datiReali);
    } catch (error) {
        console.error("Errore durante il confronto delle fermentazioni:", error);
    }
}

// Genera il grafico
function generaGrafico(datiTeorici, datiReali) {
    const ctx = document.getElementById("grafico-teorico-reale").getContext("2d");

    if (window.graficoTeoricoReale) {
        window.graficoTeoricoReale.destroy();
    }

    const labels = datiTeorici.map((_, index) => `Fermentazione ${index + 1}`);

    window.graficoTeoricoReale = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Idratazione (%)",
                    data: datiTeorici,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                },
                {
                    label: "Tempo (ore)",
                    data: datiReali,
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

        // Verifica l'esistenza degli elementi nel DOM prima di impostarne i valori
        const nomeField = document.getElementById("nome");
        const dataField = document.getElementById("data");
        const idratazioneField = document.getElementById("idratazione");
        const lievitoField = document.getElementById("lievito");
        const tempoField = document.getElementById("tempo");

        if (nomeField && dataField && idratazioneField && lievitoField && tempoField) {
            nomeField.value = data.nome || "";
            dataField.value = data.data || "";
            idratazioneField.value = data.idratazione || "";
            lievitoField.value = data.lievito || "";
            tempoField.value = data.tempo || "";
        } else {
            console.error("Alcuni elementi del modulo non sono stati trovati nel DOM.");
            alert("Errore: Impossibile modificare la fermentazione. Verifica il modulo.");
        }
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
