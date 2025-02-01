// Variables globales et constantes
let caveId = null;
let selectedStockItem = null;
let modeDeplacement = false;
let bouteilleADeplacer = null;
let similarBottles = [];

let zoomLevel = 1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.75;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialisation du header avant tout
        new NavigationHeader();
        
        caveId = getUrlParameter('id'); // On utilise toujours 'id' ici
        if (!caveId) {
            alert('ID de cave non spécifié');
            window.location.href = 'index.html';
            return;
        }

        // Récupération des données de la cave
        const caveData = await fetchApi(`${API_ENDPOINTS.GET_CAVE}&cave_id=${caveId}`);
        document.getElementById('cave-name').textContent = caveData.cave.nom;

        // ... reste du code ...
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        alert('Erreur lors du chargement de la cave');
    }
});

const API_ENDPOINTS = {
    GET_CAVE: 'api.php?endpoint=get_cave',
    GET_BOUTEILLES: 'api.php?endpoint=get_bouteilles',
    GET_STATS: 'api.php?endpoint=stats',
    GET_SUGGESTIONS: 'api.php?endpoint=get_suggestions',
    AJOUTER_BOUTEILLE: 'api.php?endpoint=ajouter_bouteille',
    MODIFIER_BOUTEILLE: 'api.php?endpoint=modifier_bouteille',
    RETIRER_BOUTEILLE: 'api.php?endpoint=retirer_bouteille',
    RANGER_BOUTEILLE: 'api.php?endpoint=ranger_bouteille',
	DEPLACER_BOUTEILLE: 'api.php?endpoint=deplacer_bouteille'
};

// Fonction pour gérer le zoom de la grille
function handleGridZoom(direction) {
    const grid = document.querySelector('.cave-grid');
    if (direction === 'in' && zoomLevel < MAX_ZOOM) {
        zoomLevel += 0.1;
    } else if (direction === 'out' && zoomLevel > MIN_ZOOM) {
        zoomLevel -= 0.1;
    }
    grid.style.setProperty('--scale-factor', zoomLevel);
}

document.addEventListener('DOMContentLoaded', function() {
    const grid = document.querySelector('.cave-grid');
    let initialDistance = 0;

    grid.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
            initialDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
        }
    });

    grid.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            const currentDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            
            if (initialDistance > 0) {
                if (currentDistance > initialDistance) {
                    handleGridZoom('in');
                } else {
                    handleGridZoom('out');
                }
            }
            initialDistance = currentDistance;
        }
    });
});

