import { app, auth } from "./login.js";
import {
    getFirestore,
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore(app);

// Salva una ricetta nel diario
export async function salvaRicettaNelDiario(tipoPizza, metodoImpasto, datiTeorici) {
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
            ...datiTeorici,
            dataSalvataggio: new Date().toISOString(),
        });
        alert("Ricetta salvata nel diario!");
    } catch (error) {
        console.error("Errore durante il salvataggio della ricetta:", error);
        alert("Errore durante il salvataggio. Riprova.");
    }
}

// Carica tutte le fermentazioni salvate dall'utente
export async function caricaFermentazioni(userId) {
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
                <strong>${fermentazione.tipoPizza}</strong> - ${fermentazione.metodoImpasto}<br>
                Farina: ${fermentazione.pesoFarina}g, Acqua: ${fermentazione.pesoAcqua}g<br>
                <button onclick="modificaFermentazione('${doc.id}')">Modifica</button>
                <button onclick="eliminaFermentazione('${doc.id}')">Elimina</button>
            `;
            list.appendChild(li);

            // Aggiungi fermentazione al selettore
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = `${fermentazione.tipoPizza} - ${fermentazione.metodoImpasto}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Errore durante il caricamento delle fermentazioni:", error);
    }
}

// Modifica una fermentazione salvata
window.modificaFermentazione = async function (docId) {
    const user = auth.currentUser;
    if (!user) {
        alert("Devi essere autenticato per modificare una fermentazione!");
        return;
    }

    try {
        const docRef = doc(db, "fermentazioni", user.uid, "entries", docId);
        const fermentazioneSnapshot = await getDoc(docRef);

        if (fermentazioneSnapshot.exists()) {
            const data = fermentazioneSnapshot.data();

            document.getElementById("nome").value = data.nome || "";
            document.getElementById("data").value = data.data || "";
            document.getElementById("idratazione").value = data.idratazione || "";
            document.getElementById("lievito").value = data.lievito || "";
            document.getElementById("tempo").value = data.tempo || "";
        } else {
            alert("Errore: fermentazione non trovata.");
        }
    } catch (error) {
        console.error("Errore durante la modifica della fermentazione:", error);
        alert("Errore durante la modifica della fermentazione.");
    }
};

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
        caricaFermentazioni(user.uid);
    } catch (error) {
        console.error("Errore durante l'eliminazione della fermentazione:", error);
        alert("Errore durante l'eliminazione della fermentazione.");
    }
};

// Confronta fermentazioni selezionate
window.confrontaFermentazioni = async function () {
    const select = document.getElementById("seleziona-fermentazioni");
    const selectedIds = Array.from(select.selectedOptions).map((option) => option.value);

    if (selectedIds.length < 2) {
        alert("Seleziona almeno due fermentazioni per confrontare.");
        return;
    }

    try {
        const user = auth.currentUser;
        const fermentazioniRef = collection(db, "fermentazioni", user.uid, "entries");

        const datiTeorici = [];
        const datiReali = [];

        for (const id of selectedIds) {
            const docRef = doc(fermentazioniRef, id);
            const snapshot = await getDoc(docRef);

            if (snapshot.exists()) {
                const data = snapshot.data();
                datiTeorici.push(data.pesoFarina);
                datiReali.push(data.pesoAcqua);
            }
        }

        generaGrafico(datiTeorici, datiReali);
    } catch (error) {
        console.error("Errore durante il confronto delle fermentazioni:", error);
    }
};

// Genera un grafico per confrontare le fermentazioni
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
                    label: "Peso Farina (g)",
                    data: datiTeorici,
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                },
                {
                    label: "Peso Acqua (g)",
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

// Event listener per caricare le fermentazioni all'accesso
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            caricaFermentazioni(user.uid);
        } else {
            alert("Devi essere autenticato per accedere al diario!");
        }
    });
});
