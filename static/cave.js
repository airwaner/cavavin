// Variables globales et constantes
let caveId = null;
let selectedStockItem = null;

const API_ENDPOINTS = {
    GET_CAVE: 'api.php?endpoint=get_cave',
    GET_BOUTEILLES: 'api.php?endpoint=get_bouteilles',
    GET_STATS: 'api.php?endpoint=stats',
    GET_SUGGESTIONS: 'api.php?endpoint=get_suggestions',
    AJOUTER_BOUTEILLE: 'api.php?endpoint=ajouter_bouteille',
    MODIFIER_BOUTEILLE: 'api.php?endpoint=modifier_bouteille',
    RETIRER_BOUTEILLE: 'api.php?endpoint=retirer_bouteille',
    RANGER_BOUTEILLE: 'api.php?endpoint=ranger_bouteille'
};

// Utilitaires
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function fetchApi(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, options);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Erreur serveur');
        }
        
        return data;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

// Initialisation et chargement
document.addEventListener('DOMContentLoaded', async () => {
    try {
        caveId = getUrlParameter('id');
        if (!caveId) {
            alert('ID de cave non spécifié');
            window.location.href = 'index.html';
            return;
        }

        // Récupération des données de la cave
        const caveData = await fetchApi(`${API_ENDPOINTS.GET_CAVE}&cave_id=${caveId}`);
        document.getElementById('cave-name').textContent = caveData.cave.nom;

        // Configuration de la grille
        configurerGrille(caveData.cave);

        // Chargement parallèle des données
        await Promise.all([
            chargerBouteilles(),
            chargerStats()
        ]);
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        alert('Erreur lors du chargement de la cave');
    }
});

function configurerGrille(cave) {
    const grid = document.getElementById('cave-grid');
    grid.style.gridTemplateColumns = `repeat(${cave.largeur}, 70px)`;

    for (let y = 0; y < cave.hauteur; y++) {
        for (let x = 0; x < cave.largeur; x++) {
            const caseVin = document.createElement('div');
            caseVin.className = 'case';
            caseVin.dataset.x = x;
            caseVin.dataset.y = y;
            caseVin.addEventListener('click', (e) => handleCaseClick(e, x, y));
            grid.appendChild(caseVin);
        }
    }
}

// Gestion des bouteilles
async function chargerBouteilles() {
    try {
        const data = await fetchApi(`${API_ENDPOINTS.GET_BOUTEILLES}&cave_id=${caveId}`);
        
        // Réinitialiser l'affichage
        reinitialiserCases();
        
        // Mettre à jour les bouteilles placées
        data.bouteilles.forEach(bouteille => {
            if (bouteille.position_x !== null && bouteille.position_y !== null) {
                afficherBouteilleDansCase(bouteille);
            }
        });
        
        // Mettre à jour le stock
        await chargerStock();
    } catch (error) {
        console.error('Erreur lors du chargement des bouteilles:', error);
        alert('Erreur lors du chargement des bouteilles');
    }
}

function reinitialiserCases() {
    document.querySelectorAll('.case').forEach(caseVin => {
        caseVin.className = 'case';
        caseVin.textContent = '';
        caseVin.removeAttribute('data-bouteille');
    });
}

function afficherBouteilleDansCase(bouteille) {
    const caseVin = document.querySelector(
        `[data-x="${bouteille.position_x}"][data-y="${bouteille.position_y}"]`
    );
    if (caseVin) {
        caseVin.classList.add(bouteille.type_vin);
        caseVin.textContent = bouteille.millesime || '';
        caseVin.dataset.bouteille = JSON.stringify(bouteille);
    }
}

// Gestion du stock
async function chargerStock() {
    try {
        const data = await fetchApi(`${API_ENDPOINTS.GET_BOUTEILLES}&cave_id=${caveId}`);
        const stockList = document.getElementById('stock-list');
        stockList.innerHTML = '';
        
        data.bouteilles
            .filter(bouteille => bouteille.position_x === null && bouteille.position_y === null)
            .forEach(creerElementStock);
    } catch (error) {
        console.error('Erreur lors du chargement du stock:', error);
        alert('Erreur lors du chargement du stock');
    }
}

function creerElementStock(bouteille) {
    const stockItem = document.createElement('div');
    stockItem.className = `stock-item ${bouteille.type_vin}`;
    stockItem.dataset.bouteille = JSON.stringify(bouteille);
    stockItem.innerHTML = `
        <strong>${bouteille.nom}</strong>
        ${bouteille.millesime ? ` (${bouteille.millesime})` : ''}
        <br>
        <span class="quantite">Quantité: ${bouteille.quantite}</span>
        <br>
        ${bouteille.domaine ? `Domaine: ${bouteille.domaine}<br>` : ''}
        Prix: ${Number(bouteille.prix).toLocaleString('fr-FR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })} €
        <div class="instructions" style="display: none;">
            Cliquez sur un emplacement vide de la cave pour ranger cette bouteille
        </div>
    `;
    stockItem.addEventListener('click', () => selectionnerBouteilleStock(stockItem));
    document.getElementById('stock-list').appendChild(stockItem);
}