// Utilitaires
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function fetchApi(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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

function convertirCoordonnees(x, y) {
    const lettres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const colonne = lettres[x];
    const ligne = y + 1; // +1 car on ne veut pas commencer à 0
    return `${colonne}${ligne}`;
}

async function exporterListePDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('l', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        let yPosition = margin;

        // Récupération des données
        const response = await fetchApi(`${API_ENDPOINTS.GET_CAVE}&cave_id=${caveId}`);
        const bouteillesResponse = await fetchApi(`${API_ENDPOINTS.GET_BOUTEILLES}&cave_id=${caveId}`);

        // En-tête du document
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(`Inventaire - ${response.cave.nom}`, margin, yPosition + 5);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const date = new Date().toLocaleDateString('fr-FR');
        doc.text(`Date d'export: ${date}`, margin, yPosition + 12);
        
        yPosition += 20;

        // Configuration des colonnes (sans la colonne Type)
        const colonnes = [
            { header: 'Position', width: 15, align: 'left' },
            { header: 'Nom', width: 75, align: 'left' },       // Largeur augmentée
            { header: 'Domaine', width: 70, align: 'left' },   // Largeur augmentée
            { header: 'Appellation', width: 60, align: 'left' },// Largeur augmentée
            { header: 'Mill.', width: 15, align: 'center' },
            { header: 'Prix', width: 20, align: 'right' },
            { header: 'Qté', width: 10, align: 'center' }
        ];

        // Couleurs plus prononcées maintenant que c'est le seul indicateur
        const couleursVin = {
            'rouge': { 
                fond: [240, 170, 170],
                texte: [100, 12, 12]
            },
            'blanc': { 
                fond: [255, 235, 160],
                texte: [130, 100, 0]
            },
            'rose': { 
                fond: [255, 180, 190],
                texte: [130, 50, 70]
            },
            'champagne': { 
                fond: [245, 225, 170],
                texte: [120, 100, 40]
            }
        };

        // Le reste de la configuration reste identique
        function dessinerLigne(data, y, isHeader = false, type = null) {
            let x = margin;
            const hauteurLigne = 7;
            
            if (type && couleursVin[type]) {
                const { fond } = couleursVin[type];
                doc.setFillColor(fond[0], fond[1], fond[2]);
                doc.rect(margin, y - 4, pageWidth - (2 * margin), hauteurLigne, 'F');
            } else if (isHeader) {
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, y - 4, pageWidth - (2 * margin), hauteurLigne, 'F');
            }

            doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
            doc.setFontSize(isHeader ? 9 : 8.5);

            colonnes.forEach((col, i) => {
                let text = String(data[i] || '');
                
                const maxChars = Math.floor((col.width * 2.1) / (doc.getFontSize() * 0.3));
                if (text.length > maxChars) {
                    text = text.substring(0, maxChars - 2) + '..';
                }

                let xPos = x;
                if (col.align === 'right') {
                    xPos = x + col.width - doc.getTextWidth(text) - 1;
                } else if (col.align === 'center') {
                    xPos = x + (col.width - doc.getTextWidth(text)) / 2;
                } else {
                    xPos = x + 1;
                }

                if (type && couleursVin[type]) {
                    const { texte } = couleursVin[type];
                    doc.setTextColor(texte[0], texte[1], texte[2]);
                } else {
                    doc.setTextColor(0, 0, 0);
                }

                doc.text(text, xPos, y);
                x += col.width + 1.5;
            });

            return y + hauteurLigne;
        }

        // Préparation des données (sans le type dans l'affichage)
        const bouteilles = bouteillesResponse.bouteilles
            .map(b => ({
                position: b.position_x !== null ? convertirCoordonnees(parseInt(b.position_x), parseInt(b.position_y)) : "Stock",
                type: b.type_vin,
                data: [
                    b.position_x !== null ? convertirCoordonnees(parseInt(b.position_x), parseInt(b.position_y)) : "Stock",
                    b.nom,
                    b.domaine || '-',
                    b.appellation || '-',
                    b.millesime || '-',
                    `${parseFloat(b.prix).toFixed(2)} €`,
                    b.quantite
                ]
            }))
            .sort((a, b) => a.position.localeCompare(b.position));

        // En-tête du tableau
        yPosition = dessinerLigne(colonnes.map(col => col.header), yPosition + 2, true);

        // Contenu du tableau
        bouteilles.forEach(b => {
            if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = margin;
                yPosition = dessinerLigne(colonnes.map(col => col.header), yPosition + 2, true);
            }
            yPosition = dessinerLigne(b.data, yPosition, false, b.type);
        });

        // Totaux
        yPosition += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        const totaux = bouteilles.reduce((acc, b) => {
            acc.quantite += parseInt(b.data[6]);
            acc.valeur += parseFloat(b.data[5]) * parseInt(b.data[6]);
            return acc;
        }, { quantite: 0, valeur: 0 });

        doc.text(`Total : ${totaux.quantite} bouteilles - Valeur totale : ${totaux.valeur.toFixed(2)} €`, margin, yPosition);

        const nomFichier = `Inventaire_${response.cave.nom.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`;
        doc.save(nomFichier);

    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        alert('Une erreur est survenue lors de la génération du PDF');
    }
}

function ouvrirStatistiques() {
    window.location.href = `statistiques.html?id=${caveId}`;
}

