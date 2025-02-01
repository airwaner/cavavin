// static/gestion_cepages.js

let editMode = false;
let currentCepageId = null;

document.addEventListener('DOMContentLoaded', () => {
    chargerCepages();
    
    document.getElementById('form-cepage').addEventListener('submit', (e) => {
        e.preventDefault();
        if (editMode) {
            modifierCepage();
        } else {
            ajouterCepage();
        }
    });
    
    // Initialiser les filtres
    document.getElementById('filtre-type').addEventListener('change', chargerCepages);
    document.getElementById('recherche').addEventListener('input', debounce(chargerCepages, 300));
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function chargerCepages() {
    try {
        const type = document.getElementById('filtre-type').value;
        const search = document.getElementById('recherche').value;
        
        let url = 'api.php?endpoint=get_cepages';
        if (type) url += `&type_vin=${encodeURIComponent(type)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        console.log('Fetching URL:', url); // Debug
        
        const response = await fetch(url);
        const text = await response.text(); // D'abord récupérer le texte brut
        
        console.log('Raw response:', text); // Debug
        
        try {
            const data = JSON.parse(text);
            if (data.success) {
                afficherCepages(data.data.cepages);
            } else {
                throw new Error(data.error || 'Erreur inconnue');
            }
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response text:', text);
            throw new Error('Erreur de parsing de la réponse');
        }
    } catch (error) {
        console.error('Error details:', error);
        alert('Erreur lors du chargement des cépages: ' + error.message);
    }
}
function afficherCepages(cepages) {
    const container = document.getElementById('liste-cepages');
    container.innerHTML = '';
    
    cepages.forEach(cepage => {
        const element = document.createElement('div');
        element.className = 'cepage-item';
        element.innerHTML = `
            <div class="cepage-info">
                <h3>${cepage.nom}</h3>
                <p>Type: ${cepage.type_vin}</p>
                <p>Facteur de garde: ${cepage.facteur_garde}</p>
                ${cepage.description ? `<p>Description: ${cepage.description}</p>` : ''}
                ${cepage.region ? `<p>Région: ${cepage.region}</p>` : ''}
                ${cepage.precocite ? `<p>Précocité: ${cepage.precocite}</p>` : ''}
                ${cepage.vigueur ? `<p>Vigueur: ${cepage.vigueur}</p>` : ''}
            </div>
            <div class="cepage-actions">
                <button onclick="editerCepage(${cepage.id})" class="btn-primary">Modifier</button>
                <button onclick="confirmerSuppression(${cepage.id})" class="btn-danger">Supprimer</button>
            </div>
        `;
        container.appendChild(element);
    });
}

async function ajouterCepage() {
    try {
        const formData = collecterDonneesFormulaire();
        
        const response = await fetch('api.php?endpoint=ajouter_cepage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            resetForm();
            chargerCepages();
            alert('Cépage ajouté avec succès !');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        alert('Erreur lors de l\'ajout du cépage: ' + error.message);
    }
}

async function modifierCepage() {
    try {
        const formData = collecterDonneesFormulaire();
        formData.id = currentCepageId;
        
        const response = await fetch('api.php?endpoint=modifier_cepage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            resetForm();
            chargerCepages();
            alert('Cépage modifié avec succès !');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        alert('Erreur lors de la modification du cépage: ' + error.message);
    }
}

function editerCepage(id) {
    const cepage = document.querySelector(`[data-id="${id}"]`);
    if (!cepage) return;
    
    const data = JSON.parse(cepage.dataset.cepage);
    remplirFormulaire(data);
    
    editMode = true;
    currentCepageId = id;
    document.querySelector('button[type="submit"]').textContent = 'Modifier';
    document.querySelector('h2').textContent = 'Modifier un cépage';
}

async function confirmerSuppression(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cépage ?')) return;
    
    try {
        const response = await fetch('api.php?endpoint=supprimer_cepage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        
        const data = await response.json();
        
        if (data.success) {
            chargerCepages();
            alert('Cépage supprimé avec succès !');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        alert('Erreur lors de la suppression du cépage: ' + error.message);
    }
}

function collecterDonneesFormulaire() {
    return {
        nom: document.getElementById('nom').value,
        type_vin: document.getElementById('type_vin').value,
        facteur_garde: parseFloat(document.getElementById('facteur_garde').value),
        description: document.getElementById('description').value,
        region: document.getElementById('region').value,
        precocite: document.getElementById('precocite').value,
        vigueur: document.getElementById('vigueur').value
    };
}

function remplirFormulaire(data) {
    const fields = ['nom', 'type_vin', 'facteur_garde', 'description', 'region', 'precocite', 'vigueur'];
    fields.forEach(field => {
        if (document.getElementById(field)) {
            document.getElementById(field).value = data[field] || '';
        }
    });
}

function resetForm() {
    document.getElementById('form-cepage').reset();
    editMode = false;
    currentCepageId = null;
    document.querySelector('button[type="submit"]').textContent = 'Ajouter';
    document.querySelector('h2').textContent = 'Ajouter un cépage';
}