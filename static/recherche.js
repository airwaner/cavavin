// Modules et configuration
let bouteilles = [];  // Variable globale unique
const caves = new Map();

document.addEventListener('DOMContentLoaded', async () => {
    // Initialisation du header
    new NavigationHeader();
    
    await chargerCaves();
    
    const urlParams = new URLSearchParams(window.location.search);
    const cavePreselection = urlParams.get('id') || urlParams.get('cave');  // On accepte les deux
    if (cavePreselection) {
        const selectCave = document.getElementById('cave');
        if (selectCave) {
            selectCave.value = cavePreselection;
        }
    }
    
    await chargerToutesLesBouteilles();
    attacherEcouteurs();
});

// Fonctions utilitaires
function formatPrice(price) {
    return parseFloat(price).toLocaleString('fr-FR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

// Chargement des données
async function chargerCaves() {
    try {
        const response = await fetch('api.php?endpoint=caves_existantes');
        const data = await response.json();
        const select = document.getElementById('cave');
        
        if (data.caves) {
            data.caves.forEach(cave => {
                caves.set(cave.id.toString(), cave);
                const option = document.createElement('option');
                option.value = cave.id;
                option.textContent = cave.nom;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des caves:', error);
    }
}

async function chargerToutesLesBouteilles() {
    try {
        const tempBouteilles = []; // Utilisation d'un tableau temporaire

        for (const [caveId, cave] of caves) {
            try {
                const response = await fetch(`api.php?endpoint=get_bouteilles&cave_id=${caveId}`);
                const data = await response.json();
                if (data.success) {
                    const bouteillesTraitees = data.bouteilles.map(bouteille => ({
                        ...bouteille,
                        cave_nom: cave.nom,
                        cave_id: caveId,
                        etat_garde: calculerPeriodes(bouteille)?.etatActuel || null
                    }));
                    tempBouteilles.push(...bouteillesTraitees);
                }
            } catch (error) {
                console.error(`Erreur cave ${caveId}:`, error);
            }
        }

        bouteilles = tempBouteilles; // Affectation unique à la variable globale
        filtrerEtAfficher();
    } catch (error) {
        console.error('Erreur générale:', error);
    }
}

// Gestion des filtres
function filtrerEtAfficher() {
    const filtres = {
        recherche: document.getElementById('search').value.toLowerCase(),
        typeVin: document.getElementById('type-vin').value,
        prixMin: parseFloat(document.getElementById('prix-min').value) || 0,
        prixMax: parseFloat(document.getElementById('prix-max').value) || Infinity,
		cepage: document.getElementById('cepage').value.toLowerCase(),
        millesimeMin: parseInt(document.getElementById('millesime-min').value) || 0,
        millesimeMax: parseInt(document.getElementById('millesime-max').value) || Infinity,
        cave: document.getElementById('cave').value,
        etatsGarde: Array.from(document.querySelectorAll('input[name="etat-garde"]:checked'))
            .map(input => input.value)
    };

    const resultats = bouteilles.filter(bouteille => 
        (!filtres.recherche || bouteille.nom.toLowerCase().includes(filtres.recherche)) &&
        (!filtres.typeVin || bouteille.type_vin === filtres.typeVin) &&
        bouteille.prix >= filtres.prixMin &&
        bouteille.prix <= filtres.prixMax &&
		(!filtres.cepage || (bouteille.cepage && bouteille.cepage.toLowerCase().includes(filtres.cepage)))&&
        (!bouteille.millesime || (bouteille.millesime >= filtres.millesimeMin && bouteille.millesime <= filtres.millesimeMax)) &&
        (!filtres.cave || bouteille.cave_id === filtres.cave) &&
        (!filtres.etatsGarde.length || filtres.etatsGarde.includes(bouteille.etat_garde))
    );

    afficherResultats(resultats);
}

// Affichage des résultats
function afficherResultats(resultats) {
    const container = document.getElementById('resultats-list');
    const countContainer = document.getElementById('resultats-count');
    
    countContainer.textContent = `${resultats.length} bouteille(s) trouvée(s)`;
    container.innerHTML = '';
    
    resultats.forEach(bouteille => {
        const element = creerElementBouteille(bouteille);
        container.appendChild(element);
    });
}

function creerElementBouteille(bouteille) {
    const element = document.createElement('div');
    element.className = 'resultat-item';
    
    const infosPrimaires = document.createElement('div');
    infosPrimaires.className = 'info-primaire';
    
    const infosSecondaires = document.createElement('div');
    infosSecondaires.className = 'info-secondaire';
    
    infosPrimaires.innerHTML = `
        <h3>
            ${bouteille.nom}
            <span class="badge ${bouteille.type_vin}">${bouteille.type_vin}</span>
            ${bouteille.etat_garde ? `
                <span class="badge-apogee ${bouteille.etat_garde}">
                    ${bouteille.etat_garde.charAt(0).toUpperCase() + bouteille.etat_garde.slice(1)}
                </span>
            ` : ''}
        </h3>
        <p>
            ${bouteille.domaine ? `Domaine: ${bouteille.domaine}<br>` : ''}
            ${bouteille.appellation ? `Appellation: ${bouteille.appellation}<br>` : ''}
			${bouteille.cepage ? `Cépage: ${bouteille.cepage}<br>` : ''}
            Cave: <a href="cave.html?id=${bouteille.cave_id}" class="cave-link">${bouteille.cave_nom}</a>
        </p>
    `;
    
    infosSecondaires.innerHTML = `
        <p>
            ${bouteille.millesime ? `Millésime: ${bouteille.millesime}<br>` : ''}
            Prix: ${formatPrice(bouteille.prix)} €<br>
            Quantité: ${bouteille.quantite}<br>
            ${bouteille.position_x!== null && bouteille.position_y!== null? `Position: <span class="position-info">${convertirCoordonnees(bouteille.position_x, bouteille.position_y)}</span>`: ''}
        </p>
    `;
    
    element.appendChild(infosPrimaires);
    element.appendChild(infosSecondaires);
    return element;
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await chargerCaves();
    
    // Gestion de la présélection de cave
    const urlParams = new URLSearchParams(window.location.search);
    const cavePreselection = urlParams.get('cave');
    if (cavePreselection) {
        document.getElementById('cave').value = cavePreselection;
    }
    
    attacherEcouteurs();
    await chargerToutesLesBouteilles();
});

function attacherEcouteurs() {
    // Écouteurs pour les champs de recherche
    ['search', 'type-vin', 'prix-min', 'prix-max', 'cepage', 'millesime-min', 
     'millesime-max', 'cave', 'tri'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', filtrerEtAfficher);
            if (id === 'search') {
                element.addEventListener('keyup', filtrerEtAfficher);
            }
        }
    });

    // Écouteurs pour les filtres d'état de garde
    document.querySelectorAll('input[name="etat-garde"]')
        .forEach(checkbox => checkbox.addEventListener('change', filtrerEtAfficher));
}

function convertirCoordonnees(x, y) {
    const lettres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const colonne = lettres[x];
    const ligne = y + 1; // +1 car on ne veut pas commencer à 0
    return `${colonne}${ligne}`;
}