function toggleModeDeplacement() {
    modeDeplacement = !modeDeplacement;
    const btn = document.getElementById('btn-mode-deplacement');
    
    // Mise à jour visuelle du bouton
    btn.classList.toggle('active', modeDeplacement);
    btn.textContent = modeDeplacement ? 'Quitter mode déplacement' : 'Mode déplacement';
    
    // Si on désactive le mode, on réinitialise la sélection
    if (!modeDeplacement) {
        bouteilleADeplacer = null;
        document.querySelectorAll('.case').forEach(c => {
            c.classList.remove('deplacement-source');
            c.style.cursor = 'pointer';
        });
    } else {
        // Si on active le mode, on met le curseur en mode déplacement sur toutes les cases
        document.querySelectorAll('.case').forEach(c => {
            c.style.cursor = 'move';
        });
    }
}
// Initialisation et chargement
async function initialiserCave() {
    try {
        const idCave = getUrlParameter('id');
        if (!idCave) {
            alert('ID de cave non spécifié');
            window.location.href = 'index.html';
            return;
        }
        caveId = idCave;

        // Récupération des données de la cave
        const caveData = await fetchApi(`api.php?endpoint=get_cave&cave_id=${caveId}`);
        
        if (!caveData.cave) {
            throw new Error('Données de cave invalides');
        }

        // Mise à jour du nom de la cave
        const nomCaveElement = document.getElementById('cave-name');
        if (nomCaveElement) {
            nomCaveElement.textContent = caveData.cave.nom;
        }

        // Configuration de la grille
        await configurerGrille(caveData.cave);

        // Chargement des données
        await Promise.all([
            chargerBouteilles(),
            chargerStats()
        ]);

    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        alert('Erreur lors du chargement de la cave');
    }
}

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    // On attend un petit délai pour s'assurer que tout est bien chargé
    setTimeout(() => {
        initialiserCave().catch(error => {
            console.error('Erreur lors de l\'initialisation:', error);
        });
    }, 100);
});

// Fonction pour configurer la grille
async function configurerGrille(cave) {
    const grid = document.getElementById('cave-grid');
    if (!grid) {
        throw new Error('Élément grille non trouvé');
    }

    grid.innerHTML = ''; // Nettoyage de la grille existante
    grid.style.gridTemplateColumns = `repeat(${cave.largeur}, 70px)`;

    // Création des cases
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
        caseVin.className = 'case';
        caseVin.classList.add(bouteille.type_vin);
        
        // Calcul et ajout de l'état de garde
        const periodes = calculerPeriodes(bouteille);
        if (periodes) {
            caseVin.classList.add(periodes.etatActuel);
        }
        
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

// Mise à jour des gestionnaires d'événements pour être plus robustes
function handleCaseClick(e, x, y) {
    if (!e.target) return;
    
    if (modeDeplacement) {
        handleDeplacementClick(e, x, y);
        return;
    }
    
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
    const groupUpdateContainer = document.getElementById('group-update-container');
    groupUpdateContainer.style.display = bouteille ? 'block' : 'none';
	
    btnEnregistrer.style.display = bouteille ? 'none' : 'block';
    btnModifier.style.display = bouteille ? 'block' : 'none';
    btnRetirer.style.display = bouteille ? 'block' : 'none';
    
	if (bouteille) {
        document.getElementById('update-similar').checked = false;
    }
	
    if (bouteille) {
        // Modification pour s'assurer que le type de vin est correctement défini
        document.getElementById('type-vin').value = bouteille.type_vin;
        document.getElementById('nom-vin').value = bouteille.nom || '';
        document.getElementById('domaine').value = bouteille.domaine || '';
        document.getElementById('appellation').value = bouteille.appellation || '';
		document.getElementById('cepage').value = bouteille.cepage || '';
        document.getElementById('millesime').value = bouteille.millesime || '';
        document.getElementById('prix').value = bouteille.prix || '';
        document.getElementById('quantite').value = bouteille.quantite || 1;
        document.getElementById('commentaire').value = bouteille.commentaire || '';
        form.dataset.bouteilleId = bouteille.id;
    } else {
        // Réinitialisation du formulaire
        form.reset();
        document.getElementById('quantite').value = 1;
        // Définir une valeur par défaut pour le type de vin
        document.getElementById('type-vin').value = 'rouge';
        delete form.dataset.bouteilleId;
    }
}

function afficherModalConfirmation(bottles, mainBottle) {
    const modal = document.getElementById('confirm-update-modal');
    const list = document.getElementById('similar-bottles-list');
    list.innerHTML = '';
    
    bottles.forEach(bottle => {
        const item = document.createElement('div');
        item.className = 'similar-bottle-item';
        item.innerHTML = `
            <input type="checkbox" id="bottle-${bottle.id}" class="similar-bottle-checkbox" value="${bottle.id}">
            <label for="bottle-${bottle.id}">
                ${bottle.nom} (${bottle.millesime || 'N/A'}) - 
                ${bottle.position_x !== null ? 
                    `Position: ${convertirCoordonnees(bottle.position_x, bottle.position_y)}` : 
                    'En stock'}
            </label>
        `;
        list.appendChild(item);
    });
    
    document.getElementById('btn-confirm-update').onclick = () => {
        const selectedBottles = Array.from(document.querySelectorAll('.similar-bottle-checkbox:checked'))
            .map(cb => cb.value);
        modifierBouteilles(mainBottle, selectedBottles);
    };
    
    modal.style.display = 'block';
}

async function modifierBouteilles(mainBottle, selectedBottles) {
    try {
        await fetchApi(API_ENDPOINTS.MODIFIER_BOUTEILLE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mainBottle,
                updates: selectedBottles
            })
        });
        
        fermerModal();
        fermerModalConfirmation();
        await Promise.all([chargerBouteilles(), chargerStats()]);
    } catch (error) {
        alert('Erreur lors de la modification des bouteilles');
    }
}

