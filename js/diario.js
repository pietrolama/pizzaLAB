import { app, auth } from "./login.js";
import { getFirestore, collection, doc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore(app);

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

        const idratazione = parseInt(document.getElementById("idratazione").value) || 0;
        const lievito = document.getElementById("lievito").value || "N/A";
        const tempo = parseInt(document.getElementById("tempo").value) || 0;
        const data = document.getElementById("data").value || "";
        const note = document.getElementById("note").value || "";

        try {
            const docRef = doc(collection(db, "fermentazioni", userId, "entries"));
            await setDoc(docRef, { idratazione, lievito, tempo, data, note });
            alert("Fermentazione aggiunta con successo!");
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

    fermentazioniSnapshot.forEach((doc) => {
        const fermentazione = doc.data();

        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${fermentazione.data}</strong>: ${fermentazione.lievito}, ${fermentazione.idratazione}%, ${fermentazione.tempo} ore<br>
            Note: ${fermentazione.note || "Nessuna"}<br>
        `;
        list.appendChild(li);
    });
}