function selectionnerBouteilleStock(stockItem) {
    if (selectedStockItem) {
        selectedStockItem.classList.remove('selected');
        selectedStockItem.querySelector('.instructions').style.display = 'none';
    }
    
    selectedStockItem = (selectedStockItem === stockItem) ? null : stockItem;
    
    if (selectedStockItem) {
        stockItem.classList.add('selected');
        stockItem.querySelector('.instructions').style.display = 'block';
    }
}

// Gestion des statistiques
async function chargerStats() {
    try {
        const data = await fetchApi(`${API_ENDPOINTS.GET_STATS}&cave_id=${caveId}`);
        const stats = data.stats;
        
        // Mise à jour des statistiques globales
        const casesOccupees = Object.values(stats.bouteilles_par_type)
            .reduce((acc, curr) => acc + curr.nombre, 0);
        
        updateElementContent('total-cases', stats.total_cases);
        updateElementContent('cases-occupees', casesOccupees);
        updateElementContent('occupation', ((casesOccupees / stats.total_cases) * 100).toFixed(1));
        updateElementContent('total-bouteilles', stats.total_bouteilles);
        updateElementContent('valeur-totale', formatPrice(stats.valeur_totale));
        
        // Mise à jour des statistiques par type
        afficherStatsParType(stats);
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        alert('Erreur lors du chargement des statistiques');
    }
}