function fermerModalConfirmation() {
    document.getElementById('confirm-update-modal').style.display = 'none';
}

async function getSimilarBottles(bottle) {
    try {
        const response = await fetch('api.php?endpoint=get_similar_bottles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bottle)
        });
        
        const data = await response.json();
        return data.success ? data.bottles : [];
    } catch (error) {
        console.error('Erreur lors de la recherche des bouteilles similaires:', error);
        return [];
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
    const fields = ['nom', 'domaine', 'appellation', 'cepage'];
    
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
    const data = collecterDonneesFormulaire();
    
    if (document.getElementById('update-similar').checked) {
        const similarBottles = await getSimilarBottles(data);
        if (similarBottles.length > 0) {
            afficherModalConfirmation(similarBottles, data);
        } else {
            await modifierBouteilles(data, []);
        }
    } else {
        await modifierBouteilles(data, []);
    }
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
		cepage: document.getElementById('cepage').value,
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

async function handleDeplacementClick(e, x, y) {
    const caseVin = e.currentTarget;
    const bouteille = caseVin.dataset.bouteille ? JSON.parse(caseVin.dataset.bouteille) : null;
    
    if (!bouteilleADeplacer) {
        // Premier clic - sélection de la bouteille à déplacer
        if (!bouteille) {
            alert('Veuillez sélectionner une bouteille à déplacer');
            return;
        }
        bouteilleADeplacer = {
            ...bouteille,
            position_x: x,
            position_y: y
        };
        caseVin.classList.add('deplacement-source');
    } else {
        // Deuxième clic - déplacement effectif
        try {
            await deplacerBouteille(bouteilleADeplacer, x, y);
            // On réinitialise juste la sélection mais on garde le mode actif
            document.querySelectorAll('.case.deplacement-source').forEach(c => 
                c.classList.remove('deplacement-source')
            );
            bouteilleADeplacer = null;
        } catch (error) {
            console.error('Erreur lors du déplacement:', error);
            alert('Erreur lors du déplacement de la bouteille');
        }
    }
}

async function deplacerBouteille(bouteille, nouvellePositionX, nouvellePositionY) {
    try {
        await fetchApi(API_ENDPOINTS.DEPLACER_BOUTEILLE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cave_id: caveId,
                bouteille_id: bouteille.id,
                position_x: bouteille.position_x,
                position_y: bouteille.position_y,
                nouvelle_position_x: nouvellePositionX,
                nouvelle_position_y: nouvellePositionY
            })
        });

        // Rafraîchir l'affichage
        await chargerBouteilles();
    } catch (error) {
        console.error('Erreur lors du déplacement:', error);
        throw error;
    }
}

function fermerModal() {
    document.getElementById('form-bouteille').style.display = 'none';
    document.querySelectorAll('.case.selected').forEach(c => c.classList.remove('selected'));
    document.getElementById('bouteille-form').reset();
	document.querySelector('.modal-content').scrollTop = 0; // permet de scroller en haut du formulaire pour la prochaine ouverture
}