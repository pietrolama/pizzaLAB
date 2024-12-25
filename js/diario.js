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
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("fermentazione-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            alert("Devi essere autenticato per aggiungere una fermentazione!");
            return;
        }

        const userId = user.uid;

        const idratazioneAttesa = parseInt(document.getElementById("idratazione").value) || 0;
        const lievito = document.getElementById("lievito").value || "N/A";
        const tempo = parseInt(document.getElementById("tempo").value) || 0;
        const data = document.getElementById("data").value || "";
        const note = document.getElementById("note").value || "";

        try {
            const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
            await setDoc(docRef, { idratazioneAttesa, lievito, tempo, data, note });
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

async function caricaFermentazioni(userId) {
    const fermentazioniRef = collection(db, "fermentazioni", userId, "entries");
    const fermentazioniSnapshot = await getDocs(fermentazioniRef);

    const list = document.getElementById("fermentazioni-list");
    list.innerHTML = "";

    const data = []; // Array per i grafici

    fermentazioniSnapshot.forEach((doc) => {
        const fermentazione = doc.data();
        data.push(fermentazione);

        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${fermentazione.data}</strong>: ${fermentazione.lievito}, ${fermentazione.idratazioneAttesa}%, ${fermentazione.tempo} ore<br>
            Note: ${fermentazione.note || "Nessuna"}<br>
            <button onclick="modificaFermentazione('${doc.id}')">Modifica</button>
            <button onclick="eliminaFermentazione('${doc.id}')">Elimina</button>
        `;
        list.appendChild(li);
    });

    generaGrafico(data);
}

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

function generaGrafico(data) {
    const ctx = document.getElementById("fermentazioni-chart").getContext("2d");

    if (window.myChart) {
        window.myChart.destroy();
    }

    const labels = data.map((_, index) => `Fermentazione ${index + 1}`);
    const idratazione = data.map((fermentazione) => fermentazione.idratazioneAttesa);

    window.myChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Idratazione (%)",
                    data: idratazione,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
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
