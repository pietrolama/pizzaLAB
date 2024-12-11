// Carica i dati dal file JSON
fetch('data/ingredients.json')
    .then(response => response.json())
    .then(ingredients => {
        const ingredientList = document.getElementById('ingredient-list');
        const selectedIngredientsTable = document.querySelector('#selected-ingredients tbody');
        const totals = {
            calories: 0,
            fats: 0,
            carbs: 0,
            sugars: 0,
            fibers: 0,
            proteins: 0,
            salt: 0,
        };

        // Funzione per aggiornare i totali
        function updateTotals() {
            document.getElementById('total-calories').textContent = totals.calories.toFixed(2);
            document.getElementById('total-fats').textContent = totals.fats.toFixed(2);
            document.getElementById('total-carbs').textContent = totals.carbs.toFixed(2);
            document.getElementById('total-sugars').textContent = totals.sugars.toFixed(2);
            document.getElementById('total-fibers').textContent = totals.fibers.toFixed(2);
            document.getElementById('total-proteins').textContent = totals.proteins.toFixed(2);
            document.getElementById('total-salt').textContent = totals.salt.toFixed(2);
        }

        // Aggiunge un ingrediente selezionato alla tabella
        function addIngredientToTable(ingredient, quantity) {
            const row = document.createElement('tr');

            const columns = [
                ingredient.nome,
                `${quantity} g/ml`,
                (ingredient.calorie * quantity / 100).toFixed(2),
                (ingredient.grassi * quantity / 100).toFixed(2),
                (ingredient.carboidrati * quantity / 100).toFixed(2),
                (ingredient.zuccheri * quantity / 100).toFixed(2),
                (ingredient.fibre * quantity / 100).toFixed(2),
                (ingredient.proteine * quantity / 100).toFixed(2),
                (ingredient.sale * quantity / 100).toFixed(2),
            ];

            columns.forEach(value => {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.appendChild(cell);
            });

            selectedIngredientsTable.appendChild(row);

            // Aggiorna i totali
            totals.calories += (ingredient.calorie * quantity / 100);
            totals.fats += (ingredient.grassi * quantity / 100);
            totals.carbs += (ingredient.carboidrati * quantity / 100);
            totals.sugars += (ingredient.zuccheri * quantity / 100);
            totals.fibers += (ingredient.fibre * quantity / 100);
            totals.proteins += (ingredient.proteine * quantity / 100);
            totals.salt += (ingredient.sale * quantity / 100);

            updateTotals();
        }

        // Popola la lista degli ingredienti
        ingredients.forEach(ingredient => {
            const listItem = document.createElement('li');
            listItem.textContent = ingredient.nome;

            const addButton = document.createElement('button');
            addButton.textContent = 'Aggiungi';
            addButton.onclick = () => {
                const quantity = parseFloat(prompt(`Inserisci la quantità di ${ingredient.nome} in g/ml:`));
                if (!isNaN(quantity) && quantity > 0) {
                    addIngredientToTable(ingredient, quantity);
                } else {
                    alert('Quantità non valida!');
                }
            };

            listItem.appendChild(addButton);
            ingredientList.appendChild(listItem);
        });
    })
    .catch(error => console.error('Errore nel caricamento degli ingredienti:', error));