function updateElementContent(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function formatPrice(price) {
    return Number(price).toLocaleString('fr-FR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

function afficherStatsParType(stats) {
    const detailsContainer = document.getElementById('stats-details');
    detailsContainer.innerHTML = '';
    
    const types = ['rouge', 'blanc', 'rose', 'champagne'];
    types.forEach(type => {
        const data = stats.bouteilles_par_type[type] || { 
            nombre: 0, 
            total_bouteilles: 0, 
            valeur_totale: 0 
        };
        
        const div = document.createElement('div');
        div.className = `type-stat ${type}`;
        div.innerHTML = `
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong>
            <p>Cases: ${data.nombre} (${((data.nombre / stats.total_cases) * 100).toFixed(1)}%)</p>
            <p>Bouteilles: ${data.total_bouteilles}</p>
            <p>Valeur: ${formatPrice(data.valeur_totale)} €</p>
        `;
        detailsContainer.appendChild(div);
    });
}

// Gestion des interactions avec la cave
function handleCaseClick(e, x, y) {
    if (selectedStockItem) {
        rangerBouteille(x, y);
    } else {
        ouvrirFormulaire(x, y);
    }
}

// Gestion du formulaire
async function ouvrirFormulaire(x, y) {
    const modal = document.getElementById('form-bouteille');
    const form = document.getElementById('bouteille-form');
    const caseVin = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    const bouteille = caseVin.dataset.bouteille ? JSON.parse(caseVin.dataset.bouteille) : null;
    
    // Réinitialisation et configuration du formulaire
    initialiserFormulaire(form, x, y, bouteille);
    
    // Chargement des suggestions
    await chargerSuggestions();
    
    // Affichage et sélection visuelle
    modal.style.display = 'block';
    document.querySelectorAll('.case.selected').forEach(c => c.classList.remove('selected'));
    caseVin.classList.add('selected');
}

function initialiserFormulaire(form, x, y, bouteille) {
    document.getElementById('position-x').value = x;
    document.getElementById('position-y').value = y;
    
    const btnEnregistrer = document.getElementById('btn-enregistrer');
    const btnModifier = document.getElementById('btn-modifier');
    const btnRetirer = document.getElementById('btn-retirer');
    
    btnEnregistrer.style.display = bouteille ? 'none' : 'block';
    btnModifier.style.display = bouteille ? 'block' : 'none';
    btnRetirer.style.display = bouteille ? 'block' : 'none';
    
    if (bouteille) {
        // Remplissage des champs avec les données existantes
        remplirFormulaire(bouteille);
        form.dataset.bouteilleId = bouteille.id;
    } else {
        // Réinitialisation du formulaire
        form.reset();
        document.getElementById('quantite').value = 1;
        delete form.dataset.bouteilleId;
    }
}

function remplirFormulaire(bouteille) {
    const fields = ['type-vin', 'nom-vin', 'domaine', 'appellation', 'millesime', 'prix', 'quantite', 'commentaire'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            const value = bouteille[field.replace('-vin', '')] || '';
            element.value = value;
        }
    });
}

async function chargerSuggestions() {
    const fields = ['nom', 'domaine', 'appellation'];
    
    for (const field of fields) {
        try {
            const data = await fetchApi(`${API_ENDPOINTS.GET_SUGGESTIONS}&field=${field}`);
            if (data.success) {
                const datalist = document.getElementById(`${field}s-list`);
                datalist.innerHTML = '';
                
                data.suggestions.forEach(suggestion => {
                    const option = document.createElement('option');
                    option.value = suggestion;
                    datalist.appendChild(option);
                });
            }
        } catch (error) {
            console.error(`Erreur lors du chargement des suggestions pour ${field}:`, error);
        }
    }
}

// Événements du formulaire
document.getElementById('btn-modifier').addEventListener('click', async function(e) {
    e.preventDefault();
    await modifierBouteille(collecterDonneesFormulaire());
});

document.getElementById('btn-enregistrer').addEventListener('click', async function(e) {
    e.preventDefault();
    await ajouterBouteille(collecterDonneesFormulaire());
});

function collecterDonneesFormulaire() {
    const form = document.getElementById('bouteille-form');
    return {
        id: form.dataset.bouteilleId,
        cave_id: caveId,
        position_x: parseInt(document.getElementById('position-x').value),
        position_y: parseInt(document.getElementById('position-y').value),
        type_vin: document.getElementById('type-vin').value,
        nom: document.getElementById('nom-vin').value,
        domaine: document.getElementById('domaine').value,
        appellation: document.getElementById('appellation').value,
        millesime: document.getElementById('millesime').value,
        prix: parseFloat(document.getElementById('prix').value),
        quantite: parseInt(document.getElementById('quantite').value),
        commentaire: document.getElementById('commentaire').value
    };
}

// Opérations CRUD sur les bouteilles
async function ajouterBouteille(data) {
    try {
        await fetchApi(API_ENDPOINTS.AJOUTER_BOUTEILLE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        fermerModal();
        await Promise.all([chargerBouteilles(), chargerStats()]);
    } catch (error) {
        alert('Erreur lors de l\'ajout de la bouteille');
    }
}

async function modifierBouteille(data) {
    try {
        await fetchApi(API_ENDPOINTS.MODIFIER_BOUTEILLE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        fermerModal();
        await Promise.all([chargerBouteilles(), chargerStats()]);
    } catch (error) {
        alert('Erreur lors de la modification de la bouteille');
    }
}

async function rangerBouteille(x, y) {
    const bouteille = JSON.parse(selectedStockItem.dataset.bouteille);
    
    try {
        const response = await fetchApi(API_ENDPOINTS.RANGER_BOUTEILLE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cave_id: caveId,
                bouteille_id: bouteille.id,
                position_x: x,
                position_y: y
            })
        });
        
        if (response.success) {
            selectedStockItem.classList.remove('selected');
            selectedStockItem.querySelector('.instructions').style.display = 'none';
            selectedStockItem = null;
            await Promise.all([chargerBouteilles(), chargerStats()]);
        }
    } catch (error) {
        if (error.message === 'Position occupée') {
            alert('Cette position est déjà occupée');
        } else {
            alert('Erreur lors du rangement de la bouteille');
        }
    }
}

async function retirerBouteille() {
    if (!confirm('Êtes-vous sûr de vouloir retirer cette bouteille ?')) {
        return;
    }
    
    const x = parseInt(document.getElementById('position-x').value);
    const y = parseInt(document.getElementById('position-y').value);
    
    try {
        await fetchApi(API_ENDPOINTS.RETIRER_BOUTEILLE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cave_id: caveId,
                position_x: x,
                position_y: y
            })
        });
        
        fermerModal();
        await Promise.all([chargerBouteilles(), chargerStats()]);
    } catch (error) {
        alert('Erreur lors du retrait de la bouteille');
    }
}

// Navigation et suppression
function ouvrirRecherche() {
    window.location.href = `recherche.html?cave=${caveId}`;
}

async function supprimerCave() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette cave ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        await fetchApi('api.php?endpoint=supprimer_cave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cave_id: caveId })
        });
        
        alert('Cave supprimée avec succès');
        window.location.href = 'index.html';
    } catch (error) {
        alert('Erreur lors de la suppression de la cave');
    }
}

function fermerModal() {
    document.getElementById('form-bouteille').style.display = 'none';
    document.querySelectorAll('.case.selected').forEach(c => c.classList.remove('selected'));
    document.getElementById('bouteille-form').reset();
}